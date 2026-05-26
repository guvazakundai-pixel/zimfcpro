import { db } from "@/lib/db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WelcomeClient } from "@/components/WelcomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let playerCount = 0;
  let clubCount = 0;

  try {
    const [playersRes, clubsRes] = await Promise.all([
      db.execute("SELECT count(*) as v FROM player_stats"),
      db.execute("SELECT count(*) as v FROM clubs"),
    ]);
    playerCount = Number(playersRes.rows[0].v);
    clubCount = Number(clubsRes.rows[0].v);
  } catch {}

  return (
    <ErrorBoundary>
      <WelcomeClient playerCount={playerCount} clubCount={clubCount} />
    </ErrorBoundary>
  );
}
