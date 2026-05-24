"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useSession } from "@/lib/session-client";

type RealtimeNotification = {
  type: string;
  title: string;
  message: string;
  link?: string;
};

type RankingUpdate = {
  type: string;
  data: any;
};

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
  notifications: RealtimeNotification[];
  latestRankingUpdate: RankingUpdate | null;
  clearNotification: (idx: number) => void;
  clearNotifications: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  notifications: [],
  latestRankingUpdate: null,
  clearNotification: () => {},
  clearNotifications: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [latestRankingUpdate, setLatestRankingUpdate] = useState<RankingUpdate | null>(null);

  useEffect(() => {
    if (!session?.userId) return;

    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      setConnected(true);
      s.emit("join-user", session.userId);
    });

    s.on("disconnect", () => setConnected(false));

    s.on("notification", (data: RealtimeNotification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
    });

    s.on("rankings-changed", (data: any) => {
      setLatestRankingUpdate({ type: "rankings", data });
    });

    s.on("match-updated", (data: any) => {
      setNotifications((prev) => [{ type: "MATCH", title: "Match Update", message: "A match you're following has been updated.", link: `/matches/${data.matchId}` }, ...prev].slice(0, 50));
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [session?.userId]);

  const clearNotification = useCallback((idx: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const joinRoom = useCallback((room: string) => {
    socket?.emit("join-league", room);
  }, [socket]);

  const leaveRoom = useCallback((room: string) => {
    socket?.emit("leave-league", room);
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        latestRankingUpdate,
        clearNotification,
        clearNotifications,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useRealtime() {
  return useContext(SocketContext);
}
