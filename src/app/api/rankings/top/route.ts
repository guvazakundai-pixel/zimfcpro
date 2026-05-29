import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
  const includeFake = searchParams.get("includeFake") === "true";

  try {
    // Self-heal: remove duplicate rows
    try {
      await db.execute({ sql: `DELETE FROM player_rankings WHERE id NOT IN (SELECT MIN(id) FROM player_rankings GROUP BY user_id)`, args: [] });
    } catch {}
    try {
      await db.execute({ sql: `DELETE FROM player_stats WHERE id NOT IN (SELECT MIN(id) FROM player_stats GROUP BY user_id)`, args: [] });
    } catch {}

    let whereClause = "";
    const args: any[] = [];
    if (!includeFake) {
      whereClause = "WHERE (u.is_fake IS NULL OR u.is_fake = 0)";
    }

    const countResult = await db.execute({
      sql: `SELECT count(*) as c FROM player_rankings pr JOIN users u ON u.id = pr.user_id ${whereClause}`,
      args,
    });
    const total = Number((countResult.rows[0] as any)?.c ?? 0);

    const dataResult = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url, u.country,
                   u.is_fake, u.is_verified,
                   ps.matches_played, ps.wins, ps.losses, ps.draws,
                   ps.goals_scored, ps.goals_conceded, ps.skill_rating, ps.points,
                   ps.form_score, ps.win_streak, ps.mvp_count, ps.form_history,
                   pr.rank_position, pr.points as ranking_points, pr.final_score,
                   ft.team_name, ft.team_value, ft.budget, ft.transfers_used
            FROM player_rankings pr
            JOIN users u ON u.id = pr.user_id
            LEFT JOIN player_stats ps ON ps.user_id = u.id
            LEFT JOIN fantasy_teams ft ON ft.user_id = u.id
            ${whereClause}
            AND pr.id IN (SELECT MIN(pr2.id) FROM player_rankings pr2 GROUP BY pr2.user_id)
            ORDER BY pr.rank_position ASC
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

      // Fetch achievements for top 50 players
      const topUserIds = (dataResult.rows as any[]).slice(0, 50).map(r => r.id);
      let achievementsMap: Record<string, any[]> = {};
      if (topUserIds.length > 0) {
        const placeholders = topUserIds.map(() => '?').join(',');
        const achResult = await db.execute({
          sql: `SELECT pa.user_id, pa.id, pa.title, pa.description, pa.icon, pa.category, pa.rarity, pa.unlocked_at
                FROM player_achievements pa
                WHERE pa.user_id IN (${placeholders})
                ORDER BY pa.unlocked_at DESC`,
          args: topUserIds,
        });
        for (const ach of achResult.rows as any[]) {
          if (!achievementsMap[ach.user_id]) achievementsMap[ach.user_id] = [];
          achievementsMap[ach.user_id].push({
            id: ach.id,
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
            category: ach.category,
            rarity: ach.rarity,
            unlockedAt: ach.unlocked_at,
          });
        }
      }

      const rankings = (dataResult.rows as any[]).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name ?? r.username,
      fullName: r.display_name ?? r.username,
      avatarUrl: r.avatar_url,
      country: r.country,
      isFake: !!r.is_fake,
      isVerified: !!r.is_verified,
      rank: r.rank_position,
      points: r.ranking_points,
      finalScore: r.final_score,
      fantasyTeam: {
        teamName: r.team_name ?? `${r.username} FC`,
        teamValue: r.team_value ?? 0,
        budget: r.budget ?? 100,
        transfersUsed: r.transfers_used ?? 0,
      },
      playerStats: {
        matchesPlayed: r.matches_played ?? 0,
        wins: r.wins ?? 0,
        losses: r.losses ?? 0,
        draws: r.draws ?? 0,
        goalsScored: r.goals_scored ?? 0,
        goalsConceded: r.goals_conceded ?? 0,
        skillRating: r.skill_rating ?? 1000,
        points: r.points ?? 0,
        formScore: r.form_score ?? 0,
        winStreak: r.win_streak ?? 0,
        mvpCount: r.mvp_count ?? 0,
        formHistory: r.form_history ?? "",
      },
      // Simple placeholder — achievements loaded separately for top 50
      playerAchievements: achievementsMap[r.id] || [],
    }));

    return NextResponse.json({ success: true, data: rankings, total });
  } catch (e) {
    console.error("[rankings/top]", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings", data: [], total: 0 },
      { status: 500 },
    );
  }
}
