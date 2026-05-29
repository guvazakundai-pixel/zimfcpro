import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Self-heal: remove duplicate rows
    try {
      await db.execute({ sql: `DELETE FROM player_rankings WHERE id NOT IN (SELECT MIN(id) FROM player_rankings GROUP BY user_id)`, args: [] });
    } catch {}

    const players = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.country,
                   pr.rank_position, pr.prev_position, pr.rank_change, pr.points, pr.final_score,
                   ps.wins, ps.losses, ps.draws, ps.goals_scored, ps.goals_conceded,
                   ps.skill_rating, ps.win_streak, ps.form_history, ps.form_score, ps.mvp_count
            FROM player_rankings pr
            JOIN users u ON u.id = pr.user_id
            LEFT JOIN (
              SELECT user_id, wins, losses, draws, goals_scored, goals_conceded,
                     skill_rating, win_streak, form_history, form_score, mvp_count
              FROM player_stats
              WHERE id IN (SELECT MIN(id) FROM player_stats GROUP BY user_id)
            ) ps ON ps.user_id = u.id
            WHERE pr.id IN (SELECT MIN(pr2.id) FROM player_rankings pr2 GROUP BY pr2.user_id)
            ORDER BY pr.rank_position ASC
            LIMIT 100`,
      args: [],
    });

    // Deduplicate by user id
    const seenIds = new Set<string>();
    const rows = (players.rows as any[]).filter((r) => {
      if (seenIds.has(String(r.id))) return false;
      seenIds.add(String(r.id));
      return true;
    });

    const playerOfTheWeek = (() => {
      let best: any = null;
      let bestScore = -Infinity;
      for (const p of rows) {
        const formHist = String(p.form_history || "");
        const recentWins = formHist.slice(-5).split("").filter((c: string) => c === "W").length;
        const score = recentWins * 10 + Number(p.win_streak || 0) * 5 + Math.round(Number(p.goals_scored || 0) * 20 / Math.max(Number(p.wins + p.losses + p.draws) || 1));
        if (score > bestScore) { bestScore = score; best = p; }
      }
      if (!best) return null;
      return {
        id: best.id,
        username: best.username,
        displayName: best.display_name ?? best.username,
        avatarUrl: best.avatar_url,
        country: best.country,
        rank: Number(best.rank_position),
        points: Number(best.points),
        winStreak: Number(best.win_streak || 0),
        recentForm: String(best.form_history || "").slice(-5),
      };
    })();

    const mostImproved = rows
      .filter((p) => Number(p.prev_position) > 0 && Number(p.rank_change) > 0)
      .sort((a, b) => Number(b.rank_change) - Number(a.rank_change))
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name ?? p.username,
        avatarUrl: p.avatar_url,
        country: p.country,
        rank: Number(p.rank_position),
        prevRank: Number(p.prev_position),
        delta: Number(p.rank_change),
      }));

    const biggestFallers = rows
      .filter((p) => Number(p.prev_position) > 0 && Number(p.rank_change) < 0)
      .sort((a, b) => Number(a.rank_change) - Number(b.rank_change))
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name ?? p.username,
        avatarUrl: p.avatar_url,
        country: p.country,
        rank: Number(p.rank_position),
        prevRank: Number(p.prev_position),
        delta: Math.abs(Number(p.rank_change)),
      }));

    return NextResponse.json({
      success: true,
      playerOfTheWeek,
      mostImproved,
      biggestFallers,
    });
  } catch (e) {
    console.error("[rankings/insights]", e);
    return NextResponse.json({ success: false, playerOfTheWeek: null, mostImproved: [], biggestFallers: [] }, { status: 500 });
  }
}