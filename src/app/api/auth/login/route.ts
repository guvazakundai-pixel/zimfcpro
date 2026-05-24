import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, type Role } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { sendEmail, renderWelcomeEmail } from "@/lib/email";
import { getDivisionForSkillRating } from "@/lib/divisions";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";

const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rlKey = rateLimitKey(req, "login");
  const rl = rateLimit(rlKey, { windowMs: 60 * 1000, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  const result = await db.execute({
    sql: "SELECT id, username, email, password_hash, role, display_name, platform, is_banned, referral_code, last_login FROM users WHERE LOWER(username) = LOWER(?) OR email = ? LIMIT 1",
    args: [identifier, identifier.toLowerCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    await db.execute({
      sql: "INSERT INTO login_attempts (id, ip, success, created_at) VALUES (?, ?, 0, ?)",
      args: [crypto.randomUUID(), ip, new Date().toISOString()],
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const userId = String(row.id);
  const passwordHash = typeof row.password_hash === "string" ? row.password_hash : String(row.password_hash);
  const isValid = await verifyPassword(password, passwordHash);

  await db.execute({
    sql: "INSERT INTO login_attempts (id, ip, user_id, success, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [crypto.randomUUID(), ip, userId, isValid ? 1 : 0, new Date().toISOString()],
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (row.is_banned === 1 || row.is_banned === true) {
    return NextResponse.json({ error: "Account suspended. Contact an admin." }, { status: 403 });
  }

  const username = String(row.username);
  const email = String(row.email || "");
  const role = String(row.role) as Role;
  const displayName = row.display_name ? sanitizeInput(String(row.display_name)) : username;
  const platform = row.platform ? String(row.platform) : "PS5";
  const referralCode = row.referral_code ? String(row.referral_code) : "";
  const lastLogin = row.last_login ? String(row.last_login) : null;
  const isFirstLogin = lastLogin === null;

  await db.execute({
    sql: "UPDATE users SET last_login = ? WHERE id = ?",
    args: [new Date().toISOString(), userId],
  });

  await setSessionCookie({ userId, username, role });

  if (isFirstLogin) {
    try {
      const rankRow = await db.execute({
        sql: "SELECT rank_position FROM player_rankings WHERE user_id = ? LIMIT 1",
        args: [userId],
      });
      const globalRank = rankRow.rows.length > 0
        ? Number((rankRow.rows[0] as Record<string, unknown>).rank_position)
        : 1;

      const statsRow = await db.execute({
        sql: "SELECT skill_rating FROM player_stats WHERE user_id = ? LIMIT 1",
        args: [userId],
      });
      const skillRating = statsRow.rows.length > 0
        ? Number((statsRow.rows[0] as Record<string, unknown>).skill_rating)
        : 1000;
      const division = getDivisionForSkillRating(skillRating);

      const welcomeUrl = `${process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw"}/join/${referralCode}`;

      await sendEmail({
        to: email,
        subject: "Welcome to ZimFC Pro — Your Competitive Journey Starts Now",
        html: renderWelcomeEmail({
          username,
          displayName,
          globalRank,
          division,
          referralCode,
          referralLink: welcomeUrl,
          platform,
        }),
      });
    } catch (err) {
      console.error(`[Login] Failed to send welcome email to ${email}:`, err);
    }
  }

  return NextResponse.json({
    user: {
      id: userId,
      username,
      email,
      role,
      displayName,
      platform,
    },
  });
}
