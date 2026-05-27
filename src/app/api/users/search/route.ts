import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ users: [] });

  const escaped = q.replace(/[%_\\]/g, "\\$&");

  try {
    const result = await db.execute({
      sql: `SELECT u.id, u.username, u.display_name, u.avatar_url,
                   pr.rank_position
            FROM users u
            LEFT JOIN player_rankings pr ON pr.user_id = u.id
            WHERE (u.username LIKE ? ESCAPE '\\' OR u.display_name LIKE ? ESCAPE '\\')
              AND u.id != ?
            ORDER BY pr.rank_position ASC
            LIMIT 10`,
      args: [`%${escaped}%`, `%${escaped}%`, auth.session.userId],
    });

    const users = (result.rows as any[]).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name ?? r.username,
      avatarUrl: r.avatar_url,
      playerRanking: r.rank_position ? { rankPosition: r.rank_position } : null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[UserSearch] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
