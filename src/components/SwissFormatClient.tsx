"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type SwissStandingEntry = {
  rank: number;
  userId: string;
  username: string;
  displayName?: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  buchholz: number;
};

type SwissMatch = {
  id: string;
  round: number;
  tableNumber: number;
  homeUser: { id: string; username: string; displayName?: string | null };
  awayUser: { id: string; username: string; displayName?: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

type SwissFormatClientProps = {
  name: string;
  currentRound: number;
  totalRounds: number;
  standings: SwissStandingEntry[];
  matches: SwissMatch[];
  isAdmin?: boolean;
  currentUserId?: string;
  onGeneratePairings?: () => void;
  onSubmitScore?: (matchId: string, score1: number, score2: number) => void;
};

function BuchholzBadge({ value }: { value: number }) {
  return (
    <span className="text-[8px] font-mono text-muted-faint tabular-nums" title="Buchholz tiebreaker">
      BH: {value}
    </span>
  );
}

export function SwissFormatClient({
  name,
  currentRound,
  totalRounds,
  standings,
  matches,
  isAdmin,
  currentUserId,
  onGeneratePairings,
  onSubmitScore,
}: SwissFormatClientProps) {
  const [tab, setTab] = useState<"standings" | "matches">("standings");
  const [scoreModal, setScoreModal] = useState<string | null>(null);
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);

  const currentRoundMatches = matches.filter((m) => m.round === currentRound);
  const isComplete = standings.every((s) => s.played >= currentRound);

  const handleScoreSubmit = () => {
    if (!scoreModal) return;
    onSubmitScore?.(scoreModal, s1, s2);
    setScoreModal(null);
    setS1(0);
    setS2(0);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="frosted-card-sm rounded-[24px] p-6 relative overflow-hidden"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(500px 200px at 50% 20%, rgba(168,85,247,0.06), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple">Swiss Format</span>
            <span className="text-[9px] text-muted-faint">·</span>
            <span className="text-[9px] font-bold text-muted-soft">Round {currentRound} of {totalRounds}</span>
          </div>
          <h1 className="cinematic-heading text-3xl sm:text-4xl text-ink">{name}</h1>

          {/* Round progress */}
          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: totalRounds }, (_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    i < currentRound ? "bg-accent" : i === currentRound ? "bg-purple animate-pulse" : "bg-white/5"
                  }`}
                />
                {i < totalRounds - 1 && (
                  <div className={`h-px w-4 ${i < currentRound - 1 ? "bg-accent/50" : "bg-white/5"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Action */}
          {isAdmin && isComplete && currentRound < totalRounds && (
            <button
              onClick={onGeneratePairings}
              className="mt-4 h-10 px-5 rounded-[12px] cta-primary text-[9px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
            >
              Generate Round {currentRound + 1} Pairings
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
        {[
          { id: "standings" as const, label: `Standings (${standings.length})` },
          { id: "matches" as const, label: `Round ${currentRound} (${currentRoundMatches.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all ${
              tab === t.id ? "bg-accent/15 text-accent" : "text-muted-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "standings" && (
          <motion.div
            key="standings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="rounded-[20px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint border-b border-border-faint">
                <span className="w-8">#</span>
                <span className="flex-1">Player</span>
                <span className="w-7 text-center">P</span>
                <span className="w-7 text-center">W</span>
                <span className="w-7 text-center">D</span>
                <span className="w-7 text-center">L</span>
                <span className="w-8 text-center">GF</span>
                <span className="w-8 text-center">GA</span>
                <span className="w-9 text-center">GD</span>
                <span className="w-9 text-center">Pts</span>
                <span className="w-12 text-center hidden sm:block">BH</span>
              </div>
              {standings.map((s, i) => {
                const isMe = s.userId === currentUserId;
                return (
                  <div
                    key={s.userId}
                    className={`flex items-center px-4 py-3 text-sm border-b border-border-faint last:border-0 transition-colors ${isMe ? "bg-accent/3" : ""}`}
                    style={isMe ? { borderLeft: "2px solid var(--accent)" } : {}}
                  >
                    <span className={`w-8 font-mono text-xs ${i < 3 ? "text-accent font-bold" : "text-muted-soft"}`}>{s.rank}</span>
                    <span className="flex-1 font-medium text-ink truncate">{s.displayName || s.username}</span>
                    <span className="w-7 text-center font-mono text-xs text-muted-soft">{s.played}</span>
                    <span className="w-7 text-center font-mono text-xs text-accent">{s.wins}</span>
                    <span className="w-7 text-center font-mono text-xs text-gold">{s.draws}</span>
                    <span className="w-7 text-center font-mono text-xs text-negative/70">{s.losses}</span>
                    <span className="w-8 text-center font-mono text-xs text-ink">{s.goalsFor}</span>
                    <span className="w-8 text-center font-mono text-xs text-muted-soft">{s.goalsAgainst}</span>
                    <span className={`w-9 text-center font-mono text-xs font-bold ${s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-negative" : "text-muted-soft"}`}>
                      {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                    </span>
                    <span className="w-9 text-center font-mono text-sm font-bold text-ink">{s.points}</span>
                    <span className="w-12 text-center hidden sm:block"><BuchholzBadge value={s.buchholz} /></span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-3 text-[8px] text-muted-faint">
              <span className="flex items-center gap-1"><BuchholzBadge value={0} /> Buchholz tiebreaker</span>
            </div>
          </motion.div>
        )}

        {tab === "matches" && (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-2"
          >
            {currentRoundMatches.length === 0 ? (
              <div className="frosted-card-sm p-10 text-center rounded-[20px]">
                <p className="text-sm text-muted-soft">No matches for this round</p>
                {isAdmin && (
                  <button onClick={onGeneratePairings} className="mt-3 h-10 px-5 rounded-[12px] cta-primary text-[9px] font-bold uppercase tracking-wider text-[#0D0D0F]">
                    Generate Pairings
                  </button>
                )}
              </div>
            ) : (
              currentRoundMatches.map((m) => {
                const isComplete = m.status === "COMPLETED";
                const isMe = m.homeUser.id === currentUserId || m.awayUser.id === currentUserId;
                return (
                  <div
                    key={m.id}
                    className={`frosted-card-sm p-4 rounded-[16px] transition-all ${isMe ? "border-l-2 border-accent" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-mono text-muted-faint">Table {m.tableNumber}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider text-purple">Round {m.round}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isComplete && m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore ? "text-accent" : "text-ink"}`}>
                          {m.homeUser.displayName || m.homeUser.username}
                        </p>
                      </div>
                      <div className="shrink-0 px-4">
                        {isComplete && m.homeScore !== null && m.awayScore !== null ? (
                          <span className="font-mono text-lg font-bold tabular-nums text-ink">{m.homeScore} – {m.awayScore}</span>
                        ) : (
                          <span className="text-[9px] text-muted-faint uppercase tracking-wider">vs</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className={`text-sm font-medium truncate ${isComplete && m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore ? "text-accent" : "text-ink"}`}>
                          {m.awayUser.displayName || m.awayUser.username}
                        </p>
                      </div>
                    </div>
                    {!isComplete && isMe && onSubmitScore && (
                      <button
                        onClick={() => setScoreModal(m.id)}
                        className="mt-2 w-full py-2 rounded-[8px] text-[8px] font-bold uppercase tracking-wider bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                      >
                        Submit Score
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Modal */}
      <AnimatePresence>
        {scoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setScoreModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="frosted-card-sm rounded-[24px] p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="cinematic-heading text-lg text-ink mb-4 text-center">Enter Score</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={s1}
                    onChange={(e) => setS1(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 h-12 rounded-[14px] bg-white/5 border border-white/10 text-center text-2xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40"
                    placeholder="0"
                    autoFocus
                  />
                  <span className="text-lg text-muted-faint font-bold">:</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={s2}
                    onChange={(e) => setS2(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 h-12 rounded-[14px] bg-white/5 border border-white/10 text-center text-2xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setScoreModal(null)} className="flex-1 h-11 rounded-[14px] text-[10px] font-bold uppercase tracking-wider border border-white/10 text-muted-soft hover:text-ink transition-all">Cancel</button>
                <button onClick={handleScoreSubmit} className="flex-1 h-11 rounded-[14px] cta-primary text-[10px] font-bold uppercase tracking-wider text-[#0D0D0F]">Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
