import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, type Role } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { sendEmail, renderWelcomeEmail } from "@/lib/email";

const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

const DIVISIONS = [
  "Bronze III", "Bronze II", "Bronze I",
  "Silver III", "Silver II", "Silver I",
  "Gold III", "Gold II", "Gold I",
  "Platinum III", "Platinum II", "Platinum I",
  "Diamond III", "Diamond II", "Diamond I",
  "Elite III", "Elite II", "Elite I",
  "Master III", "Master II", "Master I",
  "Legendary",
] as const;

function getDivisionForSkillRating(sr: number): string {
  if (sr >= 2800) return "Legendary";
  if (sr >= 2600) return "Master I";
  if (sr >= 2450) return "Master II";
  if (sr >= 2300) return "Master III";
  if (sr >= 2150) return "Elite I";
  if (sr >= 2000) return "Elite II";
  if (sr >= 1850) return "Elite III";
  if (sr >= 1700) return "Diamond I";
  if (sr >= 1550) return "Diamond II";
  if (sr >= 1400) return "Diamond III";
  if (sr >= 1250) return "Platinum I";
  if (sr >= 1100) return "Platinum II";
  if (sr >= 950) return "Platinum III";
  if (sr >= 800) return "Gold I";
  if (sr >= 650) return "Gold II";
  if (sr >= 500) return "Gold III";
  if (sr >= 350) return "Silver I";
  if (sr >= 200) return "Silver II";
  if (sr >= 100) return "Silver III";
  if (sr >= 50) return "Bronze I";
  if (sr >= 25) return "Bronze II";
  return "Bronze III";
}

export async function POST(req: Request) {
  console.log("[Login] Starting login request");

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  console.log(`[Login] Looking up user: ${identifier}`);

  const result = await db.execute({
    sql: "SELECT id, username, email, password_hash, role, display_name, platform, is_banned, referral_code, last_login FROM users WHERE LOWER(username) = LOWER(?) OR email = ? LIMIT 1",
    args: [identifier, identifier.toLowerCase()],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    console.warn(`[Login] No user found for: ${identifier}`);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const passwordHash = typeof row.password_hash === "string" ? row.password_hash : String(row.password_hash);
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    console.warn(`[Login] Invalid password for: ${identifier}`);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (row.is_banned === 1 || row.is_banned === true) {
    console.warn(`[Login] Banned user attempted login: ${identifier}`);
    return NextResponse.json({ error: "Account suspended. Contact an admin." }, { status: 403 });
  }

  const userId = String(row.id);
  const username = String(row.username);
  const email = String(row.email || "");
  const role = String(row.role) as Role;
  const displayName = row.display_name ? String(row.display_name) : username;
  const platform = row.platform ? String(row.platform) : "PS5";
  const referralCode = row.referral_code ? String(row.referral_code) : "";
  const lastLogin = row.last_login ? String(row.last_login) : null;

  const isFirstLogin = lastLogin === null;

  console.log(`[Login] User ${username} found. First login: ${isFirstLogin}`);

  await db.execute({
    sql: "UPDATE users SET last_login = ? WHERE id = ?",
    args: [new Date().toISOString(), userId],
  });

  await setSessionCookie({ userId, username, role });

  if (isFirstLogin) {
    console.log(`[Login] First-time login for ${username} (${email}). Sending welcome email.`);

    try {
      const rankRow = await db.execute({
        sql: "SELECT rank_position FROM player_rankings WHERE user_id = ? LIMIT 1",
        args: [userId],
      });
      const globalRank = rankRow.rows.length > 0 ? Number((rankRow.rows[0] as Record<string, unknown>).rank_position) : 1;

      const statsRow = await db.execute({
        sql: "SELECT skill_rating FROM player_stats WHERE user_id = ? LIMIT 1",
        args: [userId],
      });
      const skillRating = statsRow.rows.length > 0 ? Number((statsRow.rows[0] as Record<string, unknown>).skill_rating) : 1000;
      const division = getDivisionForSkillRating(skillRating);

      const welcomeUrl = `${process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw"}/join/${referralCode}`;

      const emailSent = await sendEmail({
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
      console.log(`[Login] Welcome email ${emailSent ? "sent" : "not sent"} to ${email}`);
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
