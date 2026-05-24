import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { sendEmail, renderWelcomeEmail } from "@/lib/email";

const PLATFORMS = ["PS5", "XBOX", "PC"] as const;

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers, underscores only"),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  platform: z.enum(PLATFORMS).default("PS5"),
  region: z.string().max(60).optional().default(""),
  referralCode: z.string().max(20).optional().default(""),
});

function generateReferralCode(username: string): string {
  const prefix = username.slice(0, 5).toUpperCase();
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}${suffix}`;
}

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
  console.log("[Register] Starting registration request");

  const rlKey = rateLimitKey(req, "register");
  const rl = rateLimit(rlKey, { windowMs: 60 * 60 * 1000, max: 5 });
  if (!rl.allowed) {
    console.warn("[Register] Rate limit exceeded for", rlKey);
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[Register] Invalid input:", parsed.error.flatten());
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { username, email, password, platform, region, referralCode } = parsed.data;

  console.log(`[Register] Checking existing account for ${username} / ${email}`);

  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    args: [username, email],
  });
  if (existing.rows.length > 0) {
    console.warn(`[Register] Account already exists for ${username} / ${email}`);
    return NextResponse.json(
      { error: "An account with that username or email already exists. Try signing in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  console.log("[Register] Counting existing players for rank assignment");

  const totalRow = await db.execute("SELECT count(*) as c FROM player_rankings");
  const playerCount = Number(totalRow.rows[0]?.c ?? 0);
  const startingRank = playerCount + 1;

  console.log(`[Register] Player count: ${playerCount}, starting rank: ${startingRank}`);

  const skills: string[] = [];
  try { await db.execute("ALTER TABLE users ADD COLUMN referral_code TEXT"); } catch { skills.push("rc"); }
  try { await db.execute("ALTER TABLE users ADD COLUMN referred_by TEXT"); } catch { skills.push("rb"); }
  try { await db.execute("ALTER TABLE users ADD COLUMN referral_xp INTEGER DEFAULT 0"); } catch { skills.push("rx"); }
  try { await db.execute("ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0"); } catch { skills.push("rn"); }
  try { await db.execute("ALTER TABLE users ADD COLUMN region TEXT DEFAULT ''"); } catch { skills.push("rg"); }

  try { await db.execute("ALTER TABLE player_rankings ADD COLUMN regional_rank INTEGER"); } catch {}
  try { await db.execute("ALTER TABLE player_rankings ADD COLUMN platform_rank INTEGER"); } catch {}

  let referrerId: string | null = null;
  if (referralCode) {
    const referrerRow = await db.execute({
      sql: "SELECT id FROM users WHERE referral_code = ? LIMIT 1",
      args: [referralCode.toUpperCase()],
    });
    if (referrerRow.rows.length > 0) {
      referrerId = (referrerRow.rows[0] as Record<string, unknown>).id as string;
      console.log(`[Register] Referrer found: ${referrerId}`);
    }
  }

  const code = generateReferralCode(username);

  const statsId = crypto.randomUUID();
  const rankingId = crypto.randomUUID();
  const achievementId = crypto.randomUUID();
  const welcome = ACHIEVEMENTS.WELCOME;

  console.log("[Register] Creating user in database");

  await db.batch(
    [
      {
        sql: "INSERT INTO users (id, username, email, password_hash, display_name, platform, country, region, role, referral_code, referred_by, referral_xp, referral_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'Zimbabwe', ?, 'PLAYER', ?, ?, 0, 0, ?, ?)",
        args: [id, username, email, passwordHash, username, platform, region || null, code, referrerId, now, now],
      },
      {
        sql: "INSERT INTO player_stats (id, user_id, matches_played, wins, losses, draws, goals_scored, goals_conceded, skill_rating, points, form_score, win_streak, mvp_count, form_history, updated_at) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 1000, 0, 0, 0, 0, '', ?)",
        args: [statsId, id, now],
      },
      {
        sql: "INSERT INTO player_rankings (id, user_id, rank_position, prev_position, rank_change, points, final_score, updated_at) VALUES (?, ?, ?, NULL, 0, 0, 0, ?)",
        args: [rankingId, id, startingRank, now],
      },
      {
        sql: "INSERT INTO player_achievements (id, user_id, title, description, icon, category, rarity, unlocked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [achievementId, id, welcome.title, welcome.description, welcome.icon, welcome.category, welcome.rarity, now, now],
      },
    ],
    "write",
  );

  console.log(`[Register] User ${username} (${id}) created successfully`);

  if (referrerId) {
    try {
      await db.execute({
        sql: "UPDATE users SET referral_xp = COALESCE(referral_xp, 0) + 10, referral_count = COALESCE(referral_count, 0) + 1 WHERE id = ?",
        args: [referrerId],
      });
      try {
        await db.execute({
          sql: "INSERT INTO user_activity (id, user_id, type, message, created_at) VALUES (?, ?, 'REFERRAL', ?, ?)",
          args: [crypto.randomUUID(), referrerId, `You recruited @${username} — +10 XP`, now],
        });
      } catch {}
    } catch {}
  }

  await setSessionCookie({ userId: id, username, role: "PLAYER" });

  const division = getDivisionForSkillRating(1000);

  const welcomeUrl = `${process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw"}/join/${code}`;

  console.log(`[Register] Attempting to send welcome email to ${email}`);

  try {
    const emailSent = await sendEmail({
      to: email,
      subject: "Welcome to ZimFC Pro — Your Competitive Journey Starts Now",
      html: renderWelcomeEmail({
        username,
        displayName: username,
        globalRank: startingRank,
        division,
        referralCode: code,
        referralLink: welcomeUrl,
        platform,
      }),
    });
    console.log(`[Register] Welcome email ${emailSent ? "sent" : "not sent (no provider configured)"} to ${email}`);
  } catch (err) {
    console.error(`[Register] Failed to send welcome email to ${email}:`, err);
  }

  console.log(`[Register] Registration complete for ${username}`);

  return NextResponse.json({
    user: {
      id,
      username,
      email,
      role: "PLAYER",
      displayName: username,
      platform,
      region,
    },
    welcome: {
      globalRank: startingRank,
      totalPlayers: playerCount + 1,
      division,
      referralCode: code,
      referralLink: welcomeUrl,
      platform,
      xp: 0,
    },
    referralCode: code,
  });
}
