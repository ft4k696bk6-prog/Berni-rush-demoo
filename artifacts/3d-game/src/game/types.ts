export type PowerupType =
  | "speed" | "heal" | "invincibility" | "strength"
  | "flight" | "time_slow" | "triple_shot" | "melee_360";

export type DrugType = PowerupType; // alias kept for store compat

export type EnemySubType = "ghost" | "zombie" | "creeper" | "boss10" | "boss20";
export type PoisonType = EnemySubType; // alias kept for store compat
export type EnemyMechanic = "shoot" | "melee" | "explode";

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
  mechanics: EnemyMechanic[];
  scale: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  direction: [number, number];
  speed: number;
  age: number;
}

export interface EnemyProjectile {
  id: string;
  position: [number, number, number];
  direction: [number, number];
  speed: number;
  age: number;
  damage: number;
}

export interface MeleeSwing {
  id: string;
  startedAt: number;
  playerPos: [number, number];
  angle: number;
  is360: boolean;
}

export interface ActiveEffect {
  type: DrugType;
  expiresAt: number;
}

export interface GameState {
  phase: "menu" | "playing" | "gameover";
  score: number;
  health: number;
  maxHealth: number;
  wave: number;
  activeEffects: ActiveEffect[];
  drugs: DrugItem[];
  poisons: PoisonItem[];
  projectiles: Projectile[];
  enemyProjectiles: EnemyProjectile[];
  meleeSwings: MeleeSwing[];
  playerPos: [number, number];
  playerAngle: number;
}

export const DRUG_CONFIG: Record<DrugType, { color: string; label: string; description: string; duration: number }> = {
  speed:        { color: "#00eeff", label: "SPEED SHROOM",   description: "3× Movement Speed",      duration: 8  },
  heal:         { color: "#ff88aa", label: "1-UP SHROOM",    description: "Restores 40 Health",      duration: 0  },
  invincibility:{ color: "#ffdd00", label: "STAR SHROOM",    description: "Cannot Take Damage",      duration: 6  },
  strength:     { color: "#ff6600", label: "POWER SHROOM",   description: "Destroy Enemies on Touch",duration: 10 },
  flight:       { color: "#dd88ff", label: "CLOUD SHROOM",   description: "Hover Above Ground",      duration: 7  },
  time_slow:    { color: "#44ff88", label: "TIME SHROOM",    description: "Slows All Enemies",       duration: 9  },
  triple_shot:  { color: "#ff4488", label: "TRIPLE SHROOM",  description: "3 Bullets per Shot",      duration: 12 },
  melee_360:    { color: "#ff8800", label: "BERSERK SHROOM", description: "360° Melee Attack",       duration: 8  },
};

export const ENEMY_CONFIG: Record<EnemySubType, {
  label: string; baseHp: number; speed: number;
  damage: number; mechanics: EnemyMechanic[]; scale: number;
}> = {
  ghost:  { label: "Ghost",     baseHp: 2,  speed: 5.0, damage: 15, mechanics: ["shoot"],                        scale: 1.0 },
  zombie: { label: "Zombie",    baseHp: 4,  speed: 2.6, damage: 20, mechanics: ["melee"],                        scale: 1.2 },
  creeper:{ label: "Creeper",   baseHp: 3,  speed: 4.0, damage: 35, mechanics: ["explode"],                      scale: 1.1 },
  boss10: { label: "BOSS",      baseHp: 20, speed: 3.0, damage: 25, mechanics: ["shoot", "melee"],               scale: 2.4 },
  boss20: { label: "DARK LORD", baseHp: 40, speed: 3.5, damage: 35, mechanics: ["shoot","melee","explode"],      scale: 3.0 },
};

// Keep for backward compat
export const POISON_CONFIG = ENEMY_CONFIG as unknown as Record<PoisonType, { label: string; damage: number; hp: number; color: string }>;
