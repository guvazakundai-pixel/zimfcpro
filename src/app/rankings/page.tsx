import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RankingsClient } from "@/components/RankingsNew";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rankings · ZIM FCPRO",
  description: "Live global rankings for Zimbabwe's competitive EA Sports FC season.",
};

async function getRankings() {
  try {
    // Self-heal: remove any duplicate ranking rows per user before querying
    try {
      await db.execute({
        sql: `DELETE FROM player_rankings WHERE id NOT IN (SELECT MIN(id) FROM player_rankings GROUP BY user_id)`,
        args: [],
      });
    } catch {}
    try {
      await db.execute({
        sql: `DELETE FROM player_stats WHERE id NOT IN (SELECT MIN(id) FROM player_stats GROUP BY user_id)`,
        args: [],
      });
    } catch {}

    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.country, u.city,
                   pr.rank_position, pr.prev_position, pr.rank_change, pr.points, pr.final_score,
                   ps.wins, ps.losses, ps.draws, ps.goals_scored, ps.goals_conceded,
                   ps.skill_rating, ps.win_streak, ps.form_history, ps.mvp_count
            FROM player_rankings pr
            JOIN users u ON u.id = pr.user_id
            LEFT JOIN (
              SELECT user_id, wins, losses, draws, goals_scored, goals_conceded,
                     skill_rating, win_streak, form_history, mvp_count
              FROM player_stats
              WHERE id IN (SELECT MIN(id) FROM player_stats GROUP BY user_id)
            ) ps ON ps.user_id = u.id
            WHERE pr.id IN (SELECT MIN(pr2.id) FROM player_rankings pr2 GROUP BY pr2.user_id)
            ORDER BY pr.rank_position ASC
            LIMIT 100`,
      args: [],
    });
    // Deduplicate by user id in case LEFT JOIN still produces dupes
    const seen = new Set<string>();
    const deduped = (result.rows as any[]).filter((r) => {
      if (seen.has(String(r.id))) return false;
      seen.add(String(r.id));
      return true;
    });
    return deduped.map((r) => ({
      id: r.id,
      rank: Number(r.rank_position ?? 0),
      prev: r.prev_position != null ? Number(r.prev_position) : Number(r.rank_position ?? 0),
      username: r.username,
      displayName: r.display_name ?? r.username,
      avatarUrl: r.avatar_url,
      country: r.country ?? "Zimbabwe",
      city: r.city ?? "Harare",
      points: Number(r.points ?? 0),
      finalScore: Number(r.final_score ?? 0),
      wins: Number(r.wins ?? 0),
      losses: Number(r.losses ?? 0),
      draws: Number(r.draws ?? 0),
      goalsFor: Number(r.goals_scored ?? 0),
      goalsAgainst: Number(r.goals_conceded ?? 0),
      skillRating: Number(r.skill_rating ?? 1000),
      winStreak: Number(r.win_streak ?? 0),
      formHistory: r.form_history ?? "",
      mvpCount: Number(r.mvp_count ?? 0),
      rankChange: Number(r.rank_change ?? 0),
    }));
  } catch (err) {
    console.error("[rankings page] Failed to fetch:", err);
    return [];
  }
}

export default async function RankingsPage() {
  const players = await getRankings();

  return (
    <ErrorBoundary scope="rankings">
      <RankingsClient livePlayers={players} />
    </ErrorBoundary>
  );
}