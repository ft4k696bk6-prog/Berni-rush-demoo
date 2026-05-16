export type GamePhase = "menu" | "playing" | "paused" | "upgrade" | "gameover";
export type QualityLevel = "low" | "medium" | "high";

export type StatKey = "strength" | "superpower" | "vitality" | "luck" | "dodge" | "speed";
export type WeaponId = "blaster" | "rapid" | "shotgun" | "laser" | "nova" | "arcane";
export type PerkId =
  | "front_arrow"
  | "multishot"
  | "side_arrows"
  | "ricochet"
  | "piercing"
  | "rapid_fire"
  | "fire_arrows"
  | "strong_heart"
  | "swift_boots"
  | "lucky_coin"
  | "nimble";

export type SkillId = "dash" | "power_slash" | "energy_shot";
export type ShopUpgradeId =
  | "melee_damage"
  | "attack_range"
  | "attack_cooldown"
  | "max_health"
  | "move_speed"
  | "dash_mastery"
  | "super_charge"
  | "pickup_range"
  | "heal_now"
  | "random_perk";

export type PowerupType =
  | "speed" | "heal" | "invincibility" | "strength"
  | "flight" | "time_slow" | "triple_shot" | "melee_360";

export type DrugType = PowerupType;

export type EnemySubType =
  | "grunt"
  | "charger"
  | "shooter"
  | "brute"
  | "ghost"
  | "zombie"
  | "creeper"
  | "elite"
  | "boss10"
  | "boss20";
export type PoisonType = EnemySubType;
export type EnemyMechanic = "shoot" | "melee" | "explode" | "charge" | "slam";

export interface PlayerStats {
  strength: number;
  superpower: number;
  vitality: number;
  luck: number;
  dodge: number;
  speed: number;
}

export interface DrugItem {
  id: string;
  position: [number, number, number];
  type: DrugType;
  collected: boolean;
}

export interface PoisonItem {
  id: string;
  position: [number, number, number];
  type: EnemySubType;
  collected: boolean;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  xp: number;
  coinValue: number;
  mechanics: EnemyMechanic[];
  scale: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  direction: [number, number];
  speed: number;
  damage: number;
  radius: number;
  range: number;
  distance: number;
  age: number;
  pierce: number;
  bounces: number;
  color: string;
  weaponId: WeaponId;
}

export interface EnemyProjectile {
  id: string;
  position: [number, number, number];
  direction: [number, number];
  speed: number;
  age: number;
  damage: number;
}

export interface CoinItem {
  id: string;
  position: [number, number, number];
  value: number;
}

export interface MeleeSwing {
  id: string;
  startedAt: number;
  playerPos: [number, number];
  angle: number;
  is360: boolean;
  color?: string;
  hits?: number;
}

export interface SkillStatus {
  id: SkillId;
  label: string;
  readyAt: number;
  cooldownMs: number;
  active: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  position: [number, number, number];
  color: string;
  createdAt: number;
  duration: number;
}

export interface CenterMessage {
  id: string;
  title: string;
  subtitle?: string;
  createdAt: number;
  duration: number;
  tone: "level" | "reward" | "danger" | "save";
}

export interface ActiveEffect {
  type: DrugType;
  expiresAt: number;
}

export interface GameRecords {
  bestScore: number;
  highestStage: number;
  highestPlayerLevel: number;
  mostKills: number;
  mostCoins: number;
  longestTime: number;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  health: number;
  maxHealth: number;
  stage: number;
  wave: number;
  wavesTotal: number;
  killsThisStage: number;
  killsRequired: number;
  spawnedThisStage: number;
  totalKills: number;
  playerLevel: number;
  xp: number;
  xpToNext: number;
  statPoints: number;
  coins: number;
  coinsCollected: number;
  gameTime: number;
  stats: PlayerStats;
  activeEffects: ActiveEffect[];
  drugs: DrugItem[];
  poisons: PoisonItem[];
  projectiles: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  meleeSwings: MeleeSwing[];
  coinItems: CoinItem[];
  floatingTexts: FloatingText[];
  centerMessage: CenterMessage | null;
  playerPos: [number, number];
  playerAngle: number;
  aimWorld: [number, number];
  ownedWeapons: WeaponId[];
  currentWeapon: WeaponId;
  perks: Partial<Record<PerkId, number>>;
  shopUpgrades: Partial<Record<ShopUpgradeId, number>>;
  skillStatus: Record<SkillId, SkillStatus>;
  perkChoices: PerkId[];
  pendingLevelUps: number;
  records: GameRecords;
  quality: QualityLevel;
}

