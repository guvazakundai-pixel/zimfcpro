"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type MatchPlayer = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  clubName?: string | null;
};

type MatchData = {
  id: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  score1: number | null;
  score2: number | null;
  status: string;
  competitionName?: string | null;
  competitionType?: string | null;
  round?: string | null;
};

type HeadToHead = {
  player1Wins: number;
  player2Wins: number;
  draws: number;
  lastMatch?: { score1: number; score2: number; date: string } | null;
};

type LiveMatchPageProps = {
  match: MatchData;
  headToHead?: HeadToHead | null;
  player1Rating?: number;
  player2Rating?: number;
  currentUserId?: string;
  onScoreSubmit?: (score1: number, score2: number) => void;
  isPlayer?: boolean;
  matchTimeline?: { minute: number; event: string; player: string }[];
};

function VsDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-strong to-transparent" />
      <span className="text-[11px] font-black tracking-[0.3em] uppercase text-muted-faint">VS</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-strong to-transparent" />
    </div>
  );
}

function PlayerAvatar({ player, size = "md" }: { player: MatchPlayer; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "h-20 w-20" : size === "md" ? "h-14 w-14" : "h-10 w-10";
  const textSize = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm";
  return (
    <div
      className={`${dims} rounded-[18px] border shrink-0 flex items-center justify-center overflow-hidden`}
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
        background: player.avatarUrl
          ? `url(${player.avatarUrl}) center/cover`
          : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
      }}
    >
      {!player.avatarUrl && (
        <span className={`font-black ${textSize}`} style={{ color: "var(--accent)" }}>
          {(player.displayName || player.username)[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

function StatPill({ label, value, accent, negative }: { label: string; value: string | number; accent?: boolean; negative?: boolean }) {
  return (
    <div className="frosted-card-sm p-3 rounded-[12px] text-center min-w-[80px]">
      <p className={`text-sm font-bold font-mono tabular-nums ${accent ? "text-accent" : negative ? "text-negative" : "text-ink"}`}>{value}</p>
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint mt-0.5">{label}</p>
    </div>
  );
}

export function LiveMatchPage({
  match,
  headToHead,
  player1Rating,
  player2Rating,
  currentUserId,
  onScoreSubmit,
  isPlayer,
  matchTimeline,
}: LiveMatchPageProps) {
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [confirmStep, setConfirmStep] = useState<"input" | "confirm">("input");

  const isLive = match.status === "LIVE" || match.status === "ACTIVE";
  const isComplete = match.status === "COMPLETED";
  const isPending = match.status === "PENDING" || match.status === "SCHEDULED";

  const name1 = match.player1.displayName || match.player1.username;
  const name2 = match.player2.displayName || match.player2.username;

  const timeline = matchTimeline || [];

  const h2hTotal = headToHead
    ? headToHead.player1Wins + headToHead.player2Wins + headToHead.draws
    : 0;

  const handleSubmit = () => {
    if (confirmStep === "input") {
      setConfirmStep("confirm");
      return;
    }
    setConfirming(true);
    onScoreSubmit?.(score1, score2);
  };

  return (
    <div className="space-y-6">
      {/* Header Area - Big Match Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
        style={{
          background: isLive
            ? "linear-gradient(135deg, rgba(0,255,133,0.06), rgba(18,20,24,0.7))"
            : isComplete
            ? "linear-gradient(135deg, rgba(255,184,0,0.04), rgba(18,20,24,0.7))"
            : "rgba(18,20,24,0.45)",
          border: isLive ? "1px solid rgba(0,255,133,0.15)" : "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {isLive && (
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(500px 200px at 50% 30%, rgba(0,255,133,0.08), transparent 70%)" }} />
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.5)" }} />
              Live Match
            </span>
          )}
          {isComplete && (
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-soft">Final</span>
          )}
          {isPending && (
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint">Upcoming</span>
          )}
          {match.competitionName && (
            <>
              <span className="text-muted-faint text-[9px]">·</span>
              <Link href={`/tournaments/${match.competitionName}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-accent transition-colors">
                {match.competitionName}
              </Link>
            </>
          )}
        </div>

        {/* Player vs Player Display */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {/* Player 1 */}
          <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
            <PlayerAvatar player={match.player1} size="lg" />
            <div className="text-center min-w-0">
              <p className={`text-lg sm:text-2xl font-bold truncate max-w-[160px] ${(!isComplete || (match.score1 !== null && match.score2 !== null && match.score1 >= match.score2)) ? "text-ink" : "text-muted-soft"}`}>
                {name1}
              </p>
              {match.player1.clubName && (
                <p className="text-[10px] font-mono text-muted-faint truncate">{match.player1.clubName}</p>
              )}
              {player1Rating !== undefined && (
                <p className="text-[11px] font-mono text-muted-soft tabular-nums mt-0.5">{player1Rating} SR</p>
              )}
            </div>
          </div>

          {/* Score Display */}
          <div className="flex flex-col items-center shrink-0">
            {isComplete && match.score1 !== null && match.score2 !== null ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <p className="text-5xl sm:text-7xl font-black font-mono tabular-nums text-ink leading-none">
                  <span className={match.score1 > match.score2 ? "text-accent" : "text-muted-soft"}>{match.score1}</span>
                  <span className="text-muted-faint mx-2">:</span>
                  <span className={match.score2 > match.score1 ? "text-accent" : "text-muted-soft"}>{match.score2}</span>
                </p>
              </motion.div>
            ) : isLive ? (
              <div className="text-center">
                <p className="text-5xl sm:text-7xl font-black font-mono tabular-nums text-ink leading-none">
                  <span className="text-accent">0</span>
                  <span className="text-muted-faint mx-2">:</span>
                  <span className="text-ink">0</span>
                </p>
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-accent mt-1 block">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse mr-1" />
                  In Progress
                </span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-5xl sm:text-7xl font-black font-mono tabular-nums text-muted-faint leading-none">–</p>
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint mt-1 block">Not Played</span>
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center gap-3 min-w-0 flex-1">
            <PlayerAvatar player={match.player2} size="lg" />
            <div className="text-center min-w-0">
              <p className={`text-lg sm:text-2xl font-bold truncate max-w-[160px] ${(!isComplete || (match.score1 !== null && match.score2 !== null && match.score2 >= match.score1)) ? "text-ink" : "text-muted-soft"}`}>
                {name2}
              </p>
              {match.player2.clubName && (
                <p className="text-[10px] font-mono text-muted-faint truncate">{match.player2.clubName}</p>
              )}
              {player2Rating !== undefined && (
                <p className="text-[11px] font-mono text-muted-soft tabular-nums mt-0.5">{player2Rating} SR</p>
              )}
            </div>
          </div>
        </div>

        {/* Score Entry Button (for match participants) */}
        {isPlayer && isLive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            {!showScoreEntry ? (
              <button
                onClick={() => setShowScoreEntry(true)}
                className="h-12 px-8 rounded-[16px] cta-primary font-bold text-sm tracking-[0.18em] uppercase text-[#0D0D0F]"
              >
                Submit Score
              </button>
            ) : (
              <div className="max-w-[280px] mx-auto">
                <AnimatePresence mode="wait">
                  {confirmStep === "input" ? (
                    <motion.div
                      key="input"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint">Enter Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-muted-soft mb-1 truncate">{name1}</p>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={score1}
                            onChange={(e) => setScore1(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full h-12 rounded-[12px] bg-white/5 border border-white/10 text-center text-2xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40 transition-colors"
                          />
                        </div>
                        <span className="text-lg text-muted-faint font-bold pt-6">:</span>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-muted-soft mb-1 truncate">{name2}</p>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={score2}
                            onChange={(e) => setScore2(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full h-12 rounded-[12px] bg-white/5 border border-white/10 text-center text-2xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40 transition-colors"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSubmit}
                        className="w-full h-11 rounded-[12px] cta-primary text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
                      >
                        Confirm Score
                      </button>
                      <button
                        onClick={() => setShowScoreEntry(false)}
                        className="w-full text-[9px] font-bold uppercase tracking-wider text-muted-soft hover:text-ink transition-colors"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint">Confirm Result</p>
                      <p className="text-2xl font-black font-mono text-ink">{score1} – {score2}</p>
                      <p className="text-[11px] text-muted-soft">
                        {name1} vs {name2}
                      </p>
                      <p className="text-[9px] text-muted-faint uppercase tracking-wider">Your opponent will need to confirm this result</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmStep("input")}
                          className="flex-1 h-11 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border border-white/10 text-muted-soft hover:text-ink transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={confirming}
                          className="flex-1 h-11 rounded-[12px] cta-primary text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F] disabled:opacity-50"
                        >
                          {confirming ? "Submitting..." : "Submit"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatPill label="Match" value={`#${match.id.slice(0, 6)}`} />
        <StatPill label="Status" value={match.status} accent={isLive} />
        <StatPill label="SR Diff" value={player1Rating && player2Rating ? `${Math.abs(player1Rating - player2Rating)}` : "—"} />
        <StatPill label="Round" value={match.round || "—"} />
      </div>

      {/* Head to Head */}
      {headToHead && h2hTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="frosted-card-sm rounded-[20px] p-5"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint mb-3">Head to Head</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-right">
              <p className={`text-xl font-bold ${headToHead.player1Wins > headToHead.player2Wins ? "text-accent" : "text-muted-soft"}`}>{headToHead.player1Wins}</p>
              <p className="text-[9px] text-muted-faint uppercase tracking-wider">{name1}</p>
            </div>
            <div className="text-center">
              <div className="flex gap-1 justify-center">
                <div className="h-1.5 flex-1 rounded-full bg-accent" style={{ width: `${(headToHead.player1Wins / Math.max(h2hTotal, 1)) * 100}%`, maxWidth: "60px" }} />
                <div className="h-1.5 flex-1 rounded-full bg-negative/50" style={{ width: `${(headToHead.player2Wins / Math.max(h2hTotal, 1)) * 100}%`, maxWidth: "60px" }} />
              </div>
              <p className="text-[10px] text-muted-faint font-mono mt-1">{h2hTotal} matches</p>
              <p className="text-[9px] text-muted-soft">{headToHead.draws} draws</p>
            </div>
            <div className="flex-1">
              <p className={`text-xl font-bold ${headToHead.player2Wins > headToHead.player1Wins ? "text-accent" : "text-muted-soft"}`}>{headToHead.player2Wins}</p>
              <p className="text-[9px] text-muted-faint uppercase tracking-wider">{name2}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Match Timeline */}
      {timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="frosted-card-sm rounded-[20px] p-5"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint mb-3">Match Timeline</p>
          <div className="space-y-2">
            {timeline.map((event, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-[11px] font-bold text-muted-soft w-8 tabular-nums">{event.minute}&apos;</span>
                <div className="h-2 w-2 rounded-full" style={{ background: event.player === match.player1.id ? "var(--accent)" : "var(--negative)" }} />
                <span className="text-ink">{event.event}</span>
                <span className="text-muted-soft text-[11px]">{event.player === match.player1.id ? name1 : name2}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Match Info */}
      <div className="glass rounded-[20px] p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint mb-3">Match Info</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-mono text-muted-soft">Competition</p>
            <p className="text-ink font-bold">{match.competitionName || "Friendly"}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-soft">Type</p>
            <p className="text-ink font-bold">{match.competitionType || "1v1"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
