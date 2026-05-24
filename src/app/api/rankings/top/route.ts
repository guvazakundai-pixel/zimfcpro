import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
  const includeFake = searchParams.get("includeFake") === "true";

  try {
    const where = includeFake ? {} : { user: { isFake: false } };

    const [rankings, total] = await Promise.all([
      prisma.playerRanking.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { rankPosition: "asc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              fullName: true,
              avatarUrl: true,
              country: true,
              favoriteClub: true,
              isFake: true,
              isVerified: true,
              fantasyTeam: {
                select: { teamName: true, teamValue: true, budget: true, transfersUsed: true },
              },
              playerStats: {
                select: {
                  matchesPlayed: true,
                  wins: true,
                  losses: true,
                  draws: true,
                  goalsScored: true,
                  goalsConceded: true,
                  skillRating: true,
                  points: true,
                  formScore: true,
                  winStreak: true,
                  mvpCount: true,
                  formHistory: true,
                },
              },
              playerAchievements: {
                where: { rarity: "LEGENDARY" },
                select: { icon: true, title: true, rarity: true },
                take: 3,
              },
            },
          },
        },
      }),
      prisma.playerRanking.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: rankings, total });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings", data: [], total: 0 },
      { status: 500 },
    );
  }
}
