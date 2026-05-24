import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";
import { db } from "@/lib/db";
import { z } from "zod";

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  link: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = AnnouncementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, message, link } = parsed.data;
  const now = new Date().toISOString();
  const userIds = await db.execute("SELECT id FROM users WHERE is_banned = 0");

  let sent = 0;
  for (const row of userIds.rows) {
    const uid = String((row as Record<string, unknown>).id);
    try {
      await db.execute({
        sql: "INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at) VALUES (?, ?, 'ADMIN', ?, ?, ?, ?)",
        args: [crypto.randomUUID(), uid, title, message, link || null, now],
      });
      sent++;
    } catch {}
  }

  await db.execute({
    sql: "INSERT INTO activity_logs (id, user_id, action_type, metadata, created_at) VALUES (?, ?, 'ADMIN_ANNOUNCEMENT', ?, ?)",
    args: [crypto.randomUUID(), auth.session.userId, JSON.stringify({ title, recipients: sent }), now],
  });

  return NextResponse.json({ ok: true, sent, total: userIds.rows.length });
}
