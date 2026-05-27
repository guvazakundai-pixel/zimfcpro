import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";

const MISSIONS = [
  { type: "INVITE_FRIEND", title: "Social Butterfly", description: "Invite 1 friend to ZimFC Pro", xpReward: 10 },
  { type: "PLAY_MATCH", title: "First Match", description: "Play your first competitive match", xpReward: 50 },
  { type: "JOIN_TOURNAMENT", title: "Tournament Debut", description: "Join a tournament", xpReward: 75 },
  { type: "CREATE_CLUB", title: "Club Founder", description: "Create your own club", xpReward: 100 },
  { type: "WIN_MATCH", title: "First Victory", description: "Win your first competitive match", xpReward: 100 },
] as const;

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.userId;

  const existing = await db.execute({
    sql: "SELECT title, completed FROM player_achievements WHERE user_id = ? AND mission_type IS NOT NULL",
    args: [userId],
  });
  const completedSet = new Set(
    (existing.rows as Record<string, unknown>[]).map((r) => r.title as string),
  );

  const now = new Date().toISOString();

  const toInsert = MISSIONS.filter((m) => !completedSet.has(m.title));
  for (const m of toInsert) {
    try {
      await db.execute({
        sql: "INSERT INTO player_achievements (id, user_id, title, description, icon, category, rarity, mission_type, xp_reward, completed, unlocked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
        args: [crypto.randomUUID(), userId, m.title, m.description, "🎯", "GENERAL", "COMMON", m.type, m.xpReward, null, now],
      });
    } catch {}
  }

  const allRows = await db.execute({
    sql: "SELECT id, title, description, mission_type, xp_reward, completed FROM player_achievements WHERE user_id = ? AND mission_type IS NOT NULL ORDER BY xp_reward ASC",
    args: [userId],
  });

  return NextResponse.json({
    missions: (allRows.rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      description: r.description as string,
      type: r.mission_type as string,
      xpReward: Number(r.xp_reward ?? 0),
      completed: Number(r.completed ?? 0) === 1,
    })),
  });
}
