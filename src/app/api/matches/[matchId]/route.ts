import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/route-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  try {
    const result = await db.execute({
      sql: `SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.score1, m.score2,
                   m.status, m.status_raw, m.notes, m.is_disputed, m.club_id, m.created_at,
                   m.approved_by, m.submitted_by,
                   p1.id AS p1_id, p1.username AS p1_username, p1.display_name AS p1_display, p1.avatar_url AS p1_avatar,
                   p2.id AS p2_id, p2.username AS p2_username, p2.display_name AS p2_display, p2.avatar_url AS p2_avatar,
                   w.id AS w_id, w.username AS w_username, w.display_name AS w_display,
                   c.id AS c_id, c.name AS c_name, c.tag AS c_tag,
                   sb.id AS sb_id, sb.username AS sb_username,
                   ab.id AS ab_id, ab.username AS ab_username
            FROM match_reports m
            LEFT JOIN users p1 ON p1.id = m.player1_id
            LEFT JOIN users p2 ON p2.id = m.player2_id
            LEFT JOIN users w ON w.id = m.winner_id
            LEFT JOIN clubs c ON c.id = m.club_id
            LEFT JOIN users sb ON sb.id = m.submitted_by
            LEFT JOIN users ab ON ab.id = m.approved_by
            WHERE m.id = ?`,
      args: [matchId],
    });
    const r = result.rows[0] as any;
    if (!r) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const match = {
      id: String(r.id),
      player1Id: String(r.player1_id),
      player2Id: String(r.player2_id),
      winnerId: r.winner_id ? String(r.winner_id) : null,
      score1: Number(r.score1),
      score2: Number(r.score2),
      status: String(r.status),
      statusRaw: String(r.status_raw),
      notes: r.notes ? String(r.notes) : null,
      isDisputed: !!Number(r.is_disputed),
      clubId: r.club_id ? String(r.club_id) : null,
      createdAt: String(r.created_at),
      player1: { id: String(r.p1_id), username: String(r.p1_username), displayName: r.p1_display ? String(r.p1_display) : String(r.p1_username), avatarUrl: r.p1_avatar ? String(r.p1_avatar) : null },
      player2: { id: String(r.p2_id), username: String(r.p2_username), displayName: r.p2_display ? String(r.p2_display) : String(r.p2_username), avatarUrl: r.p2_avatar ? String(r.p2_avatar) : null },
      winner: r.w_id ? { id: String(r.w_id), username: String(r.w_username), displayName: String(r.w_display) } : null,
      club: r.c_id ? { id: String(r.c_id), name: String(r.c_name), tag: r.c_tag ? String(r.c_tag) : null } : null,
      submittedById: String(r.submitted_by),
      submittedBy: r.sb_id ? { id: String(r.sb_id), username: String(r.sb_username) } : null,
      approvedById: r.approved_by ? String(r.approved_by) : null,
      approvedBy: r.ab_id ? { id: String(r.ab_id), username: String(r.ab_username) } : null,
    };
    return NextResponse.json({ match });
  } catch (e) {
    console.error("[matchId GET]", e);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const notes = body?.notes;

  if (!action || !["approve", "dispute"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const matchRes = await db.execute({
      sql: "SELECT id, status, status_raw, notes FROM match_reports WHERE id = ?",
      args: [matchId],
    });
    const match = matchRes.rows[0] as any;
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const now = new Date().toISOString();

    if (action === "approve") {
      if (String(match.status) !== "CONFIRMED") {
        return NextResponse.json({ error: "Only confirmed matches can be approved" }, { status: 400 });
      }
      await db.execute({
        sql: `UPDATE match_reports SET status = 'APPROVED', status_raw = 'APPROVED', approved_by = ?, approved_at = ? WHERE id = ?`,
        args: [auth.session.userId, now, matchId],
      });
      try {
        await db.execute({
          sql: "INSERT INTO audit_logs (id, admin_id, action, target, details, created_at) VALUES (?, ?, 'MATCH_APPROVE', ?, ?, ?)",
          args: [crypto.randomUUID(), auth.session.userId, `MATCH_REPORT:${matchId}`, JSON.stringify({ notes }), now],
        });
      } catch {}
      return NextResponse.json({ success: true, matchId });
    }

    if (action === "dispute") {
      const newNotes = notes ? `${match.notes ?? ""}\n[DISPUTE]: ${notes}`.trim() : match.notes;
      await db.execute({
        sql: "UPDATE match_reports SET is_disputed = 1, notes = ? WHERE id = ?",
        args: [newNotes, matchId],
      });
      try {
        await db.execute({
          sql: "INSERT INTO audit_logs (id, admin_id, action, target, details, created_at) VALUES (?, ?, 'MATCH_DISPUTE', ?, ?, ?)",
          args: [crypto.randomUUID(), auth.session.userId, `MATCH_REPORT:${matchId}`, JSON.stringify({ notes }), now],
        });
      } catch {}
      return NextResponse.json({ success: true, matchId });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[matchId PATCH]", e);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}