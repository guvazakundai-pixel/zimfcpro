"use client";

import { motion } from "framer-motion";
import { AuthModalCTA } from "@/components/AuthModalCTA";

export function WelcomeClient({
  playerCount,
  clubCount,
}: {
  playerCount: number;
  clubCount: number;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0d] text-white flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-base tracking-tight text-white">
            ZIMFCPRO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.16em] uppercase px-2 py-1 rounded bg-white/5 text-white/60 border border-white/10">
            ZW
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-400">SEASON 1 LIVE</span>
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center px-5 pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h1 className="text-[3.2rem] leading-[0.92] font-black tracking-tight uppercase">
            <span className="block text-white">The Road To</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500">
              FC Pro
            </span>
            <span className="block text-white">Starts In</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500">
              Zimbabwe.
            </span>
          </h1>

          <p className="mt-6 text-[11px] font-bold tracking-[0.28em] uppercase text-emerald-400/80">
            ZW&apos;S COMPETITIVE FC ECOSYSTEM
          </p>

          <p className="mt-5 text-[14px] leading-relaxed text-white/50 max-w-md">
            This is Zimbabwe&apos;s definitive ladder for EA FC. From Harare to
            Bulawayo, every match is a battle for local supremacy. Earn your
            spot among the nation&apos;s top tier, climb the ZW rankings, and
            prove you belong at the summit. The throne only holds one.
          </p>

          <p className="mt-5 text-[14px] leading-relaxed text-white/40 italic">
            Are you ready to dominate the ZW scene, or will you be left behind?
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10"
        >
          <AuthModalCTA
            tab="join"
            className="inline-flex items-center justify-center w-full h-14 rounded-2xl font-black text-base tracking-[0.04em] uppercase transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
              color: "#0a0a0d",
              boxShadow:
                "0 0 40px rgba(16,185,129,0.25), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            Claim Your Rank. Rule Zimbabwe.
          </AuthModalCTA>

          <p className="mt-3 text-center text-[12px] text-white/30">
            Create your account and begin your climb up the ZW rankings.
          </p>

          {/* Stats */}
          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-black tabular-nums text-white/80">
                {playerCount.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25 mt-1">
                Players
              </p>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center">
              <p className="text-2xl font-black tabular-nums text-white/80">
                {clubCount.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25 mt-1">
                Clubs
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Subtle background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(600px 400px at 50% 30%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(400px 300px at 50% 80%, rgba(16,185,129,0.04), transparent 60%)",
        }}
      />
    </div>
  );
}
