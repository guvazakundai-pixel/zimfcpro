"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type XPBreakdown = {
  matchWin: number;
  giantSlayer: number;
  cleanSheet: number;
  goalMargin: number;
  winStreak: number;
};

type XPRewardScreenProps = {
  show: boolean;
  winnerName: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
  xpEarned: number;
  skillRatingChange: number;
  newSkillRating: number;
  divisionChange?: { from: string; to: string } | null;
  rankChange?: { from: number; to: number } | null;
  breakdown?: Partial<XPBreakdown>;
  onClose: () => void;
};

function RewardParticle({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        y: -200 - Math.random() * 400,
        x: (Math.random() - 0.5) * 300,
        scale: [0, 1.5, 0],
      }}
      transition={{ duration: 2 + Math.random() * 2, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
      className="absolute h-2 w-2 rounded-full"
      style={{ left: `${20 + Math.random() * 60}%`, top: "60%", background: Math.random() > 0.5 ? "var(--accent)" : "var(--gold)" }}
    />
  );
}

function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M20 48h24v4H20v-4z" fill="currentColor" opacity={0.3} />
      <path d="M18 8h28v16c0 8-6 15-14 16-8-1-14-8-14-16V8z" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={2} />
      <path d="M14 12h-2c-2 0-4 2-4 4v2c0 2 2 4 4 4h2M50 12h2c2 0 4 2 4 4v2c0 2-2 4-4 4h-2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M32 32v8M28 40h8" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

function DivisionBadge({ division }: { division: string }) {
  const colors: Record<string, string> = {
    BRONZE: "#CD7F32",
    SILVER: "#C8C8D2",
    GOLD: "#FFB800",
    ELITE: "#00FF85",
    CHAMPION: "#A855F7",
    LEGENDARY: "#FF6B35",
  };
  const color = colors[division] || "#6B6D78";
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.18em]"
      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
    >
      {division}
    </span>
  );
}

