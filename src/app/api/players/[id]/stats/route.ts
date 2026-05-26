import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const result = await db.execute({
      sql: `SELECT * FROM player_stats_view WHERE id = ? LIMIT 1`,
      args: [id],
    });

    const row = result.rows[0] as any;
    if (!row) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({
      stats: {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        skillRating: row.skill_rating ?? 1000,
        wins: row.wins ?? 0,
        losses: row.losses ?? 0,
        draws: row.draws ?? 0,
        goalsFor: row.goals_for ?? 0,
        goalsAgainst: row.goals_against ?? 0,
        matchesPlayed: row.matches_played ?? 0,
        winStreak: row.win_streak ?? 0,
        formHistory: row.form_history ?? "",
        points: row.points ?? 0,
        formScore: row.form_score ?? 0,
        mvpCount: row.mvp_count ?? 0,
      },
    });
  } catch (e) {
    console.error("[PlayerStats]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
