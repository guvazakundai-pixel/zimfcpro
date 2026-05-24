import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
    redirect("/dashboard");
  }

  async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn(); } catch (e) { console.error("[Admin] Query failed:", e); return fallback; }
  }

  const [totalUsers, totalClubs, totalMatches, pendingReports, totalTournaments, activeLeagues, totalAchievements, recentActivity] = await Promise.all([
    safeQuery(() => prisma.user.count(), 0),
    safeQuery(() => prisma.club.count(), 0),
    safeQuery(async () => {
      const r = await db.execute({ sql: `SELECT COUNT(*) as c FROM tournament_matches`, args: [] });
      return (r.rows[0] as any)?.c ?? 0;
    }, 0),
    safeQuery(() => prisma.matchDispute.count({ where: { status: "OPEN" } }), 0),
    safeQuery(() => prisma.tournament.count(), 0),
    safeQuery(() => prisma.league.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(() => prisma.playerAchievement.count(), 0),
    safeQuery(async () => {
      const result = await db.execute({
        sql: `SELECT ua.type, ua.message, ua.created_at AS createdAt, u.username
              FROM user_activities ua
              JOIN users u ON u.id = ua.user_id
              ORDER BY ua.created_at DESC LIMIT 10`,
        args: [],
      });
      return (result.rows as Row[]).map((r: Row) => ({
        type: r.type as string,
        message: r.message as string,
        createdAt: r.createdAt as string,
        username: r.username as string,
      }));
    }, []),
  ]);

  const stats = { totalUsers, totalClubs, totalMatches, pendingReports, totalTournaments, activeLeagues, totalAchievements };

  return (
    <AdminDashboardClient
      stats={stats}
      recentActivity={recentActivity as { type: string; message: string; createdAt: string; username: string }[]}
    />
  );
}
