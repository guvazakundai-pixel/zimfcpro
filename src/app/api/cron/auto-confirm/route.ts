import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const authHeader = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : "";
  if (authHeader && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await db.execute({
      sql: `UPDATE match_reports
            SET status = 'CONFIRMED', status_raw = 'CONFIRMED',
                confirmations = COALESCE(confirmations, '{}')
            WHERE status = 'PENDING' AND created_at < ?`,
      args: [cutoff],
    });
    const confirmed = (result.rowsAffected ?? 0);
    console.log(`[Cron] Auto-confirmed ${confirmed} pending matches older than 24h`);
    return NextResponse.json({ confirmed, cutoff });
  } catch (e) {
    console.error("[Cron] Auto-confirm failed:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}