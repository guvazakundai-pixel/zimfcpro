import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "30")));

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [totalUsers, verifiedUsers, fakeUsers, recentSignups, countryStats, platformStats] =
    await Promise.all([
      db.execute("SELECT COUNT(*) as c FROM users"),
      db.execute("SELECT COUNT(*) as c FROM users WHERE is_verified = 1"),
      db.execute("SELECT COUNT(*) as c FROM users WHERE is_fake = 1"),
      db.execute({
        sql: "SELECT date(created_at) as day, COUNT(*) as count FROM users WHERE created_at >= ? GROUP BY date(created_at) ORDER BY day ASC",
        args: [cutoff],
      }),
      db.execute({
        sql: "SELECT country, COUNT(*) as count FROM users WHERE country != '' GROUP BY country ORDER BY count DESC LIMIT 10",
      }),
      db.execute({
        sql: "SELECT platform, COUNT(*) as count FROM users WHERE platform != '' AND platform IS NOT NULL GROUP BY platform ORDER BY count DESC",
      }),
    ]);

  return NextResponse.json({
    totalUsers: Number((totalUsers.rows[0] as Record<string, unknown>)?.c ?? 0),
    verifiedUsers: Number((verifiedUsers.rows[0] as Record<string, unknown>)?.c ?? 0),
    fakeUsers: Number((fakeUsers.rows[0] as Record<string, unknown>)?.c ?? 0),
    signupTrend: recentSignups.rows.map(
      (r) => ({ day: String((r as Record<string, unknown>).day), count: Number((r as Record<string, unknown>).count) }),
    ),
    topCountries: countryStats.rows.map(
      (r) => ({ country: String((r as Record<string, unknown>).country), count: Number((r as Record<string, unknown>).count) }),
    ),
    platformDistribution: platformStats.rows.map(
      (r) => ({ platform: String((r as Record<string, unknown>).platform), count: Number((r as Record<string, unknown>).count) }),
    ),
  });
}
