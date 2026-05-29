import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { advanceBracket } from "@/lib/tournament-bracket";
import { sendNotification } from "@/lib/match-engine/notifications";

const ReportSchema = z.object({
  winnerId: z.string().min(1),
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
});

export async function POST(req: Request, { params }: { params: Promise<{ tournamentId: string; matchId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { tournamentId, matchId } = await params;

  try {
    const matchRes = await db.execute({
      sql: "SELECT * FROM tournament_matches WHERE id = ? AND tournament_id = ?",
      args: [matchId, tournamentId],
    });
    const match = matchRes.rows[0] as Record<string, unknown> | undefined;
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    if (match.status === "COMPLETED") {
      return NextResponse.json({ error: "Match already completed" }, { status: 409 });
    }

    const tournRes = await db.execute({
      sql: "SELECT * FROM tournaments WHERE id = ?",
      args: [tournamentId],
    });
    const tournRow = tournRes.rows[0] as Record<string, unknown> | undefined;
    if (!tournRow) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

    const isParticipant = match.player1_id === auth.session.userId || match.player2_id === auth.session.userId;
    const isOrganizer = tournRow.organizer_id === auth.session.userId;
    const isAdmin = auth.session.role === "ADMIN";
    if (!isParticipant && !isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Only match participants, the organizer, or an admin can report results" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { winnerId, score1, score2 } = parsed.data;

    if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
      return NextResponse.json({ error: "Winner must be a match participant" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const tournamentType = String(tournRow.type);

    await db.execute({
      sql: "UPDATE tournament_matches SET winner_id = ?, score1 = ?, score2 = ?, status = 'COMPLETED', completed_at = ? WHERE id = ?",
      args: [winnerId, score1, score2, now, matchId],
    });

    if (match.group_id) {
      const standingHome = await db.execute({
        sql: "SELECT * FROM tournament_group_standings WHERE group_id = ? AND user_id = ?",
        args: [match.group_id, String(match.player1_id)],
      });
      const standingAway = await db.execute({
        sql: "SELECT * FROM tournament_group_standings WHERE group_id = ? AND user_id = ?",
        args: [match.group_id, String(match.player2_id)],
      });

      const hHome = Number(match.player1_id) === Number(winnerId);
      const homeGoals = Number(match.player1_id) === Number(winnerId) ? score1 : score2;
      const awayGoals = Number(match.player2_id) === Number(winnerId) ? score2 : score1;

      for (const row of [standingHome.rows[0], standingAway.rows[0]] as any[]) {
        if (!row) continue;
        const isWinner = row.user_id === winnerId;
        const isDraw = score1 === score2;
        const goalsFor = row.user_id === match.player1_id ? (hHome ? score1 : score2) : (hHome ? score2 : score1);
        const goalsAgainst = row.user_id === match.player1_id ? (hHome ? score2 : score1) : (hHome ? score1 : score2);
        const pts = isDraw ? 1 : isWinner ? 3 : 0;
        const w = isDraw ? 0 : isWinner ? 1 : 0;
        const d = isDraw ? 1 : 0;
        const l = isDraw ? 0 : isWinner ? 0 : 1;

        try {
          await db.execute({
            sql: `UPDATE tournament_group_standings SET points = points + ?, played = played + 1, wins = wins + ?, draws = draws + ?, losses = losses + ?, goals_for = goals_for + ?, goals_against = goals_against + ?, goal_difference = goal_difference + ? WHERE id = ?`,
            args: [pts, w, d, l, goalsFor, goalsAgainst, goalsFor - goalsAgainst, row.id],
          });
        } catch {
          await db.execute({
            sql: `INSERT INTO tournament_group_standings (id, group_id, user_id, points, played, wins, draws, losses, goals_for, goals_against, goal_difference) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
            args: [crypto.randomUUID(), match.group_id, row.user_id, pts, w, d, l, goalsFor, goalsAgainst, goalsFor - goalsAgainst],
          });
        }
      }
    }

    if (tournamentType === "KNOCKOUT" && tournRow.bracket) {
      let bracket = typeof tournRow.bracket === "string" ? JSON.parse(tournRow.bracket as string) : tournRow.bracket;
      bracket = advanceBracket(bracket, matchId, winnerId, score1, score2);

      await db.execute({
        sql: "UPDATE tournaments SET bracket = ?, updated_at = ? WHERE id = ?",
        args: [JSON.stringify(bracket), now, tournamentId],
      });

      for (const round of bracket.rounds) {
        for (const m of round) {
          if (m.status !== "PENDING" || m.player1Id === "" || m.player2Id === "") continue;
          const existingRes = await db.execute({
            sql: "SELECT id FROM tournament_matches WHERE id = ?",
            args: [m.id],
          });
          if (existingRes.rows.length === 0) {
            await db.execute({
              sql: "INSERT INTO tournament_matches (id, tournament_id, round, match_index, player1_id, player2_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'READY', ?)",
              args: [m.id, tournamentId, m.round, m.position ?? m.matchIndex ?? 0, m.player1Id, m.player2Id, now],
            });
          }
        }
      }

      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      const finalMatch = finalRound?.[0];
      if (finalMatch?.status === "COMPLETED") {
        await db.execute({
          sql: "UPDATE tournaments SET status = 'COMPLETED', end_at = ? WHERE id = ?",
          args: [now, tournamentId],
        });
        await db.execute({
          sql: "UPDATE tournament_participants SET final_position = 1, status = 'ACTIVE' WHERE tournament_id = ? AND user_id = ?",
          args: [tournamentId, finalMatch.winnerId],
        });
      }
    }

    try {
      const winnerNameRes = await db.execute({
        sql: "SELECT username, display_name FROM users WHERE id = ?",
        args: [winnerId],
      });
      const winnerName = (winnerNameRes.rows[0] as any)?.display_name || (winnerNameRes.rows[0] as any)?.username || "A player";

      if (match.player1_id && typeof match.player1_id === "string") {
        await sendNotification({
          userId: String(match.player1_id),
          type: "TOURNAMENT",
          title: score1 > score2 ? "Tournament Victory!" : score1 < score2 ? "Tournament Defeat" : "Tournament Draw",
          message: `${winnerName} won ${score1}-${score2}. Check bracket for next round.`,
          link: `/tournaments/${tournRow.slug || tournamentId}`,
        });
      }
      if (match.player2_id && typeof match.player2_id === "string" && String(match.player2_id) !== String(match.player1_id)) {
        await sendNotification({
          userId: String(match.player2_id),
          type: "TOURNAMENT",
          title: score2 > score1 ? "Tournament Victory!" : score2 < score1 ? "Tournament Defeat" : "Tournament Draw",
          message: `${winnerName} won ${Math.max(score1, score2)}-${Math.min(score1, score2)}. Check bracket for next round.`,
          link: `/tournaments/${tournRow.slug || tournamentId}`,
        });
      }
    } catch {}

    return NextResponse.json({ match: { id: matchId, status: "COMPLETED", winnerId, score1, score2 } });
  } catch (e) {
    console.error("[tournament match report]", e);
    return NextResponse.json({ error: "Failed to report result" }, { status: 500 });
  }
}