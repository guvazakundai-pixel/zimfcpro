import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const result = await db.execute({
    sql: `SELECT id, username, email, role, display_name, avatar_url, country, city, platform,
                 is_banned, is_shadow_banned, is_verified, is_fake,
                 created_at, last_login, last_active_at
          FROM users
          ORDER BY created_at DESC
          LIMIT 200`,
    args: [],
  });

  const users = (result.rows as any[]).map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    role: r.role,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    country: r.country,
    city: r.city,
    platform: r.platform,
    isBanned: !!r.is_banned,
    isShadowBanned: !!r.is_shadow_banned,
    isVerified: !!r.is_verified,
    isFake: !!r.is_fake,
    createdAt: r.created_at,
    lastLogin: r.last_login,
    lastActiveAt: r.last_active_at,
  }));

  return NextResponse.json({ users });
}
