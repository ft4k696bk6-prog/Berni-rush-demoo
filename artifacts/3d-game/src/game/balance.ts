import type { EnemySubType, QualityLevel } from "./types";

export const ARENA_BOUND = 74;
export const SAFE_SPAWN_RADIUS = 21;
export const PLAYER_RADIUS = 0.8;

export function getStageKillTarget(stage: number) {
  return 10 + Math.max(0, stage - 1) * 5;
}

export function getStageWaveCount(stage: number) {
  if (stage % 5 === 0) return 3;
  return stage >= 4 ? 2 : 1;
}

export function getWaveIndex(stage: number, spawnedOrKilled: number) {
  const waves = getStageWaveCount(stage);
  const target = getStageKillTarget(stage);
  return Math.min(waves, Math.max(1, Math.floor((spawnedOrKilled / target) * waves) + 1));
}

export function getEnemyBudget(stage: number, quality: QualityLevel) {
  const qualityCap = quality === "low" ? 13 : quality === "medium" ? 18 : 24;
  return Math.min(qualityCap, 5 + Math.floor(stage * 1.45));
}

export function getSpawnInterval(stage: number, quality: QualityLevel) {
  const qualitySlowdown = quality === "low" ? 95 : quality === "medium" ? 35 : 0;
  return Math.max(360 + qualitySlowdown, 1060 - stage * 62);
}

export function getXpRequirement(level: number) {
  return Math.floor(80 + level * 42 + Math.pow(level, 1.45) * 18);
}

export function getStageReward(stage: number) {
  const bossBonus = stage % 5 === 0;
  return {
    xp: 45 + stage * 18 + (bossBonus ? 80 : 0),
    coins: 8 + stage * 3 + (bossBonus ? 24 : 0),
    statPoints: bossBonus ? 2 : 1,
  };
}

export function getEnemyLevelScale(stage: number) {
  return {
    hp: 1 + (stage - 1) * 0.16,
    damage: 1 + (stage - 1) * 0.075,
    speed: Math.min(1.62, 1 + (stage - 1) * 0.024),
    reward: 1 + (stage - 1) * 0.08,
  };
}

export function pickEnemyType(stage: number, wave: number, forceBoss = false): EnemySubType {
  if (forceBoss) return "boss_dragon";

  const roll = Math.random();
  const eliteChance = Math.min(0.16, 0.03 + stage * 0.01);
  if (stage >= 4 && roll < eliteChance) return Math.random() < 0.55 ? "tank_enemy" : "ranged_enemy";

  if (stage <= 2) return Math.random() < 0.74 ? "basic_melee" : "ranged_enemy";
  if (wave === 1) return roll < 0.4 ? "basic_melee" : roll < 0.66 ? "ranged_enemy" : "fast_melee";
  if (wave === 2) return roll < 0.26 ? "basic_melee" : roll < 0.48 ? "ranged_enemy" : roll < 0.72 ? "fast_melee" : "tank_enemy";
  return roll < 0.22 ? "basic_melee" : roll < 0.42 ? "ranged_enemy" : roll < 0.62 ? "fast_melee" : roll < 0.82 ? "tank_enemy" : "exploder_enemy";
}

export function clampToArena(value: number, margin = 1) {
  return Math.max(-ARENA_BOUND + margin, Math.min(ARENA_BOUND - margin, value));
}
