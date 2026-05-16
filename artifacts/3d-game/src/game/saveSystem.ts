import type { GameRecords, GameState, PerkId, PlayerStats, QualityLevel, ShopUpgradeId, WeaponId } from "./types";

const SAVE_KEY = "toxic-harvest-save-v2";
const RECORD_KEY = "toxic-harvest-records-v2";

export interface SaveData {
  savedAt: number;
  score: number;
  health: number;
  maxHealth: number;
  stage: number;
  killsThisStage: number;
  spawnedThisStage: number;
  playerLevel: number;
  xp: number;
  xpToNext: number;
  statPoints: number;
  coins: number;
  coinsCollected: number;
  totalKills: number;
  gameTime: number;
  stats: PlayerStats;
  perks: Partial<Record<PerkId, number>>;
  shopUpgrades?: Partial<Record<ShopUpgradeId, number>>;
  ownedWeapons: WeaponId[];
  currentWeapon: WeaponId;
  quality: QualityLevel;
}

export const emptyRecords = (): GameRecords => ({
  bestScore: 0,
  highestStage: 1,
  highestPlayerLevel: 1,
  mostKills: 0,
  mostCoins: 0,
  longestTime: 0,
});

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadRecords(): GameRecords {
  if (typeof window === "undefined") return emptyRecords();
  return { ...emptyRecords(), ...safeParse<Partial<GameRecords>>(window.localStorage.getItem(RECORD_KEY)) };
}

export function saveRecords(records: GameRecords) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECORD_KEY, JSON.stringify(records));
}

export function updateRecordsFromState(state: Pick<GameState,
  "score" | "stage" | "playerLevel" | "totalKills" | "coinsCollected" | "gameTime"
>) {
  const records = loadRecords();
  const next: GameRecords = {
    bestScore: Math.max(records.bestScore, state.score),
    highestStage: Math.max(records.highestStage, state.stage),
    highestPlayerLevel: Math.max(records.highestPlayerLevel, state.playerLevel),
    mostKills: Math.max(records.mostKills, state.totalKills),
    mostCoins: Math.max(records.mostCoins, state.coinsCollected),
    longestTime: Math.max(records.longestTime, state.gameTime),
  };
  saveRecords(next);
  return next;
}

export function toSaveData(state: GameState): SaveData {
  return {
    savedAt: Date.now(),
    score: state.score,
    health: state.health,
    maxHealth: state.maxHealth,
    stage: state.stage,
    killsThisStage: state.killsThisStage,
    spawnedThisStage: state.spawnedThisStage,
    playerLevel: state.playerLevel,
    xp: state.xp,
    xpToNext: state.xpToNext,
    statPoints: state.statPoints,
    coins: state.coins,
    coinsCollected: state.coinsCollected,
    totalKills: state.totalKills,
    gameTime: state.gameTime,
    stats: state.stats,
    perks: state.perks,
    shopUpgrades: state.shopUpgrades,
    ownedWeapons: state.ownedWeapons,
    currentWeapon: state.currentWeapon,
    quality: state.quality,
  };
}

export function saveGameState(state: GameState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(toSaveData(state)));
  updateRecordsFromState(state);
}

export function loadSavedGame(): SaveData | null {
  if (typeof window === "undefined") return null;
  return safeParse<SaveData>(window.localStorage.getItem(SAVE_KEY));
}

export function hasSavedGame() {
  return loadSavedGame() !== null;
}
