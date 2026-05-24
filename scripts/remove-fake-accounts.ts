/**
 * DANGER: This script permanently removes all accounts marked as `is_fake = 1`.
 * 
 * Usage: npx tsx scripts/remove-fake-accounts.ts
 */
import { db } from "../src/lib/db";

async function main() {
  console.log("⚠️  DANGER: About to delete all fake accounts permanently!\n");

  const fake = await db.execute("SELECT COUNT(*) as c FROM users WHERE is_fake = 1");
  const count = Number((fake.rows[0] as Record<string, unknown>).c);

  if (count === 0) {
    console.log("No fake accounts to remove.");
    return;
  }

  console.log(`  ${count} fake accounts will be deleted.`);
  console.log("  This action is irreversible!\n");

  // Delete in reverse dependency order
  const tables = [
    "player_achievements", "player_rankings", "player_stats", "fantasy_teams",
    "weekly_points", "notifications_v2", "notifications", "user_activities",
    "activity_logs", "login_attempts", "points_log",
    "club_members", "club_rankings", "friend_requests",
    "match_reports", "match_requests", "wagers",
    "tournament_participants", "league_participants", "league_standings",
  ];

  let totalDeleted = 0;
  for (const table of tables) {
    try {
      const result = await db.execute({
        sql: `DELETE FROM ${table} WHERE user_id IN (SELECT id FROM users WHERE is_fake = 1)`,
      });
      if (result.rowsAffected > 0) {
        totalDeleted += Number(result.rowsAffected);
      }
    } catch {}
  }

  const result = await db.execute("DELETE FROM users WHERE is_fake = 1");
  const deleted = Number(result.rowsAffected);

  console.log(`\n=== Result ===`);
  console.log(`  Users deleted: ${deleted}`);
  console.log(`  Related records deleted: ${totalDeleted}`);
  console.log(`  Total records removed: ${deleted + totalDeleted}`);

  const remaining = await db.execute("SELECT COUNT(*) as c FROM users");
  const remainingCount = Number((remaining.rows[0] as Record<string, unknown>).c);
  console.log(`  Remaining users: ${remainingCount}`);
}

main().catch(console.error);
