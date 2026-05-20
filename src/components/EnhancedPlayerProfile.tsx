"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { DivisionProgressBar, DivisionBadge } from "@/components/DivisionProgress";
import { XPRewardScreen } from "@/components/XPRewardScreen";

type ProfileUser = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  country: string;
  platform: string | null;
  avatarUrl: string | null;
  fcUsername: string | null;
  createdAt: string;
};

type ProfileStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
  skillRating: number;
  points: number;
  winStreak: number;
  formHistory: string;
};

type ProfileRanking = {
  rankPosition: number;
  points: number;
  rankChange: number;
  finalScore: number;
};

type ProfileTrophy = {
  title: string;
  icon: string;
  rarity: string;
  unlockedAt: string;
};

type ProfileClub = {
  id: string;
  name: string;
  tag: string | null;
  slug: string;
  logoUrl: string | null;
};

type ProfileMatch = {
  id: string;
  opponent: { username: string; displayName: string | null };
  myScore: number;
  oppScore: number;
  didWin: boolean;
  isDraw: boolean;
  date: string;
};

type EnhancedPlayerProfileProps = {
  user: ProfileUser;
  stats: ProfileStats | null;
  ranking: ProfileRanking | null;
  trophies?: ProfileTrophy[];
  clubs?: ProfileClub[];
  recentMatches?: ProfileMatch[];
  currentUserId?: string;
};

const TABS = ["Overview", "Matches", "Trophies", "Clubs"] as const;
type TabName = typeof TABS[number];

function StatCard({ label, value, accent, negative, icon }: { label: string; value: string | number; accent?: boolean; negative?: boolean; icon?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="frosted-card-sm p-4 rounded-[18px] transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-2xl font-black font-mono tabular-nums ${accent ? "text-accent" : negative ? "text-negative" : "text-ink"}`}>{value}</p>
    </motion.div>
  );
}

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: "bg-accent/15 text-accent border-accent/20",
    D: "bg-gold/10 text-gold border-gold/15",
    L: "bg-negative/10 text-negative border-negative/15",
  };
  return (
    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-[11px] font-bold border ${colors[result] || "bg-white/5 text-muted-soft border-white/10"}`}>
      {result}
    </span>
  );
}

function TrophyCard({ trophy, index }: { trophy: ProfileTrophy; index: number }) {
  const rarityColors: Record<string, string> = {
    COMMON: "rgba(255,255,255,0.06)",
    RARE: "rgba(52,211,153,0.1)",
    EPIC: "rgba(168,85,247,0.1)",
    LEGENDARY: "rgba(255,184,0,0.12)",
  };
  const rarityBorders: Record<string, string> = {
    COMMON: "rgba(255,255,255,0.06)",
    RARE: "rgba(52,211,153,0.2)",
    EPIC: "rgba(168,85,247,0.2)",
    LEGENDARY: "rgba(255,184,0,0.25)",
  };
  const bg = rarityColors[trophy.rarity] || rarityColors.COMMON;
  const border = rarityBorders[trophy.rarity] || rarityBorders.COMMON;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 p-3 rounded-[14px] transition-all hover:scale-[1.02]"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span className="text-2xl">{trophy.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink truncate">{trophy.title}</p>
        <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">{trophy.rarity}</p>
      </div>
    </motion.div>
  );
}

function WinRateDonut({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const total = wins + losses + draws;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-sm text-muted-faint">No matches</p>
      </div>
    );
  }
  const winPct = (wins / total) * 100;
  const drawPct = (draws / total) * 100;
  const lossPct = (losses / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        {winPct > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${winPct}%` }} className="bg-accent rounded-l-full" transition={{ duration: 0.8, delay: 0.2 }} />}
        {drawPct > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${drawPct}%` }} className="bg-gold" transition={{ duration: 0.8, delay: 0.3 }} />}
        {lossPct > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${lossPct}%` }} className="bg-negative/70 rounded-r-full" transition={{ duration: 0.8, delay: 0.4 }} />}
      </div>
      <div className="flex items-center justify-center gap-4 text-[10px] font-mono">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> <span className="text-accent">{wins}W</span></span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" /> <span className="text-gold">{draws}D</span></span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-negative/70" /> <span className="text-negative/80">{losses}L</span></span>
      </div>
    </div>
  );
}

