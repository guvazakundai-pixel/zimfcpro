/**
 * Full PvP match flow simulation using raw SQL (no Prisma)
 * Run: TURSO_DATABASE_URL="..." TURSO_AUTH_TOKEN="..." USE_TURSO=true npx tsx prisma/simulate-match.ts
 */
import { db } from "../src/lib/db";
import crypto from "crypto";

const userAId = "seed-user-a-001";
const userBId = "seed-user-b-001";

async function getStats(label: string, userId: string) {
  const r = await db.execute({
    sql: "SELECT skill_rating, wins, losses, draws, matches_played, win_streak, points, form_history FROM player_stats WHERE user_id = ?",
    args: [userId],
  });
  const s = r.rows[0] as Record<string, unknown> | undefined;
  if (!s) { console.log(`  ${label}: NO STATS FOUND`); return; }
  console.log(`  ${label}: ${s.skill_rating}SR, ${s.wins}W/${s.losses}L/${s.draws}D, ${s.matches_played}MP, Streak=${s.win_streak}, ${s.points}pts, Form="${s.form_history}"`);
}

async function getRanking(label: string, userId: string) {
  const r = await db.execute({
    sql: "SELECT rank_position, points, final_score FROM player_rankings WHERE user_id = ?",
    args: [userId],
  });
  const s = r.rows[0] as Record<string, unknown> | undefined;
  if (!s) { console.log(`  ${label}: NO RANKING FOUND`); return; }
  console.log(`  ${label}: Rank #${s.rank_position}, ${s.points}pts, FS=${s.final_score}`);
}

