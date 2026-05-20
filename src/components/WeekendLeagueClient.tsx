"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type WLRank = "SILVER" | "GOLD" | "ELITE" | "CHAMPION";

type WLPlayer = {
  userId: string;
  username: string;
  displayName?: string | null;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  rank: WLRank;
  matchesRemaining: number;
  qualificationPoints: number;
};

type WeekendLeagueClientProps = {
  player: WLPlayer;
  standings: WLPlayer[];
  currentUserId?: string;
  onPlayMatch?: () => void;
  onClaimRewards?: () => void;
  isActive: boolean;
  entriesRemaining?: number;
};

const RANK_META: Record<WLRank, { label: string; color: string; gradient: string; icon: string; minPts: number }> = {
  SILVER: { label: "Silver", color: "#C8C8D2", gradient: "linear-gradient(135deg, rgba(200,200,210,0.1), rgba(18,20,24,0.4))", icon: "🥈", minPts: 0 },
  GOLD: { label: "Gold", color: "#FFB800", gradient: "linear-gradient(135deg, rgba(255,184,0,0.1), rgba(18,20,24,0.4))", icon: "🥇", minPts: 20 },
  ELITE: { label: "Elite", color: "#00FF85", gradient: "linear-gradient(135deg, rgba(0,255,133,0.1), rgba(18,20,24,0.4))", icon: "💎", minPts: 40 },
  CHAMPION: { label: "Champion", color: "#A855F7", gradient: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(18,20,24,0.4))", icon: "👑", minPts: 55 },
};

const TIER_ORDER: WLRank[] = ["SILVER", "GOLD", "ELITE", "CHAMPION"];

