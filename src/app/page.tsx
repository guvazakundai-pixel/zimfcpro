import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WelcomeClient } from "@/components/WelcomeClient";

export const dynamic = "force-dynamic";

type TopPlayer = {
  id: string;
  username: string;
  displayName: string | null;
  rankPosition: number;
  points: number;
  skillRating: number;
  wins: number;
  losses: number;
  goalsScored: number;
  clubTag: string | null;
};

export default async function HomePage() {
  let playerCount = 0;
  let clubCount = 0;
  let matchesCount = 0;
  let topPlayers: TopPlayer[] = [];

  try {
    const [playersRes, clubsRes, matchesRes] = await Promise.all([
      db.execute("SELECT count(*) as v FROM player_stats"),
      db.execute("SELECT count(*) as v FROM clubs"),
      db.execute("SELECT COALESCE(SUM(matches_played),0) as v FROM player_stats"),
    ]);
    playerCount = Number(playersRes.rows[0].v);
    clubCount = Number(clubsRes.rows[0].v);
    matchesCount = Number(matchesRes.rows[0].v);
  } catch {}

  try {
    const res = await db.execute(`
      SELECT
        u.id, u.username, u.display_name,
        pr.rank_position, pr.points,
        ps.skill_rating, ps.wins, ps.losses,
        ps.goals_scored,
        c.tag as club_tag
      FROM player_rankings pr
      JOIN users u ON u.id = pr.user_id
      LEFT JOIN player_stats ps ON ps.user_id = u.id
      LEFT JOIN clubs c ON c.id = u.club_id
      ORDER BY pr.rank_position ASC
      LIMIT 5
    `);
    topPlayers = (res.rows as any[]).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      rankPosition: Number(r.rank_position ?? 0),
      points: Number(r.points ?? 0),
      skillRating: Number(r.skill_rating ?? 1000),
      wins: Number(r.wins ?? 0),
      losses: Number(r.losses ?? 0),
      goalsScored: Number(r.goals_scored ?? 0),
      clubTag: r.club_tag ?? null,
    }));
  } catch {}

  return (
    <ErrorBoundary>
      <WelcomeClient
        playerCount={playerCount}
        clubCount={clubCount}
        matchesCount={matchesCount}
        topPlayers={topPlayers}
      />
    </ErrorBoundary>
  );
}
