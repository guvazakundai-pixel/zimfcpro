import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MatchesPageClient } from "@/app/matches/MatchesPageClient";

export const dynamic = "force-dynamic";

async function getMatchData() {
  const session = await getSession();
  if (!session) return { matches: [], stats: null, userId: null };

  const userId = session.userId;

  try {
    const [matches, stats] = await Promise.all([
      prisma.matchReport.findMany({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          player1: { select: { id: true, username: true, displayName: true } },
          player2: { select: { id: true, username: true, displayName: true } },
        },
      }),
      prisma.playerStats.findUnique({ where: { userId } }),
    ]);

    return {
      matches: matches.map((m) => ({
        id: m.id,
        player1: m.player1,
        player2: m.player2,
        score1: m.score1,
        score2: m.score2,
        status: m.status,
        statusRaw: m.statusRaw,
        isDisputed: m.isDisputed,
        winnerId: m.winnerId,
        createdAt: m.createdAt.toISOString(),
      })),
      stats: stats
        ? {
            totalMatches: stats.matchesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws,
            winRate: stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0,
            currentStreak: stats.winStreak,
            bestStreak: stats.winStreak,
          }
        : null,
      userId,
    };
  } catch (err) {
    console.error("[matches page]", err);
    return { matches: [], stats: null, userId };
  }
}

export default async function MatchesPage() {
  const data = await getMatchData();

  return <MatchesPageClient initialMatches={data.matches} initialStats={data.stats} userId={data.userId} />;
}
