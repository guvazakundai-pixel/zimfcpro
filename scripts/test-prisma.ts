import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Testing Prisma connection...\n");

  try {
    const count = await prisma.playerRanking.count();
    console.log("✓ playerRanking.count():", count);
  } catch (e: any) {
    console.error("✗ playerRanking.count() FAILED:", e.message);
  }

  try {
    const users = await prisma.user.findMany({ take: 2, select: { id: true, username: true } });
    console.log("✓ user.findMany():", users.length, "users");
    if (users.length > 0) console.log("  First:", users[0].username);
  } catch (e: any) {
    console.error("✗ user.findMany() FAILED:", e.message);
  }

  try {
    const match = await prisma.matchReport.findFirst({
      where: { statusRaw: "COMPLETED" },
      select: { id: true, player1Id: true, player2Id: true },
    });
    console.log("✓ matchReport.findFirst():", match ? "found" : "none");
  } catch (e: any) {
    console.error("✗ matchReport.findFirst() FAILED:", e.message);
  }

  console.log("\nDone.");
}

main();
