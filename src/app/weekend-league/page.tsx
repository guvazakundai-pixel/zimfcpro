import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { WeekendLeagueClient } from "@/components/WeekendLeagueClient";
import { motion } from "framer-motion";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Weekend League · ZIM FCPRO",
  description: "Compete in the weekly Weekend League for glory and rewards.",
};

type WLRank = "SILVER" | "GOLD" | "ELITE" | "CHAMPION";

const RANK_THRESHOLDS: { rank: WLRank; minPts: number }[] = [
  { rank: "CHAMPION", minPts: 300 },
  { rank: "ELITE", minPts: 200 },
  { rank: "GOLD", minPts: 100 },
  { rank: "SILVER", minPts: 0 },
];

function getRank(points: number): WLRank {
  for (const t of RANK_THRESHOLDS) {
    if (points >= t.minPts) return t.rank;
  }
  return "SILVER";
}

export default async function WeekendLeaguePage() {
  const session = await getSession();
  const userId = session?.userId;

  let player = null;
  let standings: any[] = [];
  let isActive = false;
  let entriesRemaining = 0;

  if (userId) {
    try {
      const leagueRes = await db.execute({
        sql: `SELECT l.id, l.name, l.status, l.max_players FROM leagues l 
              WHERE l.type = 'WEEKEND' AND l.status IN ('REGISTRATION', 'LIVE') 
              ORDER BY l.created_at DESC LIMIT 1`,
        args: [],
      });
      const league = leagueRes.rows[0] as any;

      if (league) {
        isActive = league.status === "LIVE";

        const [participantRes, standingsRes] = await Promise.all([
          db.execute({
            sql: `SELECT lp.user_id, ps.wins, ps.losses, ps.draws, ps.goals_scored, ps.goals_conceded, ps.points, ps.matches_played, u.username, u.display_name
                  FROM league_participants lp
                  JOIN users u ON u.id = lp.user_id
                  LEFT JOIN player_stats ps ON ps.user_id = lp.user_id
                  WHERE lp.league_id = ? AND lp.user_id = ?`,
            args: [league.id, userId],
          }),
          db.execute({
            sql: `SELECT ls.user_id, ls.points, ls.played as matches_played, ls.wins, ls.draws, ls.losses, ls.goals_for, ls.goals_against, ls.goal_difference,
                         u.username, u.display_name, u.avatar_url
                  FROM league_standings ls
                  JOIN users u ON u.id = ls.user_id
                  WHERE ls.league_id = ?
                  ORDER BY ls.points DESC, ls.goal_difference DESC, ls.goals_for DESC`,
            args: [league.id],
          }),
        ]);

        const p = participantRes.rows[0] as any;
        if (p) {
          const pts = Number(p.points || 0);
          const mp = Number(p.matches_played || 0);
          player = {
            userId,
            username: p.username || "You",
            displayName: p.display_name || p.username || "You",
            matchesPlayed: mp,
            wins: Number(p.wins || 0),
            draws: Number(p.draws || 0),
            losses: Number(p.losses || 0),
            points: pts,
            goalsFor: Number(p.goals_scored || 0),
            goalsAgainst: Number(p.goals_conceded || 0),
            rank: getRank(pts),
            matchesRemaining: Math.max(0, 15 - mp),
            qualificationPoints: pts,
          };
        }

        standings = (standingsRes.rows as any[]).map((s) => {
          const pts = Number(s.points || 0);
          return {
            userId: s.user_id,
            username: s.username || "Player",
            displayName: s.display_name || s.username || "Player",
            matchesPlayed: Number(s.matches_played || 0),
            wins: Number(s.wins || 0),
            draws: Number(s.draws || 0),
            losses: Number(s.losses || 0),
            points: pts,
            goalsFor: Number(s.goals_for || 0),
            goalsAgainst: Number(s.goals_against || 0),
            rank: getRank(pts),
            matchesRemaining: Math.max(0, 15 - Number(s.matches_played || 0)),
            qualificationPoints: pts,
          };
        });

        const totalParticipants = (standingsRes.rows as any[]).length;
        entriesRemaining = Math.max(0, Number(league.max_players || 20) - totalParticipants);
      }
    } catch (e) {
      console.error("[WeekendLeague] DB error:", e);
    }
  }

  const defaultPlayer = player || {
    userId: "guest",
    username: "Guest",
    displayName: "Guest",
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    rank: "SILVER" as WLRank,
    matchesRemaining: 15,
    qualificationPoints: 0,
  };

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase text-muted-soft hover:text-ink transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </motion.div>

        <WeekendLeagueClient
          player={defaultPlayer}
          standings={standings.length > 0 ? standings : [defaultPlayer]}
          currentUserId={userId || undefined}
          isActive={isActive || standings.length > 0}
          entriesRemaining={entriesRemaining}
          onPlayMatch={() => {}}
          onClaimRewards={() => {}}
        />
      </div>
    </div>
  );
}