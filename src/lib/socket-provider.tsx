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

type LiveMatch = {
  id: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  status: string;
};

type RealtimeContextValue = {
  socket: Socket | null;
  connected: boolean;
  notifications: RealtimeNotification[];
  latestRankingUpdate: RankingUpdate | null;
  liveMatches: LiveMatch[];
  clearNotification: (idx: number) => void;
  clearNotifications: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  socket: null,
  connected: false,
  notifications: [],
  latestRankingUpdate: null,
  liveMatches: [],
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
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);

  // SSE connection — primary transport (works on Vercel)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      eventSource?.close();
      eventSource = new EventSource("/api/sse");

      eventSource.addEventListener("connected", (event) => {
        try {
          const data = JSON.parse(event.data);
          setConnected(data.status === "connected");
        } catch {}
      });

      eventSource.addEventListener("notification", (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) =>
            [{ type: data.type, title: data.title, message: data.message, link: data.link }, ...prev].slice(0, 50)
          );
        } catch {}
      });

      eventSource.addEventListener("live-matches", (event) => {
        try {
          const data = JSON.parse(event.data) as LiveMatch[];
          setLiveMatches(data);
        } catch {}
      });

      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Socket.IO — secondary transport (when a separate server is available)
  useEffect(() => {
    if (!session?.userId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return; // Skip Socket.IO if no URL configured

    const s = io(socketUrl, {
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
      setNotifications((prev) => [
        {
          type: "MATCH",
          title: "Match Update",
          message: "A match you're following has been updated.",
          link: `/matches/${data.matchId}`,
        },
        ...prev,
      ].slice(0, 50));
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [session?.userId]);

  const clearNotification = useCallback((idx: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const joinRoom = useCallback(
    (room: string) => {
      socket?.emit("join-league", room);
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (room: string) => {
      socket?.emit("leave-league", room);
    },
    [socket],
  );

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        connected,
        notifications,
        latestRankingUpdate,
        liveMatches,
        clearNotification,
        clearNotifications,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
