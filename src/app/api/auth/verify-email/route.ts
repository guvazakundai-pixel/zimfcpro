import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Verification token required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "SELECT id, verification_token_expiry FROM users WHERE verification_token = ? AND is_verified = 0 LIMIT 1",
    args: [token],
  });

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 404 });
  }

  const expiry = row.verification_token_expiry
    ? new Date(String(row.verification_token_expiry))
    : null;
  if (expiry && expiry < new Date()) {
    return NextResponse.json({ error: "Verification token has expired" }, { status: 410 });
  }

  const userId = String(row.id);
  const now = new Date().toISOString();

  await db.execute({
    sql: "UPDATE users SET is_verified = 1, verification_token = NULL, verification_token_expiry = NULL, updated_at = ? WHERE id = ?",
    args: [now, userId],
  });

  return NextResponse.json({ success: true, message: "Email verified successfully" });
}
