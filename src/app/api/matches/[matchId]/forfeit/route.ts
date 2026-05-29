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