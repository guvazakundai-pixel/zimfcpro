/**
 * Insert match records matching actual Turso columns (no updated_at, has submitted_by NOT NULL)
 * Run: USE_TURSO=true npx tsx prisma/seed-matches.ts
 */
import { db } from "../src/lib/db";
import crypto from "crypto";

async function main() {
  console.log("Inserting match records...\n");

  const now = new Date().toISOString();
  const userAId = "seed-user-a-001";
  const userBId = "seed-user-b-001";

  // Clean up previous test matches
  await db.execute({
    sql: "DELETE FROM match_reports WHERE player1_id IN (?, ?) OR player2_id IN (?, ?)",
    args: [userAId, userBId, userAId, userBId],
  });
  console.log("✓ Cleaned up old matches");

  // Past match: Alpha 2 - 3 Bravo (COMPLETED)
  await db.execute({
    sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, status, status_raw, score1, score2, submitted_by, created_at)
          VALUES (?, ?, ?, ?, 'COMPLETED', 'COMPLETED', 2, 3, ?, ?)`,
    args: [crypto.randomUUID(), userAId, userBId, userBId, userAId, now],
  });
  console.log("✓ Past match: Alpha 2 - 3 Bravo (COMPLETED)");

  // Active match
  const activeMatchId = "seed-match-active-001";
  await db.execute({
    sql: `INSERT INTO match_reports (id, player1_id, player2_id, status, status_raw, submitted_by, created_at)
          VALUES (?, ?, ?, 'ACTIVE', 'ACTIVE', ?, ?)`,
    args: [activeMatchId, userAId, userBId, userAId, now],
  });
  console.log("✓ Active match: Alpha vs Bravo (ready for scores)");
  console.log("  Active match ID:", activeMatchId);

  console.log("\nDone.");
}

main().catch(console.error);
