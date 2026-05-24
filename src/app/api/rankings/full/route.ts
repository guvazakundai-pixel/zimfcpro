import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const sort = searchParams.get("sort") || "rank";
  const order = searchParams.get("order") || "asc";
  const search = searchParams.get("search") || "";

  try {
    const where = search
      ? {
          user: {
            OR: [
              { username: { contains: search } },
              { displayName: { contains: search } },
            ],
          },
        }
      : {};

    const [rankings, total] = await Promise.all([
      prisma.playerRanking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy:
          sort === "points"
            ? { points: order as "asc" | "desc" }
            : sort === "skillRating"
            ? { user: { playerStats: { skillRating: order as "asc" | "desc" } } }
            : { rankPosition: order as "asc" | "desc" },
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
      }),
      prisma.playerRanking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: rankings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[rankings/full]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings", data: [] },
      { status: 500 }
    );
  }
}
