import type {
  ClassDefinition,
  ClassId,
  PlayerLoadout,
  SkinDefinition,
  SkinId,
} from "./types";

export const DEFAULT_CLASS_ID: ClassId = "knight";
export const DEFAULT_SKIN_ID: SkinId = "knight_male";

export const CLASS_ORDER: ClassId[] = ["knight", "ranger", "mage", "assassin", "tank", "miner"];

export const CLASS_DEFINITIONS: Record<ClassId, ClassDefinition> = {
  knight: {
    id: "knight",
    displayName: "Knight",
    description: "Bezpieczny wojownik z mocnym frontowym slashem.",
    icon: "shield",
    baseHpMultiplier: 1.15,
    damageMultiplier: 1.02,
    attackSpeedMultiplier: 1,
    cooldownMultiplier: 1,
    critChanceBonus: 0.03,
    armorBonus: 0.02,
    coinMultiplier: 1,
    moveSpeedMultiplier: 1,
    attackType: "melee_arc",
    vfxTheme: "knight",
    color: "#9be7ff",
    preferredRange: "close",
  },
  ranger: {
    id: "ranger",
    displayName: "Ranger",
    description: "Szybki dystans, nizsze pojedyncze trafienie, wiecej presji.",
    icon: "crosshair",
    baseHpMultiplier: 1,
    damageMultiplier: 0.88,
    attackSpeedMultiplier: 1.1,
    cooldownMultiplier: 1,
    critChanceBonus: 0.04,
    armorBonus: 0,
    coinMultiplier: 1,
    moveSpeedMultiplier: 1.04,
    attackType: "rapid_projectile",
    vfxTheme: "ranger",
    color: "#7dfcff",
    preferredRange: "ranged",
  },
  mage: {
    id: "mage",
    displayName: "Mage",
    description: "Wolniejszy rytm, magie obszarowe i krotsze cooldowny.",
    icon: "sparkles",
    baseHpMultiplier: 0.95,
    damageMultiplier: 1.08,
    attackSpeedMultiplier: 0.86,
    cooldownMultiplier: 0.9,
    critChanceBonus: 0.02,
    armorBonus: 0,
    coinMultiplier: 1,
    moveSpeedMultiplier: 0.98,
    attackType: "magic_orb",
    vfxTheme: "mage",
    color: "#c691ff",
    preferredRange: "ranged",
  },
  assassin: {
    id: "assassin",
    displayName: "Assassin",
    description: "Szybki, ryzykowny styl z wyraznym potencjalem krytycznym.",
    icon: "dagger",
    baseHpMultiplier: 0.92,
    damageMultiplier: 1,
    attackSpeedMultiplier: 1.06,
    cooldownMultiplier: 0.96,
    critChanceBonus: 0.1,
    armorBonus: 0,
    coinMultiplier: 1,
    moveSpeedMultiplier: 1.08,
    attackType: "dash_strike",
    vfxTheme: "assassin",
    color: "#ff6fae",
    preferredRange: "close",
  },
  tank: {
    id: "tank",
    displayName: "Tank",
    description: "Wolniejszy, odporny, mocny cone attack i knockback.",
    icon: "shield-plus",
    baseHpMultiplier: 1.08,
    damageMultiplier: 1.12,
    attackSpeedMultiplier: 0.82,
    cooldownMultiplier: 1.04,
    critChanceBonus: 0.01,
    armorBonus: 0.1,
    coinMultiplier: 1,
    moveSpeedMultiplier: 0.94,
    attackType: "heavy_cone",
    vfxTheme: "tank",
    color: "#ffd36a",
    preferredRange: "close",
  },
  miner: {
    id: "miner",
    displayName: "Miner",
    description: "Slabszy bojowo, ale szybciej zbiera monety na skiny.",
    icon: "pickaxe",
    baseHpMultiplier: 1,
    damageMultiplier: 0.94,
    attackSpeedMultiplier: 0.96,
    cooldownMultiplier: 1,
    critChanceBonus: 0.02,
    armorBonus: 0.02,
    coinMultiplier: 1.2,
    moveSpeedMultiplier: 1,
    attackType: "pickaxe_throw",
    vfxTheme: "miner",
    color: "#f7c251",
    preferredRange: "hybrid",
  },
};

export const SKIN_ORDER: SkinId[] = [
  "knight_male",
  "soldier_scout",
  "wizard_arcane",
  "ninja_shadow",
  "viking_brute",
  "worker_miner",
  "blue_soldier",
  "casual_runner",
  "pirate_rogue",
  "witch_mystic",
  "golden_knight",
  "suit_agent",
];

