import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const result = await db.execute({
    sql: `SELECT id, user_id, type, title, message, link, image_url, metadata, is_read, is_archived, created_at, read_at
          FROM notifications_v2
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 50`,
    args: [auth.session.userId],
  });

  const notifications = (result.rows as any[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link,
    imageUrl: r.image_url,
    metadata: r.metadata,
    isRead: !!r.is_read,
    isArchived: !!r.is_archived,
    createdAt: r.created_at,
    readAt: r.read_at,
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}
