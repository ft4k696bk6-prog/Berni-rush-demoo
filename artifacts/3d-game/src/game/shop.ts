import type { ShopUpgradeId } from "./types";

export interface ShopUpgradeConfig {
  id: ShopUpgradeId;
  category: "Combat" | "Defense" | "Mobility" | "Powers" | "Utility";
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  color: string;
}

export const SHOP_UPGRADES: Record<ShopUpgradeId, ShopUpgradeConfig> = {
  melee_damage: {
    id: "melee_damage",
    category: "Combat",
    name: "Sharpened Blade",
    description: "Melee hits deal more damage and feel heavier.",
    maxLevel: 6,
    baseCost: 18,
    costGrowth: 1.55,
    color: "#ffd85a",
  },
  attack_range: {
    id: "attack_range",
    category: "Combat",
    name: "Longer Arc",
    description: "Widens melee arcs and lets class projectiles travel farther.",
    maxLevel: 5,
    baseCost: 22,
    costGrowth: 1.62,
    color: "#7dfcff",
  },
  attack_cooldown: {
    id: "attack_cooldown",
    category: "Combat",
    name: "Quick Grip",
    description: "Reduces melee cooldown without making it spammy.",
    maxLevel: 5,
    baseCost: 24,
    costGrowth: 1.7,
    color: "#ff9d4d",
  },
  max_health: {
    id: "max_health",
    category: "Defense",
    name: "Tougher Core",
    description: "Adds max health and heals for the same amount.",
    maxLevel: 6,
    baseCost: 20,
    costGrowth: 1.58,
    color: "#ff5d8f",
  },
  move_speed: {
    id: "move_speed",
    category: "Mobility",
    name: "Light Boots",
    description: "Improves movement speed and kiting control.",
    maxLevel: 5,
    baseCost: 20,
    costGrowth: 1.56,
    color: "#9cff5a",
  },
  dash_mastery: {
    id: "dash_mastery",
    category: "Mobility",
    name: "Dash Mastery",
    description: "Shorter dash cooldown and a little more burst.",
    maxLevel: 4,
    baseCost: 28,
    costGrowth: 1.72,
    color: "#69e7ff",
  },
  super_charge: {
    id: "super_charge",
    category: "Powers",
    name: "Super Charge",
    description: "360 power slash comes back faster and knocks enemies harder.",
    maxLevel: 5,
    baseCost: 32,
    costGrowth: 1.78,
    color: "#ff8f3d",
  },
  pickup_range: {
    id: "pickup_range",
    category: "Utility",
    name: "Magnet Reach",
    description: "Collect coins and powerups from farther away.",
    maxLevel: 5,
    baseCost: 18,
    costGrowth: 1.48,
    color: "#ffe56e",
  },
  heal_now: {
    id: "heal_now",
    category: "Utility",
    name: "Field Medkit",
    description: "One-time heal for the current run.",
    maxLevel: 99,
    baseCost: 16,
    costGrowth: 1.18,
    color: "#ff88aa",
  },
  random_perk: {
    id: "random_perk",
    category: "Utility",
    name: "Spore Infusion",
    description: "Force one mushroom-style mutation when you need a run boost.",
    maxLevel: 99,
    baseCost: 45,
    costGrowth: 1.24,
    color: "#b98cff",
  },
};

export const SHOP_CATEGORIES = ["Combat", "Defense", "Mobility", "Powers", "Utility"] as const;

export function shopUpgradeLevel(upgrades: Partial<Record<ShopUpgradeId, number>>, id: ShopUpgradeId) {
  return upgrades[id] ?? 0;
}

export function shopUpgradeCost(upgrades: Partial<Record<ShopUpgradeId, number>>, id: ShopUpgradeId) {
  const cfg = SHOP_UPGRADES[id];
  const level = shopUpgradeLevel(upgrades, id);
  return Math.round(cfg.baseCost * Math.pow(cfg.costGrowth, level));
}
