import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const pendingMatches = await db.execute({
      sql: `SELECT id, player1_id, player2_id, winner_id, score1, score2, club_id
            FROM match_reports WHERE status = 'PENDING' AND created_at < ?`,
      args: [cutoff],
    });

    let confirmed = 0;

    for (const match of pendingMatches.rows as any[]) {
      const player1Id = String(match.player1_id);
      const player2Id = String(match.player2_id);
      const winnerId = match.winner_id ? String(match.winner_id) : null;
      const score1 = Number(match.score1);
      const score2 = Number(match.score2);
      const now = new Date().toISOString();

      await db.execute({
        sql: `UPDATE match_reports SET status = 'CONFIRMED', status_raw = 'CONFIRMED', approved_at = ? WHERE id = ?`,
        args: [now, String(match.id)],
      });

      const isDraw = winnerId === null;
      const p1Wins = !isDraw && winnerId === player1Id;
      const p2Wins = !isDraw && winnerId === player2Id;

      const [s1Res, s2Res] = await Promise.all([
        db.execute({ sql: "SELECT skill_rating, win_streak, form_history FROM player_stats WHERE user_id = ?", args: [player1Id] }),
        db.execute({ sql: "SELECT skill_rating, win_streak, form_history FROM player_stats WHERE user_id = ?", args: [player2Id] }),
      ]);
      const s1 = s1Res.rows[0] as any;
      const s2 = s2Res.rows[0] as any;

      if (s1 && s2) {
        const rA = Number(s1.skill_rating);
        const rB = Number(s2.skill_rating);
        const result = p1Wins ? 1 : p2Wins ? 0 : 0.5;
        const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
        const deltaA = 32 * (result - expectedA);
        const newRatingA = Math.round(rA + deltaA);
        const newRatingB = Math.round(rB - deltaA);

        const streak1 = Number(s1.win_streak ?? 0);
        const streak2 = Number(s2.win_streak ?? 0);
        const result1 = p1Wins ? "W" : p2Wins ? "L" : "D";
        const result2 = p2Wins ? "W" : p1Wins ? "L" : "D";
        const newFh1 = (String(s1.form_history ?? "") + result1).slice(-10);
        const newFh2 = (String(s2.form_history ?? "") + result2).slice(-10);
        const computeForm = (h: string) => h.slice(-5).split("").reduce((a, c) => a + (c === "W" ? 10 : c === "L" ? -5 : 2), 0);

        let p1Sets = "matches_played = matches_played + 1, goals_scored = goals_scored + ?, goals_conceded = goals_conceded + ?, skill_rating = ?, form_history = ?, form_score = ?, updated_at = ?";
        let p1Args: (string | number)[] = [score1, score2, newRatingA, newFh1, computeForm(newFh1), now];
        let p2Sets = "matches_played = matches_played + 1, goals_scored = goals_scored + ?, goals_conceded = goals_conceded + ?, skill_rating = ?, form_history = ?, form_score = ?, updated_at = ?";
        let p2Args: (string | number)[] = [score2, score1, newRatingB, newFh2, computeForm(newFh2), now];

        if (p1Wins) {
          p1Sets += ", wins = wins + 1, win_streak = ?, points = points + 3";
          p1Args.push(streak1 + 1);
          p2Sets += ", losses = losses + 1, win_streak = 0";
        } else if (p2Wins) {
          p2Sets += ", wins = wins + 1, win_streak = ?, points = points + 3";
          p2Args.push(streak2 + 1);
          p1Sets += ", losses = losses + 1, win_streak = 0";
        } else {
          p1Sets += ", draws = draws + 1, win_streak = 0, points = points + 1";
          p2Sets += ", draws = draws + 1, win_streak = 0, points = points + 1";
        }

        p1Args.push(player1Id);
        p2Args.push(player2Id);

        await Promise.all([
          db.execute({ sql: `UPDATE player_stats SET ${p1Sets} WHERE user_id = ?`, args: p1Args }),
          db.execute({ sql: `UPDATE player_stats SET ${p2Sets} WHERE user_id = ?`, args: p2Args }),
        ]);
      }

      confirmed++;
    }

    if (confirmed > 0) {
      // Delete duplicate rankings keeping only the earliest per user
      await db.execute({
        sql: `DELETE FROM player_rankings WHERE id NOT IN (SELECT MIN(id) FROM player_rankings GROUP BY user_id)`,
        args: [],
      });

      const stats = await db.execute({
        sql: `SELECT ps.user_id, ps.points, ps.wins, ps.losses, ps.draws, ps.goals_scored, ps.goals_conceded, ps.skill_rating, ps.form_score FROM player_stats ps`,
        args: [],
      });
      const scored = (stats.rows as any[]).map(s => {
        const core = Number(s.wins) * 30 + Number(s.goals_scored) * 2 - Number(s.losses) * 10;
        const skill = Number(s.skill_rating || 1000);
        const form = Number(s.form_score || 0);
        return { userId: String(s.user_id), points: Number(s.points), finalScore: core + skill * 10 + form };
      }).sort((a, b) => b.finalScore - a.finalScore);

      for (const s of scored) {
        const newRank = scored.indexOf(s) + 1;
        await db.execute({
          sql: `UPDATE player_rankings SET rank_position = ?, prev_position = COALESCE((SELECT rank_position FROM player_rankings WHERE user_id = ?), NULL), points = ?, final_score = ?, updated_at = datetime('now') WHERE user_id = ?`,
          args: [newRank, s.userId, s.points, s.finalScore, s.userId],
        });
      }
    }

    console.log(`[Cron] Auto-confirmed ${confirmed} pending matches older than ${cutoff}`);
    return NextResponse.json({ confirmed, cutoff });
  } catch (e) {
    console.error("[Cron] Auto-confirm failed:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}