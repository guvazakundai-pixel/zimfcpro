import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { submitScore } from "@/lib/match-engine/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const score = typeof body.score === "number" ? body.score : (typeof body.score1 === "number" ? body.score1 : -1);
  const opponentScore = typeof body.opponentScore === "number" ? body.opponentScore : (typeof body.score2 === "number" ? body.score2 : -1);

  if (score < 0 || opponentScore < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  try {
    const result = await submitScore({
      matchId,
      playerId: auth.session.userId,
      score,
      opponentScore,
      screenshots: body.screenshots ?? (body.screenshot ? [body.screenshot] : []),
      videoUrl: body.videoUrl,
      rageQuit: body.rageQuit ?? false,
      antiCheat: {
        ipHash: "na",
        deviceHash: "na",
        userAgent: req.headers.get("user-agent") ?? "",
        matchDuration: 0,
        scoreSpeed: 0,
        previousOpponents: [],
        timeSinceLastMatch: 0,
        flags: [],
      },
    });
    return NextResponse.json({ success: true, status: result.match.statusRaw, antiCheat: result.antiCheat });
  } catch (e: any) {
    const status = e.message?.includes("Invalid transition") ? 409 : 400;
    return NextResponse.json({ error: e.message ?? "Failed to submit score" }, { status });
  }
}