async function main() {
  console.log("⚽ Full PvP Match Flow Simulation (Raw SQL)\n");
  console.log("=".repeat(55));

  const now = new Date().toISOString();
  const matchId = crypto.randomUUID();
  const requestId = crypto.randomUUID();

  // ── PRE-MATCH ──
  console.log("\n📊 PRE-MATCH STATE:");
  await getStats("Alpha  ", userAId);
  await getStats("Bravo  ", userBId);
  await getRanking("Alpha  ", userAId);
  await getRanking("Bravo  ", userBId);

  // ── STEP 1: Create challenge (Alpha -> Bravo) ──
  console.log("\n🎯 STEP 1: Create Challenge (Alpha → Bravo)");
  const token = crypto.randomBytes(16).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await db.execute({
    sql: `INSERT INTO challenge_tokens (id, token, challenger_id, opponent_id, match_type, platform, region, wager_amount, expires_at, used)
          VALUES (?, ?, ?, ?, 'RANKED_1V1', 'PS5', 'Zimbabwe', 0, ?, 0)`,
    args: [crypto.randomUUID(), token, userAId, userBId, expiresAt],
  });
  console.log(`  Token: ${token.substring(0, 20)}...`);

  await db.execute({
    sql: `INSERT INTO match_requests (id, sender_id, receiver_id, status, status_raw, expires_at, created_at)
          VALUES (?, ?, ?, 'PENDING', 'PENDING_ACCEPTANCE', ?, ?)`,
    args: [requestId, userAId, userBId, expiresAt, now],
  });
  console.log(`  Match Request ID: ${requestId}`);

  // ── STEP 2: Accept challenge (Bravo accepts) ──
  console.log("\n🤝 STEP 2: Accept Challenge (Bravo accepts)");

  await db.execute({
    sql: `INSERT INTO match_reports (id, player1_id, player2_id, status, status_raw, submitted_by, created_at)
          VALUES (?, ?, ?, 'ACTIVE', 'ACTIVE', ?, ?)`,
    args: [matchId, userAId, userBId, userAId, now],
  });
  console.log(`  Match ACTIVE: ${matchId}`);

  // Update challenge token
  await db.execute({ sql: "UPDATE challenge_tokens SET used = 1 WHERE token = ?", args: [token] });

  // Update match request
  await db.execute({
    sql: "UPDATE match_requests SET status = 'ACCEPTED', status_raw = 'ACTIVE', receiver_id = ? WHERE sender_id = ? AND status_raw = 'PENDING_ACCEPTANCE'",
    args: [userBId, userAId],
  });

  // ── STEP 3: Submit scores ──
  console.log("\n📝 STEP 3: Submit Scores");

  // Alpha submits: Alpha 3 - 2 Bravo
  const confirmations: Record<string, any> = {};
  confirmations["player1"] = {
    playerId: userAId,
    score: 3,
    opponentScore: 2,
    screenshots: [],
    rageQuit: false,
    submittedAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `UPDATE match_reports SET status = 'SCORE_SUBMITTED', status_raw = 'SCORE_SUBMITTED', confirmations = ? WHERE id = ?`,
    args: [JSON.stringify(confirmations), matchId],
  });
  console.log(`  Alpha submitted: 3 - 2 → SCORE_SUBMITTED`);

  // Bravo submits: Alpha 2 - 3 Bravo (disagreement)
  confirmations["player2"] = {
    playerId: userBId,
    score: 3,
    opponentScore: 2,
    screenshots: [],
    rageQuit: false,
    submittedAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `UPDATE match_reports SET confirmations = ? WHERE id = ?`,
    args: [JSON.stringify(confirmations), matchId],
  });
  console.log(`  Bravo submitted: 3 - 2 → Both submitted (still SCORE_SUBMITTED)`);

  // ── STEP 4: Verify — Bravo confirms (match completes) ──
  console.log("\n🔍 STEP 4: Verify (Bravo confirms both scores match → COMPLETED)");

  // Scores match (both reported 3-2), winner is Bravo
  await db.execute({
    sql: `UPDATE match_reports SET status = 'COMPLETED', status_raw = 'COMPLETED', winner_id = ?, score1 = 2, score2 = 3 WHERE id = ?`,
    args: [userBId, matchId],
  });
  console.log("  Match COMPLETED — Bravo wins!");

  // ── STEP 5: Apply match results (ELO, XP, stats) ──
  console.log("\n📈 STEP 5: Apply Results (ELO + Stats + Rankings)");

  // Simulate ELO calculation (simplified K=32)
  const alphaPreSR = 1100;
  const bravoPreSR = 1150;
  const expectedAlpha = 1 / (1 + Math.pow(10, (bravoPreSR - alphaPreSR) / 400));
  const expectedBravo = 1 - expectedAlpha;
  const K = 32;
  const alphaNewSR = Math.round(alphaPreSR + K * (0 - expectedAlpha)); // Alpha lost
  const bravoNewSR = Math.round(bravoPreSR + K * (1 - expectedBravo)); // Bravo won

  const winnerPointsGain = 25 + Math.round(0.1 * (bravoPreSR - alphaPreSR)); // upset bonus
  const loserPointsGain = 5; // loser gets small consolation

  console.log(`  ELO: Alpha ${alphaPreSR}→${alphaNewSR}, Bravo ${bravoPreSR}→${bravoNewSR}`);
  console.log(`  Points: Alpha +${loserPointsGain}, Bravo +${winnerPointsGain}`);

  // Update Alpha stats (loser)
  await db.execute({
    sql: `UPDATE player_stats SET
            matches_played = matches_played + 1,
            losses = losses + 1,
            goals_scored = goals_scored + 2,
            goals_conceded = goals_conceded + 3,
            skill_rating = ?,
            points = points + ?,
            win_streak = 0,
            form_score = form_score + (-5),
            updated_at = ?
          WHERE user_id = ?`,
    args: [alphaNewSR, loserPointsGain, now, userAId],
  });
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('L' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [userAId],
  });

  // Update Bravo stats (winner)
  await db.execute({
    sql: `UPDATE player_stats SET
            matches_played = matches_played + 1,
            wins = wins + 1,
            goals_scored = goals_scored + 3,
            goals_conceded = goals_conceded + 2,
            skill_rating = ?,
            points = points + ?,
            win_streak = win_streak + 1,
            form_score = form_score + 10,
            updated_at = ?
          WHERE user_id = ?`,
    args: [bravoNewSR, winnerPointsGain, now, userBId],
  });
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('W' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [userBId],
  });

  // Points logs
  await db.execute({
    sql: `INSERT INTO points_log (id, user_id, points_change, reason, reasonText, match_id, created_at)
          VALUES (?, ?, ?, 'MATCH_LOSS', 'Lost to Test Bravo (2-3)', ?, ?)`,
    args: [crypto.randomUUID(), userAId, loserPointsGain, matchId, now],
  });
  await db.execute({
    sql: `INSERT INTO points_log (id, user_id, points_change, reason, reasonText, match_id, created_at)
          VALUES (?, ?, ?, 'MATCH_WIN', 'Defeated Test Alpha (3-2)', ?, ?)`,
    args: [crypto.randomUUID(), userBId, winnerPointsGain, matchId, now],
  });

  // Update rankings (simplified)
  await db.execute({
    sql: `UPDATE player_rankings SET points = points + ?, final_score = ?, updated_at = ? WHERE user_id = ?`,
    args: [loserPointsGain, 11195 + loserPointsGain, now, userAId],
  });
  await db.execute({
    sql: `UPDATE player_rankings SET points = points + ?, final_score = ?, updated_at = ? WHERE user_id = ?`,
    args: [winnerPointsGain, 11745 + winnerPointsGain, now, userBId],
  });

  // ── POST-MATCH ──
  console.log("\n📊 POST-MATCH STATE:");
  await getStats("Alpha  ", userAId);
  await getStats("Bravo  ", userBId);
  await getRanking("Alpha  ", userAId);
  await getRanking("Bravo  ", userBId);

  // Achievements
  console.log("\n🏆 ACHIEVEMENTS:");
  const achA = await db.execute({ sql: "SELECT title FROM player_achievements WHERE user_id = ?", args: [userAId] });
  const achB = await db.execute({ sql: "SELECT title FROM player_achievements WHERE user_id = ?", args: [userBId] });
  console.log(`  Alpha: ${achA.rows.map((r: any) => r.title).join(", ") || "(none)"}`);
  console.log(`  Bravo: ${achB.rows.map((r: any) => r.title).join(", ") || "(none)"}`);

  // Points log
  console.log("\n💰 POINTS LOG:");
  const plog = await db.execute({ sql: "SELECT user_id, points_change, reason FROM points_log WHERE match_id = ?", args: [matchId] });
  for (const r of plog.rows) {
    const row = r as Record<string, unknown>;
    console.log(`  ${row.user_id === userAId ? "Alpha" : "Bravo"}: ${row.points_change} pts (${row.reason})`);
  }

  // Final match state
  console.log("\n📋 MATCH STATE:");
  const m = await db.execute({ sql: "SELECT id, status_raw, winner_id, score1, score2 FROM match_reports WHERE id = ?", args: [matchId] });
  const match = m.rows[0] as Record<string, unknown>;
  console.log(`  Status: ${match.status_raw}, Score: ${match.score1}-${match.score2}, Winner: ${match.winner_id === userBId ? "Bravo" : "Alpha"}`);

  console.log("\n" + "=".repeat(55));
  console.log("✅ Full PvP match flow simulation complete!");
  console.log(`\n  Match ID: ${matchId}`);
  console.log(`  Alpha (testalpha): ${alphaNewSR}SR, Streak broken`);
  console.log(`  Bravo (testbravo): ${bravoNewSR}SR, 4-win streak`);
}

main().catch((e) => {
  console.error("❌ Simulation failed:", e.message);
  console.error(e.stack);
  process.exit(1);
});
