import type { PerkId } from "./types";

export interface PerkConfig {
  id: PerkId;
  name: string;
  description: string;
  color: string;
  maxLevel: number;
  tags: string[];
}

export const PERK_CONFIG: Record<PerkId, PerkConfig> = {
  front_arrow: {
    id: "front_arrow",
    name: "Blade Focus",
    description: "Main attacks gain extra force after absorbing combat spores.",
    color: "#7dfcff",
    maxLevel: 5,
    tags: ["damage", "core"],
  },
  multishot: {
    id: "multishot",
    name: "Spore Volley",
    description: "Ranged attacks split into extra forward shots with a tight spread.",
    color: "#ffd85a",
    maxLevel: 3,
    tags: ["projectiles"],
  },
  side_arrows: {
    id: "side_arrows",
    name: "Twin Bloom",
    description: "Adds weaker side bursts that help clear nearby pressure.",
    color: "#b98cff",
    maxLevel: 2,
    tags: ["projectiles"],
  },
  ricochet: {
    id: "ricochet",
    name: "Chain Mycelium",
    description: "Projectiles can seek one nearby monster after impact.",
    color: "#71ff9a",
    maxLevel: 3,
    tags: ["chain"],
  },
  piercing: {
    id: "piercing",
    name: "Thornpiercer",
    description: "Shots keep momentum and pass through more enemies.",
    color: "#69e7ff",
    maxLevel: 3,
    tags: ["pierce"],
  },
  rapid_fire: {
    id: "rapid_fire",
    name: "Fever Rhythm",
    description: "Attacks cycle faster while the mushroom energy is built up.",
    color: "#ff9d4d",
    maxLevel: 5,
    tags: ["speed"],
  },
  fire_arrows: {
    id: "fire_arrows",
    name: "Ember Spores",
    description: "Shots gain heated damage and a stronger glow.",
    color: "#ff6b3d",
    maxLevel: 4,
    tags: ["damage"],
  },
  strong_heart: {
    id: "strong_heart",
    name: "Vital Cap",
    description: "Raises max HP and gives a small stabilizing heal.",
    color: "#ff5d8f",
    maxLevel: 5,
    tags: ["survival"],
  },
  swift_boots: {
    id: "swift_boots",
    name: "Mycelium Step",
    description: "Movement and dash recovery feel smoother.",
    color: "#9cff5a",
    maxLevel: 4,
    tags: ["mobility"],
  },
  lucky_coin: {
    id: "lucky_coin",
    name: "Golden Growth",
    description: "Enemies drop more coins after economy spores activate.",
    color: "#ffe56e",
    maxLevel: 4,
    tags: ["economy"],
  },
  nimble: {
    id: "nimble",
    name: "Mist Veil",
    description: "Raises the chance to slip through enemy hits.",
    color: "#f4f0ff",
    maxLevel: 4,
    tags: ["survival"],
  },
};

export function perkLevel(perks: Partial<Record<PerkId, number>>, id: PerkId) {
  return perks[id] ?? 0;
}

export function rollPerkChoices(perks: Partial<Record<PerkId, number>>, count = 3): PerkId[] {
  const candidates = (Object.keys(PERK_CONFIG) as PerkId[])
    .filter(id => perkLevel(perks, id) < PERK_CONFIG[id].maxLevel);
  const pool = candidates.length > 0 ? candidates : (Object.keys(PERK_CONFIG) as PerkId[]);
  const choices: PerkId[] = [];

  while (choices.length < Math.min(count, pool.length)) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    if (!choices.includes(id)) choices.push(id);
  }

  return choices;
}
