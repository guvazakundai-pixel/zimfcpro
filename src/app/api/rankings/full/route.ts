import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const sort = searchParams.get("sort") || "rank";
  const order = searchParams.get("order") || "asc";
  const search = searchParams.get("search") || "";

  try {
    // Self-heal: remove duplicate rows
    try {
      await db.execute({ sql: `DELETE FROM player_rankings WHERE id NOT IN (SELECT MIN(id) FROM player_rankings GROUP BY user_id)`, args: [] });
    } catch {}

    const offset = (page - 1) * limit;

    const allowedSorts: Record<string, string> = {
      rank: "pr.rank_position ASC",
      points: "pr.points DESC",
      points_asc: "pr.points ASC",
      skillRating: "ps.skill_rating DESC",
      skillRating_asc: "ps.skill_rating ASC",
    };
    const orderClause = allowedSorts[`${sort}_${order}`] || allowedSorts[sort] || "pr.rank_position ASC";

    let whereClause = "";
    const args: any[] = [];
    if (search) {
      whereClause = "WHERE (u.username LIKE ? OR u.display_name LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await db.execute({
      sql: `SELECT count(DISTINCT pr.user_id) as c FROM player_rankings pr JOIN users u ON u.id = pr.user_id ${whereClause}`,
      args,
    });
    const total = Number((countResult.rows[0] as any)?.c ?? 0);

    const dataResult = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.country, u.city,
                    ps.wins, ps.losses, ps.draws, ps.goals_scored, ps.goals_conceded,
                    ps.skill_rating, ps.win_streak, ps.form_history, ps.mvp_count,
                    pr.rank_position, pr.points, pr.final_score
             FROM player_rankings pr
             JOIN users u ON u.id = pr.user_id
             LEFT JOIN player_stats ps ON ps.user_id = u.id
             ${whereClause}
             AND pr.id IN (SELECT MIN(pr2.id) FROM player_rankings pr2 GROUP BY pr2.user_id)
             ORDER BY ${orderClause}
             LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const rankings = (dataResult.rows as any[]).map((r) => ({
      id: r.id,
      rank: r.rank_position,
      username: r.username,
      displayName: r.display_name ?? r.username,
      avatarUrl: r.avatar_url,
      country: r.country,
      city: r.city,
      points: r.points,
      finalScore: r.final_score,
      skillRating: r.skill_rating ?? 1000,
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      draws: r.draws ?? 0,
      goalsScored: r.goals_scored ?? 0,
      goalsConceded: r.goals_conceded ?? 0,
      winStreak: r.win_streak ?? 0,
      formHistory: r.form_history ?? "",
      mvpCount: r.mvp_count ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: rankings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[rankings/full]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings", data: [] },
      { status: 500 }
    );
  }
}
