import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

async function safeCount(sql: string, args: any[] = []): Promise<number> {
  try {
    const r = await db.execute({ sql, args });
    return Number((r.rows[0] as any)?.c ?? 0);
  } catch {
    return 0;
  }
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
    redirect("/dashboard");
  }

  const [
    totalUsers, totalClubs, totalMatches, pendingReports,
    totalTournaments, activeLeagues, totalAchievements, recentActivity,
    activeMatches, newUsersToday,
  ] = await Promise.all([
    safeCount("SELECT count(*) as c FROM users"),
    safeCount("SELECT count(*) as c FROM clubs"),
    safeCount("SELECT count(*) as c FROM match_reports"),
    safeCount("SELECT count(*) as c FROM match_disputes WHERE status = 'OPEN'"),
    safeCount("SELECT count(*) as c FROM tournaments"),
    safeCount("SELECT count(*) as c FROM leagues WHERE status IN ('LIVE', 'REGISTRATION')"),
    safeCount("SELECT count(*) as c FROM player_achievements"),
    db.execute({
      sql: `SELECT ua.type, ua.message, ua.created_at, u.username
            FROM user_activities ua
            JOIN users u ON u.id = ua.user_id
            ORDER BY ua.created_at DESC LIMIT 10`,
      args: [],
    }).then(r => (r.rows as Row[]).map(r => ({
      type: r.type as string,
      message: r.message as string,
      createdAt: r.created_at as string,
      username: r.username as string,
    }))).catch(() => []),
    safeCount("SELECT count(*) as c FROM match_reports WHERE status_raw = 'ACTIVE'"),
    safeCount("SELECT count(*) as c FROM users WHERE created_at > datetime('now', '-1 day')"),
  ]);

  const stats = {
    totalUsers,
    totalClubs,
    totalMatches,
    pendingReports,
    totalTournaments,
    activeLeagues,
    totalAchievements,
    activeMatches,
    newUsersToday,
  };

  return (
    <AdminDashboardClient
      stats={stats}
      recentActivity={recentActivity as { type: string; message: string; createdAt: string; username: string }[]}
    />
  );
}
