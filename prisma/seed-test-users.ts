/**
 * Seed test users — matches ACTUAL Turso DB columns (not Prisma schema)
 * Run: npx tsx prisma/seed-test-users.ts
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding test users...\n");

  const hash = await bcrypt.hash("test1234", 10);
  const now = new Date().toISOString();

  const userAId = "seed-user-a-001";
  const userBId = "seed-user-b-001";
  const statsAId = "seed-stats-a-001";
  const statsBId = "seed-stats-b-001";
  const rankAId = "seed-rank-a-001";
  const rankBId = "seed-rank-b-001";

  // Clean up
  console.log("Cleaning up previous test data...");
  await db.execute({ sql: "DELETE FROM notifications_v2 WHERE user_id IN (?, ?)", args: [userAId, userBId] });
  await db.execute({ sql: "DELETE FROM player_achievements WHERE user_id IN (?, ?)", args: [userAId, userBId] });
  await db.execute({ sql: "DELETE FROM points_log WHERE user_id IN (?, ?)", args: [userAId, userBId] });
  await db.execute({ sql: "DELETE FROM match_reports WHERE player1_id IN (?, ?) OR player2_id IN (?, ?)", args: [userAId, userBId, userAId, userBId] });
  await db.execute({ sql: "DELETE FROM match_requests WHERE sender_id IN (?, ?) OR receiver_id IN (?, ?)", args: [userAId, userBId, userAId, userBId] });
  await db.execute({ sql: "DELETE FROM player_rankings WHERE user_id IN (?, ?)", args: [userAId, userBId] });
  await db.execute({ sql: "DELETE FROM player_stats WHERE user_id IN (?, ?)", args: [userAId, userBId] });
  await db.execute({ sql: "DELETE FROM users WHERE id IN (?, ?)", args: [userAId, userBId] });
  console.log("✓ Cleaned up\n");

  // ── Create users (matching ACTUAL columns) ──
  const userCols = `id, username, email, password_hash, display_name, platform, country, phone, role, created_at, updated_at`;
  await db.execute({
    sql: `INSERT INTO users (${userCols}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PLAYER', ?, ?)`,
    args: [userAId, "testalpha", "testalpha@zimfcpro.zw", hash, "Test Alpha", "PS5", "Zimbabwe", "+263771234567", now, now],
  });
  await db.execute({
    sql: `INSERT INTO users (${userCols}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PLAYER', ?, ?)`,
    args: [userBId, "testbravo", "testbravo@zimfcpro.zw", hash, "Test Bravo", "XBOX", "Zimbabwe", "+263772345678", now, now],
  });
  console.log("✓ Users: testalpha / test1234 | testbravo / test1234");

  // ── Player stats ──
  const statsCols = `id, user_id, matches_played, wins, losses, draws, goals_scored, goals_conceded, skill_rating, points, win_streak, form_score, form_history, updated_at`;
  await db.execute({
    sql: `INSERT INTO player_stats (${statsCols}) VALUES (?, ?, 5, 3, 1, 1, 15, 8, 1100, 180, 0, 15, 'WLWWD', ?)`,
    args: [statsAId, userAId, now],
  });
  await db.execute({
    sql: `INSERT INTO player_stats (${statsCols}) VALUES (?, ?, 5, 4, 0, 1, 18, 5, 1150, 220, 3, 25, 'WWWDW', ?)`,
    args: [statsBId, userBId, now],
  });
  console.log("✓ Stats: Alpha 1100SR/180pts | Bravo 1150SR/220pts");

  // ── Rankings ──
  await db.execute({
    sql: `INSERT INTO player_rankings (id, user_id, rank_position, prev_position, rank_change, points, final_score, updated_at)
          VALUES (?, ?, 2, NULL, 0, 180, 11195, ?)`,
    args: [rankAId, userAId, now],
  });
  await db.execute({
    sql: `INSERT INTO player_rankings (id, user_id, rank_position, prev_position, rank_change, points, final_score, updated_at)
          VALUES (?, ?, 1, NULL, 0, 220, 11745, ?)`,
    args: [rankBId, userBId, now],
  });
  console.log("✓ Rankings: Bravo #1, Alpha #2");

  // ── Achievements ──
  await db.execute({
    sql: `INSERT INTO player_achievements (id, user_id, title, description, icon, category, rarity, unlocked_at, created_at) VALUES
          (?, ?, 'Welcome to zimfcpro', 'Joined the competitive ecosystem.', '🎮', 'GENERAL', 'COMMON', ?, ?),
          (?, ?, 'First Win', 'Won your first ranked match.', '🥇', 'GENERAL', 'COMMON', ?, ?),
          (?, ?, 'Learning the Ropes', 'First match completed.', '🎯', 'GENERAL', 'COMMON', ?, ?),
          (?, ?, 'Welcome to zimfcpro', 'Joined the competitive ecosystem.', '🎮', 'GENERAL', 'COMMON', ?, ?),
          (?, ?, 'First Win', 'Won your first ranked match.', '🥇', 'GENERAL', 'COMMON', ?, ?),
          (?, ?, 'Hat-Trick of Wins', 'Won 3 matches in a row.', '🔥', 'STREAK', 'COMMON', ?, ?),
          (?, ?, 'Iron Wall', 'Won without conceding.', '🛡️', 'GENERAL', 'COMMON', ?, ?)`,
    args: [
      crypto.randomUUID(), userAId, now, now,
      crypto.randomUUID(), userAId, now, now,
      crypto.randomUUID(), userAId, now, now,
      crypto.randomUUID(), userBId, now, now,
      crypto.randomUUID(), userBId, now, now,
      crypto.randomUUID(), userBId, now, now,
      crypto.randomUUID(), userBId, now, now,
    ],
  });
  console.log("✓ Achievements: 3 for Alpha, 4 for Bravo");

  // ── Notifications ──
  await db.execute({
    sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, is_read, created_at) VALUES
          (?, ?, 'SYSTEM', 'Welcome to ZIM FCPRO', 'Your competitive journey begins now.', '/rankings', 0, ?),
          (?, ?, 'ACHIEVEMENT', 'Achievement Unlocked', 'You earned: First Win', '/dashboard', 0, ?),
          (?, ?, 'SYSTEM', 'Welcome to ZIM FCPRO', 'Your competitive journey begins now.', '/rankings', 0, ?),
          (?, ?, 'ACHIEVEMENT', 'Achievement Unlocked', 'You earned: Hat-Trick of Wins', '/dashboard', 0, ?)`,
    args: [
      crypto.randomUUID(), userAId, now,
      crypto.randomUUID(), userAId, now,
      crypto.randomUUID(), userBId, now,
      crypto.randomUUID(), userBId, now,
    ],
  });
  console.log("✓ Notifications: 2 each");

  // ── Completed match (Alpha 2 - 3 Bravo) ──
  await db.execute({
    sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, status, status_raw, score1, score2, submitted_by, created_at)
          VALUES (?, ?, ?, ?, 'COMPLETED', 'COMPLETED', 2, 3, ?, ?)`,
    args: [crypto.randomUUID(), userAId, userBId, userBId, userAId, now],
  });
  console.log("✓ Past match: Alpha 2 - 3 Bravo (COMPLETED)");

  // ── ACTIVE match (Alpha vs Bravo, ready for score submission) ──
  const activeMatchId = "seed-match-active-001";
  await db.execute({
    sql: `INSERT INTO match_reports (id, player1_id, player2_id, status, status_raw, submitted_by, created_at)
          VALUES (?, ?, ?, 'ACTIVE', 'ACTIVE', ?, ?)`,
    args: [activeMatchId, userAId, userBId, userAId, now],
  });
  console.log("✓ Active match: Alpha vs Bravo (ready for scores)\n");

  console.log("═══════════════════════════════════════");
  console.log("  Credentials:");
  console.log("  User A: testalpha / test1234");
  console.log("  User B: testbravo / test1234");
  console.log("═══════════════════════════════════════");
  console.log("  Rankings: Bravo #1 | Alpha #2");
  console.log("  Active match ID:", activeMatchId);
  console.log("═══════════════════════════════════════");
}

main().catch(console.error);
