export type Division = {
  id: string;
  name: string;
  tier: number;
  minSkillRating: number;
  maxSkillRating: number;
  color: string;
  icon: string;
};

export const DIVISIONS: Division[] = [
  { id: "BRONZE_V", name: "Bronze V", tier: 1, minSkillRating: 0, maxSkillRating: 200, color: "#CD7F32", icon: "🥉" },
  { id: "BRONZE_IV", name: "Bronze IV", tier: 2, minSkillRating: 201, maxSkillRating: 400, color: "#CD7F32", icon: "🥉" },
  { id: "BRONZE_III", name: "Bronze III", tier: 3, minSkillRating: 401, maxSkillRating: 600, color: "#CD7F32", icon: "🥉" },
  { id: "BRONZE_II", name: "Bronze II", tier: 4, minSkillRating: 601, maxSkillRating: 800, color: "#CD7F32", icon: "🥉" },
  { id: "BRONZE_I", name: "Bronze I", tier: 5, minSkillRating: 801, maxSkillRating: 999, color: "#CD7F32", icon: "🥉" },
  { id: "SILVER_V", name: "Silver V", tier: 6, minSkillRating: 1000, maxSkillRating: 1100, color: "#C8C8D2", icon: "🥈" },
  { id: "SILVER_IV", name: "Silver IV", tier: 7, minSkillRating: 1101, maxSkillRating: 1200, color: "#C8C8D2", icon: "🥈" },
  { id: "SILVER_III", name: "Silver III", tier: 8, minSkillRating: 1201, maxSkillRating: 1300, color: "#C8C8D2", icon: "🥈" },
  { id: "SILVER_II", name: "Silver II", tier: 9, minSkillRating: 1301, maxSkillRating: 1400, color: "#C8C8D2", icon: "🥈" },
  { id: "SILVER_I", name: "Silver I", tier: 10, minSkillRating: 1401, maxSkillRating: 1499, color: "#C8C8D2", icon: "🥈" },
  { id: "GOLD_V", name: "Gold V", tier: 11, minSkillRating: 1500, maxSkillRating: 1600, color: "#FFB800", icon: "🌟" },
  { id: "GOLD_IV", name: "Gold IV", tier: 12, minSkillRating: 1601, maxSkillRating: 1700, color: "#FFB800", icon: "🌟" },
  { id: "GOLD_III", name: "Gold III", tier: 13, minSkillRating: 1701, maxSkillRating: 1800, color: "#FFB800", icon: "🌟" },
  { id: "GOLD_II", name: "Gold II", tier: 14, minSkillRating: 1801, maxSkillRating: 1900, color: "#FFB800", icon: "🌟" },
  { id: "GOLD_I", name: "Gold I", tier: 15, minSkillRating: 1901, maxSkillRating: 1999, color: "#FFB800", icon: "🌟" },
  { id: "ELITE_V", name: "Elite V", tier: 16, minSkillRating: 2000, maxSkillRating: 2100, color: "#00FF85", icon: "💎" },
  { id: "ELITE_IV", name: "Elite IV", tier: 17, minSkillRating: 2101, maxSkillRating: 2200, color: "#00FF85", icon: "💎" },
  { id: "ELITE_III", name: "Elite III", tier: 18, minSkillRating: 2201, maxSkillRating: 2300, color: "#00FF85", icon: "💎" },
  { id: "ELITE_II", name: "Elite II", tier: 19, minSkillRating: 2301, maxSkillRating: 2400, color: "#00FF85", icon: "💎" },
  { id: "ELITE_I", name: "Elite I", tier: 20, minSkillRating: 2401, maxSkillRating: 2499, color: "#00FF85", icon: "💎" },
  { id: "CHAMPION", name: "Champion", tier: 21, minSkillRating: 2500, maxSkillRating: 2999, color: "#A855F7", icon: "👑" },
  { id: "LEGENDARY", name: "Legendary", tier: 22, minSkillRating: 3000, maxSkillRating: Infinity, color: "#FF6B35", icon: "🔥" },
];

export function getDivision(skillRating: number): Division {
  for (let i = DIVISIONS.length - 1; i >= 0; i--) {
    if (skillRating >= DIVISIONS[i].minSkillRating) {
      return DIVISIONS[i];
    }
  }
  return DIVISIONS[0];
}

export function getDivisionChange(
  oldRating: number,
  newRating: number
): { from: Division; to: Division; promoted: boolean; relegated: boolean } {
  const from = getDivision(oldRating);
  const to = getDivision(newRating);
  return {
    from,
    to,
    promoted: to.tier > from.tier,
    relegated: to.tier < from.tier,
  };
}

export function getDivisionProgress(skillRating: number): {
  current: Division;
  next: Division | null;
  prev: Division | null;
  progress: number;
} {
  const current = getDivision(skillRating);
  const currentIdx = DIVISIONS.indexOf(current);
  const next = currentIdx < DIVISIONS.length - 1 ? DIVISIONS[currentIdx + 1] : null;
  const prev = currentIdx > 0 ? DIVISIONS[currentIdx - 1] : null;

  const rangeSize = current.maxSkillRating - current.minSkillRating;
  const progress = rangeSize > 0 ? (skillRating - current.minSkillRating) / rangeSize : 0;

  return { current, next, prev, progress: Math.min(Math.max(progress, 0), 1) };
}

export function getDivisionTierLabel(tier: number): string {
  if (tier >= 22) return "LEGENDARY";
  if (tier >= 21) return "CHAMPION";
  if (tier >= 16) return "ELITE";
  if (tier >= 11) return "GOLD";
  if (tier >= 6) return "SILVER";
  return "BRONZE";
}
