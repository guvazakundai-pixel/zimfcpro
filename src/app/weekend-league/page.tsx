"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { WeekendLeagueClient } from "@/components/WeekendLeagueClient";

const MOCK_PLAYER = {
  userId: "current",
  username: "You",
  displayName: "You",
  matchesPlayed: 7,
  wins: 5,
  draws: 1,
  losses: 1,
  points: 21,
  goalsFor: 18,
  goalsAgainst: 7,
  rank: "GOLD" as const,
  matchesRemaining: 8,
  qualificationPoints: 210,
};

const MOCK_STANDINGS = [
  { userId: "p1", username: "KingKai", displayName: "KingKai", matchesPlayed: 10, wins: 8, draws: 1, losses: 1, points: 33, goalsFor: 28, goalsAgainst: 9, rank: "CHAMPION" as const, matchesRemaining: 5, qualificationPoints: 330 },
  { userId: "p2", username: "ProdigyZW", displayName: "Prodigy", matchesPlayed: 9, wins: 7, draws: 1, losses: 1, points: 29, goalsFor: 24, goalsAgainst: 8, rank: "ELITE" as const, matchesRemaining: 6, qualificationPoints: 290 },
  { userId: "p3", username: "NeonStriker", displayName: "Neon Striker", matchesPlayed: 9, wins: 6, draws: 2, losses: 1, points: 26, goalsFor: 22, goalsAgainst: 10, rank: "ELITE" as const, matchesRemaining: 6, qualificationPoints: 260 },
  { userId: "current", username: "You", displayName: "You", matchesPlayed: 7, wins: 5, draws: 1, losses: 1, points: 21, goalsFor: 18, goalsAgainst: 7, rank: "GOLD" as const, matchesRemaining: 8, qualificationPoints: 210 },
  { userId: "p4", username: "ShadowX", displayName: "Shadow X", matchesPlayed: 8, wins: 5, draws: 0, losses: 3, points: 20, goalsFor: 16, goalsAgainst: 12, rank: "GOLD" as const, matchesRemaining: 7, qualificationPoints: 200 },
  { userId: "p5", username: "BlazeZW", displayName: "Blaze ZW", matchesPlayed: 8, wins: 4, draws: 1, losses: 3, points: 17, goalsFor: 14, goalsAgainst: 13, rank: "GOLD" as const, matchesRemaining: 7, qualificationPoints: 170 },
  { userId: "p6", username: "FuryElite", displayName: "Fury Elite", matchesPlayed: 9, wins: 3, draws: 2, losses: 4, points: 14, goalsFor: 12, goalsAgainst: 16, rank: "SILVER" as const, matchesRemaining: 6, qualificationPoints: 140 },
  { userId: "p7", username: "VexFC", displayName: "Vex FC", matchesPlayed: 10, wins: 2, draws: 1, losses: 7, points: 9, goalsFor: 8, goalsAgainst: 24, rank: "SILVER" as const, matchesRemaining: 5, qualificationPoints: 90 },
];

export default function WeekendLeaguePage() {
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase text-muted-soft hover:text-ink transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </motion.div>

        <WeekendLeagueClient
          player={MOCK_PLAYER}
          standings={MOCK_STANDINGS}
          currentUserId="current"
          isActive={isActive}
          entriesRemaining={3}
          onPlayMatch={() => alert("Match started!")}
          onClaimRewards={() => setIsActive(true)}
        />
      </div>
    </div>
  );
}
