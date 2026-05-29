import { db } from "@/lib/db";
import { SwissFormatClient } from "@/components/SwissFormatClient";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Swiss Tournament · ZIM FCPRO",
  description: "Swiss-format tournament standings and pairings.",
};

export default async function SwissPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const userId = session?.userId;

  try {
    const tournament = await db.execute({
      sql: `SELECT t.id, t.name, t.type, t.status, t.max_players FROM tournaments t WHERE t.id = ?`,
      args: [id],
    });
    const t = tournament.rows[0] as any;
    if (!t) return notFound();

    const [participants, matches] = await Promise.all([
      db.execute({
        sql: `SELECT tp.user_id, tp.seed, tp.status, u.username, u.display_name
              FROM tournament_participants tp
              JOIN users u ON u.id = tp.user_id
              WHERE tp.tournament_id = ?
              ORDER BY tp.seed ASC`,
        args: [id],
      }),
      db.execute({
        sql: `SELECT tm.id, tm.round, tm.match_index, tm.player1_id, tm.player2_id, tm.score1, tm.score2, tm.status,
                     p1.username AS home_username, p1.display_name AS home_display_name,
                     p2.username AS away_username, p2.display_name AS away_display_name
              FROM tournament_matches tm
              LEFT JOIN users p1 ON p1.id = tm.player1_id
              LEFT JOIN users p2 ON p2.id = tm.player2_id
              WHERE tm.tournament_id = ?
              ORDER BY tm.round ASC, tm.match_index ASC`,
        args: [id],
      }),
    ]);

    const standings = (participants.rows as any[]).map((p, i) => ({
      rank: i + 1,
      userId: p.user_id,
      username: p.username || "Player",
      displayName: p.display_name || p.username || "Player",
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      buchholz: 0,
    }));

    // Calculate standings from matches
    const matchData = matches.rows as any[];
    const standingMap = new Map<string, { points: number; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalDifference: number; buchholz: number }>();
    
    for (const p of participants.rows as any[]) {
      standingMap.set(p.user_id, { points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, buchholz: 0 });
    }

    for (const m of matchData) {
      if (m.status !== "COMPLETED" && m.status !== "CONFIRMED" && m.status !== "AUTO_FORFEIT") continue;
      const s1 = Number(m.score1 || 0);
      const s2 = Number(m.score2 || 0);
      const p1Stats = standingMap.get(m.player1_id);
      const p2Stats = standingMap.get(m.player2_id);
      
      if (p1Stats) {
        p1Stats.played++;
        p1Stats.goalsFor += s1;
        p1Stats.goalsAgainst += s2;
        p1Stats.goalDifference = p1Stats.goalsFor - p1Stats.goalsAgainst;
        if (s1 > s2) { p1Stats.wins++; p1Stats.points += 3; }
        else if (s1 === s2) { p1Stats.draws++; p1Stats.points += 1; }
        else { p1Stats.losses++; }
      }
      if (p2Stats) {
        p2Stats.played++;
        p2Stats.goalsFor += s2;
        p2Stats.goalsAgainst += s1;
        p2Stats.goalDifference = p2Stats.goalsFor - p2Stats.goalsAgainst;
        if (s2 > s1) { p2Stats.wins++; p2Stats.points += 3; }
        else if (s1 === s2) { p2Stats.draws++; p2Stats.points += 1; }
        else { p2Stats.losses++; }
      }
    }

    // Sort by points, then goal difference
    const finalStandings = (participants.rows as any[]).map((p) => {
      const s = standingMap.get(p.user_id) || { points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, buchholz: 0 };
      return {
        rank: 1,
        userId: p.user_id,
        username: p.username || "Player",
        displayName: p.display_name || p.username || "Player",
        ...s,
      };
    }).sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const formattedMatches = matchData.map((m) => ({
      id: m.id,
      round: Number(m.round || 1),
      tableNumber: Number(m.match_index || 0) + 1,
      homeUser: {
        id: m.player1_id || "",
        username: m.home_username || "TBD",
        displayName: m.home_display_name || m.home_username || "TBD",
      },
      awayUser: {
        id: m.player2_id || "",
        username: m.away_username || "TBD",
        displayName: m.away_display_name || m.away_username || "TBD",
      },
      homeScore: m.score1 !== null ? Number(m.score1) : null,
      awayScore: m.score2 !== null ? Number(m.score2) : null,
      status: m.status || "PENDING",
    }));

    const currentRound = matchData.length > 0 
      ? Math.max(...matchData.map(m => Number(m.round || 1))) 
      : 1;
    const maxRounds = Math.ceil(Math.log2(Number(t.max_players || 8))) + 2;

    return (
      <div className="broadcast-theme min-h-screen bc-grain">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
          <SwissFormatClient
            name={t.name || `Swiss #${id.slice(0, 8)}`}
            currentRound={currentRound}
            totalRounds={maxRounds}
            standings={finalStandings.length > 0 ? finalStandings : standings}
            matches={formattedMatches}
            isAdmin={session?.role === "ADMIN" || session?.role === "MANAGER"}
            currentUserId={userId || undefined}
          />
        </div>
      </div>
    );
  } catch (e) {
    console.error("[Swiss] Error:", e);
    return notFound();
  }
}