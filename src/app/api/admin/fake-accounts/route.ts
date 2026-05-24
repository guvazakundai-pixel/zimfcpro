import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "list";

  if (action === "count") {
    const result = await db.execute("SELECT COUNT(*) as c FROM users WHERE is_fake = 1");
    const count = Number((result.rows[0] as Record<string, unknown>)?.c ?? 0);
    return NextResponse.json({ count });
  }

  if (action === "list") {
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const [users, total] = await Promise.all([
      db.execute({
        sql: "SELECT id, username, email, display_name, is_fake, is_verified, created_at FROM users WHERE is_fake = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?",
        args: [limit, offset],
      }),
      db.execute("SELECT COUNT(*) as c FROM users WHERE is_fake = 1"),
    ]);

    return NextResponse.json({
      users: users.rows,
      total: Number((total.rows[0] as Record<string, unknown>)?.c ?? 0),
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const { userIds } = await req.json().catch(() => ({}));
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds array required" }, { status: 400 });
  }

  const placeholders = userIds.map(() => "?").join(",");
  const result = await db.execute({
    sql: `DELETE FROM users WHERE id IN (${placeholders}) AND is_fake = 1`,
    args: userIds,
  });

  return NextResponse.json({
    deleted: result.rowsAffected,
    message: `Removed ${result.rowsAffected} fake account(s)`,
  });
}
