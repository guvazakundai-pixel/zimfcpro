import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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
  const siteUrl = process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw";

  await sendEmail({
    to: email,
    subject: "Your ZimFC Pro Password Reset Code",
    html: renderResetCodeEmail({ code, displayName, siteUrl }),
  });

  return NextResponse.json({
    ok: true,
    message: "If an account with that email exists, a reset code has been sent.",
  });
}

function renderResetCodeEmail(params: { code: string; displayName: string; siteUrl: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border-radius:24px;border:1px solid rgba(255,255,255,0.06)">
    <tr><td style="padding:40px 32px 16px;text-align:center">
      <h1 style="color:#00ff85;font-size:28px;font-weight:900;letter-spacing:-0.5px;margin:0 0 8px;text-transform:uppercase">ZimFC Pro</h1>
      <p style="color:#8E909A;font-size:14px;margin:0 0 32px">Password Reset Request</p>
    </td></tr>

    <tr><td style="padding:0 32px">
      <p style="color:#EDEDED;font-size:15px;margin:0 0 16px">Hey <strong style="color:#00ff85">${params.displayName}</strong>,</p>
      <p style="color:#BFC3C9;font-size:14px;margin:0 0 24px">We received a request to reset your password. Use the code below to proceed. This code expires in 15 minutes.</p>
    </td></tr>

    <tr><td style="padding:0 32px">
      <div style="background:rgba(0,255,133,0.06);border:1px solid rgba(0,255,133,0.12);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
        <p style="color:#6B6D78;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">Reset Code</p>
        <p style="color:#00ff85;font-size:36px;font-weight:900;margin:0;font-family:'JetBrains Mono','Fira Code',monospace;letter-spacing:8px">${params.code}</p>
      </div>
    </td></tr>

    <tr><td style="padding:0 32px">
      <div style="background:rgba(255,77,77,0.04);border:1px solid rgba(255,77,77,0.10);border-radius:12px;padding:16px;margin-bottom:24px">
        <p style="color:#ff4d4d;font-size:12px;font-weight:700;margin:0 0 4px">Security Notice</p>
        <p style="color:#8E909A;font-size:12px;margin:0">If you didn't request this reset, ignore this email. Your password remains unchanged.</p>
      </div>
    </td></tr>

    <tr><td style="padding:32px;text-align:center">
      <a href="${params.siteUrl}/?auth=reset" style="display:inline-block;padding:14px 32px;background:#00ff85;color:#000;text-decoration:none;font-weight:700;font-size:14px;border-radius:12px;text-transform:uppercase;letter-spacing:1px">Reset Password</a>
    </td></tr>

    <tr><td style="padding:0 32px 32px;text-align:center">
      <p style="color:#6B6D78;font-size:11px;margin:0">ZimFC Pro — The Official Competitive FC Ecosystem of Zimbabwe</p>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}