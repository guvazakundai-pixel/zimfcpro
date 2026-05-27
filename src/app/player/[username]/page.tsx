import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PlayerProfileClient from "./PlayerProfileClient";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  let displayName = username;
  let skillRating = 1000;
  let wins = 0;
  let losses = 0;
  try {
    const userRes = await db.execute({
      sql: "SELECT id, display_name FROM users WHERE username = ? LIMIT 1",
      args: [username],
    });
    const user = userRes.rows[0] as any;
    if (user) {
      displayName = user.display_name || username;
      const statsRes = await db.execute({
        sql: "SELECT skill_rating, wins, losses FROM player_stats WHERE user_id = ? LIMIT 1",
        args: [String(user.id)],
      });
      const stats = statsRes.rows[0] as any;
      if (stats) { skillRating = Number(stats.skill_rating); wins = Number(stats.wins); losses = Number(stats.losses); }
    }
  } catch {}
  const siteUrl = process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw";
  return {
    title: `${displayName} | ZIM FCPRO`,
    description: `${displayName} — SR ${skillRating} · ${wins}W ${losses}L on Zimbabwe's competitive FC ladder`,
    alternates: { canonical: `${siteUrl}/player/${username}` },
    openGraph: {
      title: `${displayName} | ZIM FCPRO`,
      description: `${displayName} — SR ${skillRating} · ${wins}W ${losses}L`,
      url: `${siteUrl}/player/${username}`,
      images: [{ url: `${siteUrl}/og-default.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} | ZIM FCPRO`,
      description: `${displayName} — SR ${skillRating} · ${wins}W ${losses}L`,
    },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let user: any = null;
  try {
    const userRes = await db.execute({
      sql: `SELECT id, username, display_name, bio, country, platform, avatar_url,
                   fc_username, created_at, club_id
            FROM users WHERE username = ? LIMIT 1`,
      args: [username],
    });
    user = userRes.rows[0] as any;
  } catch {}

  if (!user) notFound();

  const userId = String(user.id);
  const userClubId = user.club_id ? String(user.club_id) : null;

  let ranking: any = null;
  let stats: any = null;
  let club: any = null;
  let recentMatches: any[] = [];

  try {
    const [rankRes, statsRes, matchesRes] = await Promise.all([
      db.execute({
        sql: "SELECT rank_position, points, rank_change, final_score FROM player_rankings WHERE user_id = ? LIMIT 1",
        args: [userId],
      }),
      db.execute({
        sql: `SELECT matches_played, wins, losses, draws, goals_scored, goals_conceded,
                      skill_rating, points, win_streak, form_history
               FROM player_stats WHERE user_id = ? LIMIT 1`,
        args: [userId],
      }),
      db.execute({
        sql: `SELECT m.id, m.score1, m.score2, m.winner_id, m.created_at,
                      p1.username AS p1_username, p1.display_name AS p1_display,
                      p2.username AS p2_username, p2.display_name AS p2_display
               FROM match_reports m
               LEFT JOIN users p1 ON p1.id = m.player1_id
               LEFT JOIN users p2 ON p2.id = m.player2_id
               WHERE (m.player1_id = ? OR m.player2_id = ?)
                 AND m.status IN ('CONFIRMED', 'APPROVED')
               ORDER BY m.created_at DESC LIMIT 10`,
        args: [userId, userId],
      }),
    ]);

    const r = rankRes.rows[0] as any;
    if (r) ranking = { rankPosition: Number(r.rank_position), points: Number(r.points), rankChange: Number(r.rank_change), finalScore: Number(r.final_score) };

    const s = statsRes.rows[0] as any;
    if (s) stats = {
      matchesPlayed: Number(s.matches_played), wins: Number(s.wins), losses: Number(s.losses), draws: Number(s.draws),
      goalsScored: Number(s.goals_scored), goalsConceded: Number(s.goals_conceded),
      skillRating: Number(s.skill_rating), points: Number(s.points),
      winStreak: Number(s.win_streak), formHistory: String(s.form_history ?? ""),
    };

    recentMatches = (matchesRes.rows as any[]).map((m) => {
      const isP1 = String(m.player1_id || m.p1_username) === userId || m.p1_username === username;
      const oppUsername = isP1 ? m.p2_username : m.p1_username;
      const oppDisplay = isP1 ? m.p2_display : m.p1_display;
      const myScore = isP1 ? Number(m.score1) : Number(m.score2);
      const oppScore = isP1 ? Number(m.score2) : Number(m.score1);
      const didWin = m.winner_id === userId;
      const isDraw = !m.winner_id;
      return { id: String(m.id), opponent: { username: oppUsername, displayName: oppDisplay }, myScore, oppScore, didWin, isDraw, date: String(m.created_at) };
    });
  } catch (e) {
    console.error("[Profile] data fetch error:", e);
  }

  if (userClubId) {
    try {
      const clubRes = await db.execute({
        sql: "SELECT id, name, tag, slug, logo_url FROM clubs WHERE id = ? LIMIT 1",
        args: [userClubId],
      });
      const c = clubRes.rows[0] as any;
      if (c) club = { id: String(c.id), name: c.name, tag: c.tag, slug: c.slug, logoUrl: c.logo_url };
    } catch {}
  }

  const profileData = {
    user: {
      id: userId,
      username: String(user.username),
      displayName: user.display_name,
      bio: user.bio,
      country: user.country ?? "Zimbabwe",
      platform: user.platform ?? "PS5",
      avatarUrl: user.avatar_url,
      fcUsername: user.fc_username,
      createdAt: user.created_at,
    },
    ranking,
    stats,
    club,
    recentMatches,
  };

  return (
    <ErrorBoundary>
      <PlayerProfileClient data={profileData} />
    </ErrorBoundary>
  );
}