import { prisma } from "@/lib/prisma";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RankingsClient } from "@/components/RankingsNew";

export const dynamic = "force-dynamic";
export const revalidate = 30;
export const metadata = {
  title: "Rankings · ZIM FCPRO",
  description: "Live global rankings for Zimbabwe's competitive EA Sports FC season.",
};

async function getRankings() {
  try {
    const rankings = await prisma.playerRanking.findMany({
      take: 100,
      orderBy: { rankPosition: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            country: true,
            city: true,
            playerStats: {
              select: {
                wins: true,
                losses: true,
                draws: true,
                goalsScored: true,
                goalsConceded: true,
                skillRating: true,
                winStreak: true,
                formHistory: true,
                mvpCount: true,
              },
            },
          },
        },
      },
    });
    return rankings;
  } catch (err) {
    console.error("[rankings page] Failed to fetch:", err);
    return [];
  }
}

export default async function RankingsPage() {
  const rankings = await getRankings();

  const players = rankings.map((r) => ({
    id: r.user.id,
    rank: r.rankPosition,
    prev: r.prevPosition ?? r.rankPosition,
    username: r.user.username,
    displayName: r.user.displayName ?? r.user.username,
    avatarUrl: r.user.avatarUrl,
    country: r.user.country ?? "Zimbabwe",
    city: r.user.city ?? "Harare",
    points: r.points,
    finalScore: r.finalScore,
    wins: r.user.playerStats?.wins ?? 0,
    losses: r.user.playerStats?.losses ?? 0,
    draws: r.user.playerStats?.draws ?? 0,
    goalsFor: r.user.playerStats?.goalsScored ?? 0,
    goalsAgainst: r.user.playerStats?.goalsConceded ?? 0,
    skillRating: r.user.playerStats?.skillRating ?? 1000,
    winStreak: r.user.playerStats?.winStreak ?? 0,
    formHistory: r.user.playerStats?.formHistory ?? "",
    mvpCount: r.user.playerStats?.mvpCount ?? 0,
    rankChange: r.rankChange,
  }));

  return (
    <ErrorBoundary scope="rankings">
      <RankingsClient livePlayers={players} />
    </ErrorBoundary>
  );
}
