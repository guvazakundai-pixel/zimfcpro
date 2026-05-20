"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type FeedEvent = {
  id: string;
  type: "MATCH" | "TOURNAMENT" | "LEAGUE" | "PROMOTION" | "ACHIEVEMENT" | "RIVALRY" | "STREAK" | "CHAMPION";
  message: string;
  player1Name: string;
  player1Username: string;
  player2Name?: string | null;
  player2Username?: string | null;
  score1?: number | null;
  score2?: number | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
  link?: string | null;
};

type LiveFeedProps = {
  initialEvents?: FeedEvent[];
  className?: string;
  maxEvents?: number;
};

function FeedIcon({ type }: { type: string }) {
  switch (type) {
    case "MATCH":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(0,255,133,0.08)", border: "1px solid rgba(0,255,133,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-accent">
            <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M8 12h8" /><path d="M12 8v8" />
          </svg>
        </div>
      );
    case "TOURNAMENT":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-gold">
            <path d="M6 9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
            <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" /><path d="M12 15v3" /><path d="M8 21h8" />
          </svg>
        </div>
      );
    case "LEAGUE":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-emerald">
            <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
          </svg>
        </div>
      );
    case "PROMOTION":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-purple">
            <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
          </svg>
        </div>
      );
    case "ACHIEVEMENT":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-cyan">
            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        </div>
      );
    case "RIVALRY":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.12)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-negative">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      );
    case "STREAK":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.12)" }}>
          <span className="text-sm">🔥</span>
        </div>
      );
    case "CHAMPION":
      return (
        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.2)" }}>
          <span className="text-sm">👑</span>
        </div>
      );
    default:
      return <div className="h-8 w-8 rounded-[10px] bg-white/5 shrink-0" />;
  }
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function LiveFeed({
  initialEvents = [],
  className = "",
  maxEvents = 50,
}: LiveFeedProps) {
  const [events, setEvents] = useState<FeedEvent[]>(initialEvents.slice(0, maxEvents));
  const [filter, setFilter] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents(initialEvents.slice(0, maxEvents));
  }, [initialEvents, maxEvents]);

  const filtered = filter
    ? events.filter((e) => e.type === filter)
    : events;

  const types = Array.from(new Set(events.map((e) => e.type)));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Live Feed</p>
        </div>
        <span className="text-[8px] font-mono text-muted-faint">{events.length} events</span>
      </div>

      {/* Filter chips */}
      {types.length > 1 && (
        <div className="flex gap-1 overflow-x-auto bc-no-scrollbar pb-1">
          <button
            onClick={() => setFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all ${
              filter === null ? "bg-accent/15 text-accent" : "text-muted-faint hover:text-muted-soft bg-white/[0.02]"
            }`}
          >
            All
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all ${
                filter === t ? "bg-accent/15 text-accent" : "text-muted-faint hover:text-muted-soft bg-white/[0.02]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      <div ref={feedRef} className="space-y-1">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="frosted-card-sm p-8 text-center rounded-[20px]">
              <p className="text-sm text-muted-soft">No activity yet</p>
            </div>
          ) : (
            filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.3) }}
              >
                <Link
                  href={event.link || "#"}
                  className={`block p-3 rounded-[14px] transition-all hover:bg-white/[0.02] ${i < 3 ? "border-l-2 border-accent/30" : ""}`}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-start gap-3">
                    <FeedIcon type={event.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider" style={{
                          color: event.type === "MATCH" ? "var(--accent)" : event.type === "CHAMPION" ? "var(--gold)" : event.type === "PROMOTION" ? "var(--purple)" : "var(--muted-soft)"
                        }}>
                          {event.type}
                        </span>
                        <span className="text-[8px] font-mono text-muted-faint">{getTimeAgo(event.timestamp)}</span>
                      </div>
                      <p className="text-sm text-ink leading-snug">
                        {event.message}
                      </p>
                      {event.score1 !== null && event.score2 !== null && (
                        <span className="font-mono text-sm font-bold tabular-nums mt-1 inline-block">
                          <span className="text-accent">{event.score1}</span>
                          <span className="text-muted-faint mx-1">–</span>
                          <span className={event.score1 && event.score2 && event.score1 < event.score2 ? "text-accent" : "text-ink"}>{event.score2}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
