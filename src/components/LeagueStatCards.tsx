"use client";

import { motion } from "framer-motion";

type LeagueStandingEntry = {
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
  form: string;
  prevPosition?: number | null;
};

type LeagueStatCardsProps = {
  standings: LeagueStandingEntry[];
  playoffQualifiers: number;
  currentUserId?: string;
};

function RankArrow({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined || change === 0) {
    return <span className="text-muted-faint text-[10px] w-5 text-center">–</span>;
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-accent font-bold text-[11px]">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M12 5l7 7h-5v7h-4v-7H5l7-7z" /></svg>
        {change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-negative font-bold text-[11px]">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M12 19l-7-7h5V5h4v7h5l-7 7z" /></svg>
      {Math.abs(change)}
    </span>
  );
}

function FormDots({ form }: { form: string }) {
  const chars = form.slice(-5).split("");
  if (chars.length === 0) return <span className="text-[8px] text-muted-faint">—</span>;
  return (
    <div className="flex gap-0.5">
      {chars.map((r, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            r === "W" ? "bg-accent" : r === "D" ? "bg-gold" : r === "L" ? "bg-negative" : "bg-muted-faint"
          }`}
        />
      ))}
    </div>
  );
}

function PositionGlow({ rank, qualifiers, total }: { rank: number; qualifiers: number; total: number }) {
  if (rank <= qualifiers && qualifiers > 0) {
    return (
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgba(0,255,133,0.04), transparent)",
          borderLeft: "2px solid var(--accent)",
          boxShadow: "inset 0 0 20px rgba(0,255,133,0.04)",
        }}
      />
    );
  }
  if (rank > total - 2 && total > 2) {
    return (
      <div
        className="absolute inset-0 rounded-[16px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgba(255,77,77,0.04), transparent)",
          borderLeft: "2px solid rgba(255,77,77,0.3)",
        }}
      />
    );
  }
  return null;
}

export function LeagueDesktopTable({
  standings,
  playoffQualifiers,
  currentUserId,
}: LeagueStatCardsProps) {
  return (
    <div className="rounded-[20px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint border-b border-border-faint">
        <span className="w-8">#</span>
        <span className="w-10 text-center" style={{ fontSize: "7px" }}>MOV</span>
        <span className="flex-1">Player</span>
        <span className="w-7 text-center">P</span>
        <span className="w-7 text-center">W</span>
        <span className="w-7 text-center">D</span>
        <span className="w-7 text-center">L</span>
        <span className="w-8 text-center">GF</span>
        <span className="w-8 text-center">GA</span>
        <span className="w-9 text-center">GD</span>
        <span className="w-9 text-center">Pts</span>
        <span className="w-14 text-center hidden sm:block">Form</span>
      </div>

      {/* Rows */}
      {standings.map((s, i) => {
        const isCurrentUser = s.userId === currentUserId;
        const rank = i + 1;
        return (
          <div
            key={s.userId}
            className="relative flex items-center px-4 py-3 text-sm border-b border-border-faint last:border-0 transition-colors"
            style={{
              background: isCurrentUser ? "rgba(0,255,133,0.03)" : i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
              borderLeft: "2px solid transparent",
              ...(isCurrentUser ? { borderLeftColor: "var(--accent)" } : {}),
            }}
          >
            <PositionGlow rank={rank} qualifiers={playoffQualifiers} total={standings.length} />
            <span className={`relative z-10 w-8 font-mono text-xs ${i === 0 ? "text-gold font-bold" : i < 3 ? "text-accent" : "text-muted-soft"}`}>
              {rank}
              {i === 0 && <span className="ml-0.5 text-[8px]">👑</span>}
            </span>
            <span className="relative z-10 w-10 flex justify-center">
              <RankArrow change={s.prevPosition ? (s.prevPosition - rank) : null} />
            </span>
            <span className="relative z-10 flex-1 font-medium text-ink truncate hover:text-accent transition-colors cursor-pointer">
              {s.displayName || s.username}
              {isCurrentUser && <span className="ml-1.5 text-[8px] text-accent uppercase tracking-wider">(You)</span>}
            </span>
            <span className="relative z-10 w-7 text-center font-mono text-xs text-muted-soft">{s.played}</span>
            <span className="relative z-10 w-7 text-center font-mono text-xs text-accent">{s.wins}</span>
            <span className="relative z-10 w-7 text-center font-mono text-xs text-gold">{s.draws}</span>
            <span className="relative z-10 w-7 text-center font-mono text-xs text-negative/70">{s.losses}</span>
            <span className="relative z-10 w-8 text-center font-mono text-xs text-ink">{s.goalsFor}</span>
            <span className="relative z-10 w-8 text-center font-mono text-xs text-muted-soft">{s.goalsAgainst}</span>
            <span className={`relative z-10 w-9 text-center font-mono text-xs font-bold ${s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-negative" : "text-muted-soft"}`}>
              {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
            </span>
            <span className="relative z-10 w-9 text-center font-mono text-sm font-bold text-ink">{s.points}</span>
            <span className="relative z-10 w-14 hidden sm:flex justify-center">
              <FormDots form={s.form} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LeagueMobileCards({
  standings,
  playoffQualifiers,
  currentUserId,
}: LeagueStatCardsProps) {
  const total = standings.length;
  return (
    <div className="space-y-2">
      {standings.map((s, i) => {
        const isCurrentUser = s.userId === currentUserId;
        const rank = i + 1;
        const isQual = playoffQualifiers > 0 && rank <= playoffQualifiers;
        const isReleg = rank > total - 2 && total > 2;

        return (
          <motion.div
            key={s.userId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`relative rounded-[18px] p-4 overflow-hidden transition-all ${isCurrentUser ? "ring-1 ring-accent/30" : ""}`}
            style={{
              background: isQual
                ? "linear-gradient(135deg, rgba(0,255,133,0.04), rgba(18,20,24,0.6))"
                : isReleg
                ? "linear-gradient(135deg, rgba(255,77,77,0.04), rgba(18,20,24,0.6))"
                : "rgba(18,20,24,0.3)",
              border: isQual
                ? "1px solid rgba(0,255,133,0.1)"
                : isReleg
                ? "1px solid rgba(255,77,77,0.08)"
                : "1px solid rgba(255,255,255,0.03)",
            }}
          >
            {/* Position badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-lg font-black tabular-nums ${i === 0 ? "text-gold" : i < 3 ? "text-accent" : "text-muted-soft"}`}>
                  #{rank}
                </span>
                <RankArrow change={s.prevPosition ? (s.prevPosition - rank) : null} />
                {isQual && <span className="text-[7px] font-black uppercase tracking-wider text-accent px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20">Qual</span>}
                {isReleg && <span className="text-[7px] font-black uppercase tracking-wider text-negative px-1.5 py-0.5 rounded-full bg-negative/10 border border-negative/20">Drop</span>}
              </div>
              <FormDots form={s.form} />
            </div>

            {/* Player name */}
            <p className="text-base font-bold text-ink mb-2 truncate">
              {s.displayName || s.username}
              {isCurrentUser && <span className="ml-1.5 text-[8px] text-accent uppercase tracking-wider">(You)</span>}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold font-mono text-ink tabular-nums">{s.points}</p>
                <p className="text-[7px] font-black uppercase tracking-wider text-muted-faint">Pts</p>
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-muted-soft tabular-nums">{s.played}</p>
                <p className="text-[7px] font-black uppercase tracking-wider text-muted-faint">Pld</p>
              </div>
              <div>
                <p className={`text-lg font-bold font-mono tabular-nums ${s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-negative" : "text-muted-soft"}`}>
                  {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                </p>
                <p className="text-[7px] font-black uppercase tracking-wider text-muted-faint">GD</p>
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-ink tabular-nums">{s.wins}/{s.draws}/{s.losses}</p>
                <p className="text-[7px] font-black uppercase tracking-wider text-muted-faint">W/D/L</p>
              </div>
            </div>

            {/* Mini goal bar */}
            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
              <span className="text-accent font-bold">{s.goalsFor} GF</span>
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/60"
                  style={{ width: `${Math.min((s.goalsFor / Math.max(s.goalsFor + s.goalsAgainst, 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-muted-soft">{s.goalsAgainst} GA</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function LeagueStatsRow({ standings }: { standings: LeagueStandingEntry[] }) {
  const topScorer = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestGD = [...standings].sort((a, b) => b.goalDifference - a.goalDifference)[0];
  const mostWins = [...standings].sort((a, b) => b.wins - a.wins)[0];
  const bestForm = [...standings].sort((a, b) => {
    const formA = (a.form.match(/W/g) || []).length;
    const formB = (b.form.match(/W/g) || []).length;
    return formB - formA;
  })[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        { label: "Top Scorer", value: topScorer?.goalsFor ?? 0, name: topScorer?.displayName || topScorer?.username || "—", color: "var(--accent)" },
        { label: "Best GD", value: bestGD?.goalDifference ?? 0, name: bestGD?.displayName || bestGD?.username || "—", color: "var(--cyan)" },
        { label: "Most Wins", value: mostWins?.wins ?? 0, name: mostWins?.displayName || mostWins?.username || "—", color: "var(--gold)" },
        { label: "Best Form", value: bestForm ? `${(bestForm.form.match(/W/g) || []).length}/5` : "—", name: bestForm?.displayName || bestForm?.username || "—", color: "var(--purple)" },
      ].map((stat, i) => (
        <div
          key={stat.label}
          className="frosted-card-sm p-3 rounded-[14px]"
        >
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-faint">{stat.label}</p>
          <p className="text-base font-bold font-mono tabular-nums mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
          <p className="text-[10px] text-muted-soft truncate mt-0.5">{stat.name}</p>
        </div>
      ))}
    </div>
  );
}
