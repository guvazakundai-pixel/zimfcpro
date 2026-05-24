"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtime } from "@/lib/socket-provider";
import Link from "next/link";

type Toast = {
  id: string;
  title: string;
  message: string;
  type?: "match" | "tournament" | "club" | "ranking" | "achievement" | "system";
  link?: string;
  createdAt: number;
};

export function NotificationToast() {
  const { notifications } = useRealtime();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const newOnes = notifications.filter(
      (n: any) => !dismissed.has(n.id) && !toasts.find((t) => t.id === n.id)
    );

    if (newOnes.length > 0) {
      setToasts((prev) => [
        ...newOnes.map((n: any) => ({
          id: n.id,
          title: n.title || "",
          message: n.message || n.body || "",
          type: n.type || "system",
          link: n.link,
          createdAt: Date.now(),
        })),
        ...prev,
      ].slice(0, 5));
    }
  }, [notifications, dismissed, toasts]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
    match: {
      bg: "rgba(0,255,133,0.06)",
      border: "rgba(0,255,133,0.15)",
      icon: "⚽",
    },
    tournament: {
      bg: "rgba(255,184,0,0.06)",
      border: "rgba(255,184,0,0.15)",
      icon: "🏆",
    },
    club: {
      bg: "rgba(168,85,247,0.06)",
      border: "rgba(168,85,247,0.15)",
      icon: "🏠",
    },
    ranking: {
      bg: "rgba(34,211,238,0.06)",
      border: "rgba(34,211,238,0.15)",
      icon: "📊",
    },
    achievement: {
      bg: "rgba(255,107,53,0.06)",
      border: "rgba(255,107,53,0.15)",
      icon: "⭐",
    },
    system: {
      bg: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.08)",
      icon: "📢",
    },
  };

  return (
    <div className="fixed bottom-20 right-4 z-[90] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = typeStyles[toast.type || "system"];
          const content = (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="pointer-events-auto rounded-[16px] p-4 cursor-pointer backdrop-blur-xl"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              onClick={() => dismiss(toast.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-ink truncate">{toast.title}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(toast.id);
                      }}
                      className="shrink-0 text-muted-faint hover:text-muted-soft transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-soft mt-0.5 line-clamp-2">{toast.message}</p>
                  {toast.link && (
                    <Link
                      href={toast.link}
                      className="inline-block mt-1.5 text-[9px] font-bold text-accent uppercase tracking-wider hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(toast.id);
                      }}
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );

          return content;
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Live match score ticker — scrolls across the top showing ongoing match scores
 */
export function LiveMatchTicker({ matches = [] }: { matches?: { id: string; player1: string; player2: string; score1: number; score2: number; status: string }[] }) {
  if (matches.length === 0) return null;

  return (
    <div
      className="overflow-hidden whitespace-nowrap py-1.5"
      style={{
        background: "linear-gradient(90deg, rgba(0,255,133,0.04), transparent 50%, rgba(0,255,133,0.04))",
        borderBottom: "1px solid rgba(0,255,133,0.06)",
      }}
    >
      <div className="inline-flex animate-marquee gap-8 px-4">
        {[...matches, ...matches].map((m, i) => (
          <Link
            key={`${m.id}-${i}`}
            href={`/matches/${m.id}`}
            className="inline-flex items-center gap-2 text-[10px] font-mono shrink-0 hover:text-accent transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-ink font-bold">{m.player1}</span>
            <span className="text-accent tabular-nums font-bold">{m.score1}</span>
            <span className="text-muted-faint">-</span>
            <span className="text-accent tabular-nums font-bold">{m.score2}</span>
            <span className="text-ink font-bold">{m.player2}</span>
            <span className="text-[8px] text-muted-faint uppercase tracking-wider">{m.status}</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
