import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const matchRes = await db.execute({
    sql: `SELECT id, player1_id, player2_id, winner_id, score1, score2,
                 status, status_raw, submitted_by, club_id, notes
          FROM match_reports WHERE id = ?`,
    args: [matchId],
  });
  const match = matchRes.rows[0] as Record<string, unknown> | undefined;
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (String(match.status) !== "PENDING") {
    return NextResponse.json({ error: "Match is not pending confirmation" }, { status: 400 });
  }

  const player1Id = String(match.player1_id);
  const player2Id = String(match.player2_id);
  const submittedById = String(match.submitted_by);
  const clubId = match.club_id ? String(match.club_id) : null;

  const confirmerId = auth.session.userId;
  if (confirmerId !== player1Id && confirmerId !== player2Id) {
    return NextResponse.json({ error: "Only match players can confirm" }, { status: 403 });
  }
  if (confirmerId === submittedById) {
    return NextResponse.json({ error: "Submitter cannot confirm their own match" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const score1 = typeof body.score1 === "number" ? Math.max(0, body.score1) : Number(match.score1);
  const score2 = typeof body.score2 === "number" ? Math.max(0, body.score2) : Number(match.score2);

  let winnerId: string | null = null;
  if (score1 > score2) winnerId = player1Id;
  else if (score2 > score1) winnerId = player2Id;

  const now = new Date().toISOString();
  const isDraw = winnerId === null;
  const p1Wins = !isDraw && winnerId === player1Id;
  const p2Wins = !isDraw && winnerId === player2Id;

  await db.execute({
    sql: `UPDATE match_reports SET status = 'CONFIRMED', status_raw = 'CONFIRMED',
          winner_id = ?, score1 = ?, score2 = ?,
          approved_by = ?, approved_at = ? WHERE id = ?`,
    args: [winnerId, score1, score2, confirmerId, now, matchId],
  });

  const [s1Res, s2Res] = await Promise.all([
    db.execute({ sql: "SELECT skill_rating, win_streak, form_history FROM player_stats WHERE user_id = ?", args: [player1Id] }),
    db.execute({ sql: "SELECT skill_rating, win_streak, form_history FROM player_stats WHERE user_id = ?", args: [player2Id] }),
  ]);
  const s1 = s1Res.rows[0] as Record<string, unknown> | undefined;
  const s2 = s2Res.rows[0] as Record<string, unknown> | undefined;

  if (!s1 || !s2) {
    return NextResponse.json({ error: "Player stats not found — contact admin" }, { status: 500 });
  }

  const rA = Number(s1.skill_rating);
  const rB = Number(s2.skill_rating);
  const result = p1Wins ? 1 : p2Wins ? 0 : 0.5;
  const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const deltaA = 32 * (result - expectedA);
  const newRatingA = Math.round(rA + deltaA);
  const newRatingB = Math.round(rB - deltaA);

  const streak1 = Number(s1.win_streak ?? 0);
  const streak2 = Number(s2.win_streak ?? 0);
  const fh1 = String(s1.form_history ?? "");
  const fh2 = String(s2.form_history ?? "");
  const result1 = p1Wins ? "W" : p2Wins ? "L" : "D";
  const result2 = p2Wins ? "W" : p1Wins ? "L" : "D";
  const newFh1 = (fh1 + result1).slice(-10);
  const newFh2 = (fh2 + result2).slice(-10);

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

  await recomputeRankingsSQL();

  try {
    await db.execute({
      sql: "INSERT INTO audit_logs (id, admin_id, action, target, details, created_at) VALUES (?, ?, 'MATCH_CONFIRM', ?, ?, ?)",
      args: [crypto.randomUUID(), confirmerId, `MATCH_REPORT:${matchId}`, JSON.stringify({ score1, score2 }), now],
    });
  } catch {}

  return NextResponse.json({ success: true, matchId, winnerId, score1, score2 });
}

async function recomputeRankingsSQL() {
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

    try {
      await db.execute({
        sql: `UPDATE player_rankings SET rank_position = ?, prev_position = ?, rank_change = ?, points = ?, final_score = ?, updated_at = datetime('now') WHERE user_id = ?`,
        args: [newRank, prev, rankChange, s.points, s.finalScore, s.userId],
      });
    } catch {
      await db.execute({
        sql: `INSERT INTO player_rankings (id, user_id, rank_position, prev_position, rank_change, points, final_score, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [crypto.randomUUID(), s.userId, newRank, prev, rankChange, s.points, s.finalScore],
      });
    }
  }
}