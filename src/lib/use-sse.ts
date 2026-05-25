"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type SSENotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

export type LiveMatch = {
  id: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  status: string;
};

type SSEState = {
  connected: boolean;
  notifications: SSENotification[];
  liveMatches: LiveMatch[];
};

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    connected: false,
    notifications: [],
    liveMatches: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/sse");
    eventSourceRef.current = es;

    es.addEventListener("connected", (event) => {
      try {
        const data = JSON.parse(event.data);
        setState((s) => ({ ...s, connected: data.status === "connected" }));
      } catch {}
    });

    es.addEventListener("notification", (event) => {
      try {
        const data = JSON.parse(event.data) as SSENotification;
        setState((s) => ({
          ...s,
          notifications: [data, ...s.notifications].slice(0, 20),
        }));
      } catch {}
    });

    es.addEventListener("live-matches", (event) => {
      try {
        const data = JSON.parse(event.data) as LiveMatch[];
        setState((s) => ({ ...s, liveMatches: data }));
      } catch {}
    });

    es.onerror = () => {
      setState((s) => ({ ...s, connected: false }));
      es.close();
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return state;
}
