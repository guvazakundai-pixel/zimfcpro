"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { WelcomeData } from "@/store/auth-store";

const PHASES = ["intro", "ranked", "details", "complete"] as const;

export function WelcomeOverlay({
  data,
  onDismiss,
}: {
  data: WelcomeData;
  onDismiss: () => void;
}) {
  const [phase, setPhase] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (phase >= PHASES.length) return;
    const t = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? 1200 : 1500);
    return () => clearTimeout(t);
  }, [phase]);

  function handleGo() {
    onDismiss();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, rgba(0,255,133,0.04) 0%, rgba(10,10,12,0.96) 70%)",
        backdropFilter: "blur(24px)",
      }}
    >
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl sm:text-7xl font-black tracking-tight"
              style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(0,255,133,0.3)" }}
            >
              ZimFC Pro
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-lg text-muted-soft mt-4 tracking-wide"
            >
              YOUR COMPETITIVE JOURNEY STARTS NOW
            </motion.p>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div
            key="ranked"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 12 }}
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,133,0.20), rgba(34,211,238,0.15))",
                border: "2px solid rgba(0,255,133,0.30)",
                boxShadow: "0 0 40px rgba(0,255,133,0.15)",
              }}
            >
              <span className="text-4xl">🏆</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl sm:text-4xl font-black text-ink"
            >
              YOU ARE NOW OFFICIALLY RANKED
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-muted-soft text-sm mt-3"
            >
              Out of {data.totalPlayers.toLocaleString()} players
            </motion.p>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm mx-auto px-6"
          >
            <div
              className="rounded-[24px] p-6"
              style={{
                background: "rgba(18,20,24,0.70)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}
            >
              <div className="text-center mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft">Player Card</p>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div className="h-14 w-14 rounded-[16px] flex items-center justify-center text-xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,133,0.15), rgba(34,211,238,0.10))",
                    border: "2px solid rgba(0,255,133,0.20)",
                  }}
                >
                  <span className="text-accent">★</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-ink">New Recruit</p>
                  <p className="text-xs text-muted-soft">{data.platform}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-[14px] p-3.5 text-center" style={{ background: "rgba(0,255,133,0.05)", border: "1px solid rgba(0,255,133,0.10)" }}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-faint">Global Rank</p>
                  <p className="text-2xl font-black text-accent mt-1">#{data.globalRank}</p>
                </div>
                <div className="rounded-[14px] p-3.5 text-center" style={{ background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.10)" }}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-faint">Division</p>
                  <p className="text-lg font-black text-gold mt-1">{data.division}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[14px] p-3.5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-faint">XP</p>
                  <p className="text-xl font-black text-ink mt-1">{data.xp}</p>
                </div>
                <div className="rounded-[14px] p-3.5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-faint">Season</p>
                  <p className="text-lg font-black text-ink mt-1">S1</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <p className="text-xs text-muted-soft text-center">
                  Referral code: <span className="text-gold font-bold">{data.referralCode}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-4 px-6"
          >
            <button
              onClick={handleGo}
              className="px-10 py-4 rounded-[16px] font-bold text-base uppercase tracking-wider"
              style={{
                background: "var(--accent)",
                color: "#000",
                boxShadow: "0 0 40px rgba(0,255,133,0.20)",
              }}
            >
              Enter Your Dashboard
            </button>
            <p className="text-[10px] text-muted-faint uppercase tracking-wider">
              Build your football legacy
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
