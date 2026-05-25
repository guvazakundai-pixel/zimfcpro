import { db } from "@/lib/db";
import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { HeroSkeleton } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

async function getSiteStats() {
  try {
    const res = await db.execute(
      "SELECT COALESCE(SUM(matches_played),0) as total_matches, COALESCE(SUM(goals_scored),0) as total_goals, count(*) as player_count, (SELECT count(*) FROM clubs) as club_count FROM player_stats"
    );
    const row = res.rows[0] as any;
    return {
      totalMatches: Number(row?.total_matches ?? 0),
      totalGoals: Number(row?.total_goals ?? 0),
      playerCount: Number(row?.player_count ?? 0),
      clubCount: Number(row?.club_count ?? 0),
    };
  } catch (e) {
    console.error("[HomePage] getSiteStats failed:", e);
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
      id: r.id, rank: Number(r.rank_position ?? 0), username: r.username,
      displayName: r.display_name ?? r.username, avatarUrl: r.avatar_url,
      city: r.city ?? "Harare", points: Number(r.points ?? 0),
      wins: Number(r.wins ?? 0), losses: Number(r.losses ?? 0), draws: Number(r.draws ?? 0),
      skillRating: Number(r.skill_rating ?? 1000), winStreak: Number(r.win_streak ?? 0),
      formHistory: r.form_history ?? "",
    }));
  } catch (e) { console.error("[HomePage] getTopPlayers failed:", e); return []; }
}

async function getLiveMatches() {
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
      id: r.id, player1: r.player1 || "Player 1", player2: r.player2 || "Player 2",
      score1: Number(r.score1 ?? 0), score2: Number(r.score2 ?? 0),
      status: r.status_raw || "ACTIVE",
    }));
  } catch (e) { console.error("[HomePage] getLiveMatches failed:", e); return []; }
}

export default async function HomePage() {
  const [stats, topPlayers, liveMatches] = await Promise.all([
    getSiteStats(), getTopPlayers(), getLiveMatches(),
  ]);

  return (
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
  );
}
