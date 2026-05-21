import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username || username.length < 3) {
    return NextResponse.json({ available: false });
  }
  const result = await db.execute({
    sql: "SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1",
    args: [username],
  });
  return NextResponse.json({ available: result.rows.length === 0 });
}
