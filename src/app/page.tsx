import { db } from "@/lib/db";
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
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.city,
                   ps.wins, ps.losses, ps.draws, ps.skill_rating, ps.win_streak, ps.form_history,
                   pr.rank_position, pr.points
            FROM player_rankings pr
            JOIN users u ON u.id = pr.user_id
            LEFT JOIN player_stats ps ON ps.user_id = u.id
            ORDER BY pr.rank_position ASC
            LIMIT 10`,
      args: [],
    });
    return (result.rows as any[]).map((r) => ({
      id: r.id as string,
      rank: Number(r.rank_position ?? 0),
      username: r.username as string,
      displayName: (r.display_name as string) ?? (r.username as string),
      avatarUrl: r.avatar_url as string | null,
      city: (r.city as string) ?? "Harare",
      points: Number(r.points ?? 0),
      wins: Number(r.wins ?? 0),
      losses: Number(r.losses ?? 0),
      draws: Number(r.draws ?? 0),
      skillRating: Number(r.skill_rating ?? 1000),
      winStreak: Number(r.win_streak ?? 0),
      formHistory: (r.form_history as string) ?? "",
    }));
  } catch (e) {
    console.error("[HomePage] getTopPlayers failed:", e);
    return [];
  }
}

async function getLiveMatches(): Promise<{ id: string; player1: string; player2: string; score1: number; score2: number; status: string }[]> {
  try {
    const result = await db.execute({
      sql: `SELECT m.id, p1.username AS player1, p2.username AS player2,
                   m.score1, m.score2, m.status_raw
            FROM match_reports m
            LEFT JOIN users p1 ON p1.id = m.player1_id
            LEFT JOIN users p2 ON p2.id = m.player2_id
            WHERE m.status_raw = 'ACTIVE'
            ORDER BY m.created_at DESC LIMIT 10`,
      args: [],
    });
    return (result.rows as any[]).map((r) => ({
      id: r.id as string,
      player1: (r.player1 as string) || "Player 1",
      player2: (r.player2 as string) || "Player 2",
      score1: (r.score1 as number) ?? 0,
      score2: (r.score2 as number) ?? 0,
      status: (r.status_raw as string) || "ACTIVE",
    }));
  } catch (e) {
    console.error("[HomePage] getLiveMatches failed:", e);
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
