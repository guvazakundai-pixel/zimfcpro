export type WeekendLeagueRank =
  | "SILVER"
  | "GOLD"
  | "ELITE"
  | "CHAMPION";

export type WeekendLeaguePlayer = {
  userId: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  rank: WeekendLeagueRank;
  matchesRemaining: number;
  qualificationPoints: number;
};

export const MAX_MATCHES = 15;
export const WIN_POINTS = 4;
export const DRAW_POINTS = 1;
export const LOSS_POINTS = 0;

const RANK_THRESHOLDS: Record<WeekendLeagueRank, { minPoints: number; qualPoints: number }> = {
  SILVER: { minPoints: 0, qualPoints: 0 },
  GOLD: { minPoints: 20, qualPoints: 100 },
  ELITE: { minPoints: 40, qualPoints: 250 },
  CHAMPION: { minPoints: 55, qualPoints: 500 },
};

export function initWeekendLeaguePlayer(userId: string): WeekendLeaguePlayer {
  return {
    userId,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    rank: "SILVER",
    matchesRemaining: MAX_MATCHES,
    qualificationPoints: 0,
  };
}

export function calculateWeekendLeagueRank(points: number): WeekendLeagueRank {
  if (points >= 55) return "CHAMPION";
  if (points >= 40) return "ELITE";
  if (points >= 20) return "GOLD";
  return "SILVER";
}

export function recordWeekendLeagueMatch(
  player: WeekendLeaguePlayer,
  goalsFor: number,
  goalsAgainst: number
): {
  pointsEarned: number;
  rankChanged: boolean;
  previousRank: WeekendLeagueRank;
  newRank: WeekendLeagueRank;
  qualificationPointsEarned: number;
} {
  const previousRank = player.rank;

  player.matchesPlayed++;
  player.matchesRemaining--;
  player.goalsFor += goalsFor;
  player.goalsAgainst += goalsAgainst;

  let pointsEarned = 0;
  if (goalsFor > goalsAgainst) {
    player.wins++;
    pointsEarned = WIN_POINTS;
  } else if (goalsFor < goalsAgainst) {
    player.losses++;
    pointsEarned = LOSS_POINTS;
  } else {
    player.draws++;
    pointsEarned = DRAW_POINTS;
  }

  player.points += pointsEarned;
  player.qualificationPoints += pointsEarned * 10;

  player.rank = calculateWeekendLeagueRank(player.points);
  const rankChanged = previousRank !== player.rank;

  return {
    pointsEarned,
    rankChanged,
    previousRank,
    newRank: player.rank,
    qualificationPointsEarned: pointsEarned * 10,
  };
}

export function getWeekendLeagueRewards(rank: WeekendLeagueRank): {
  xpReward: number;
  coinsReward: number;
  packTier: string;
} {
  switch (rank) {
    case "CHAMPION":
      return { xpReward: 2000, coinsReward: 50000, packTier: "Legendary" };
    case "ELITE":
      return { xpReward: 1200, coinsReward: 25000, packTier: "Rare" };
    case "GOLD":
      return { xpReward: 600, coinsReward: 10000, packTier: "Standard" };
    case "SILVER":
      return { xpReward: 200, coinsReward: 2500, packTier: "Basic" };
  }
}

export function getWeekendLeagueStandings(players: Map<string, WeekendLeaguePlayer>) {
  return Array.from(players.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    })
    .map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      points: p.points,
      played: p.matchesPlayed,
      wins: p.wins,
      draws: p.draws,
      losses: p.losses,
      goalsFor: p.goalsFor,
      goalsAgainst: p.goalsAgainst,
      goalDifference: p.goalsFor - p.goalsAgainst,
      tier: p.rank,
      matchesRemaining: p.matchesRemaining,
      qualificationPoints: p.qualificationPoints,
    }));
}
