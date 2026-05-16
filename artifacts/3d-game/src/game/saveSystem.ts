import { DEFAULT_CLASS_ID, DEFAULT_SKIN_ID, getStarterUnlockedSkins, normalizeLoadout } from "./loadout";
import type { ClassId, GameRecords, GameState, PerkId, PlayerStats, QualityLevel, ShopUpgradeId, SkinId, WeaponId } from "./types";

const SAVE_KEY = "berni-rush-save-v1";
const RECORD_KEY = "berni-rush-records-v1";
const PROFILE_KEY = "berni-rush-profile-v1";
const LEGACY_SAVE_KEY = "toxic-harvest-save-v2";
const LEGACY_RECORD_KEY = "toxic-harvest-records-v2";
const LEGACY_PROFILE_KEY = "toxic-harvest-profile-v1";

export interface ProfileData {
  selectedClassId: ClassId;
  selectedSkinId: SkinId;
  unlockedSkinIds: SkinId[];
  totalCoins: number;
  bestScore: number;
  highestWave: number;
  bossesDefeated: number;
  settings: {
    quality: QualityLevel;
  };
}

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
  selectedClassId?: ClassId;
  selectedSkinId?: SkinId;
  bossesDefeated?: number;
  quality: QualityLevel;
}

export const emptyRecords = (): GameRecords => ({
  bestScore: 0,
  highestStage: 1,
  highestPlayerLevel: 1,
  mostKills: 0,
  mostCoins: 0,
  longestTime: 0,
  mostBossesDefeated: 0,
});

export const defaultProfile = (): ProfileData => ({
  selectedClassId: DEFAULT_CLASS_ID,
  selectedSkinId: DEFAULT_SKIN_ID,
  unlockedSkinIds: getStarterUnlockedSkins(),
  totalCoins: 0,
  bestScore: 0,
  highestWave: 1,
  bossesDefeated: 0,
  settings: {
    quality: "medium",
  },
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
  return {
    ...emptyRecords(),
    ...safeParse<Partial<GameRecords>>(window.localStorage.getItem(LEGACY_RECORD_KEY)),
    ...safeParse<Partial<GameRecords>>(window.localStorage.getItem(RECORD_KEY)),
  };
}

export function saveRecords(records: GameRecords) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECORD_KEY, JSON.stringify(records));
}

export function loadProfile(): ProfileData {
  const base = defaultProfile();
  if (typeof window === "undefined") return base;
  const saved = {
    ...(safeParse<Partial<ProfileData>>(window.localStorage.getItem(LEGACY_PROFILE_KEY)) ?? {}),
    ...(safeParse<Partial<ProfileData>>(window.localStorage.getItem(PROFILE_KEY)) ?? {}),
  };
  const unlockedSkinIds = Array.from(new Set([...(saved.unlockedSkinIds ?? []), ...getStarterUnlockedSkins()])) as SkinId[];
  const loadout = normalizeLoadout({
    selectedClassId: saved.selectedClassId ?? base.selectedClassId,
    selectedSkinId: saved.selectedSkinId ?? base.selectedSkinId,
  }, unlockedSkinIds);

  return {
    ...base,
    ...saved,
    ...loadout,
    unlockedSkinIds,
    totalCoins: Math.max(0, Math.floor(saved.totalCoins ?? base.totalCoins)),
    bestScore: Math.max(0, saved.bestScore ?? base.bestScore),
    highestWave: Math.max(1, saved.highestWave ?? base.highestWave),
    bossesDefeated: Math.max(0, saved.bossesDefeated ?? base.bossesDefeated),
    settings: {
      ...base.settings,
      ...(saved.settings ?? {}),
    },
  };
}

export function saveProfile(profile: ProfileData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function updateProfile(patch: Partial<ProfileData> | ((profile: ProfileData) => ProfileData)) {
  const current = loadProfile();
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  const normalized = normalizeLoadout(next, Array.from(new Set([...next.unlockedSkinIds, ...getStarterUnlockedSkins()])) as SkinId[]);
  const profile: ProfileData = {
    ...next,
    ...normalized,
    unlockedSkinIds: Array.from(new Set([...next.unlockedSkinIds, ...getStarterUnlockedSkins()])) as SkinId[],
    totalCoins: Math.max(0, Math.floor(next.totalCoins)),
    highestWave: Math.max(1, next.highestWave),
    bossesDefeated: Math.max(0, next.bossesDefeated),
    settings: {
      quality: next.settings?.quality ?? "medium",
    },
  };
  saveProfile(profile);
  return profile;
}

export function updateRecordsFromState(state: Pick<GameState,
  "score" | "stage" | "playerLevel" | "totalKills" | "coinsCollected" | "gameTime" | "bossesDefeated"
>) {
  const records = loadRecords();
  const next: GameRecords = {
    bestScore: Math.max(records.bestScore, state.score),
    highestStage: Math.max(records.highestStage, state.stage),
    highestPlayerLevel: Math.max(records.highestPlayerLevel, state.playerLevel),
    mostKills: Math.max(records.mostKills, state.totalKills),
    mostCoins: Math.max(records.mostCoins, state.coinsCollected),
    longestTime: Math.max(records.longestTime, state.gameTime),
    mostBossesDefeated: Math.max(records.mostBossesDefeated, state.bossesDefeated),
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
    selectedClassId: state.selectedClassId,
    selectedSkinId: state.selectedSkinId,
    bossesDefeated: state.bossesDefeated,
    quality: state.quality,
  };
}

export function saveGameState(state: GameState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(toSaveData(state)));
  updateRecordsFromState(state);
  updateProfile(profile => ({
    ...profile,
    selectedClassId: state.selectedClassId,
    selectedSkinId: state.selectedSkinId,
    bestScore: Math.max(profile.bestScore, state.score),
    highestWave: Math.max(profile.highestWave, state.stage),
    settings: { quality: state.quality },
  }));
}

export function loadSavedGame(): SaveData | null {
  if (typeof window === "undefined") return null;
  return safeParse<SaveData>(window.localStorage.getItem(SAVE_KEY))
    ?? safeParse<SaveData>(window.localStorage.getItem(LEGACY_SAVE_KEY));
}

export function hasSavedGame() {
  return loadSavedGame() !== null;
}
