import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function getSocketIO(httpServer?: HTTPServer): SocketIOServer | null {
  if (io) return io;
  if (httpServer) {
    io = new SocketIOServer(httpServer, {
      cors: { origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
      transports: ['websocket', 'polling'],
    });
    io.on('connection', (socket) => {
      // User joins their personal notification room
      socket.on('join-user', (userId: string) => {
        if (userId) socket.join(`user:${userId}`);
      });

      // User leaves their personal room
      socket.on('leave-user', (userId: string) => {
        if (userId) socket.leave(`user:${userId}`);
      });

      // League rooms
      socket.on('join-league', (id: string) => socket.join(`league:${id}`));
      socket.on('leave-league', (id: string) => socket.leave(`league:${id}`));

      // Tournament rooms
      socket.on('join-tournament', (id: string) => socket.join(`tournament:${id}`));
      socket.on('leave-tournament', (id: string) => socket.leave(`tournament:${id}`));

      // Club rooms
      socket.on('join-club', (id: string) => socket.join(`club:${id}`));
      socket.on('leave-club', (id: string) => socket.leave(`club:${id}`));

      // Match updates
      socket.on('match-update', (data: { matchId: string; leagueId?: string; tournamentId?: string }) => {
        if (data.leagueId) io?.to(`league:${data.leagueId}`).emit('match-updated', data);
        if (data.tournamentId) io?.to(`tournament:${data.tournamentId}`).emit('match-updated', data);
      });

      // Standings updates
      socket.on('standings-update', (data: { leagueId: string }) => {
        io?.to(`league:${data.leagueId}`).emit('standings-changed', data);
      });

      // Club activity
      socket.on('club-activity', (data: { clubId: string; activity: any }) => {
        io?.to(`club:${data.clubId}`).emit('club-activity', data.activity);
      });

      socket.on('disconnect', () => {});
    });
  }
  return io;
}

// Helper to emit to a specific user
export function emitToUser(userId: string, event: string, data: any) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

// Helper to emit to a club
export function emitToClub(clubId: string, event: string, data: any) {
  if (io) io.to(`club:${clubId}`).emit(event, data);
}

// Helper to emit to all connected clients
export function emitToAll(event: string, data: any) {
  if (io) io.emit(event, data);
}

// Helper to emit ranking update to all
export function emitRankingUpdate(data: any) {
  if (io) io.emit('rankings-changed', data);
}

// Helper to send a notification to a user in real-time
export function notifyUser(userId: string, notification: {
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  emitToUser(userId, 'notification', notification);
}
