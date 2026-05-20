"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { type Division, getDivision, getDivisionProgress } from "@/lib/division-engine";

type DivisionProgressProps = {
  skillRating: number;
  showAnimation?: boolean;
  className?: string;
};

const TIER_LABELS = ["BRONZE", "SILVER", "GOLD", "ELITE", "CHAMPION", "LEGENDARY"];
const TIER_COLORS: Record<string, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C8C8D2",
  GOLD: "#FFB800",
  ELITE: "#00FF85",
  CHAMPION: "#A855F7",
  LEGENDARY: "#FF6B35",
};

function getTierFromDivision(div: Division): string {
  if (div.tier >= 22) return "LEGENDARY";
  if (div.tier >= 21) return "CHAMPION";
  if (div.tier >= 16) return "ELITE";
  if (div.tier >= 11) return "GOLD";
  if (div.tier >= 6) return "SILVER";
  return "BRONZE";
}

function DivisionIcon({ division, size = "md" }: { division: Division; size?: "sm" | "md" | "lg" }) {
  const tier = getTierFromDivision(division);
  const color = TIER_COLORS[tier] || "#6B6D78";
  const dims = size === "lg" ? "h-16 w-16" : size === "md" ? "h-12 w-12" : "h-8 w-8";
  const fontSize = size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm";

  return (
    <div
      className={`${dims} rounded-[16px] flex items-center justify-center shrink-0`}
      style={{
        background: `${color}10`,
        border: `1px solid ${color}20`,
        boxShadow: `0 0 20px ${color}08`,
      }}
    >
      <span className={fontSize}>{division.icon}</span>
    </div>
  );
}

function TierIndicator({ currentTier }: { currentTier: string }) {
  const currentIdx = TIER_LABELS.indexOf(currentTier);

  return (
    <div className="flex items-center gap-1">
      {TIER_LABELS.map((tier, i) => {
        const color = TIER_COLORS[tier] || "#6B6D78";
        const isCurrent = tier === currentTier;
        const isPast = i < currentIdx;
        return (
          <div
            key={tier}
            className="flex items-center gap-1"
          >
            <div
              className={`h-2 w-2 rounded-full transition-all duration-500 ${isCurrent ? "scale-125" : ""}`}
              style={{
                background: isCurrent || isPast ? color : "rgba(255,255,255,0.08)",
                boxShadow: isCurrent ? `0 0 8px ${color}40` : "none",
              }}
            />
            {i < TIER_LABELS.length - 1 && (
              <div
                className="h-px w-3 transition-all duration-500"
                style={{ background: i < currentIdx ? color : "rgba(255,255,255,0.05)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DivisionBadge({ division }: { division: Division }) {
  const tier = getTierFromDivision(division);
  const color = TIER_COLORS[tier] || "#6B6D78";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.16em]"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}20`,
        color,
      }}
    >
      <span>{division.icon}</span>
      {division.name}
    </span>
  );
}

export function DivisionProgressBar({
  skillRating,
  showAnimation = false,
  className = "",
}: DivisionProgressProps) {
  const { current, next, prev, progress } = getDivisionProgress(skillRating);
  const tier = getTierFromDivision(current);
  const color = TIER_COLORS[tier] || "#6B6D78";
  const nextTier = next ? getTierFromDivision(next) : null;
  const nextColor = nextTier ? TIER_COLORS[nextTier] : color;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DivisionIcon division={current} size="sm" />
          <div>
            <p className="text-sm font-bold text-ink">{current.name}</p>
            <p className="text-[9px] font-mono text-muted-faint">{skillRating} SR</p>
          </div>
        </div>
        {next && (
          <div className="text-right">
            <p className="text-xs text-muted-soft">{next.name}</p>
            <p className="text-[9px] font-mono text-muted-faint">{next.minSkillRating} SR</p>
          </div>
        )}
      </div>

      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={showAnimation ? { width: 0 } : undefined}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, ${color}, ${nextColor})`,
            boxShadow: `0 0 12px ${color}20`,
          }}
        />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${(i + 1) * 20}%`, background: "rgba(255,255,255,0.03)" }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <TierIndicator currentTier={tier} />
        <span className="text-[9px] font-mono text-muted-faint tabular-nums">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}

export function PromotionRelegationAnimation({
  oldDivision,
  newDivision,
  show,
  onComplete,
}: {
  oldDivision: Division;
  newDivision: Division;
  show: boolean;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<"hidden" | "reveal" | "celebrate">("hidden");
  const promoted = newDivision.tier > oldDivision.tier;
  const relegated = newDivision.tier < oldDivision.tier;

  useEffect(() => {
    if (!show) {
      setPhase("hidden");
      return;
    }
    setPhase("reveal");
    const t = setTimeout(() => {
      setPhase("celebrate");
      setTimeout(() => onComplete?.(), 2000);
    }, 1500);
    return () => clearTimeout(t);
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)" }}
        >
          <div className="text-center">
            {phase === "reveal" && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-faint mb-4">
                  {promoted ? "Promotion!" : relegated ? "Relegation" : "Division Update"}
                </p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <DivisionIcon division={oldDivision} size="lg" />
                    <p className="text-sm font-bold text-muted-soft mt-2">{oldDivision.name}</p>
                  </div>
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-3xl text-muted-faint"
                  >
                    {promoted ? "→" : relegated ? "→" : "—"}
                  </motion.div>
                  <div className="text-center">
                    <DivisionIcon division={newDivision} size="lg" />
                    <p className="text-sm font-bold text-ink mt-2">{newDivision.name}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "celebrate" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {promoted ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="text-6xl mb-4"
                    >
                      🎉
                    </motion.div>
                    <p className="cinematic-heading text-4xl text-accent mb-2">Promoted!</p>
                    <p className="text-sm text-muted-soft">
                      Welcome to <span className="text-ink font-bold">{newDivision.name}</span>
                    </p>
                  </>
                ) : relegated ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="text-6xl mb-4"
                    >
                      😤
                    </motion.div>
                    <p className="cinematic-heading text-4xl text-negative mb-2">Relegated</p>
                    <p className="text-sm text-muted-soft">
                      Dropped to <span className="text-ink font-bold">{newDivision.name}</span>
                    </p>
                  </>
                ) : null}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
