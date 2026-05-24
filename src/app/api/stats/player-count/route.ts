import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.execute(
      "SELECT count(*) as c FROM player_rankings"
    );
    const count = Number(result.rows[0]?.c ?? 0);
    console.log(`[Stats] Player count fetched: ${count}`);
    return NextResponse.json({ playerCount: count });
  } catch (err) {
    console.error("[Stats] Failed to fetch player count:", err);
    return NextResponse.json({ playerCount: 0 }, { status: 500 });
  }
}
