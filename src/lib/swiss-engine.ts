export type SwissParticipant = {
  userId: string;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  opponentIds: string[];
  buchholz: number;
};

export type SwissPairing = {
  round: number;
  homeUserId: string;
  awayUserId: string;
  tableNumber: number;
};

export function initSwissParticipants(userIds: string[]): Map<string, SwissParticipant> {
  const map = new Map<string, SwissParticipant>();
  for (const uid of userIds) {
    map.set(uid, {
      userId: uid,
      points: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      opponentIds: [],
      buchholz: 0,
    });
  }
  return map;
}

export function calculateBuchholz(participants: Map<string, SwissParticipant>): void {
  for (const [, p] of participants) {
    let sum = 0;
    for (const oppId of p.opponentIds) {
      const opp = participants.get(oppId);
      if (opp) sum += opp.points;
    }
    p.buchholz = sum;
  }
}

export function generateSwissPairings(
  participants: Map<string, SwissParticipant>,
  round: number,
  maxPairs: number = 50
): SwissPairing[] {
  calculateBuchholz(participants);

  const eligible = Array.from(participants.values())
    .filter((p) => p.matchesPlayed < round)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.buchholz - a.buchholz;
    });

  const pairings: SwissPairing[] = [];
  const used = new Set<string>();
  let tableNumber = 1;

  for (let i = 0; i < eligible.length && pairings.length < maxPairs; i++) {
    const p = eligible[i];
    if (used.has(p.userId)) continue;

    let opponent: SwissParticipant | null = null;

    for (let j = i + 1; j < eligible.length; j++) {
      const q = eligible[j];
      if (used.has(q.userId)) continue;
      if (p.opponentIds.includes(q.userId)) continue;
      if (Math.abs(p.points - q.points) > 2 && round > 2) continue;
      opponent = q;
      break;
    }

    if (!opponent) {
      for (let j = i + 1; j < eligible.length; j++) {
        const q = eligible[j];
        if (used.has(q.userId)) continue;
        opponent = q;
        break;
      }
    }

    if (opponent) {
      used.add(p.userId);
      used.add(opponent.userId);
      const homeFirst = Math.random() > 0.5;
      pairings.push({
        round,
        homeUserId: homeFirst ? p.userId : opponent.userId,
        awayUserId: homeFirst ? opponent.userId : p.userId,
        tableNumber: tableNumber++,
      });
    }
  }

  return pairings;
}

export function updateSwissStandings(
  participants: Map<string, SwissParticipant>,
  homeUserId: string,
  awayUserId: string,
  homeScore: number,
  awayScore: number
): void {
  const home = participants.get(homeUserId);
  const away = participants.get(awayUserId);
  if (!home || !away) return;

  home.matchesPlayed++;
  away.matchesPlayed++;
  home.goalsFor += homeScore;
  home.goalsAgainst += awayScore;
  away.goalsFor += awayScore;
  away.goalsAgainst += homeScore;
  home.opponentIds.push(awayUserId);
  away.opponentIds.push(homeUserId);

  if (homeScore > awayScore) {
    home.wins++;
    home.points += 3;
    away.losses++;
  } else if (homeScore < awayScore) {
    away.wins++;
    away.points += 3;
    home.losses++;
  } else {
    home.draws++;
    away.draws++;
    home.points += 1;
    away.points += 1;
  }
}

export function getSwissStandings(participants: Map<string, SwissParticipant>) {
  calculateBuchholz(participants);
  return Array.from(participants.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
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
      buchholz: p.buchholz,
      opponents: p.opponentIds,
    }));
}
