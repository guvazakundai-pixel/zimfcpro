"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AuthModalCTA } from "@/components/AuthModalCTA";

type TopPlayer = {
  id: string;
  username: string;
  displayName: string | null;
  rankPosition: number;
  points: number;
  skillRating: number;
  wins: number;
  losses: number;
  goalsScored: number;
  clubTag: string | null;
};

function shimmerBg() {
  return "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)";
}

export function WelcomeClient({
  playerCount,
  clubCount,
  matchesCount,
  topPlayers,
}: {
  playerCount: number;
  clubCount: number;
  matchesCount: number;
  topPlayers: TopPlayer[];
}) {
  const hasStats = playerCount > 0;
  const hasPlayers = topPlayers.length > 0;

  return (
    <div className="relative min-h-screen bg-[#060608] text-white overflow-hidden">
      {/* ── Animated background ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        {/* Main green glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(0,230,118,0.13), transparent 60%)",
          }}
        />
        {/* Purple accent */}
        <div
          className="absolute top-1/3 right-0 w-[500px] h-[400px]"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, rgba(168,85,247,0.06), transparent 60%)",
          }}
        />
        {/* Cyan accent */}
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[400px]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 70%, rgba(34,211,238,0.05), transparent 60%)",
          }}
        />
        {/* Subtle moving gradient */}
        <div
          className="absolute inset-0 animate-[spin_20s_linear_infinite] opacity-20"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(0,230,118,0.06) 0deg, rgba(168,85,247,0.04) 120deg, rgba(34,211,238,0.04) 240deg, rgba(0,230,118,0.06) 360deg)",
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col">
        {/* SECTION 1 — Hero */}
        <section className="flex flex-col justify-center min-h-[calc(100vh-8rem)] px-5 sm:px-8 pt-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 px-4 py-1.5 mb-8"
              style={{ background: "rgba(0,230,118,0.06)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald-400">
                Season 1 &middot; Live Now
              </span>
            </div>

            {/* Hero headline */}
            <h1
              className="text-[3rem] sm:text-[4.5rem] md:text-[5.5rem] leading-[0.9] font-black uppercase tracking-tight"
              style={{ lineHeight: 0.88 }}
            >
              <span className="block text-white">The Road To</span>
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(135deg, #00e676 0%, #00ff85 30%, #34d399 60%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 30px rgba(0,230,118,0.3))",
                }}
              >
                FC Pro
              </span>
              <span className="block text-white">Starts In</span>
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(135deg, #00e676 0%, #00ff85 30%, #a855f7 70%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 30px rgba(0,230,118,0.25))",
                }}
              >
                Zimbabwe.
              </span>
            </h1>

            {/* Tagline */}
            <p className="mt-6 text-[11px] font-black tracking-[0.26em] uppercase text-emerald-400/70">
              ZW&apos;s Competitive FC Ecosystem
            </p>

            {/* Description */}
            <p className="mt-5 text-[14px] sm:text-[15px] leading-relaxed text-white/45 max-w-lg">
              This is Zimbabwe&apos;s definitive ladder for EA FC. From Harare to
              Bulawayo, every match is a battle for local supremacy. Earn your
              spot among the nation&apos;s top tier, climb the ZW rankings, and
              prove you belong at the summit. The throne only holds one.
            </p>

            <p className="mt-4 text-[14px] text-white/35 italic max-w-lg">
              Are you ready to dominate the ZW scene, or will you be left behind?
            </p>
          </motion.div>

          {/* SECTION 2 — CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 space-y-3"
          >
            {/* Primary CTA */}
            <AuthModalCTA
              tab="join"
              className="inline-flex items-center justify-center w-full sm:w-auto min-w-[280px] h-14 rounded-2xl font-black text-base tracking-[0.04em] uppercase transition-all duration-300 hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg, #00c853 0%, #00e676 40%, #00ff85 100%)",
                color: "#060608",
                boxShadow:
                  "0 0 50px rgba(0,230,118,0.30), 0 0 100px rgba(0,230,118,0.12), 0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              Claim Your Rank. Rule Zimbabwe.
            </AuthModalCTA>

            {/* Secondary CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/rankings"
                className="inline-flex items-center justify-center h-11 rounded-xl px-6 font-bold text-sm tracking-[0.06em] uppercase transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 mr-2">
                  <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" strokeLinecap="round"/>
                </svg>
                Explore Rankings
              </Link>
              <Link
                href="/leagues"
                className="inline-flex items-center justify-center h-11 rounded-xl px-6 font-bold text-sm tracking-[0.06em] uppercase transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 mr-2">
                  <path d="M6 3h12v18l-6-4-6 4V3z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View Leagues
              </Link>
            </div>
          </motion.div>
        </section>

        {/* SECTION 3 — Top Players */}
        <section className="px-5 sm:px-8 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="h-1 w-1 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 8px rgba(0,230,118,0.6)" }} />
              <span className="text-[10px] font-black tracking-[0.26em] uppercase text-emerald-400/80">
                {hasPlayers ? "Top Competitors" : "The Ladder"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-8">
              {hasPlayers ? "Leading the Pack" : "Top competitors emerging"}
            </h2>

            {!hasPlayers ? (
              /* Skeleton loading cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 animate-pulse"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-12 w-12 rounded-xl"
                        style={{
                          background: shimmerBg(),
                          backgroundSize: "200% 100%",
                        }}
                      />
                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded" style={{ background: shimmerBg(), backgroundSize: "200% 100%" }} />
                        <div className="h-3 w-16 rounded" style={{ background: shimmerBg(), backgroundSize: "200% 100%" }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-10 rounded-lg" style={{ background: shimmerBg(), backgroundSize: "200% 100%" }} />
                      <div className="h-10 rounded-lg" style={{ background: shimmerBg(), backgroundSize: "200% 100%" }} />
                      <div className="h-10 rounded-lg" style={{ background: shimmerBg(), backgroundSize: "200% 100%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Real player cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPlayers.map((player, i) => {
                  const displayName = player.displayName || player.username;
                  const isTop3 = player.rankPosition <= 3;
                  const rankColor =
                    player.rankPosition === 1
                      ? { glow: "rgba(255,184,0,0.30)", border: "rgba(255,184,0,0.25)", bg: "rgba(255,184,0,0.08)", text: "#ffb800" }
                      : player.rankPosition === 2
                        ? { glow: "rgba(180,180,200,0.20)", border: "rgba(180,180,200,0.18)", bg: "rgba(180,180,200,0.05)", text: "#C8C8D2" }
                        : player.rankPosition === 3
                          ? { glow: "rgba(205,127,50,0.20)", border: "rgba(205,127,50,0.18)", bg: "rgba(205,127,50,0.05)", text: "#CD7F32" }
                          : { glow: "rgba(0,230,118,0.10)", border: "rgba(255,255,255,0.06)", bg: "rgba(0,230,118,0.03)", text: "#00e676" };

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <Link
                        href={`/player/${player.username}`}
                        className="block rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          background: "rgba(10,10,14,0.6)",
                          backdropFilter: "blur(24px)",
                          WebkitBackdropFilter: "blur(24px)",
                          border: `1px solid ${rankColor.border}`,
                          boxShadow: `0 0 40px -12px ${rankColor.glow}, 0 4px 20px rgba(0,0,0,0.2)`,
                        }}
                      >
                        {/* Rank badge */}
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="flex items-center justify-center h-12 w-12 rounded-xl font-black text-xl"
                            style={{
                              background: rankColor.bg,
                              border: `1px solid ${rankColor.border}`,
                              color: rankColor.text,
                            }}
                          >
                            {player.rankPosition}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-white/30 font-bold tracking-[0.14em] uppercase">
                              @{player.username}
                              {player.clubTag && ` · [${player.clubTag}]`}
                            </p>
                          </div>
                          {isTop3 && (
                            <span
                              className="ml-auto shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-[0.16em] uppercase"
                              style={{
                                background: rankColor.bg,
                                border: `1px solid ${rankColor.border}`,
                                color: rankColor.text,
                              }}
                            >
                              {player.rankPosition === 1 ? "★ GOAT" : player.rankPosition === 2 ? "★ Elite" : "★ Top 3"}
                            </span>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div
                            className="rounded-xl p-2.5 text-center"
                            style={{ background: "rgba(255,255,255,0.015)" }}
                          >
                            <p className="text-lg font-black tabular-nums text-white">
                              {Math.round(player.skillRating).toLocaleString()}
                            </p>
                            <p className="text-[8px] font-bold tracking-[0.16em] uppercase text-white/20 mt-0.5">
                              Skill Rating
                            </p>
                          </div>
                          <div
                            className="rounded-xl p-2.5 text-center"
                            style={{ background: "rgba(255,255,255,0.015)" }}
                          >
                            <p className="text-lg font-black tabular-nums text-white">
                              {player.wins}W / {player.losses}L
                            </p>
                            <p className="text-[8px] font-bold tracking-[0.16em] uppercase text-white/20 mt-0.5">
                              Record
                            </p>
                          </div>
                          <div
                            className="rounded-xl p-2.5 text-center"
                            style={{ background: "rgba(255,255,255,0.015)" }}
                          >
                            <p className="text-lg font-black tabular-nums text-emerald-400">
                              {player.points.toLocaleString()}
                            </p>
                            <p className="text-[8px] font-bold tracking-[0.16em] uppercase text-white/20 mt-0.5">
                              Points
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* View full rankings link */}
            <div className="mt-8 text-center">
              <Link
                href="/rankings"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400/70 hover:text-emerald-400 transition-colors uppercase tracking-[0.12em]"
              >
                View Full Rankings
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-5 sm:px-8 pb-32 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/10">
            ZIM FCPRO &middot; Season 1 &middot; FC26 &middot; Zimbabwe
          </p>
        </footer>
      </div>
    </div>
  );
}
