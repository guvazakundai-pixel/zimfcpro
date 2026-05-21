import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const rows = await db.execute({
    sql: `SELECT u.id, u.username, u.display_name, u.referral_count, u.referral_xp
          FROM users u
          WHERE u.referral_count > 0
          ORDER BY u.referral_xp DESC
          LIMIT 50`,
    args: [],
  });

  return NextResponse.json({
    leaderboard: (rows.rows as Record<string, unknown>[]).map((r, i) => ({
      rank: i + 1,
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      referralCount: Number(r.referral_count ?? 0),
      referralXp: Number(r.referral_xp ?? 0),
    })),
  });
}
