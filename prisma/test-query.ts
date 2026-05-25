import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    const rankings = await prisma.playerRanking.findMany({
      take: 3,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            playerStats: { select: { skillRating: true } },
          },
        },
      },
    });
    console.log("Rankings count:", rankings.length);
    if (rankings.length > 0) {
      console.log("First:", JSON.stringify(rankings[0], null, 2));
    }
  } catch (e: any) {
    console.error("Error:", e.message, e.code);
  }
}

main();