function RankProgressBar({ currentPoints, rank }: { currentPoints: number; rank: WLRank }) {
  const currentMeta = RANK_META[rank];
  const currentIdx = TIER_ORDER.indexOf(rank);
  const nextRank = currentIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentIdx + 1] : null;
  const nextMeta = nextRank ? RANK_META[nextRank] : null;

  if (!nextMeta) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-mono">
          <span style={{ color: currentMeta.color }}>{currentMeta.label}</span>
          <span className="text-gold">Max Rank</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full" style={{ width: "100%", background: `linear-gradient(90deg, ${currentMeta.color}, #A855F7)` }} />
        </div>
      </div>
    );
  }

  const rangeMin = currentMeta.minPts;
  const rangeMax = nextMeta.minPts;
  const progress = Math.min(((currentPoints - rangeMin) / (rangeMax - rangeMin)) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-mono">
        <span style={{ color: currentMeta.color }}>{currentMeta.label}</span>
        <span className="text-muted-soft">{currentPoints} pts</span>
        <span style={{ color: nextMeta.color }}>{nextMeta.label}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${currentMeta.color}, ${nextMeta.color})` }}
        />
      </div>
      <p className="text-[8px] text-muted-faint font-mono">{nextMeta.minPts - currentPoints} pts to {nextMeta.label}</p>
    </div>
  );
}

export function WeekendLeagueClient({
  player,
  standings,
  currentUserId,
  onPlayMatch,
  onClaimRewards,
  isActive,
  entriesRemaining,
}: WeekendLeagueClientProps) {
  const [tab, setTab] = useState<"overview" | "standings">("overview");
  const meta = RANK_META[player.rank];
  const pointsNeeded = player.matchesRemaining * 4;
  const pointsPossible = player.points + pointsNeeded;

  return (
    <div className="space-y-5">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] p-6"
        style={{ background: meta.gradient, border: `1px solid ${meta.color}15` }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(500px 200px at 50% 20%, ${meta.color}08, transparent 70%)` }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Weekend League
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}20` }}>
              {meta.icon} {meta.label}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">Points</p>
              <p className="text-2xl font-black font-mono tabular-nums text-ink">{player.points}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">Played</p>
              <p className="text-2xl font-black font-mono tabular-nums text-ink">{player.matchesPlayed}/15</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">W/D/L</p>
              <p className="text-2xl font-black font-mono tabular-nums text-ink">{player.wins}/{player.draws}/{player.losses}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">Remaining</p>
              <p className="text-2xl font-black font-mono tabular-nums text-ink">{player.matchesRemaining}</p>
            </div>
          </div>

          {/* Rank Progress */}
          <RankProgressBar currentPoints={player.points} rank={player.rank} />

          {/* Action buttons */}
          <div className="flex gap-2 mt-5">
            {isActive && player.matchesRemaining > 0 && (
              <button
                onClick={onPlayMatch}
                className="h-11 px-6 rounded-[14px] cta-primary text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
              >
                Play Match ({player.matchesRemaining} left)
              </button>
            )}
            {!isActive && entriesRemaining && entriesRemaining > 0 && (
              <button
                onClick={onClaimRewards}
                className="h-11 px-6 rounded-[14px] cta-primary text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
              >
                Enter Weekend League ({entriesRemaining} entries)
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
        {[
          { id: "overview" as const, label: "Overview" },
          { id: "standings" as const, label: `Standings (${standings.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 ${
              tab === t.id ? "bg-accent/15 text-accent" : "text-muted-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="frosted-card-sm p-4 rounded-[16px]">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint">Points Per Match</p>
                <p className="text-xl font-bold font-mono tabular-nums text-ink">
                  {player.matchesPlayed > 0 ? (player.points / player.matchesPlayed).toFixed(1) : "0"}
                </p>
              </div>
              <div className="frosted-card-sm p-4 rounded-[16px]">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint">Goal Difference</p>
                <p className={`text-xl font-bold font-mono tabular-nums ${player.goalsFor - player.goalsAgainst > 0 ? "text-accent" : "text-negative"}`}>
                  {player.goalsFor - player.goalsAgainst > 0 ? "+" : ""}{player.goalsFor - player.goalsAgainst}
                </p>
              </div>
              <div className="frosted-card-sm p-4 rounded-[16px]">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint">Win Rate</p>
                <p className="text-xl font-bold font-mono tabular-nums text-ink">
                  {player.matchesPlayed > 0 ? `${Math.round((player.wins / player.matchesPlayed) * 100)}%` : "—"}
                </p>
              </div>
              <div className="frosted-card-sm p-4 rounded-[16px]">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint">Qual Points</p>
                <p className="text-xl font-bold font-mono tabular-nums text-gold">{player.qualificationPoints}</p>
              </div>
            </div>

            {/* Rewards Preview */}
            <div className="frosted-card-sm rounded-[20px] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint mb-3">Reward Tiers</p>
              <div className="space-y-2">
                {TIER_ORDER.map((tier) => {
                  const tm = RANK_META[tier];
                  const reached = TIER_ORDER.indexOf(tier) <= TIER_ORDER.indexOf(player.rank);
                  const rewards = tier === "CHAMPION" ? "2,000 XP · 50,000 coins" : tier === "ELITE" ? "1,200 XP · 25,000 coins" : tier === "GOLD" ? "600 XP · 10,000 coins" : "200 XP · 2,500 coins";
                  return (
                    <div
                      key={tier}
                      className={`flex items-center justify-between p-3 rounded-[12px] transition-all ${reached ? "" : "opacity-50"}`}
                      style={{
                        background: reached ? `${tm.color}08` : "transparent",
                        border: reached ? `1px solid ${tm.color}15` : "1px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tm.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-ink">{tm.label}</p>
                          <p className="text-[9px] font-mono text-muted-soft">{tm.minPts}+ pts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono text-muted-soft">{rewards}</p>
                        {reached && <span className="text-[8px] font-black uppercase tracking-wider text-accent">✓ Reached</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

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
                <span className="w-6 text-center">P</span>
                <span className="w-6 text-center">W</span>
                <span className="w-6 text-center">D</span>
                <span className="w-6 text-center">L</span>
                <span className="w-8 text-center">Pts</span>
                <span className="w-10 text-center hidden sm:block">Tier</span>
              </div>
              {standings.map((p, i) => {
                const tm = RANK_META[p.rank];
                const isMe = p.userId === currentUserId;
                return (
                  <div
                    key={p.userId}
                    className={`flex items-center px-4 py-3 text-sm border-b border-border-faint last:border-0 transition-colors ${isMe ? "bg-accent/3" : ""}`}
                    style={isMe ? { borderLeft: "2px solid var(--accent)" } : {}}
                  >
                    <span className={`w-8 font-mono text-xs ${i < 3 ? "text-accent font-bold" : "text-muted-soft"}`}>{i + 1}</span>
                    <span className="flex-1 font-medium text-ink truncate">{p.displayName || p.username}</span>
                    <span className="w-6 text-center font-mono text-xs text-muted-soft">{p.matchesPlayed}</span>
                    <span className="w-6 text-center font-mono text-xs text-accent">{p.wins}</span>
                    <span className="w-6 text-center font-mono text-xs text-gold">{p.draws}</span>
                    <span className="w-6 text-center font-mono text-xs text-negative/70">{p.losses}</span>
                    <span className="w-8 text-center font-mono text-sm font-bold text-ink">{p.points}</span>
                    <span className="w-10 text-center hidden sm:block">
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${tm.color}15`, color: tm.color }}>
                        {tm.label}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
