/**
 * Migration script to mark existing placeholder/test accounts as `is_fake = 1`.
 *
 * This script identifies likely fake accounts based on patterns and marks them
 * so they can be filtered from rankings and cleaned up later.
 *
 * Usage: npx tsx scripts/migrate-fake-accounts.ts
 */
import { db } from "../src/lib/db";

const FAKE_EMAIL_PATTERNS = [
  "%@test.com",
  "%@example.com",
  "%@fake.com",
  "%@placeholder.com",
  "%@mailinator.com",
  "%+test%@",
];

const FAKE_USERNAME_PATTERNS = [
  "test_",
  "testuser",
  "player_",
  "bot_",
  "placeholder",
  "demo_",
];

async function main() {
  console.log("=== Fake Account Migration ===\n");

  // 1. Mark accounts with fake email patterns
  let marked = 0;
  for (const pattern of FAKE_EMAIL_PATTERNS) {
    const result = await db.execute({
      sql: "UPDATE users SET is_fake = 1 WHERE email LIKE ? AND is_fake = 0",
      args: [pattern],
    });
    if (result.rowsAffected > 0) {
      marked += Number(result.rowsAffected);
      console.log(`  Marked ${result.rowsAffected} accounts (email: ${pattern})`);
    }
  }

  // 2. Mark accounts with fake username patterns
  for (const pattern of FAKE_USERNAME_PATTERNS) {
    const result = await db.execute({
      sql: "UPDATE users SET is_fake = 1 WHERE username LIKE ? AND is_fake = 0",
      args: [`${pattern}%`],
    });
    if (result.rowsAffected > 0) {
      marked += Number(result.rowsAffected);
      console.log(`  Marked ${result.rowsAffected} accounts (username: ${pattern})`);
    }
  }

  // 3. Count remaining real vs fake
  const [real, fake] = await Promise.all([
    db.execute("SELECT COUNT(*) as c FROM users WHERE is_fake = 0"),
    db.execute("SELECT COUNT(*) as c FROM users WHERE is_fake = 1"),
  ]);

  const realCount = Number((real.rows[0] as Record<string, unknown>).c);
  const fakeCount = Number((fake.rows[0] as Record<string, unknown>).c);

  console.log(`\n=== Summary ===`);
  console.log(`  Total accounts marked as fake: ${marked}`);
  console.log(`  Real accounts: ${realCount}`);
  console.log(`  Fake accounts: ${fakeCount}`);
  console.log(`  Total: ${realCount + fakeCount}`);

  if (fakeCount > 0) {
    console.log(`\n  To remove fake accounts, run:`);
    console.log(`  npx tsx scripts/remove-fake-accounts.ts`);
  }
}

main().catch(console.error);