export const STAT_LABELS: Record<StatKey, { label: string; description: string }> = {
  strength: { label: "Sila", description: "Wieksze obrazenia kazdej broni" },
  superpower: { label: "Supermoce", description: "Mocniejsze efekty specjalne" },
  vitality: { label: "Zycie", description: "Wiecej maksymalnego HP" },
  luck: { label: "Szczescie", description: "Lepsze dropy monet i bonusow" },
  dodge: { label: "Unik", description: "Szansa na chybienie ataku wroga" },
  speed: { label: "Szybkosc", description: "Szybszy ruch i krotszy dash" },
};

export const DRUG_CONFIG: Record<DrugType, { color: string; label: string; description: string; duration: number }> = {
  speed:        { color: "#00eeff", label: "SPEED SHROOM",   description: "Movement burst",          duration: 8  },
  heal:         { color: "#ff88aa", label: "1-UP SHROOM",    description: "Restores 40 health",      duration: 0  },
  invincibility:{ color: "#ffdd00", label: "STAR SHROOM",    description: "Short invulnerability",   duration: 6  },
  strength:     { color: "#ff6600", label: "POWER SHROOM",   description: "Heavy damage on touch",   duration: 10 },
  flight:       { color: "#dd88ff", label: "CLOUD SHROOM",   description: "Light movement lift",     duration: 7  },
  time_slow:    { color: "#44ff88", label: "TIME SHROOM",    description: "Slows all enemies",       duration: 9  },
  triple_shot:  { color: "#ff4488", label: "TRIPLE SHROOM",  description: "More projectiles",        duration: 12 },
  melee_360:    { color: "#ff8800", label: "BERSERK SHROOM", description: "Wide melee attack",       duration: 8  },
};

export const ENEMY_CONFIG: Record<EnemySubType, {
  label: string;
  baseHp: number;
  speed: number;
  damage: number;
  xp: number;
  coinValue: number;
  mechanics: EnemyMechanic[];
  scale: number;
  color: string;
}> = {
  grunt:  { label: "Basic Grunt", baseHp: 3.2,  speed: 3.45, damage: 14, mechanics: ["melee"],                 xp: 14,  coinValue: 3,  scale: 0.98, color: "#4bd46a" },
  charger:{ label: "Charger",     baseHp: 4.2,  speed: 3.05, damage: 22, mechanics: ["charge"],                xp: 23,  coinValue: 5,  scale: 1.08, color: "#ff9d4d" },
  shooter:{ label: "Spore Shooter", baseHp: 3.0, speed: 2.9, damage: 13, mechanics: ["shoot"],                 xp: 20,  coinValue: 5,  scale: 1.0,  color: "#8bb7ff" },
  brute:  { label: "Heavy Brute", baseHp: 9.2,  speed: 2.15, damage: 30, mechanics: ["slam", "melee"],         xp: 38,  coinValue: 8,  scale: 1.42, color: "#d86bff" },
  ghost:  { label: "Crystal Bat", baseHp: 2.2,  speed: 5.1, damage: 12, mechanics: ["shoot"],                  xp: 16,  coinValue: 3,  scale: 1.0, color: "#8bb7ff" },
  zombie: { label: "Moss Slime",  baseHp: 4.4,  speed: 2.8, damage: 17, mechanics: ["melee"],                  xp: 18,  coinValue: 4,  scale: 1.15, color: "#4bd46a" },
  creeper:{ label: "Bomb Beetle", baseHp: 3.2,  speed: 4.1, damage: 28, mechanics: ["explode"],                xp: 22,  coinValue: 5,  scale: 1.05, color: "#f6d24a" },
  elite:  { label: "Rune Mage",   baseHp: 7.2,  speed: 3.6, damage: 24, mechanics: ["shoot", "melee"],         xp: 42,  coinValue: 9,  scale: 1.35, color: "#ff4f86" },
  boss10: { label: "Gatekeeper",  baseHp: 34,   speed: 3.0, damage: 26, mechanics: ["shoot", "melee"],         xp: 140, coinValue: 28, scale: 2.25, color: "#ff8f3d" },
  boss20: { label: "Void Warden", baseHp: 58,   speed: 3.35, damage: 34, mechanics: ["shoot","melee","explode"], xp: 240, coinValue: 44, scale: 2.75, color: "#b06cff" },
};

export const POISON_CONFIG = ENEMY_CONFIG as unknown as Record<PoisonType, { label: string; damage: number; hp: number; color: string }>;
