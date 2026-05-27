import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { PlayerHubClient } from "@/components/PlayerHubClient";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export default async function PlayerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const userId = session.userId;

  async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn(); } catch (e) { console.error("[Dashboard] Query failed:", e); return fallback; }
  }

  const user = await safeQuery(async () => {
    const result = await db.execute({
      sql: `SELECT id, username, display_name, platform, COALESCE(country, 'Zimbabwe') AS country, avatar_url, bio FROM users WHERE id = ? LIMIT 1`,
      args: [userId],
    });
    return (result.rows[0] as Row) ?? null;
  }, null);

  const [statsData, rankingData, notifications, achievements] = await Promise.all([
    safeQuery(async () => {
      const res = await db.execute({
        sql: `SELECT matches_played, wins, losses, draws, goals_scored, goals_conceded,
                     skill_rating, points, win_streak, form_score, form_history
              FROM player_stats WHERE user_id = ? LIMIT 1`,
        args: [userId],
      });
      return res.rows[0] as Row | undefined;
    }, undefined),

    safeQuery(async () => {
      const res = await db.execute({
        sql: `SELECT rank_position, points, prev_position FROM player_rankings WHERE user_id = ? LIMIT 1`,
        args: [userId],
      });
      return res.rows[0] as Row | undefined;
    }, undefined),

    safeQuery(async () => {
      const res = await db.execute({
        sql: `SELECT id, title, message, is_read, created_at FROM notifications_v2 WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC LIMIT 20`,
        args: [userId],
      });
      return (res.rows as Row[]);
    }, []),

    safeQuery(async () => {
      const res = await db.execute({
        sql: `SELECT id, title, description, icon, category, rarity, unlocked_at FROM player_achievements WHERE user_id = ? ORDER BY unlocked_at DESC LIMIT 6`,
        args: [userId],
      });
      return (res.rows as Row[]);
    }, []),
  ]);

  const clubData = await safeQuery(async () => {
    const res = await db.execute({
      sql: `SELECT c.id, c.name, c.slug, c.tag, c.logo_url, cm.role
            FROM clubs c
            JOIN club_members cm ON cm.club_id = c.id
            WHERE cm.user_id = ? AND cm.status = 'APPROVED'
            LIMIT 1`,
      args: [userId],
    });
    return res.rows[0] as Row | undefined;
  }, undefined);

  if (!user) {
    return (
      <div className="broadcast-theme min-h-screen bc-grain overflow-x-hidden">
        <div className="mx-auto max-w-4xl px-4 py-6 w-full min-w-0">
          <div className="text-center py-20 px-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.12)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-negative/70"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            </div>
            <h2 className="bc-headline text-2xl text-ink mb-2">Failed to load dashboard</h2>
            <p className="text-sm text-muted-soft max-w-md mx-auto mb-6">We couldn&apos;t load your player data. Try again.</p>
            <a href="/dashboard" className="btn-primary inline-flex items-center justify-center h-11 px-6 rounded-[14px] text-sm font-bold">Try Again</a>
          </div>
        </div>
      </div>
    );
  }

  const club = clubData
    ? {
        id: String(clubData.id),
        name: String(clubData.name),
        slug: String(clubData.slug),
        tag: clubData.tag ? String(clubData.tag) : null,
        logoUrl: clubData.logo_url ? String(clubData.logo_url) : null,
        membershipRole: String(clubData.role ?? "MEMBER"),
      }
    : null;

  const stats = statsData
    ? {
        points: Number(statsData.points ?? 0),
        matchesPlayed: Number(statsData.matches_played ?? 0),
        wins: Number(statsData.wins ?? 0),
        losses: Number(statsData.losses ?? 0),
        draws: Number(statsData.draws ?? 0),
        goalsScored: Number(statsData.goals_scored ?? 0),
        goalsConceded: Number(statsData.goals_conceded ?? 0),
        skillRating: Number(statsData.skill_rating ?? 1000),
        winStreak: Number(statsData.win_streak ?? 0),
        formScore: Number(statsData.form_score ?? 0),
        formHistory: String(statsData.form_history ?? ""),
      }
    : null;

  const rankingData2 = rankingData
    ? {
        rankPosition: Number(rankingData.rank_position ?? 0),
        points: Number(rankingData.points ?? 0),
        prevPosition: rankingData.prev_position != null ? Number(rankingData.prev_position) : null,
      }
    : null;

  return (
    <div className="broadcast-theme min-h-screen bc-grain overflow-x-hidden">
      <PlayerHubClient
        user={{
          id: String(user.id),
          username: String(user.username),
          displayName: user.display_name ? String(user.display_name) : String(user.username),
          platform: String(user.platform ?? "CROSSPLAY"),
          country: String(user.country ?? "Zimbabwe"),
          avatarUrl: user.avatar_url ? String(user.avatar_url) : null,
          bio: user.bio ? String(user.bio) : null,
        }}
        stats={stats}
        ranking={rankingData2}
        club={club}
        activeTournaments={[]}
        activeLeagues={[]}
        upcomingFixtures={[]}
        achievements={achievements.map((a: any) => ({
          id: String(a.id),
          title: String(a.title),
          description: a.description ? String(a.description) : null,
          icon: String(a.icon ?? "🏆"),
          category: String(a.category ?? "GENERAL"),
          rarity: String(a.rarity ?? "COMMON"),
          unlockedAt: String(a.unlocked_at),
        }))}
        activities={[]}
        notifications={notifications.map((n: any) => ({
          id: String(n.id),
          title: String(n.title),
          message: String(n.message),
          isRead: !!n.is_read,
          createdAt: String(n.created_at),
        }))}
        friends={[]}
      />
    </div>
  );
}