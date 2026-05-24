import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { ErrorBoundary, ScopedErrorBoundary } from "@/components/ErrorBoundary";
import { HomeClient } from "@/components/HomeClient";
import { HeroSkeleton } from "@/components/ui/Skeleton";

export const revalidate = 30;

function safeNumber(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

async function getSiteStats(): Promise<{
  totalMatches: number;
  totalGoals: number;
  playerCount: number;
  clubCount: number;
}> {
  try {
    const res = await db.execute(
      "SELECT COALESCE(SUM(matches_played),0) as total_matches, COALESCE(SUM(goals_scored),0) as total_goals, count(*) as player_count, (SELECT count(*) FROM clubs) as club_count FROM player_stats"
    ).catch(() => ({ rows: [{ total_matches: 0, total_goals: 0, player_count: 0, club_count: 0 }] }));
    const row = res.rows[0] ?? { total_matches: 0, total_goals: 0, player_count: 0, club_count: 0 };
    return {
      totalMatches: safeNumber(row.total_matches, 0),
      totalGoals: safeNumber(row.total_goals, 0),
      playerCount: safeNumber(row.player_count, 0),
      clubCount: safeNumber(row.club_count, 0),
    };
  } catch (err) {
    console.error("[HomePage] getSiteStats failed:", err);
    return { totalMatches: 0, totalGoals: 0, playerCount: 0, clubCount: 0 };
  }
}

async function getTopPlayers() {
  try {
    const top = await prisma.playerRanking.findMany({
      take: 10,
      orderBy: { rankPosition: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            city: true,
            playerStats: {
              select: {
                wins: true,
                losses: true,
                draws: true,
                skillRating: true,
                winStreak: true,
                formHistory: true,
              },
            },
          },
        },
      },
    });
    return top.map((r) => ({
      id: r.user.id,
      rank: r.rankPosition,
      username: r.user.username,
      displayName: r.user.displayName ?? r.user.username,
      avatarUrl: r.user.avatarUrl,
      city: r.user.city ?? "Harare",
      points: r.points,
      wins: r.user.playerStats?.wins ?? 0,
      losses: r.user.playerStats?.losses ?? 0,
      draws: r.user.playerStats?.draws ?? 0,
      skillRating: r.user.playerStats?.skillRating ?? 1000,
      winStreak: r.user.playerStats?.winStreak ?? 0,
      formHistory: r.user.playerStats?.formHistory ?? "",
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [stats, topPlayers] = await Promise.all([getSiteStats(), getTopPlayers()]);

  return (
    <ErrorBoundary scope="homepage">
      <Suspense fallback={<HeroSkeleton />}>
        <HomeClient
          totalMatches={stats.totalMatches}
          totalGoals={stats.totalGoals}
          playerCount={stats.playerCount}
          clubCount={stats.clubCount}
          topPlayers={topPlayers}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