export const STARTER_SKIN_IDS: SkinId[] = [
  "knight_male",
  "soldier_scout",
  "wizard_arcane",
  "ninja_shadow",
  "viking_brute",
  "worker_miner",
];

export const SKIN_DEFINITIONS: Record<SkinId, SkinDefinition> = {
  knight_male: {
    id: "knight_male",
    displayName: "Iron Knight",
    prefab: "/assets/characters/Knight_Male.gltf",
    icon: "shield",
    rarity: "starter",
    unlockCost: 0,
    defaultUnlocked: true,
    miniBonusType: "hp",
    miniBonusValue: 0.03,
    compatibleClasses: ["knight"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  blue_soldier: {
    id: "blue_soldier",
    displayName: "Blue Soldier",
    prefab: "/assets/characters/BlueSoldier_Male.gltf",
    icon: "shield-plus",
    rarity: "common",
    unlockCost: 90,
    defaultUnlocked: false,
    miniBonusType: "hp",
    miniBonusValue: 0.02,
    compatibleClasses: ["knight", "ranger", "tank"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  casual_runner: {
    id: "casual_runner",
    displayName: "Street Runner",
    prefab: "/assets/characters/Casual_Male.gltf",
    icon: "gauge",
    rarity: "common",
    unlockCost: 80,
    defaultUnlocked: false,
    miniBonusType: "move_speed",
    miniBonusValue: 0.02,
    compatibleClasses: ["ranger", "assassin", "miner"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  worker_miner: {
    id: "worker_miner",
    displayName: "Mine Worker",
    prefab: "/assets/characters/Worker_Male.gltf",
    icon: "pickaxe",
    rarity: "starter",
    unlockCost: 0,
    defaultUnlocked: true,
    miniBonusType: "coins",
    miniBonusValue: 0.03,
    compatibleClasses: ["miner"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  ninja_shadow: {
    id: "ninja_shadow",
    displayName: "Shadow Blade",
    prefab: "/assets/characters/Ninja_Female.gltf",
    icon: "dagger",
    rarity: "starter",
    unlockCost: 0,
    defaultUnlocked: true,
    miniBonusType: "crit",
    miniBonusValue: 0.02,
    compatibleClasses: ["assassin"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  wizard_arcane: {
    id: "wizard_arcane",
    displayName: "Arcane Wizard",
    prefab: "/assets/characters/Wizard.gltf",
    icon: "sparkles",
    rarity: "starter",
    unlockCost: 0,
    defaultUnlocked: true,
    miniBonusType: "cooldown",
    miniBonusValue: 0.02,
    compatibleClasses: ["mage"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  pirate_rogue: {
    id: "pirate_rogue",
    displayName: "Sea Rogue",
    prefab: "/assets/characters/Pirate_Female.gltf",
    icon: "swords",
    rarity: "rare",
    unlockCost: 170,
    defaultUnlocked: false,
    miniBonusType: "damage",
    miniBonusValue: 0.03,
    compatibleClasses: ["assassin", "ranger", "knight"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  viking_brute: {
    id: "viking_brute",
    displayName: "Storm Viking",
    prefab: "/assets/characters/Viking_Male.gltf",
    icon: "shield-plus",
    rarity: "starter",
    unlockCost: 0,
    defaultUnlocked: true,
    miniBonusType: "hp",
    miniBonusValue: 0.04,
    compatibleClasses: ["tank"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  soldier_scout: {
    id: "soldier_scout",
    displayName: "Field Scout",
    prefab: "/assets/characters/Soldier_Female.gltf",
    icon: "crosshair",
    rarity: "starter",
    unlockCost: 0,
    defaultUnlocked: true,
    miniBonusType: "move_speed",
    miniBonusValue: 0.03,
    compatibleClasses: ["ranger"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  witch_mystic: {
    id: "witch_mystic",
    displayName: "Mystic Witch",
    prefab: "/assets/characters/Witch.gltf",
    icon: "sparkles",
    rarity: "epic",
    unlockCost: 260,
    defaultUnlocked: false,
    miniBonusType: "cooldown",
    miniBonusValue: 0.03,
    compatibleClasses: ["mage", "assassin"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  golden_knight: {
    id: "golden_knight",
    displayName: "Golden Knight",
    prefab: "/assets/characters/Knight_Golden_Male.gltf",
    icon: "coins",
    rarity: "legendary",
    unlockCost: 420,
    defaultUnlocked: false,
    miniBonusType: "coins",
    miniBonusValue: 0.05,
    compatibleClasses: ["knight", "tank", "miner"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
  suit_agent: {
    id: "suit_agent",
    displayName: "Night Agent",
    prefab: "/assets/characters/Suit_Female.gltf",
    icon: "dagger",
    rarity: "epic",
    unlockCost: 300,
    defaultUnlocked: false,
    miniBonusType: "crit",
    miniBonusValue: 0.03,
    compatibleClasses: ["assassin", "ranger", "mage"],
    previewOffset: [0, -1.08, 0],
    previewScale: 1.35,
    animationProfile: "humanoid",
  },
};

export interface LoadoutModifiers {
  hpMultiplier: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  cooldownMultiplier: number;
  critChanceBonus: number;
  armorBonus: number;
  coinMultiplier: number;
  moveSpeedMultiplier: number;
}

export function getClassDefinition(id: ClassId | undefined) {
  return CLASS_DEFINITIONS[id && CLASS_DEFINITIONS[id] ? id : DEFAULT_CLASS_ID];
}

export function getSkinDefinition(id: SkinId | undefined) {
  return SKIN_DEFINITIONS[id && SKIN_DEFINITIONS[id] ? id : DEFAULT_SKIN_ID];
}

export function skinFitsClass(skinId: SkinId, classId: ClassId) {
  return SKIN_DEFINITIONS[skinId].compatibleClasses.includes(classId);
}

export function firstCompatibleSkin(classId: ClassId, unlockedSkinIds: SkinId[]) {
  return SKIN_ORDER.find(id => unlockedSkinIds.includes(id) && skinFitsClass(id, classId)) ?? DEFAULT_SKIN_ID;
}

export function normalizeLoadout(loadout: PlayerLoadout, unlockedSkinIds: SkinId[]): PlayerLoadout {
  const classId = CLASS_DEFINITIONS[loadout.selectedClassId] ? loadout.selectedClassId : DEFAULT_CLASS_ID;
  const skinId = SKIN_DEFINITIONS[loadout.selectedSkinId] && unlockedSkinIds.includes(loadout.selectedSkinId) && skinFitsClass(loadout.selectedSkinId, classId)
    ? loadout.selectedSkinId
    : firstCompatibleSkin(classId, unlockedSkinIds);
  return { selectedClassId: classId, selectedSkinId: skinId };
}

export function getStarterUnlockedSkins() {
  return SKIN_ORDER.filter(id => SKIN_DEFINITIONS[id].defaultUnlocked || STARTER_SKIN_IDS.includes(id));
}

export function getLoadoutModifiers(classId: ClassId, skinId: SkinId): LoadoutModifiers {
  const klass = getClassDefinition(classId);
  const skin = getSkinDefinition(skinId);
  const modifiers: LoadoutModifiers = {
    hpMultiplier: klass.baseHpMultiplier,
    damageMultiplier: klass.damageMultiplier,
    attackSpeedMultiplier: klass.attackSpeedMultiplier,
    cooldownMultiplier: klass.cooldownMultiplier,
    critChanceBonus: klass.critChanceBonus,
    armorBonus: klass.armorBonus,
    coinMultiplier: klass.coinMultiplier,
    moveSpeedMultiplier: klass.moveSpeedMultiplier,
  };

  if (skin.miniBonusType === "move_speed") modifiers.moveSpeedMultiplier += skin.miniBonusValue;
  if (skin.miniBonusType === "hp") modifiers.hpMultiplier += skin.miniBonusValue;
  if (skin.miniBonusType === "cooldown") modifiers.cooldownMultiplier = Math.max(0.75, modifiers.cooldownMultiplier - skin.miniBonusValue);
  if (skin.miniBonusType === "crit") modifiers.critChanceBonus += skin.miniBonusValue;
  if (skin.miniBonusType === "coins") modifiers.coinMultiplier += skin.miniBonusValue;
  if (skin.miniBonusType === "damage") modifiers.damageMultiplier += skin.miniBonusValue;

  return modifiers;
}

export function formatSkinBonus(skin: SkinDefinition) {
  const pct = Math.round(skin.miniBonusValue * 100);
  if (skin.miniBonusType === "move_speed") return `+${pct}% move`;
  if (skin.miniBonusType === "hp") return `+${pct}% HP`;
  if (skin.miniBonusType === "cooldown") return `-${pct}% cooldown`;
  if (skin.miniBonusType === "crit") return `+${pct}% crit`;
  if (skin.miniBonusType === "coins") return `+${pct}% coins`;
  return `+${pct}% damage`;
}
