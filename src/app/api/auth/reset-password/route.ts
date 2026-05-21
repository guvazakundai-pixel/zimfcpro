import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createHash } from "crypto";

const Schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input. Code must be 6 characters, password 8+." },
      { status: 400 }
    );
  }

  const { email, code, newPassword } = parsed.data;
  const hashedCode = createHash("sha256").update(code.toUpperCase()).digest("hex");

  const result = await db.execute({
    sql: "SELECT id, verification_token, verification_token_expiry FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    args: [email.toLowerCase()],
  });

  const user = result.rows[0] as Record<string, unknown> | undefined;

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  const storedToken = String(user.verification_token || "");
  const expiryStr = String(user.verification_token_expiry || "");

  if (!storedToken || !expiryStr) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  if (storedToken !== hashedCode) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  const expiryDate = new Date(expiryStr);
  if (isNaN(expiryDate.getTime()) || expiryDate.getTime() < Date.now()) {
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);

  await db.execute({
    sql: "UPDATE users SET password_hash = ?, verification_token = NULL, verification_token_expiry = NULL WHERE id = ?",
    args: [passwordHash, String(user.id)],
  });

  return NextResponse.json({ ok: true, message: "Password reset successfully." });
}