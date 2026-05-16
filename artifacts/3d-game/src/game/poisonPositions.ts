/** Live XZ world positions for each enemy, updated every frame by EnemyItem */
export const poisonCurrentPos: Record<string, [number, number]> = {};

/** Per-enemy timestamp of last time it dealt contact damage to the player */
export const enemyContactTimers: Record<string, number> = {};

/** Per-ghost timestamp of last projectile fired */
export const enemyFireTimers: Record<string, number> = {};

/** Per-creeper: 0 = idle, >0 = timestamp when countdown started */
export const creeperCountdownStart: Record<string, number> = {};

export function clearEnemyRuntime(id: string) {
  delete poisonCurrentPos[id];
  delete enemyContactTimers[id];
  delete enemyContactTimers[`${id}:slam`];
  delete enemyFireTimers[id];
  delete creeperCountdownStart[id];
}

export function clearAllEnemyRuntime() {
  for (const key of Object.keys(poisonCurrentPos)) delete poisonCurrentPos[key];
  for (const key of Object.keys(enemyContactTimers)) delete enemyContactTimers[key];
  for (const key of Object.keys(enemyFireTimers)) delete enemyFireTimers[key];
  for (const key of Object.keys(creeperCountdownStart)) delete creeperCountdownStart[key];
}
