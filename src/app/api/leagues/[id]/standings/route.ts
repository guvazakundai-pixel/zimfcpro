import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const league = await prisma.league.findUnique({ where: { id }, select: { id: true } });
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const standings = await prisma.leagueStanding.findMany({
      where: { leagueId: id },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: [
        { points: "desc" },
        { goalDifference: "desc" },
        { goalsFor: "desc" },
        { wins: "desc" },
      ],
    });

    return NextResponse.json({ success: true, data: standings });
  } catch (e) {
    console.error("[league standings]", e);
    return NextResponse.json({ error: "Failed to fetch standings" }, { status: 500 });
  }
}
