/** Live XZ world positions for each enemy, updated every frame by EnemyItem */
export const poisonCurrentPos: Record<string, [number, number]> = {};

/** Per-enemy timestamp of last time it dealt contact damage to the player */
export const enemyContactTimers: Record<string, number> = {};

/** Per-ghost timestamp of last projectile fired */
export const enemyFireTimers: Record<string, number> = {};

/** Per-creeper: 0 = idle, >0 = timestamp when countdown started */
export const creeperCountdownStart: Record<string, number> = {};