export function EnhancedPlayerProfile({
  user,
  stats,
  ranking,
  trophies = [],
  clubs = [],
  recentMatches = [],
  currentUserId,
}: EnhancedPlayerProfileProps) {
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [showXP, setShowXP] = useState(false);

  const displayName = user.displayName || user.username;
  const total = stats ? stats.matchesPlayed : 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const draws = stats?.draws ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const goalDiff = (stats?.goalsScored ?? 0) - (stats?.goalsConceded ?? 0);
  const formStr = stats?.formHistory ? stats.formHistory.slice(-5) : "";
  const formArr = formStr.split("");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] p-6"
        style={{
          background: ranking && ranking.rankPosition <= 3
            ? "linear-gradient(135deg, rgba(18,20,24,0.6), rgba(14,16,18,0.55))"
            : "rgba(18,20,24,0.45)",
          border: ranking && ranking.rankPosition === 1
            ? "1px solid rgba(255,184,0,0.2)"
            : "1px solid rgba(255,255,255,0.04)",
          boxShadow: ranking && ranking.rankPosition === 1 ? "0 0 40px rgba(255,184,0,0.15)" : "none",
        }}
      >
        {ranking && ranking.rankPosition === 1 && (
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(400px 200px at 30% 50%, rgba(255,184,0,0.08), transparent 70%)" }} />
        )}

        <div className="relative z-10 flex items-start gap-4">
          {/* Avatar */}
          <div
            className="h-20 w-20 rounded-[20px] border shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              borderColor: ranking && ranking.rankPosition <= 3 ? "rgba(255,184,0,0.2)" : "rgba(255,255,255,0.06)",
              background: user.avatarUrl
                ? `url(${user.avatarUrl}) center/cover`
                : "linear-gradient(135deg, rgba(22,24,28,0.9), rgba(18,20,24,0.8))",
            }}
          >
            {!user.avatarUrl && (
              <span className="text-3xl font-black" style={{ color: "var(--accent)" }}>{displayName[0].toUpperCase()}</span>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="cinematic-heading text-3xl text-ink truncate">{displayName}</h1>
              {ranking && (
                <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.15)", color: "var(--accent)" }}>
                  #{ranking.rankPosition}
                </span>
              )}
            </div>

            <p className="font-mono text-[11px] text-muted-soft mt-0.5">
              @{user.username}{user.platform && <span> · {user.platform}</span>}{user.country && <span> · {user.country}</span>}
            </p>

            {user.bio && <p className="text-sm text-muted mt-1.5 line-clamp-2">{user.bio}</p>}

            {/* Rank change */}
            {ranking && ranking.rankChange !== 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`font-mono text-[11px] font-bold ${ranking.rankChange > 0 ? "text-accent" : "text-negative/80"}`}>
                  {ranking.rankChange > 0 ? "▲" : "▼"} {Math.abs(ranking.rankChange)} rank{Math.abs(ranking.rankChange) !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Form indicators */}
            {formArr.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {formArr.map((r, i) => <FormBadge key={i} result={r} />)}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Division Progress */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="frosted-card-sm rounded-[20px] p-5"
        >
          <DivisionProgressBar skillRating={stats.skillRating} showAnimation />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-faint">
            <span className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">Skill Rating</span>
            <span className="font-mono text-lg font-bold text-ink tabular-nums">{Math.round(stats.skillRating)}</span>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Matches" value={total} icon="📊" />
          <StatCard label="Win Rate" value={`${winRate}%`} accent={winRate >= 50} negative={winRate < 40} icon="🎯" />
          <StatCard label="Streak" value={stats.winStreak > 0 ? `🔥 ${stats.winStreak}` : "—"} accent={stats.winStreak > 0} icon="⚡" />
          <StatCard label="Points" value={stats.points} icon="⭐" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 px-4 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 ${
              activeTab === t ? "bg-accent/15 text-accent" : "text-muted-soft hover:text-ink"
            }`}
          >
            {t}
            {t === "Trophies" && trophies.length > 0 && (
              <span className="ml-1 text-[8px] text-muted-faint">({trophies.length})</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Overview" && stats && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="frosted-card-sm rounded-[20px] p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint mb-3">Performance</p>
              <WinRateDonut wins={wins} losses={losses} draws={draws} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Goals Scored" value={stats.goalsScored} icon="⚽" accent />
              <StatCard label="Goals Conceded" value={stats.goalsConceded} icon="🛡️" negative />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="frosted-card-sm p-3 rounded-[14px] text-center">
                <p className="text-lg font-bold font-mono text-accent tabular-nums">{wins}</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-faint">Wins</p>
              </div>
              <div className="frosted-card-sm p-3 rounded-[14px] text-center">
                <p className="text-lg font-bold font-mono text-gold tabular-nums">{draws}</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-faint">Draws</p>
              </div>
              <div className="frosted-card-sm p-3 rounded-[14px] text-center">
                <p className="text-lg font-bold font-mono text-negative/80 tabular-nums">{losses}</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-muted-faint">Losses</p>
              </div>
            </div>

            {/* Goal Difference */}
            <div className="frosted-card-sm rounded-[20px] p-5 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-faint">Goal Difference</span>
              <span className={`text-2xl font-black font-mono tabular-nums ${goalDiff > 0 ? "text-accent" : goalDiff < 0 ? "text-negative" : "text-muted-soft"}`}>
                {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
              </span>
            </div>
          </motion.div>
        )}

        {activeTab === "Matches" && (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {recentMatches.length === 0 ? (
              <div className="frosted-card-sm p-10 text-center rounded-[20px]">
                <p className="text-lg mb-2">🎮</p>
                <p className="text-sm text-muted-soft">No matches played yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((m, i) => (
                  <Link key={m.id} href={`/matches/${m.id}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="frosted-card-sm p-3.5 rounded-[16px] flex items-center justify-between hover:border-accent/15 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 h-9 w-9 rounded-[10px] flex items-center justify-center text-[11px] font-bold ${
                          m.didWin ? "bg-accent/10 text-accent border border-accent/20" : m.isDraw ? "bg-gold/10 text-gold border border-gold/15" : "bg-negative/10 text-negative border border-negative/15"
                        }`}>
                          {m.didWin ? "W" : m.isDraw ? "D" : "L"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">vs {m.opponent.displayName || m.opponent.username}</p>
                          <p className="text-[10px] font-mono text-muted-soft">{new Date(m.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="shrink-0 font-mono text-base font-bold tabular-nums">
                        <span className={m.didWin ? "text-accent" : "text-ink"}>{m.myScore}</span>
                        <span className="text-muted-faint mx-1">:</span>
                        <span className={!m.didWin && !m.isDraw ? "text-accent" : "text-ink"}>{m.oppScore}</span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Trophies" && (
          <motion.div
            key="trophies"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {trophies.length === 0 ? (
              <div className="frosted-card-sm p-10 text-center rounded-[20px]">
                <p className="text-lg mb-2">🏆</p>
                <p className="text-sm text-muted-soft">No trophies yet. Win competitions to earn them!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trophies.map((t, i) => (
                  <TrophyCard key={t.title} trophy={t} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "Clubs" && (
          <motion.div
            key="clubs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            {clubs.length === 0 ? (
              <div className="frosted-card-sm p-10 text-center rounded-[20px]">
                <p className="text-lg mb-2">🏠</p>
                <p className="text-sm text-muted-soft">Free Agent</p>
                <Link href="/clubs" className="inline-flex mt-3 h-10 px-5 rounded-[12px] cta-outline text-[10px] font-bold uppercase tracking-wider items-center">
                  Browse Clubs
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {clubs.map((c) => (
                  <Link key={c.id} href={`/club/${c.slug}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="frosted-card-sm p-4 rounded-[18px] flex items-center gap-4 hover:border-accent/20 transition-all"
                    >
                      <div
                        className="h-12 w-12 rounded-[14px] border shrink-0 flex items-center justify-center overflow-hidden"
                        style={{
                          borderColor: "rgba(255,255,255,0.06)",
                          background: c.logoUrl ? `url(${c.logoUrl}) center/cover` : "linear-gradient(135deg, rgba(22,24,28,0.9), rgba(18,20,24,0.8))",
                        }}
                      >
                        {!c.logoUrl && <span className="text-lg font-black text-accent">{c.name[0]}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-ink truncate">{c.name}</p>
                        {c.tag && <p className="text-[10px] font-mono text-muted-soft">[{c.tag}]</p>}
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-muted-soft shrink-0">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <XPRewardScreen
        show={showXP}
        winnerName={displayName}
        loserName="Opponent"
        winnerScore={3}
        loserScore={1}
        xpEarned={250}
        skillRatingChange={15}
        newSkillRating={Math.round(stats?.skillRating ?? 1000) + 15}
        onClose={() => setShowXP(false)}
      />
    </div>
  );
}
