import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail, renderPasswordResetEmail } from "@/lib/email";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { randomBytes, createHash } from "crypto";

const Schema = z.object({
  email: z.string().email(),
});

const CODE_EXPIRY_MS = 15 * 60 * 1000;

function generateCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const rl = rateLimit(rateLimitKey(req, "forgot-password"), {
    windowMs: 60 * 1000,
    max: 3,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { email } = parsed.data;

  const result = await db.execute({
    sql: "SELECT id, username, display_name, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    args: [email.toLowerCase()],
  });

  const user = result.rows[0] as Record<string, unknown> | undefined;

  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "If an account with that email exists, a reset code has been sent.",
    });
  }

  const code = generateCode();
  const hashedCode = hashToken(code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();

  await db.execute({
    sql: "UPDATE users SET verification_token = ?, verification_token_expiry = ? WHERE id = ?",
    args: [hashedCode, expiresAt, String(user.id)],
  });

  const displayName = String(user.display_name || user.username);

  await sendEmail({
    to: email,
    subject: "Your ZimFC Pro Password Reset Code",
    html: renderPasswordResetEmail({ username: displayName, code }),
  });

  return NextResponse.json({
    ok: true,
    message: "If an account with that email exists, a reset code has been sent.",
  });
}
