import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { sendNotification } from "@/lib/match-engine/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { matchId } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "Player forfeited";

  try {
    const matchRes = await db.execute({
      sql: "SELECT id, player1_id, player2_id, status_raw, created_at FROM match_reports WHERE id = ?",
      args: [matchId],
    });
    const match = matchRes.rows[0] as Record<string, unknown> | undefined;
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const statusRaw = String(match.status_raw);
    if (statusRaw !== "ACTIVE" && statusRaw !== "PENDING_ACCEPTANCE" && statusRaw !== "SCORE_SUBMITTED") {
      return NextResponse.json({ error: "Match cannot be forfeited in its current state" }, { status: 400 });
    }

    const isPlayer1 = auth.session.userId === String(match.player1_id);
    const isPlayer2 = auth.session.userId === String(match.player2_id);
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: "Only match participants can forfeit" }, { status: 403 });
    }

    const winnerId = isPlayer1 ? String(match.player2_id) : String(match.player1_id);
    const loserId = auth.session.userId;
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE match_reports SET status = 'AUTO_FORFEIT', status_raw = 'AUTO_FORFEIT', winner_id = ?, notes = ?, updated_at = ? WHERE id = ?`,
      args: [winnerId, `Forfeit: ${reason}`, now, matchId],
    });

    // Update player stats for forfeit
    const [wStats, lStats] = await Promise.all([
      db.execute({ sql: "SELECT id, skill_rating, win_streak, form_history, form_score, matches_played, wins, losses, goals_scored, goals_conceded, points FROM player_stats WHERE user_id = ?", args: [winnerId] }),
      db.execute({ sql: "SELECT id, skill_rating, win_streak, form_history, form_score, matches_played, wins, losses, goals_scored, goals_conceded, points FROM player_stats WHERE user_id = ?", args: [loserId] }),
    ]);

    const ws = wStats.rows[0] as Record<string, unknown> | undefined;
    const ls = lStats.rows[0] as Record<string, unknown> | undefined;

    if (ws && ls) {
      const rW = Number(ws.skill_rating || 1000);
      const rL = Number(ls.skill_rating || 1000);
      const expectedW = 1 / (1 + Math.pow(10, (rL - rW) / 400));
      const deltaW = 32 * (1 - expectedW);
      const newRatingW = Math.round(rW + deltaW);
      const newRatingL = Math.round(rL - deltaW);

      const wStreak = Number(ws.win_streak || 0);
      const lFh = String(ls.form_history || "");
      const wFh = String(ws.form_history || "");
      const newFhW = (wFh + "W").slice(-10);
      const newFhL = (lFh + "L").slice(-10);
      const computeForm = (h: string) => h.slice(-5).split("").reduce((a, c) => a + (c === "W" ? 10 : c === "L" ? -5 : 2), 0);

      await Promise.all([
        db.execute({
          sql: `UPDATE player_stats SET matches_played = matches_played + 1, wins = wins + 1, win_streak = ?, points = points + 3, skill_rating = ?, form_history = ?, form_score = ?, updated_at = ? WHERE user_id = ?`,
          args: [wStreak + 1, newRatingW, newFhW, computeForm(newFhW), now, winnerId],
        }),
        db.execute({
          sql: `UPDATE player_stats SET matches_played = matches_played + 1, losses = losses + 1, win_streak = 0, skill_rating = ?, form_history = ?, form_score = ?, updated_at = ? WHERE user_id = ?`,
          args: [newRatingL, newFhL, computeForm(newFhL), now, loserId],
        }),
      ]);

      // Recompute rankings
      await recomputeRankingsForfeit();
    }

    try {
      const loserRows = await db.execute({
        sql: "SELECT username, display_name FROM users WHERE id = ?",
        args: [loserId],
      });
      const loserName = (loserRows.rows[0] as any)?.display_name || (loserRows.rows[0] as any)?.username || "A player";

      await sendNotification({
        userId: winnerId,
        type: "MATCH",
        title: "Opponent Forfeited",
        message: `${loserName} forfeited your match. You win!`,
        link: `/matches/${matchId}`,
      });

      await sendNotification({
        userId: loserId,
        type: "MATCH",
        title: "Match Forfeited",
        message: `You forfeited the match.`,
        link: `/matches/${matchId}`,
      });
    } catch {}

    return NextResponse.json({ success: true, matchId, winnerId, status: "AUTO_FORFEIT" });
  } catch (e) {
    console.error("[forfeit]", e);
    return NextResponse.json({ error: "Failed to forfeit match" }, { status: 500 });
  }
}

async function recomputeRankingsForfeit() {
  try {
    // Delete duplicate rankings keeping only the earliest per user
    await db.execute({
      sql: `DELETE FROM player_rankings WHERE id NOT IN (
             SELECT MIN(id) FROM player_rankings GROUP BY user_id
           )`,
      args: [],
    });

    const stats = await db.execute({
      sql: `SELECT ps.user_id, ps.points, ps.wins, ps.losses, ps.draws,
                   ps.goals_scored, ps.goals_conceded, ps.skill_rating, ps.form_score
            FROM player_stats ps`,
      args: [],
    });

    const scored = (stats.rows as any[]).map(s => {
      const core = Number(s.wins) * 30 + Number(s.goals_scored) * 2 - Number(s.losses) * 10;
      const skill = Number(s.skill_rating || 1000);
      const form = Number(s.form_score || 0);
      return { userId: String(s.user_id), points: Number(s.points), finalScore: core + skill * 10 + form };
    }).sort((a, b) => b.finalScore - a.finalScore);

    const current = await db.execute({ sql: "SELECT user_id, rank_position FROM player_rankings", args: [] });
    const prevMap = new Map((current.rows as any[]).map(r => [String(r.user_id), Number(r.rank_position)]));

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
  } catch (e) {
    console.error("[forfeit] Ranking recomputation failed:", e);
  }
}