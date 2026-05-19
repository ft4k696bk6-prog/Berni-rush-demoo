export type GamePhase = "menu" | "playing" | "paused" | "upgrade" | "gameover";
export type QualityLevel = "low" | "medium" | "high";
export type CameraViewMode = "third_person" | "first_person";

export interface MobileControlSettings {
  lookSensitivity: number;
  lookDeadzone: number;
  leftHanded: boolean;
}

export type ClassId = "knight" | "ranger" | "mage" | "assassin" | "tank" | "miner";
export type ClassAttackType = "melee_arc" | "rapid_projectile" | "magic_orb" | "dash_strike" | "heavy_cone" | "pickaxe_throw";
export type VfxTheme = "knight" | "ranger" | "mage" | "assassin" | "tank" | "miner";
export type SkinId =
  | "knight_male"
  | "blue_soldier"
  | "casual_runner"
  | "ninja_shadow"
  | "wizard_arcane"
  | "worker_miner"
  | "pirate_rogue"
  | "viking_brute"
  | "soldier_scout"
  | "witch_mystic"
  | "golden_knight"
  | "suit_agent";
export type SkinRarity = "starter" | "common" | "rare" | "epic" | "legendary";
export type SkinMiniBonusType = "move_speed" | "hp" | "cooldown" | "crit" | "coins" | "damage";

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
  | "basic_melee"
  | "fast_melee"
  | "tank_enemy"
  | "ranged_enemy"
  | "exploder_enemy"
  | "boss_dragon"
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
export type EnemyMechanic = "shoot" | "melee" | "explode" | "charge" | "slam" | "shockwave";

export interface ClassDefinition {
  id: ClassId;
  displayName: string;
  description: string;
  icon: string;
  baseHpMultiplier: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  cooldownMultiplier: number;
  critChanceBonus: number;
  armorBonus: number;
  coinMultiplier: number;
  moveSpeedMultiplier: number;
  attackType: ClassAttackType;
  vfxTheme: VfxTheme;
  color: string;
  preferredRange: "close" | "ranged" | "hybrid";
}

export interface SkinDefinition {
  id: SkinId;
  displayName: string;
  prefab: string;
  icon: string;
  rarity: SkinRarity;
  unlockCost: number;
  defaultUnlocked: boolean;
  miniBonusType: SkinMiniBonusType;
  miniBonusValue: number;
  compatibleClasses: ClassId[];
  previewOffset: [number, number, number];
  previewScale: number;
  animationProfile: "humanoid";
}

export interface PlayerLoadout {
  selectedClassId: ClassId;
  selectedSkinId: SkinId;
}

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
  assetPath?: string;
  modelScale?: number;
  modelYOffset?: number;
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
  attackStyle?: ClassAttackType;
  splashRadius?: number;
  critical?: boolean;
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
  comboStep?: number;
  color?: string;
  hits?: number;
  theme?: VfxTheme;
}

export type ImpactKind = "hit" | "crit" | "magic" | "heavy" | "death" | "coin";

export interface ImpactBurst {
  id: string;
  position: [number, number, number];
  color: string;
  theme: VfxTheme;
  kind: ImpactKind;
  createdAt: number;
  duration: number;
  power: number;
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
  mostBossesDefeated: number;
}

