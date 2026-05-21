import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.userId;

  const userRow = await db.execute({
    sql: "SELECT referral_code, referral_xp, referral_count, username, display_name FROM users WHERE id = ?",
    args: [userId],
  });
  const user = userRow.rows[0] as Record<string, unknown> | undefined;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const recruitsRow = await db.execute({
    sql: `SELECT u.id, u.username, u.display_name, u.created_at
          FROM users u
          WHERE u.referred_by = ?
          ORDER BY u.created_at DESC
          LIMIT 50`,
    args: [userId],
  });

  const rankRow = await db.execute({
    sql: `SELECT COUNT(*) + 1 AS r FROM users WHERE referral_xp > COALESCE((SELECT referral_xp FROM users WHERE id = ?), 0)`,
    args: [userId],
  });
  const referralRank = Number((rankRow.rows[0] as Record<string, unknown>)?.r ?? 0);

  const referralCode = user.referral_code as string;
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw";

  return NextResponse.json({
    referralCode,
    referralLink: `${baseUrl}/join/${referralCode}`,
    referralXp: Number(user.referral_xp ?? 0),
    referralCount: Number(user.referral_count ?? 0),
    referralRank,
    recruits: (recruitsRow.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      joinedAt: r.created_at,
    })),
  });
}
