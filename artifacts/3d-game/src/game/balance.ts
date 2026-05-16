import type { EnemySubType, QualityLevel } from "./types";

export const ARENA_BOUND = 42;
export const SAFE_SPAWN_RADIUS = 15;
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
  const qualitySlowdown = quality === "low" ? 130 : quality === "medium" ? 50 : 0;
  return Math.max(460 + qualitySlowdown, 1280 - stage * 52);
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
    speed: Math.min(1.45, 1 + (stage - 1) * 0.018),
    reward: 1 + (stage - 1) * 0.08,
  };
}

export function pickEnemyType(stage: number, wave: number, forceBoss = false): EnemySubType {
  if (forceBoss) return stage >= 15 ? "boss20" : "boss10";

  const roll = Math.random();
  const eliteChance = Math.min(0.16, 0.03 + stage * 0.01);
  if (stage >= 4 && roll < eliteChance) return "elite";

  if (stage <= 2) return Math.random() < 0.72 ? "grunt" : "shooter";
  if (wave === 1) return roll < 0.44 ? "grunt" : roll < 0.72 ? "shooter" : "charger";
  if (wave === 2) return roll < 0.28 ? "grunt" : roll < 0.52 ? "shooter" : roll < 0.78 ? "charger" : "brute";
  return roll < 0.22 ? "grunt" : roll < 0.44 ? "shooter" : roll < 0.7 ? "charger" : roll < 0.9 ? "brute" : "creeper";
}

export function clampToArena(value: number, margin = 1) {
  return Math.max(-ARENA_BOUND + margin, Math.min(ARENA_BOUND - margin, value));
}
