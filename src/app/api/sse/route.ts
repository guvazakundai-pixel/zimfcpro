/**
 * SSE (Server-Sent Events) real-time endpoint
 * Vercel-compatible — uses streaming Response instead of WebSockets
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.userId;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastCheck = Date.now();
      let lastNotificationId = "";

      // Get the latest notification ID as a starting point
      try {
        const latest = await db.execute({
          sql: "SELECT id FROM notifications_v2 ORDER BY created_at DESC LIMIT 1",
          args: [],
        });
        if (latest.rows.length > 0) {
          lastNotificationId = (latest.rows[0] as any).id as string;
        }
      } catch {}

      // Send an initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`)
      );

      // Poll for updates every 3 seconds
      const interval = setInterval(async () => {
        try {
          const now = Date.now();

          // Check for new notifications (if authenticated)
          if (userId) {
            const notifications = await db.execute({
              sql: `SELECT id, type, title, message, link, is_read, created_at
                    FROM notifications_v2
                    WHERE user_id = ? AND created_at > ?
                    ORDER BY created_at DESC
                    LIMIT 5`,
              args: [userId, new Date(lastCheck).toISOString()],
            });

            for (const row of notifications.rows as any[]) {
              if (row.id !== lastNotificationId) {
                controller.enqueue(
                  encoder.encode(`event: notification\ndata: ${JSON.stringify({
                    id: row.id,
                    type: row.type,
                    title: row.title,
                    message: row.message,
                    link: row.link,
                    isRead: !!row.is_read,
                    createdAt: row.created_at,
                  })}\n\n`)
                );
                lastNotificationId = row.id;
              }
            }
          }

          // Check for active matches (always public)
          const matches = await db.execute({
            sql: `SELECT m.id, p1.username AS player1, p2.username AS player2,
                         m.score1, m.score2, m.status_raw
                  FROM match_reports m
                  LEFT JOIN users p1 ON p1.id = m.player1_id
                  LEFT JOIN users p2 ON p2.id = m.player2_id
                  WHERE m.status_raw IN ('ACTIVE', 'SCORE_SUBMITTED', 'PENDING_VERIFICATION')
                  ORDER BY m.created_at DESC
                  LIMIT 10`,
            args: [],
          });

          controller.enqueue(
            encoder.encode(`event: live-matches\ndata: ${JSON.stringify(
              (matches.rows as any[]).map((r) => ({
                id: r.id,
                player1: r.player1 ?? "Player 1",
                player2: r.player2 ?? "Player 2",
                score1: r.score1 ?? 0,
                score2: r.score2 ?? 0,
                status: r.status_raw ?? "ACTIVE",
              }))
            )}\n\n`)
          );

          lastCheck = now;
        } catch (e) {
          // Silently skip polling errors — the client will retry on reconnect
        }
      }, 3000);

      // Clean up on connection close
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
