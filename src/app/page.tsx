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

async function getLiveMatches(): Promise<{ id: string; player1: string; player2: string; score1: number; score2: number; status: string }[]> {
  try {
    const result = await db.execute({
      sql: `SELECT m.id, p1.username AS player1, p2.username AS player2,
                   m.score1, m.score2, m.status
            FROM matches m
            LEFT JOIN users p1 ON p1.id = m.player1_id
            LEFT JOIN users p2 ON p2.id = m.player2_id
            WHERE m.status = 'LIVE'
            ORDER BY m.updated_at DESC LIMIT 10`,
      args: [],
    });
    return (result.rows as any[]).map((r) => ({
      id: r.id as string,
      player1: (r.player1 as string) || "Player 1",
      player2: (r.player2 as string) || "Player 2",
      score1: (r.score1 as number) ?? 0,
      score2: (r.score2 as number) ?? 0,
      status: (r.status as string) || "LIVE",
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [stats, topPlayers, liveMatches] = await Promise.all([getSiteStats(), getTopPlayers(), getLiveMatches()]);

  return (
    <ErrorBoundary scope="homepage">
      <Suspense fallback={<HeroSkeleton />}>
        <HomeClient
          totalMatches={stats.totalMatches}
          totalGoals={stats.totalGoals}
          playerCount={stats.playerCount}
          clubCount={stats.clubCount}
          topPlayers={topPlayers}
          liveMatches={liveMatches}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
