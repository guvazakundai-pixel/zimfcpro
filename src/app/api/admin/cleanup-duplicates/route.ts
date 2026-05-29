import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/route-auth";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (auth.session.role !== "ADMIN" && auth.session.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Find and report duplicates
    const dupRankings = await db.execute({
      sql: `SELECT user_id, COUNT(*) as cnt FROM player_rankings GROUP BY user_id HAVING cnt > 1`,
      args: [],
    });

    const dupStats = await db.execute({
      sql: `SELECT user_id, COUNT(*) as cnt FROM player_stats GROUP BY user_id HAVING cnt > 1`,
      args: [],
    });

    const rankingDupes = (dupRankings.rows as any[]).length;
    const statsDupes = (dupStats.rows as any[]).length;

    // Clean up duplicates - keep the earliest row (MIN id)
    if (rankingDupes > 0) {
      await db.execute({
        sql: `DELETE FROM player_rankings WHERE id NOT IN (SELECT MIN(id) FROM player_rankings GROUP BY user_id)`,
        args: [],
      });
    }

    if (statsDupes > 0) {
      await db.execute({
        sql: `DELETE FROM player_stats WHERE id NOT IN (SELECT MIN(id) FROM player_stats GROUP BY user_id)`,
        args: [],
      });
    }

    // Recompute rankings after cleanup
    const ranked = await db.execute({
      sql: `SELECT ps.user_id, ps.points, ps.wins, ps.losses, ps.draws,
                   ps.goals_scored, ps.goals_conceded, ps.skill_rating, ps.form_score
            FROM player_stats ps`,
      args: [],
    });

    const scored = (ranked.rows as any[]).map((s: any) => {
      const core = Number(s.wins) * 30 + Number(s.goals_scored) * 2 - Number(s.losses) * 10;
      const skill = Number(s.skill_rating || 1000);
      const form = Number(s.form_score || 0);
      return { userId: String(s.user_id), points: Number(s.points), finalScore: core + skill * 10 + form };
    }).sort((a: any, b: any) => b.finalScore - a.finalScore);

    // Get current positions for rank_change calc
    const current = await db.execute({ sql: "SELECT user_id, rank_position FROM player_rankings", args: [] });
    const prevMap = new Map((current.rows as any[]).map((r: any) => [String(r.user_id), Number(r.rank_position)]));

    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      const newRank = i + 1;
      const prev = prevMap.get(s.userId) ?? null;
      const rankChange = prev != null ? prev - newRank : 0;

      await db.execute({
        sql: `UPDATE player_rankings SET rank_position = ?, prev_position = ?, rank_change = ?, points = ?, final_score = ?, updated_at = datetime('now') WHERE user_id = ?`,
        args: [newRank, prev, rankChange, s.points, s.finalScore, s.userId],
      });
    }

    // Verify clean
    const afterRankings = await db.execute({
      sql: `SELECT user_id, COUNT(*) as cnt FROM player_rankings GROUP BY user_id HAVING cnt > 1`,
      args: [],
    });

    return NextResponse.json({
      success: true,
      before: {
        rankingDuplicates: rankingDupes,
        statsDuplicates: statsDupes,
      },
      after: {
        rankingDuplicates: (afterRankings.rows as any[]).length,
        totalPlayers: scored.length,
      },
      rankings: scored.map((s: any, i: number) => ({ rank: i + 1, ...s })),
    });
  } catch (e) {
    console.error("[admin/cleanup-duplicates]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}