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
    name: "Front Arrow",
    description: "Your main shots hit harder. Simple, clean, very Archero.",
    color: "#7dfcff",
    maxLevel: 5,
    tags: ["damage", "core"],
  },
  multishot: {
    id: "multishot",
    name: "Multishot",
    description: "Adds extra forward arrows with a small spread.",
    color: "#ffd85a",
    maxLevel: 3,
    tags: ["projectiles"],
  },
  side_arrows: {
    id: "side_arrows",
    name: "Side Arrows",
    description: "Fires weaker arrows to the left and right.",
    color: "#b98cff",
    maxLevel: 2,
    tags: ["projectiles"],
  },
  ricochet: {
    id: "ricochet",
    name: "Ricochet",
    description: "Shots can jump to nearby monsters after a hit.",
    color: "#71ff9a",
    maxLevel: 3,
    tags: ["chain"],
  },
  piercing: {
    id: "piercing",
    name: "Piercing Shot",
    description: "Arrows pass through more enemies.",
    color: "#69e7ff",
    maxLevel: 3,
    tags: ["pierce"],
  },
  rapid_fire: {
    id: "rapid_fire",
    name: "Attack Speed",
    description: "Stand still and fire faster.",
    color: "#ff9d4d",
    maxLevel: 5,
    tags: ["speed"],
  },
  fire_arrows: {
    id: "fire_arrows",
    name: "Fire Arrows",
    description: "Shots deal more damage and glow hot.",
    color: "#ff6b3d",
    maxLevel: 4,
    tags: ["damage"],
  },
  strong_heart: {
    id: "strong_heart",
    name: "Strong Heart",
    description: "Gain max HP and heal immediately.",
    color: "#ff5d8f",
    maxLevel: 5,
    tags: ["survival"],
  },
  swift_boots: {
    id: "swift_boots",
    name: "Swift Boots",
    description: "Move and dash more smoothly.",
    color: "#9cff5a",
    maxLevel: 4,
    tags: ["mobility"],
  },
  lucky_coin: {
    id: "lucky_coin",
    name: "Lucky Coin",
    description: "Monsters drop more coins.",
    color: "#ffe56e",
    maxLevel: 4,
    tags: ["economy"],
  },
  nimble: {
    id: "nimble",
    name: "Nimble",
    description: "Raises your chance to dodge enemy hits.",
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
