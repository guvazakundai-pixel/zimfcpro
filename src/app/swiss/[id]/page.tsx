import { SwissFormatClient } from "@/components/SwissFormatClient";

export const dynamic = "force-dynamic";

const MOCK_PARTICIPANTS = [
  { userId: "p1", username: "AshlyFC", displayName: "Ashly FC", points: 12, played: 4, wins: 4, draws: 0, losses: 0, goalsFor: 15, goalsAgainst: 3, goalDifference: 12, buchholz: 18 },
  { userId: "p2", username: "LincolnPro", displayName: "Lincoln Pro", points: 9, played: 4, wins: 3, draws: 0, losses: 1, goalsFor: 10, goalsAgainst: 5, goalDifference: 5, buchholz: 21 },
  { userId: "p3", username: "TacticZone", displayName: "Tactic Zone", points: 7, played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 8, goalsAgainst: 6, goalDifference: 2, buchholz: 24 },
  { userId: "p4", username: "KingSkillz", displayName: "King Skillz", points: 6, played: 4, wins: 2, draws: 0, losses: 2, goalsFor: 7, goalsAgainst: 8, goalDifference: -1, buchholz: 22 },
  { userId: "p5", username: "EliteMotion", displayName: "Elite Motion", points: 4, played: 4, wins: 1, draws: 1, losses: 2, goalsFor: 5, goalsAgainst: 9, goalDifference: -4, buchholz: 20 },
  { userId: "p6", username: "ZimBallers", displayName: "Zim Ballers", points: 3, played: 4, wins: 1, draws: 0, losses: 3, goalsFor: 4, goalsAgainst: 11, goalDifference: -7, buchholz: 25 },
  { userId: "p7", username: "GhostZW", displayName: "Ghost ZW", points: 3, played: 4, wins: 1, draws: 0, losses: 3, goalsFor: 3, goalsAgainst: 10, goalDifference: -7, buchholz: 23 },
  { userId: "p8", username: "ProdigyZW", displayName: "Prodigy ZW", points: 1, played: 4, wins: 0, draws: 1, losses: 3, goalsFor: 2, goalsAgainst: 12, goalDifference: -10, buchholz: 24 },
].map((p, i) => ({ ...p, rank: i + 1 }));

const MOCK_MATCHES = [
  { id: "m1", round: 5, tableNumber: 1, homeUser: { id: "p1", username: "AshlyFC", displayName: "Ashly FC" }, awayUser: { id: "p2", username: "LincolnPro", displayName: "Lincoln Pro" }, homeScore: null, awayScore: null, status: "PENDING" },
  { id: "m2", round: 5, tableNumber: 2, homeUser: { id: "p3", username: "TacticZone", displayName: "Tactic Zone" }, awayUser: { id: "p4", username: "KingSkillz", displayName: "King Skillz" }, homeScore: null, awayScore: null, status: "PENDING" },
  { id: "m3", round: 5, tableNumber: 3, homeUser: { id: "p5", username: "EliteMotion", displayName: "Elite Motion" }, awayUser: { id: "p6", username: "ZimBallers", displayName: "Zim Ballers" }, homeScore: null, awayScore: null, status: "PENDING" },
  { id: "m4", round: 5, tableNumber: 4, homeUser: { id: "p7", username: "GhostZW", displayName: "Ghost ZW" }, awayUser: { id: "p8", username: "ProdigyZW", displayName: "Prodigy ZW" }, homeScore: null, awayScore: null, status: "PENDING" },
];

export default async function SwissPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <SwissFormatClient
          name={id === "demo" ? "Harare Swiss Open" : `Swiss #${id}`}
          currentRound={5}
          totalRounds={7}
          standings={MOCK_PARTICIPANTS}
          matches={MOCK_MATCHES}
          isAdmin={true}
          currentUserId="p1"
        />
      </div>
    </div>
  );
}
