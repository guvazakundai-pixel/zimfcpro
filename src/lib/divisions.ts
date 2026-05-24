export const DIVISIONS = [
  "Bronze III", "Bronze II", "Bronze I",
  "Silver III", "Silver II", "Silver I",
  "Gold III", "Gold II", "Gold I",
  "Platinum III", "Platinum II", "Platinum I",
  "Diamond III", "Diamond II", "Diamond I",
  "Elite III", "Elite II", "Elite I",
  "Master III", "Master II", "Master I",
  "Legendary",
] as const;

export function getDivisionForSkillRating(sr: number): string {
  if (sr >= 2800) return "Legendary";
  if (sr >= 2600) return "Master I";
  if (sr >= 2450) return "Master II";
  if (sr >= 2300) return "Master III";
  if (sr >= 2150) return "Elite I";
  if (sr >= 2000) return "Elite II";
  if (sr >= 1850) return "Elite III";
  if (sr >= 1700) return "Diamond I";
  if (sr >= 1550) return "Diamond II";
  if (sr >= 1400) return "Diamond III";
  if (sr >= 1250) return "Platinum I";
  if (sr >= 1100) return "Platinum II";
  if (sr >= 950) return "Platinum III";
  if (sr >= 800) return "Gold I";
  if (sr >= 650) return "Gold II";
  if (sr >= 500) return "Gold III";
  if (sr >= 350) return "Silver I";
  if (sr >= 200) return "Silver II";
  if (sr >= 100) return "Silver III";
  if (sr >= 50) return "Bronze I";
  if (sr >= 25) return "Bronze II";
  return "Bronze III";
}

const DIVISION_TIERS: { label: string; min: number }[] = [
  { label: "Bronze III", min: 0 },
  { label: "Bronze II", min: 25 },
  { label: "Bronze I", min: 50 },
  { label: "Silver III", min: 100 },
  { label: "Silver II", min: 200 },
  { label: "Silver I", min: 350 },
  { label: "Gold III", min: 500 },
  { label: "Gold II", min: 650 },
  { label: "Gold I", min: 800 },
  { label: "Platinum III", min: 950 },
  { label: "Platinum II", min: 1100 },
  { label: "Platinum I", min: 1250 },
  { label: "Diamond III", min: 1400 },
  { label: "Diamond II", min: 1550 },
  { label: "Diamond I", min: 1700 },
  { label: "Elite III", min: 1850 },
  { label: "Elite II", min: 2000 },
  { label: "Elite I", min: 2150 },
  { label: "Master III", min: 2300 },
  { label: "Master II", min: 2450 },
  { label: "Master I", min: 2600 },
  { label: "Legendary", min: 2800 },
];

export function divisionFromElo(elo: number): { tier: string; label: string } {
  const tier = elo >= 2800 ? "ELITE" : elo >= 2000 ? "PRO" : elo >= 1000 ? "CONTENDER" : "ROOKIE";
  const label = getDivisionForSkillRating(elo);
  return { tier, label };
}

export function progressToNext(elo: number): { pct: number; needed: number } {
  for (let i = 0; i < DIVISION_TIERS.length; i++) {
    const current = DIVISION_TIERS[i];
    const next = DIVISION_TIERS[i + 1];
    if (!next) return { pct: 100, needed: 0 };
    if (elo >= current.min && elo < next.min) {
      const span = next.min - current.min;
      const into = elo - current.min;
      return { pct: Math.round((into / span) * 100), needed: next.min - elo };
    }
  }
  return { pct: 100, needed: 0 };
}
