import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

const CreateSchema = z.object({
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  clubId: z.string().optional(),
  score1: z.number().int().min(0).default(0),
  score2: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

function mapMatch(row: any) {
  return {
    id: row.id,
    player1Id: row.player1_id,
    player2Id: row.player2_id,
    winnerId: row.winner_id,
    score1: row.score1,
    score2: row.score2,
    status: row.status,
    statusRaw: row.status_raw,
    notes: row.notes,
    isDisputed: !!row.is_disputed,
    createdAt: row.created_at,
    player1: row.p1_id ? { id: row.p1_id, username: row.p1_username, displayName: row.p1_display, avatarUrl: row.p1_avatar } : null,
    player2: row.p2_id ? { id: row.p2_id, username: row.p2_username, displayName: row.p2_display, avatarUrl: row.p2_avatar } : null,
    winner: row.winner_id ? { id: row.winner_id, username: row.w_username, displayName: row.w_display } : null,
    club: row.club_id ? { id: row.club_id, name: row.c_name, tag: row.c_tag } : null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const playerId = searchParams.get("player");
  const clubId = searchParams.get("club");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const args: any[] = [];

    if (status) { conditions.push("m.status = ?"); args.push(status); }
    if (playerId) { conditions.push("(m.player1_id = ? OR m.player2_id = ?)"); args.push(playerId, playerId); }
    if (clubId) { conditions.push("m.club_id = ?"); args.push(clubId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.execute({
      sql: `SELECT count(*) as c FROM match_reports m ${where}`,
      args,
    });
    const total = Number((countResult.rows[0] as any)?.c ?? 0);

    const dataResult = await db.execute({
      sql: `SELECT m.*,
                   p1.id AS p1_id, p1.username AS p1_username, p1.display_name AS p1_display, p1.avatar_url AS p1_avatar,
                   p2.id AS p2_id, p2.username AS p2_username, p2.display_name AS p2_display, p2.avatar_url AS p2_avatar,
                   w.username AS w_username, w.display_name AS w_display,
                   c.name AS c_name, c.tag AS c_tag
            FROM match_reports m
            LEFT JOIN users p1 ON p1.id = m.player1_id
            LEFT JOIN users p2 ON p2.id = m.player2_id
            LEFT JOIN users w ON w.id = m.winner_id
            LEFT JOIN clubs c ON c.id = m.club_id
            ${where}
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const matches = (dataResult.rows as any[]).map(mapMatch);

    return NextResponse.json({ matches, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[matches]", e);
    return NextResponse.json({ matches: [], total: 0, page: 1, totalPages: 0 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { player1Id, player2Id, clubId, score1, score2, notes } = parsed.data;

  if (player1Id === player2Id) {
    return NextResponse.json({ error: "Players must be different" }, { status: 400 });
  }

  // Verify both players exist
  const playerCheck = await db.execute({
    sql: "SELECT id FROM users WHERE id IN (?, ?)",
    args: [player1Id, player2Id],
  });
  if (playerCheck.rows.length < 2) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  let winnerId: string | null = null;
  if (score1 > score2) winnerId = player1Id;
  else if (score2 > score1) winnerId = player2Id;

  const matchId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO match_reports (id, player1_id, player2_id, club_id, score1, score2, winner_id, status, status_raw, notes, submitted_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', ?, ?, ?)`,
    args: [matchId, player1Id, player2Id, clubId ?? null, score1, score2, winnerId, notes ?? null, auth.session.userId, now],
  });

  // Fetch the created match with joins
  const result = await db.execute({
    sql: `SELECT m.*,
                 p1.id AS p1_id, p1.username AS p1_username, p1.display_name AS p1_display, p1.avatar_url AS p1_avatar,
                 p2.id AS p2_id, p2.username AS p2_username, p2.display_name AS p2_display, p2.avatar_url AS p2_avatar,
                 w.username AS w_username, w.display_name AS w_display
          FROM match_reports m
          LEFT JOIN users p1 ON p1.id = m.player1_id
          LEFT JOIN users p2 ON p2.id = m.player2_id
          LEFT JOIN users w ON w.id = m.winner_id
          WHERE m.id = ?`,
    args: [matchId],
  });

  const match = (result.rows[0] as any) ? mapMatch(result.rows[0]) : null;

  return NextResponse.json({ match }, { status: 201 });
}