export interface GameState {
  runId: number;
  phase: GamePhase;
  score: number;
  walletCoins: number;
  health: number;
  maxHealth: number;
  stage: number;
  wave: number;
  wavesTotal: number;
  killsThisStage: number;
  killsRequired: number;
  spawnedThisStage: number;
  totalKills: number;
  bossesDefeated: number;
  totalBossesDefeated: number;
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
  impactBursts: ImpactBurst[];
  coinItems: CoinItem[];
  floatingTexts: FloatingText[];
  centerMessage: CenterMessage | null;
  playerPos: [number, number];
  playerAngle: number;
  aimWorld: [number, number];
  ownedWeapons: WeaponId[];
  currentWeapon: WeaponId;
  selectedClassId: ClassId;
  selectedSkinId: SkinId;
  unlockedSkinIds: SkinId[];
  perks: Partial<Record<PerkId, number>>;
  shopUpgrades: Partial<Record<ShopUpgradeId, number>>;
  skillStatus: Record<SkillId, SkillStatus>;
  perkChoices: PerkId[];
  pendingLevelUps: number;
  records: GameRecords;
  quality: QualityLevel;
  cameraViewMode: CameraViewMode;
  mobileLookSensitivity: number;
  mobileLookDeadzone: number;
  mobileLeftHanded: boolean;
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
  speed:        { color: "#00eeff", label: "SPEED CORE",     description: "Movement burst",          duration: 8  },
  heal:         { color: "#ff88aa", label: "HEAL CORE",      description: "Restores 40 health",      duration: 0  },
  invincibility:{ color: "#ffdd00", label: "AURORA CORE",    description: "Short invulnerability",   duration: 6  },
  strength:     { color: "#ff6600", label: "POWER CORE",     description: "Heavy damage on touch",   duration: 10 },
  flight:       { color: "#dd88ff", label: "WIND CORE",      description: "Light movement lift",     duration: 7  },
  time_slow:    { color: "#44ff88", label: "TIME CORE",      description: "Slows all enemies",       duration: 9  },
  triple_shot:  { color: "#ff4488", label: "TRIPLE CORE",    description: "More projectiles",        duration: 12 },
  melee_360:    { color: "#ff8800", label: "BERSERK CORE",   description: "Wide melee attack",       duration: 8  },
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
  assetPath?: string;
  modelScale?: number;
  modelYOffset?: number;
  modelYawOffset?: number;
}> = {
  basic_melee:   { label: "Bone Grunt",    baseHp: 3.4, speed: 3.35, damage: 14, mechanics: ["melee"],            xp: 15,  coinValue: 3,  scale: 1.02, color: "#e5e2cf", assetPath: "/assets/enemies/Skeleton.fbx", modelScale: 0.010, modelYOffset: -1.1 },
  fast_melee:    { label: "Tunnel Rat",    baseHp: 2.6, speed: 4.95, damage: 11, mechanics: ["melee"],            xp: 16,  coinValue: 3,  scale: 0.78, color: "#d6a06b", assetPath: "/assets/enemies/Rat.fbx", modelScale: 0.012, modelYOffset: -1.1 },
  tank_enemy:    { label: "Stone Slime",    baseHp: 9.8, speed: 2.05, damage: 24, mechanics: ["slam", "melee"],   xp: 36,  coinValue: 8,  scale: 1.52, color: "#7dc96e", assetPath: "/assets/enemies/Slime.fbx", modelScale: 0.013, modelYOffset: -1.1 },
  ranged_enemy:  { label: "Venom Wasp",     baseHp: 3.2, speed: 3.05, damage: 13, mechanics: ["shoot"],            xp: 22,  coinValue: 5,  scale: 1.0,  color: "#ffd45d", assetPath: "/assets/enemies/Wasp.fbx", modelScale: 0.010, modelYOffset: -1.0 },
  exploder_enemy:{ label: "Angry Serpent",  baseHp: 4.0, speed: 4.25, damage: 28, mechanics: ["charge", "explode"], xp: 24,  coinValue: 6,  scale: 1.05, color: "#ff6b4c", assetPath: "/assets/enemies/Snake_angry.fbx", modelScale: 0.012, modelYOffset: -1.1 },
  boss_dragon:   { label: "Harvest Dragon", baseHp: 84,  speed: 2.65, damage: 30, mechanics: ["shoot", "melee", "shockwave"], xp: 260, coinValue: 55, scale: 2.9, color: "#ff7048", assetPath: "/assets/enemies/Dragon.fbx", modelScale: 0.018, modelYOffset: -1.8 },
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