export function XPRewardScreen({
  show,
  winnerName,
  loserName,
  winnerScore,
  loserScore,
  xpEarned,
  skillRatingChange,
  newSkillRating,
  divisionChange,
  rankChange,
  breakdown,
  onClose,
}: XPRewardScreenProps) {
  const [phase, setPhase] = useState<"hidden" | "intro" | "xp" | "rating" | "complete">("hidden");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!show) {
      setPhase("hidden");
      setShowConfetti(false);
      return;
    }
    setPhase("intro");
    setShowConfetti(true);
    const t1 = setTimeout(() => setPhase("xp"), 1200);
    const t2 = setTimeout(() => setPhase("rating"), 2200);
    const t3 = setTimeout(() => setPhase("complete"), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show]);

  if (!show) return null;

  const particles = Array.from({ length: 12 }, (_, i) => i);

  const bd = breakdown || {};
  const totalFromBreakdown = (bd.matchWin ?? 0) + (bd.giantSlayer ?? 0) + (bd.cleanSheet ?? 0) + (bd.goalMargin ?? 0) + (bd.winStreak ?? 0);
  const actualXp = xpEarned || totalFromBreakdown || 100;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
          onClick={() => { if (phase === "complete") onClose(); }}
        >
          <div className="relative w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {showConfetti && particles.map((_, i) => (
              <RewardParticle key={i} delay={i * 0.08} />
            ))}

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.2 }}
              className="relative rounded-[32px] p-8 text-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(18,20,24,0.95), rgba(14,16,18,0.9))",
                border: "1px solid rgba(0,255,133,0.15)",
                boxShadow: "0 0 80px rgba(0,255,133,0.08), 0 0 0 1px rgba(0,255,133,0.05) inset",
              }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(400px 200px at 50% 20%, rgba(0,255,133,0.06), transparent 70%)" }} />

              {/* Phase: Intro */}
              <AnimatePresence mode="wait">
                {phase === "intro" && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                      className="mx-auto mb-6 h-20 w-20 rounded-[24px] flex items-center justify-center"
                      style={{ background: "rgba(0,255,133,0.1)", border: "1px solid rgba(0,255,133,0.2)", color: "var(--accent)" }}
                    >
                      <TrophyIcon className="h-10 w-10" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-[11px] font-black uppercase tracking-[0.28em] text-muted-faint mb-2"
                    >
                      Match Complete
                    </motion.p>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="cinematic-heading text-4xl text-ink mb-1"
                    >
                      {winnerName} <span className="text-accent">Wins</span>
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-5xl font-black font-mono tabular-nums mt-4"
                      style={{ color: "var(--accent)", textShadow: "0 0 40px rgba(0,255,133,0.2)" }}
                    >
                      {winnerScore} – {loserScore}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-sm text-muted-soft mt-2"
                    >
                      vs {loserName}
                    </motion.p>
                  </motion.div>
                )}

                {/* Phase: XP */}
                {phase === "xp" && (
                  <motion.div
                    key="xp"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10"
                  >
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint mb-1"
                    >
                      XP Earned
                    </motion.p>
                    <motion.p
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                      className="text-6xl font-black font-mono tabular-nums"
                      style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(0,255,133,0.3)" }}
                    >
                      +{actualXp}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint mt-2 mb-4"
                    >
                      XP
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-1.5 text-left max-w-[200px] mx-auto"
                    >
                      {bd.matchWin && bd.matchWin > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-soft">Match Win</span>
                          <span className="font-mono font-bold text-accent">+{bd.matchWin}</span>
                        </div>
                      )}
                      {bd.cleanSheet && bd.cleanSheet > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-soft">Clean Sheet</span>
                          <span className="font-mono font-bold text-cyan">+{bd.cleanSheet}</span>
                        </div>
                      )}
                      {bd.giantSlayer && bd.giantSlayer > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-soft">Giant Slayer</span>
                          <span className="font-mono font-bold text-purple">+{bd.giantSlayer}</span>
                        </div>
                      )}
                      {bd.goalMargin && bd.goalMargin > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-soft">Dominant Win</span>
                          <span className="font-mono font-bold text-gold">+{bd.goalMargin}</span>
                        </div>
                      )}
                      {bd.winStreak && bd.winStreak > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-soft">Win Streak</span>
                          <span className="font-mono font-bold text-orange">+{bd.winStreak}</span>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Phase: Rating */}
                {phase === "rating" && (
                  <motion.div
                    key="rating"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10"
                  >
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-faint mb-1"
                    >
                      Skill Rating
                    </motion.p>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                      className="text-center"
                    >
                      <span className="text-5xl font-black font-mono tabular-nums text-ink">{newSkillRating}</span>
                      <span className="text-xl font-bold font-mono tabular-nums ml-2" style={{ color: skillRatingChange >= 0 ? "var(--accent)" : "var(--negative)" }}>
                        {skillRatingChange >= 0 ? "+" : ""}{skillRatingChange}
                      </span>
                    </motion.div>

                    {divisionChange && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-5 flex items-center justify-center gap-3"
                      >
                        <DivisionBadge division={divisionChange.from} />
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                          className="text-lg text-muted-soft"
                        >
                          →
                        </motion.span>
                        <DivisionBadge division={divisionChange.to} />
                      </motion.div>
                    )}

                    {rankChange && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-sm text-muted-soft mt-3"
                      >
                        Rank: <span className="text-ink font-bold">#{rankChange.from}</span> → <span className="text-accent font-bold">#{rankChange.to}</span>
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* Phase: Complete */}
                {phase === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10"
                  >
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="mx-auto mb-4 h-16 w-16 rounded-[20px] flex items-center justify-center"
                      style={{ background: "rgba(0,255,133,0.12)", border: "1px solid rgba(0,255,133,0.2)", color: "var(--accent)" }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </motion.div>
                    <p className="cinematic-heading text-3xl text-ink mb-1">Rewards Claimed</p>
                    <p className="text-sm text-muted-soft">
                      +{actualXp} XP · {skillRatingChange >= 0 ? "+" : ""}{skillRatingChange} SR
                    </p>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={onClose}
                      className="mt-6 h-11 px-8 rounded-[14px] cta-primary text-[10px] font-bold uppercase tracking-[0.18em] text-[#0D0D0F]"
                    >
                      Continue
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
