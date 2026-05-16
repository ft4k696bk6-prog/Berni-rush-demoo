import { create } from "zustand";
import {
  ActiveEffect,
  CenterMessage,
  CoinItem,
  ClassId,
  DRUG_CONFIG,
  DrugItem,
  DrugType,
  ENEMY_CONFIG,
  EnemyProjectile,
  EnemySubType,
  FloatingText,
  GamePhase,
  GameRecords,
  GameState,
  ImpactBurst,
  MeleeSwing,
  PerkId,
  PlayerStats,
  PoisonItem,
  Projectile,
  QualityLevel,
  ShopUpgradeId,
  SkinId,
  SkillId,
  StatKey,
  WeaponId,
  VfxTheme,
} from "./types";
import {
  firstCompatibleSkin,
  getClassDefinition,
  getLoadoutModifiers,
  getSkinDefinition,
  normalizeLoadout,
  skinFitsClass,
} from "./loadout";
import {
  ARENA_BOUND,
  clampToArena,
  getEnemyBudget,
  getEnemyLevelScale,
  getSpawnInterval,
  getStageKillTarget,
  getStageReward,
  getStageWaveCount,
  getWaveIndex,
  getXpRequirement,
  pickEnemyType,
  SAFE_SPAWN_RADIUS,
} from "./balance";
import { playerRuntime, resetPlayerRuntime } from "./gameRuntime";
import { perkLevel, rollPerkChoices } from "./perks";
import { SHOP_UPGRADES, shopUpgradeCost, shopUpgradeLevel } from "./shop";
import { WEAPON_CONFIG } from "./weapons";
import { clearAllEnemyRuntime, clearEnemyRuntime, poisonCurrentPos } from "./poisonPositions";
import {
  loadProfile,
  loadRecords,
  loadSavedGame as readSavedGame,
  saveGameState,
  updateProfile,
  updateRecordsFromState,
} from "./saveSystem";

const DRUG_TYPES: DrugType[] = [
  "speed", "heal", "invincibility", "strength",
  "flight", "time_slow", "triple_shot", "melee_360",
];

let idc = 0;
const nid = (prefix = "g") => `${prefix}${++idc}`;
const MELEE_DUR = 620;
const START_GRACE_MS = 2600;
const RESUME_GRACE_MS = 1500;
const isBossType = (type: EnemySubType) => type === "boss10" || type === "boss20" || type === "boss_dragon";

const baseStats = (): PlayerStats => ({
  strength: 0,
  superpower: 0,
  vitality: 0,
  luck: 0,
  dodge: 0,
  speed: 0,
});

function baseSkillStatus(): GameState["skillStatus"] {
  return {
    dash: { id: "dash", label: "Dash", readyAt: 0, cooldownMs: 820, active: false },
    power_slash: { id: "power_slash", label: "360", readyAt: 0, cooldownMs: 7600, active: false },
    energy_shot: { id: "energy_shot", label: "Shot", readyAt: 0, cooldownMs: 230, active: false },
  };
}

function centerMessage(title: string, subtitle: string | undefined, tone: CenterMessage["tone"], duration = 2200): CenterMessage {
  return { id: nid("msg"), title, subtitle, createdAt: Date.now(), duration, tone };
}

function floater(text: string, x: number, z: number, color: string, y = 2.2, duration = 850): FloatingText {
  return { id: nid("txt"), text, position: [x, y, z], color, createdAt: Date.now(), duration };
}

function impactBurst(x: number, z: number, color: string, theme: VfxTheme, kind: ImpactBurst["kind"] = "hit", power = 1): ImpactBurst {
  return {
    id: nid("imp"),
    position: [x, 1.08, z],
    color,
    theme,
    kind,
    createdAt: Date.now(),
    duration: kind === "death" ? 620 : kind === "heavy" ? 540 : 420,
    power,
  };
}

function themeFromAttackStyle(style: Projectile["attackStyle"]): VfxTheme {
  if (style === "rapid_projectile") return "ranger";
  if (style === "magic_orb") return "mage";
  if (style === "dash_strike") return "assassin";
  if (style === "heavy_cone") return "tank";
  if (style === "pickaxe_throw") return "miner";
  return "knight";
}

function randomArenaPoint(margin = 5): [number, number, number] {
  const x = (Math.random() * 2 - 1) * (ARENA_BOUND - margin);
  const z = (Math.random() * 2 - 1) * (ARENA_BOUND - margin);
  return [x, 1.05, z];
}

function spawnMushroom(): DrugItem {
  const pos = randomArenaPoint(7);
  return {
    id: nid("drug"),
    position: [pos[0], 1.15, pos[2]],
    type: DRUG_TYPES[Math.floor(Math.random() * DRUG_TYPES.length)],
    collected: false,
  };
}

function spawnPositionAwayFromPlayer(minDistance = SAFE_SPAWN_RADIUS): [number, number, number] {
  for (let i = 0; i < 12; i++) {
    const side = Math.floor(Math.random() * 4);
    const spread = (Math.random() * 2 - 1) * ARENA_BOUND * 0.86;
    const edge = ARENA_BOUND - 2.5 - Math.random() * 3;
    const x = side === 0 ? -edge : side === 1 ? edge : spread;
    const z = side === 2 ? -edge : side === 3 ? edge : spread;
    const dx = x - playerRuntime.x;
    const dz = z - playerRuntime.z;
    if (dx * dx + dz * dz > minDistance * minDistance) {
      return [x, 1.2, z];
    }
  }

  const a = Math.random() * Math.PI * 2;
  return [
    clampToArena(playerRuntime.x + Math.cos(a) * minDistance * 1.35, 2),
    1.2,
    clampToArena(playerRuntime.z + Math.sin(a) * minDistance * 1.35, 2),
  ];
}

function createEnemy(stage: number, type: EnemySubType, position = spawnPositionAwayFromPlayer()): PoisonItem {
  const cfg = ENEMY_CONFIG[type];
  const scale = getEnemyLevelScale(stage);
  const bossScale = isBossType(type) ? 1 + Math.floor(stage / 5) * 0.12 : 1;
  const maxHp = Math.ceil(cfg.baseHp * scale.hp * bossScale);

  return {
    id: nid("enemy"),
    position,
    type,
    collected: false,
    hp: maxHp,
    maxHp,
    damage: Math.round(cfg.damage * scale.damage * bossScale),
    speed: cfg.speed * scale.speed * (isBossType(type) ? 1.06 : 1.12),
    xp: Math.round(cfg.xp * scale.reward),
    coinValue: Math.round(cfg.coinValue * scale.reward),
    mechanics: cfg.mechanics,
    scale: cfg.scale,
    assetPath: cfg.assetPath,
    modelScale: cfg.modelScale,
    modelYOffset: cfg.modelYOffset,
  };
}

function initialEnemies(stage: number, quality: QualityLevel) {
  const stageOneCount = quality === "low" ? 2 : 3;
  const count = Math.min(stage === 1 ? stageOneCount : quality === "low" ? 3 : 4, getStageKillTarget(stage));
  const spawnDistance = stage === 1 ? SAFE_SPAWN_RADIUS + 9 : SAFE_SPAWN_RADIUS;
  return Array.from({ length: count }, (_, index) => {
    const type = pickEnemyType(stage, 1, stage % 5 === 0 && index === count - 1);
    return createEnemy(stage, type, spawnPositionAwayFromPlayer(spawnDistance));
  });
}

function fresh(quality: QualityLevel = "medium", records: GameRecords = loadRecords()): GameState {
  const profile = loadProfile();
  const loadout = normalizeLoadout({
    selectedClassId: profile.selectedClassId,
    selectedSkinId: profile.selectedSkinId,
  }, profile.unlockedSkinIds);
  const modifiers = getLoadoutModifiers(loadout.selectedClassId, loadout.selectedSkinId);
  const maxHealth = Math.round(120 * modifiers.hpMultiplier);

  return {
    phase: "menu",
    score: 0,
    walletCoins: profile.totalCoins,
    health: maxHealth,
    maxHealth,
    stage: 1,
    wave: 1,
    wavesTotal: getStageWaveCount(1),
    killsThisStage: 0,
    killsRequired: getStageKillTarget(1),
    spawnedThisStage: 0,
    totalKills: 0,
    bossesDefeated: 0,
    totalBossesDefeated: profile.bossesDefeated,
    playerLevel: 1,
    xp: 0,
    xpToNext: getXpRequirement(1),
    statPoints: 0,
    coins: 0,
    coinsCollected: 0,
    gameTime: 0,
    stats: baseStats(),
    activeEffects: [],
    drugs: [],
    poisons: [],
    projectiles: [],
    enemyProjectiles: [],
    meleeSwings: [],
    impactBursts: [],
    coinItems: [],
    floatingTexts: [],
    centerMessage: null,
    playerPos: [0, 0],
    playerAngle: Math.PI,
    aimWorld: [0, -8],
    ownedWeapons: ["blaster"],
    currentWeapon: "blaster",
    selectedClassId: loadout.selectedClassId,
    selectedSkinId: loadout.selectedSkinId,
    unlockedSkinIds: profile.unlockedSkinIds,
    perks: {},
    shopUpgrades: {},
    skillStatus: baseSkillStatus(),
    perkChoices: [],
    pendingLevelUps: 0,
    records,
    quality,
    cameraViewMode: "first_person",
  };
}

function addXp(level: number, xp: number, xpToNext: number, amount: number) {
  let nextLevel = level;
  let nextXp = xp + amount;
  let nextNeed = xpToNext;
  let levelUps = 0;

  while (nextXp >= nextNeed) {
    nextXp -= nextNeed;
    nextLevel += 1;
    levelUps += 1;
    nextNeed = getXpRequirement(nextLevel);
  }

  return { playerLevel: nextLevel, xp: nextXp, xpToNext: nextNeed, levelUps };
}

function applyKills(state: GameState, nextPoisons: PoisonItem[], killed: PoisonItem[]) {
  const uniqueKilled = Array.from(new Map(killed.map(enemy => [enemy.id, enemy])).values());
  if (uniqueKilled.length === 0) return { poisons: nextPoisons };

  for (const enemy of uniqueKilled) clearEnemyRuntime(enemy.id);

  const droppedCoins: CoinItem[] = [];
  const newFloaters: FloatingText[] = [];
  const loadoutMods = getLoadoutModifiers(state.selectedClassId, state.selectedSkinId);
  let scoreGain = 0;
  let xpGain = 0;
  let bossKills = 0;

  for (const enemy of uniqueKilled) {
    const live = poisonCurrentPos[enemy.id] ?? [enemy.position[0], enemy.position[2]];
    scoreGain += Math.round(enemy.xp * 7);
    xpGain += enemy.xp;

    const boss = isBossType(enemy.type);
    if (boss) bossKills += 1;
    const coinPerk = perkLevel(state.perks, "lucky_coin");
    const dropChance = boss ? 1 : Math.min(0.95, 0.48 + state.stats.luck * 0.032 + coinPerk * 0.06);
    if (Math.random() < dropChance) {
      const value = Math.max(1, Math.round(enemy.coinValue * loadoutMods.coinMultiplier * (1 + state.stats.luck * 0.055 + coinPerk * 0.18) * (0.85 + Math.random() * 0.35)));
      droppedCoins.push({ id: nid("coin"), position: [live[0], 0.65, live[1]], value });
    }

    newFloaters.push(floater(`+${enemy.xp} XP`, live[0], live[1], "#7dffb2", 2.1, 720));
  }

  let nextStage = state.stage;
  let nextWave = getWaveIndex(state.stage, state.killsThisStage + uniqueKilled.length);
  let nextWavesTotal = state.wavesTotal;
  let nextKillsThisStage = state.killsThisStage + uniqueKilled.length;
  let nextKillsRequired = state.killsRequired;
  let nextSpawnedThisStage = state.spawnedThisStage;
  let nextScore = state.score + scoreGain;
  let nextCoins = state.coins;
  let nextCoinsCollected = state.coinsCollected;
  let nextStatPoints = state.statPoints;
  let nextProjectiles = state.projectiles;
  let nextEnemyProjectiles = state.enemyProjectiles;
  let nextCenterMessage = state.centerMessage;
  let nextPhase: GamePhase = state.phase;
  let nextPerkChoices = state.perkChoices;
  let nextPendingLevelUps = state.pendingLevelUps;
  let gainedLevelUps = 0;

  let xpResult = addXp(state.playerLevel, state.xp, state.xpToNext, xpGain);
  if (xpResult.levelUps > 0) {
    nextStatPoints += xpResult.levelUps;
    gainedLevelUps += xpResult.levelUps;
    nextCenterMessage = centerMessage(
      "LEVEL UP",
      `Choose a new ability - hero level ${xpResult.playerLevel}`,
      "level",
      2600,
    );
  }

  if (nextKillsThisStage >= state.killsRequired) {
    const reward = getStageReward(state.stage);
    xpResult = addXp(xpResult.playerLevel, xpResult.xp, xpResult.xpToNext, reward.xp);
    nextStatPoints += reward.statPoints + xpResult.levelUps;
    gainedLevelUps += xpResult.levelUps;
    const classCoins = Math.round(reward.coins * loadoutMods.coinMultiplier);
    nextCoins += classCoins;
    nextCoinsCollected += classCoins;
    nextScore += reward.xp * 9 + classCoins * 20;
    nextStage = state.stage + 1;
    nextWave = 1;
    nextWavesTotal = getStageWaveCount(nextStage);
    nextKillsThisStage = 0;
    nextKillsRequired = getStageKillTarget(nextStage);
    nextSpawnedThisStage = 0;
    nextPoisons = [];
    nextProjectiles = [];
    nextEnemyProjectiles = [];
    clearAllEnemyRuntime();
    nextCenterMessage = centerMessage(
      "LEVEL COMPLETE",
      `LEVEL ${nextStage} START - +${reward.xp} XP, +${classCoins} coins, +${reward.statPoints} stat point${reward.statPoints > 1 ? "s" : ""}`,
      "reward",
      3100,
    );
  }

  if (gainedLevelUps > 0) {
    nextPhase = "upgrade";
    nextPendingLevelUps += gainedLevelUps;
    nextPerkChoices = rollPerkChoices(state.perks);
  }

  return {
    phase: nextPhase,
    score: nextScore,
    playerLevel: xpResult.playerLevel,
    xp: xpResult.xp,
    xpToNext: xpResult.xpToNext,
    statPoints: nextStatPoints,
    coins: nextCoins,
    coinsCollected: nextCoinsCollected,
    stage: nextStage,
    wave: nextWave,
    wavesTotal: nextWavesTotal,
    killsThisStage: nextKillsThisStage,
    killsRequired: nextKillsRequired,
    spawnedThisStage: nextSpawnedThisStage,
    totalKills: state.totalKills + uniqueKilled.length,
    bossesDefeated: state.bossesDefeated + bossKills,
    poisons: nextPoisons,
    projectiles: nextProjectiles,
    enemyProjectiles: nextEnemyProjectiles,
    coinItems: [...state.coinItems.slice(-45), ...droppedCoins],
    floatingTexts: [...state.floatingTexts.slice(-18), ...newFloaters],
    centerMessage: nextCenterMessage,
    perkChoices: nextPerkChoices,
    pendingLevelUps: nextPendingLevelUps,
  };
}

interface GameStore extends GameState {
  startGame: () => void;
  restartGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  exitToMenu: () => void;
  loadGame: () => void;
  saveGame: () => void;
  collectDrug: (id: string) => void;
  collectCoin: (id: string) => void;
  damageEnemy: (id: string, dmg: number) => void;
  damagePlayer: (amount: number, x?: number, z?: number) => void;
  tickEffects: (now: number) => void;
  tickFloaters: (now: number) => void;
  tickGameClock: (delta: number) => void;
  spawnItems: () => void;
  addScore: (n: number) => void;
  setPlayerSnapshot: (pos: [number, number], angle: number, aim: [number, number]) => void;
  fireWeapon: (ox: number, oz: number, dx: number, dz: number) => void;
  tickProjectiles: (delta: number) => void;
  fireEnemyProjectile: (ex: number, ez: number, px: number, pz: number, damage: number) => void;
  tickEnemyProjectiles: (delta: number, px: number, pz: number) => void;
  addMeleeSwing: (playerPos: [number, number], angle: number, is360: boolean) => void;
  clearOldMelee: (now: number) => void;
  explodeAt: (ex: number, ez: number, radius: number, damage: number) => void;
  upgradeStat: (stat: StatKey) => void;
  buyWeapon: (id: WeaponId) => void;
  equipWeapon: (id: WeaponId) => void;
  choosePerk: (id: PerkId) => void;
  buyShopUpgrade: (id: ShopUpgradeId) => void;
  selectClass: (id: ClassId) => void;
  selectSkin: (id: SkinId) => void;
  buySkin: (id: SkinId) => void;
  setSkillStatus: (id: SkillId, readyAt: number, cooldownMs: number, active?: boolean) => void;
  setQuality: (quality: QualityLevel) => void;
  refreshRecords: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...fresh(readSavedGame()?.quality ?? loadProfile().settings.quality ?? "medium"),

  startGame: () => {
    const quality = get().quality;
    const now = Date.now();
    resetPlayerRuntime();
    clearAllEnemyRuntime();
    const poisons = initialEnemies(1, quality);
    set({
      ...fresh(quality, loadRecords()),
      phase: "playing",
      drugs: Array.from({ length: quality === "low" ? 3 : 5 }, spawnMushroom),
      poisons,
      spawnedThisStage: poisons.length,
      activeEffects: [{ type: "invincibility", expiresAt: now + START_GRACE_MS }],
      centerMessage: centerMessage("LEVEL 1 START", "Brief shield. Get space, then fight.", "level", 2600),
    });
  },

  restartGame: () => get().startGame(),

  pauseGame: () => set(s => s.phase === "playing" ? { phase: "paused" } : {}),

  resumeGame: () => set(s => s.phase === "paused" ? { phase: "playing" } : {}),

  exitToMenu: () => {
    const state = get();
    if (state.phase !== "menu") saveGameState(state);
    clearAllEnemyRuntime();
    set({ ...fresh(state.quality, loadRecords()), phase: "menu" });
  },

  loadGame: () => {
    const saved = readSavedGame();
    if (!saved) {
      get().startGame();
      return;
    }

    resetPlayerRuntime();
    clearAllEnemyRuntime();
    const now = Date.now();
    const stage = Math.max(1, saved.stage);
    const killsRequired = getStageKillTarget(stage);
    const killsThisStage = Math.min(killsRequired - 1, saved.killsThisStage ?? 0);
    const quality = saved.quality ?? "medium";
    const poisons = initialEnemies(stage, quality);
    const profile = loadProfile();
    const loadout = normalizeLoadout({
      selectedClassId: saved.selectedClassId ?? profile.selectedClassId,
      selectedSkinId: saved.selectedSkinId ?? profile.selectedSkinId,
    }, profile.unlockedSkinIds);

    set({
      ...fresh(quality, loadRecords()),
      phase: "playing",
      score: saved.score,
      health: Math.max(1, saved.health),
      maxHealth: saved.maxHealth,
      stage,
      wave: getWaveIndex(stage, saved.spawnedThisStage ?? killsThisStage),
      wavesTotal: getStageWaveCount(stage),
      killsThisStage,
      killsRequired,
      spawnedThisStage: Math.max(saved.spawnedThisStage ?? poisons.length, poisons.length),
      totalKills: saved.totalKills,
      bossesDefeated: saved.bossesDefeated ?? 0,
      totalBossesDefeated: profile.bossesDefeated,
      playerLevel: saved.playerLevel,
      xp: saved.xp,
      xpToNext: saved.xpToNext,
      statPoints: saved.statPoints,
      coins: saved.coins,
      coinsCollected: saved.coinsCollected,
      gameTime: saved.gameTime,
      stats: saved.stats,
      perks: saved.perks ?? {},
      shopUpgrades: saved.shopUpgrades ?? {},
      ownedWeapons: saved.ownedWeapons.length ? saved.ownedWeapons : ["blaster"],
      currentWeapon: saved.currentWeapon,
      walletCoins: profile.totalCoins,
      selectedClassId: loadout.selectedClassId,
      selectedSkinId: loadout.selectedSkinId,
      unlockedSkinIds: profile.unlockedSkinIds,
      poisons,
      drugs: Array.from({ length: quality === "low" ? 3 : 5 }, spawnMushroom),
      activeEffects: [{ type: "invincibility", expiresAt: now + RESUME_GRACE_MS }],
      centerMessage: centerMessage("SAVE LOADED", `LEVEL ${stage} - brief shield`, "save", 2200),
    });
  },

  saveGame: () => {
    const state = get();
    saveGameState(state);
    set({
      records: loadRecords(),
      centerMessage: centerMessage("GAME SAVED", "Local save and records updated.", "save", 1800),
    });
  },

  collectDrug: (id) => {
    set(s => {
      const drug = s.drugs.find(d => d.id === id);
      if (!drug) return {};

      const now = Date.now();
      const cfg = DRUG_CONFIG[drug.type];
      const drugs = s.drugs.filter(d => d.id !== id);
      const float = floater(cfg.label, drug.position[0], drug.position[2], cfg.color, 2.2, 900);

      if (drug.type === "heal") {
        return {
          drugs,
          health: Math.min(s.maxHealth, s.health + 40),
          score: s.score + 120,
          floatingTexts: [...s.floatingTexts.slice(-18), float],
        };
      }

      return {
        drugs,
        activeEffects: [
          ...s.activeEffects.filter(e => e.type !== drug.type),
          { type: drug.type, expiresAt: now + cfg.duration * 1000 },
        ],
        score: s.score + 120,
        floatingTexts: [...s.floatingTexts.slice(-18), float],
      };
    });
  },

  collectCoin: (id) => {
    set(s => {
      const coin = s.coinItems.find(c => c.id === id);
      if (!coin) return {};
      return {
        coinItems: s.coinItems.filter(c => c.id !== id),
        coins: s.coins + coin.value,
        coinsCollected: s.coinsCollected + coin.value,
        score: s.score + coin.value * 15,
        floatingTexts: [...s.floatingTexts.slice(-18), floater(`+${coin.value}`, coin.position[0], coin.position[2], "#ffd85a", 1.8, 650)],
      };
    });
  },

  damageEnemy: (id, dmg) => {
    set(s => {
      const killed: PoisonItem[] = [];
      const poisons = s.poisons.flatMap(enemy => {
        if (enemy.id !== id) return [enemy];
        const hp = enemy.hp - dmg;
        if (hp <= 0) {
          killed.push(enemy);
          return [];
        }
        return [{ ...enemy, hp }];
      });
      return applyKills(s, poisons, killed);
    });
  },

  damagePlayer: (amount, x = playerRuntime.x, z = playerRuntime.z) => {
    set(s => {
      if (s.phase !== "playing") return {};
      const now = Date.now();
      const loadoutMods = getLoadoutModifiers(s.selectedClassId, s.selectedSkinId);
      const mitigatedAmount = amount * Math.max(0.55, 1 - loadoutMods.armorBonus);
      const inv = s.activeEffects.some(e => e.type === "invincibility" && e.expiresAt > now) || playerRuntime.dashUntil > now;
      if (inv) {
        return { floatingTexts: [...s.floatingTexts.slice(-18), floater("DODGE", x, z, "#8af7ff", 2.4, 620)] };
      }

      const dodgeChance = Math.min(0.54, 0.045 + s.stats.dodge * 0.026 + s.stats.luck * 0.006 + perkLevel(s.perks, "nimble") * 0.035);
      if (Math.random() < dodgeChance) {
        return { floatingTexts: [...s.floatingTexts.slice(-18), floater("UNIK", x, z, "#f8ff7a", 2.45, 720)] };
      }

      const newHp = Math.max(0, Math.round(s.health - mitigatedAmount));
      if (newHp <= 0) {
        const records = updateRecordsFromState(s);
        const profile = updateProfile(current => ({
          ...current,
          totalCoins: current.totalCoins + s.coinsCollected,
          bestScore: Math.max(current.bestScore, s.score),
          highestWave: Math.max(current.highestWave, s.stage),
          bossesDefeated: current.bossesDefeated + s.bossesDefeated,
        }));
        return {
          health: 0,
          phase: "gameover",
          walletCoins: profile.totalCoins,
          totalBossesDefeated: profile.bossesDefeated,
          records,
          centerMessage: centerMessage("GAME OVER", `Score ${s.score.toString().padStart(6, "0")} - +${s.coinsCollected} banked coins`, "danger", 3200),
        };
      }

      return {
        health: newHp,
        floatingTexts: [...s.floatingTexts.slice(-18), floater(`-${Math.round(mitigatedAmount)}`, playerRuntime.x, playerRuntime.z, "#ff5b6a", 2.45, 680)],
      };
    });
  },

  tickEffects: (now) => {
    const active = get().activeEffects.filter(e => e.expiresAt > now);
    if (active.length !== get().activeEffects.length) set({ activeEffects: active });
  },

  tickFloaters: (now) => {
    const state = get();
    const floatingTexts = state.floatingTexts.filter(t => now - t.createdAt < t.duration);
    const impactBursts = state.impactBursts.filter(b => now - b.createdAt < b.duration);
    const center = state.centerMessage && now - state.centerMessage.createdAt < state.centerMessage.duration
      ? state.centerMessage
      : null;
    if (floatingTexts.length !== state.floatingTexts.length || impactBursts.length !== state.impactBursts.length || center !== state.centerMessage) {
      set({ floatingTexts, impactBursts, centerMessage: center });
    }
  },

  tickGameClock: (delta) => set(s => s.phase === "playing" ? { gameTime: s.gameTime + delta } : {}),

  spawnItems: () => {
    set(s => {
      if (s.phase !== "playing") return {};

      const aliveCount = s.poisons.length;
      const budget = getEnemyBudget(s.stage, s.quality);
      const remaining = s.killsRequired - s.spawnedThisStage;
      let poisons = s.poisons;
      let spawnedThisStage = s.spawnedThisStage;
      let wave = s.wave;
      let center = s.centerMessage;

      if (remaining > 0 && aliveCount < budget) {
        const spawnBatch = Math.min(remaining, Math.max(1, Math.min(3, budget - aliveCount)));
        const nextEnemies: PoisonItem[] = [];
        let bossIncoming = false;
        for (let i = 0; i < spawnBatch; i++) {
          const enemyNumber = spawnedThisStage + i + 1;
          const nextWave = getWaveIndex(s.stage, enemyNumber);
          const forceBoss = s.stage % 5 === 0 && enemyNumber === s.killsRequired;
          if (forceBoss) bossIncoming = true;
          nextEnemies.push(createEnemy(s.stage, pickEnemyType(s.stage, nextWave, forceBoss)));
        }
        spawnedThisStage += nextEnemies.length;
        const newWave = getWaveIndex(s.stage, spawnedThisStage);
        if (newWave !== wave) {
          center = centerMessage(`WAVE ${newWave}`, `${s.killsRequired - s.killsThisStage} monsters left`, "level", 1300);
        }
        if (bossIncoming) {
          center = centerMessage("BOSS INCOMING", "Watch the telegraphs and shockwave.", "danger", 2200);
        }
        wave = newWave;
        poisons = [...poisons, ...nextEnemies];
      }

      const maxDrugs = s.quality === "low" ? 3 : s.quality === "medium" ? 4 : 5;
      const drugs = s.drugs.length < maxDrugs && Math.random() < 0.5
        ? [...s.drugs, spawnMushroom()]
        : s.drugs;

      return { poisons, spawnedThisStage, wave, drugs, centerMessage: center };
    });
  },

  addScore: (n) => set(s => ({ score: s.score + n })),

  setPlayerSnapshot: (pos, angle, aim) => set({ playerPos: pos, playerAngle: angle, aimWorld: aim }),

  fireWeapon: (ox, oz, dx, dz) => {
    const s = get();
    if (s.phase !== "playing") return;
    const weapon = WEAPON_CONFIG[s.currentWeapon];
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return;

    const now = Date.now();
    const klass = getClassDefinition(s.selectedClassId);
    const loadoutMods = getLoadoutModifiers(s.selectedClassId, s.selectedSkinId);
    const hasTriple = s.activeEffects.some(e => e.type === "triple_shot" && e.expiresAt > now);
    const hasStrength = s.activeEffects.some(e => e.type === "strength" && e.expiresAt > now);
    const baseAngle = Math.atan2(dx / len, dz / len);
    const perkMultishot = perkLevel(s.perks, "multishot");
    const perkFrontArrow = perkLevel(s.perks, "front_arrow");
    const perkSideArrows = perkLevel(s.perks, "side_arrows");
    const perkPiercing = perkLevel(s.perks, "piercing");
    const perkRicochet = perkLevel(s.perks, "ricochet");
    const perkFire = perkLevel(s.perks, "fire_arrows");
    const classExtraPellets = klass.attackType === "rapid_projectile" ? 1 : 0;
    const pellets = (hasTriple && weapon.pellets === 1 ? 3 : weapon.pellets + (hasTriple ? 2 : 0)) + perkMultishot + classExtraPellets;
    const spread = weapon.spread || (pellets > 1 ? (klass.attackType === "heavy_cone" ? 0.18 : 0.12) : 0);
    const classDamage = klass.attackType === "rapid_projectile" ? 0.86
      : klass.attackType === "magic_orb" ? 1.18
      : klass.attackType === "heavy_cone" ? 1.22
      : klass.attackType === "dash_strike" ? 0.95
      : klass.attackType === "pickaxe_throw" ? 0.98
      : 1.04;
    const damageScale = loadoutMods.damageMultiplier * classDamage * (1 + s.stats.strength * 0.12 + perkFrontArrow * 0.12 + perkFire * 0.1) * (1 + s.stats.superpower * (weapon.id === "blaster" ? 0.035 : 0.062));
    const luckScale = weapon.id === "arcane" ? 1 + s.stats.luck * 0.026 : 1;
    const strengthBurst = hasStrength ? 1.45 : 1;
    const critChance = Math.min(0.68, loadoutMods.critChanceBonus + s.stats.luck * 0.006);
    const styleRadius = klass.attackType === "magic_orb" ? 1.22
      : klass.attackType === "heavy_cone" ? 1.45
      : klass.attackType === "pickaxe_throw" ? 0.95
      : klass.attackType === "dash_strike" ? 0.82
      : 1;
    const styleSpeed = klass.attackType === "rapid_projectile" ? 1.22
      : klass.attackType === "magic_orb" ? 0.82
      : klass.attackType === "heavy_cone" ? 0.68
      : klass.attackType === "dash_strike" ? 1.36
      : klass.attackType === "pickaxe_throw" ? 0.95
      : 1;
    const styleRange = klass.attackType === "heavy_cone" ? 0.62 : klass.attackType === "magic_orb" ? 0.92 : 1;
    const projectiles: Projectile[] = [];

    const pushProjectile = (angle: number, damageMultiplier = 1, radiusMultiplier = 1) => {
      const critical = Math.random() < critChance;
      projectiles.push({
        id: nid("proj"),
        position: [ox + Math.sin(angle) * 0.9, 1.28, oz + Math.cos(angle) * 0.9],
        direction: [Math.sin(angle), Math.cos(angle)],
        speed: weapon.projectileSpeed * styleSpeed * 1.16,
        damage: weapon.damage * damageScale * luckScale * strengthBurst * damageMultiplier * (critical ? 1.85 : 1),
        radius: weapon.radius * radiusMultiplier * styleRadius,
        range: weapon.range * styleRange,
        distance: 0,
        age: 0,
        pierce: (weapon.id === "laser" ? 1 + Math.floor(s.stats.superpower / 4) : 0) + perkPiercing,
        bounces: perkRicochet,
        color: critical ? "#ffffff" : perkFire > 0 ? "#ff743d" : klass.color,
        weaponId: klass.attackType === "magic_orb" ? "nova" : weapon.id,
        attackStyle: klass.attackType,
        splashRadius: klass.attackType === "magic_orb" ? 2.25 + s.stats.superpower * 0.04 : undefined,
        critical,
      });
    };

    for (let i = 0; i < pellets; i++) {
      const offset = pellets === 1 ? 0 : (i - (pellets - 1) / 2) * spread;
      pushProjectile(baseAngle + offset);
    }

    if (perkSideArrows > 0) {
      const sideDamage = 0.46 + perkSideArrows * 0.12;
      pushProjectile(baseAngle + Math.PI / 2, sideDamage, 0.86);
      pushProjectile(baseAngle - Math.PI / 2, sideDamage, 0.86);
    }

    const cap = s.quality === "low" ? 40 : s.quality === "medium" ? 60 : 84;
    set(state => ({ projectiles: [...state.projectiles.slice(-cap), ...projectiles] }));
  },

  tickProjectiles: (delta) => {
    set(s => {
      if (s.projectiles.length === 0) return {};

      const killed: PoisonItem[] = [];
      const poisons = s.poisons.map(enemy => ({ ...enemy }));
      const aliveProjectiles: Projectile[] = [];
      const impactBursts: ImpactBurst[] = [];

      for (const projectile of s.projectiles) {
        const step = projectile.speed * delta;
        const next: Projectile = {
          ...projectile,
          position: [
            projectile.position[0] + projectile.direction[0] * step,
            projectile.position[1],
            projectile.position[2] + projectile.direction[1] * step,
          ],
          distance: projectile.distance + step,
          age: projectile.age + delta,
        };

        if (
          next.age > 3.2 ||
          next.distance > next.range ||
          Math.abs(next.position[0]) > ARENA_BOUND + 5 ||
          Math.abs(next.position[2]) > ARENA_BOUND + 5
        ) {
          continue;
        }

        let consumed = false;
        let pierceLeft = next.pierce;

        for (let i = 0; i < poisons.length; i++) {
          const enemy = poisons[i];
          const live = poisonCurrentPos[enemy.id] ?? [enemy.position[0], enemy.position[2]];
          const dx = next.position[0] - live[0];
          const dz = next.position[2] - live[1];
          const radius = enemy.scale * 0.8 + next.radius;

          if (dx * dx + dz * dz > radius * radius) continue;

          enemy.hp -= next.damage;
          impactBursts.push(impactBurst(
            live[0],
            live[1],
            next.color,
            themeFromAttackStyle(next.attackStyle),
            next.critical ? "crit" : next.attackStyle === "magic_orb" ? "magic" : next.attackStyle === "heavy_cone" ? "heavy" : "hit",
            next.critical ? 1.45 : next.attackStyle === "heavy_cone" ? 1.25 : 1,
          ));
          const splashRadius = next.splashRadius ?? (next.weaponId === "nova" ? 2.9 : 0);
          if (splashRadius > 0) {
            for (const nearby of poisons) {
              if (nearby.id === enemy.id) continue;
              const pos = poisonCurrentPos[nearby.id] ?? [nearby.position[0], nearby.position[2]];
              const ndx = pos[0] - live[0];
              const ndz = pos[1] - live[1];
              if (ndx * ndx + ndz * ndz < splashRadius * splashRadius) nearby.hp -= next.damage * 0.58;
            }
          }

          if (enemy.hp <= 0) killed.push(enemy);

          if (next.bounces > 0) {
            let target: PoisonItem | null = null;
            let best = Number.POSITIVE_INFINITY;
            for (const candidate of poisons) {
              if (candidate.id === enemy.id || candidate.hp <= 0) continue;
              const pos = poisonCurrentPos[candidate.id] ?? [candidate.position[0], candidate.position[2]];
              const cdx = pos[0] - live[0];
              const cdz = pos[1] - live[1];
              const dd = cdx * cdx + cdz * cdz;
              if (dd < best && dd < 13 * 13) {
                best = dd;
                target = candidate;
              }
            }

            if (target) {
              const targetPos = poisonCurrentPos[target.id] ?? [target.position[0], target.position[2]];
              const ndx = targetPos[0] - next.position[0];
              const ndz = targetPos[1] - next.position[2];
              const nLen = Math.max(0.001, Math.sqrt(ndx * ndx + ndz * ndz));
              next.direction = [ndx / nLen, ndz / nLen];
              next.bounces -= 1;
              next.damage *= 0.72;
              consumed = false;
              break;
            }
          }

          if (pierceLeft <= 0) {
            consumed = true;
            break;
          }
          pierceLeft -= 1;
        }

        if (!consumed) aliveProjectiles.push({ ...next, pierce: pierceLeft });
      }

      const killedIds = new Set(killed.map(enemy => enemy.id));
      const nextPoisons = poisons.filter(enemy => enemy.hp > 0 && !killedIds.has(enemy.id));
      const killUpdate = applyKills(s, nextPoisons, killed);
      const completedStage = "stage" in killUpdate && killUpdate.stage !== s.stage;
      return {
        ...killUpdate,
        projectiles: completedStage ? [] : aliveProjectiles,
        impactBursts: completedStage ? [] : [...s.impactBursts.slice(-42), ...impactBursts.slice(-18)],
      };
    });
  },

  fireEnemyProjectile: (ex, ez, px, pz, damage) => {
    const dx = px - ex;
    const dz = pz - ez;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) return;

    const proj: EnemyProjectile = {
      id: nid("eproj"),
      position: [ex, 1.5, ez],
      direction: [dx / len, dz / len],
      speed: 8.4,
      age: 0,
      damage,
    };
    set(s => ({ enemyProjectiles: [...s.enemyProjectiles.slice(-34), proj] }));
  },

  tickEnemyProjectiles: (delta, px, pz) => {
    const { enemyProjectiles } = get();
    if (enemyProjectiles.length === 0) return;

    let totalDmg = 0;
    const alive = enemyProjectiles
      .map(p => ({
        ...p,
        position: [
          p.position[0] + p.direction[0] * p.speed * delta,
          p.position[1],
          p.position[2] + p.direction[1] * p.speed * delta,
        ] as [number, number, number],
        age: p.age + delta,
      }))
      .filter(p => {
        if (p.age > 5 || Math.abs(p.position[0]) > ARENA_BOUND + 5 || Math.abs(p.position[2]) > ARENA_BOUND + 5) return false;
        const dd = (p.position[0] - px) ** 2 + (p.position[2] - pz) ** 2;
        if (dd < 1.05 * 1.05) {
          totalDmg += p.damage;
          return false;
        }
        return true;
      });

    set({ enemyProjectiles: alive });
    if (totalDmg > 0) get().damagePlayer(totalDmg);
  },

  addMeleeSwing: (playerPos, angle, is360) => {
    set(s => {
      const rangeLevel = shopUpgradeLevel(s.shopUpgrades, "attack_range");
      const damageLevel = shopUpgradeLevel(s.shopUpgrades, "melee_damage");
      const superLevel = shopUpgradeLevel(s.shopUpgrades, "super_charge");
      const klass = getClassDefinition(s.selectedClassId);
      const loadoutMods = getLoadoutModifiers(s.selectedClassId, s.selectedSkinId);
      const swing: MeleeSwing = {
        id: nid("melee"),
        startedAt: Date.now(),
        playerPos,
        angle,
        is360,
        color: is360 ? "#ff9d2f" : klass.color,
        theme: klass.vfxTheme,
      };
      const classRange = klass.attackType === "heavy_cone" ? 1.18 : klass.attackType === "dash_strike" ? 0.88 : klass.attackType === "melee_arc" ? 1.08 : 1;
      const range = ((is360 ? 4.25 : 3.25) + rangeLevel * (is360 ? 0.18 : 0.22)) * classRange;
      const arc = is360 ? Math.PI * 2 : Math.PI * ((klass.attackType === "heavy_cone" ? 0.96 : klass.attackType === "dash_strike" ? 0.62 : 0.78) + rangeLevel * 0.035);
      const killed: PoisonItem[] = [];
      const hitBursts: ImpactBurst[] = [];
      const classDamage = klass.attackType === "heavy_cone" ? 1.34 : klass.attackType === "dash_strike" ? 1.08 : klass.attackType === "pickaxe_throw" ? 0.94 : 1;
      const critical = Math.random() < Math.min(0.68, loadoutMods.critChanceBonus + s.stats.luck * 0.006);
      const damage = (2.25 + s.stats.strength * 0.34 + damageLevel * 0.55) * loadoutMods.damageMultiplier * classDamage * (critical ? 1.85 : 1) * (is360 ? 1.75 + superLevel * 0.14 : 1);
      let hits = 0;
      const poisons = s.poisons.flatMap(enemy => {
        const live = poisonCurrentPos[enemy.id] ?? [enemy.position[0], enemy.position[2]];
        const dx = live[0] - playerPos[0];
        const dz = live[1] - playerPos[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > range + enemy.scale * 0.4) return [enemy];
        if (!is360) {
          const ea = Math.atan2(dx, dz);
          let diff = ea - angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) > arc / 2) return [enemy];
        }
        const hp = enemy.hp - damage;
        hits += 1;
        if (hitBursts.length < 12) {
          hitBursts.push(impactBurst(
            live[0],
            live[1],
            is360 ? "#ffbd5a" : critical ? "#ffffff" : klass.color,
            klass.vfxTheme,
            is360 || klass.attackType === "heavy_cone" ? "heavy" : critical ? "crit" : klass.attackType === "magic_orb" ? "magic" : "hit",
            is360 ? 1.5 : critical ? 1.35 : 1,
          ));
        }
        if (hp <= 0) {
          killed.push(enemy);
          return [];
        }
        const knock = (is360 ? 1.55 + superLevel * 0.16 : 0.72 + damageLevel * 0.05) * (klass.attackType === "heavy_cone" ? 1.45 : 1) * enemy.scale;
        const nx = dx / Math.max(0.001, dist);
        const nz = dz / Math.max(0.001, dist);
        poisonCurrentPos[enemy.id] = [
          clampToArena(live[0] + nx * knock, 1.4),
          clampToArena(live[1] + nz * knock, 1.4),
        ];
        return [{ ...enemy, hp }];
      });
      swing.hits = hits;

      return {
        ...applyKills(s, poisons, killed),
        meleeSwings: [...s.meleeSwings.slice(-7), swing],
        impactBursts: [...s.impactBursts.slice(-42), ...hitBursts],
        floatingTexts: hits > 0
          ? [...s.floatingTexts.slice(-16), floater(is360 ? `POWER x${hits}` : critical ? `CRIT x${hits}` : `SLASH x${hits}`, playerPos[0], playerPos[1], is360 ? "#ffbd5a" : critical ? "#ffffff" : klass.color, 2.55, 520)]
          : s.floatingTexts,
      };
    });
  },

  clearOldMelee: (now) => {
    const alive = get().meleeSwings.filter(m => now - m.startedAt < MELEE_DUR);
    if (alive.length !== get().meleeSwings.length) set({ meleeSwings: alive });
  },

  explodeAt: (ex, ez, radius, damage) => {
    const dx = ex - playerRuntime.x;
    const dz = ez - playerRuntime.z;
    if (dx * dx + dz * dz < radius * radius) {
      get().damagePlayer(damage, ex, ez);
    }
    set(s => ({
      floatingTexts: [...s.floatingTexts.slice(-18), floater("BOOM", ex, ez, "#ff8b3d", 2.6, 700)],
    }));
  },

  upgradeStat: (stat) => {
    set(s => {
      if (s.statPoints <= 0) return {};
      const stats = { ...s.stats, [stat]: s.stats[stat] + 1 };
      const vitalityGain = stat === "vitality" ? 18 : 0;
      return {
        stats,
        statPoints: s.statPoints - 1,
        maxHealth: s.maxHealth + vitalityGain,
        health: Math.min(s.maxHealth + vitalityGain, s.health + vitalityGain),
        centerMessage: centerMessage("STAT UPGRADED", `${stat.toUpperCase()} +1`, "level", 1200),
      };
    });
  },

  buyWeapon: (id) => {
    set(s => {
      if (s.ownedWeapons.includes(id)) return { currentWeapon: id };
      const weapon = WEAPON_CONFIG[id];
      if (!weapon || s.coins < weapon.price) {
        return { centerMessage: centerMessage("NOT ENOUGH COINS", weapon ? `${weapon.price} coins required` : "Unknown weapon", "danger", 1200) };
      }
      return {
        coins: s.coins - weapon.price,
        ownedWeapons: [...s.ownedWeapons, id],
        currentWeapon: id,
        centerMessage: centerMessage("WEAPON BOUGHT", weapon.name, "reward", 1500),
      };
    });
  },

  equipWeapon: (id) => {
    if (get().ownedWeapons.includes(id)) set({ currentWeapon: id });
  },

  choosePerk: (id) => {
    set(s => {
      if (s.phase !== "upgrade" || !s.perkChoices.includes(id)) return {};

      const perks = { ...s.perks, [id]: perkLevel(s.perks, id) + 1 };
      const pendingLevelUps = Math.max(0, s.pendingLevelUps - 1);
      const nextChoices = pendingLevelUps > 0 ? rollPerkChoices(perks) : [];
      const heartGain = id === "strong_heart" ? 24 : 0;
      const phase: GamePhase = pendingLevelUps > 0 ? "upgrade" : "playing";

      return {
        perks,
        phase,
        pendingLevelUps,
        perkChoices: nextChoices,
        maxHealth: s.maxHealth + heartGain,
        health: Math.min(s.maxHealth + heartGain, s.health + heartGain),
        centerMessage: centerMessage("ABILITY READY", id.replaceAll("_", " ").toUpperCase(), "reward", 1450),
      };
    });
  },

  buyShopUpgrade: (id) => {
    set(s => {
      const cfg = SHOP_UPGRADES[id];
      if (!cfg) return {};
      const currentLevel = shopUpgradeLevel(s.shopUpgrades, id);
      if (currentLevel >= cfg.maxLevel) {
        return { centerMessage: centerMessage("MAX LEVEL", cfg.name, "save", 1200) };
      }
      const cost = shopUpgradeCost(s.shopUpgrades, id);
      if (s.coins < cost) {
        return { centerMessage: centerMessage("NOT ENOUGH COINS", `${cost} coins required`, "danger", 1200) };
      }

      if (id === "heal_now") {
        return {
          coins: s.coins - cost,
          shopUpgrades: { ...s.shopUpgrades, [id]: currentLevel + 1 },
          health: Math.min(s.maxHealth, s.health + 48),
          centerMessage: centerMessage("HEALED", "+48 HP", "reward", 1100),
        };
      }

      if (id === "random_perk") {
        const choices = rollPerkChoices(s.perks, 1);
        const perk = choices[0];
        if (!perk) return {};
        return {
          coins: s.coins - cost,
          shopUpgrades: { ...s.shopUpgrades, [id]: currentLevel + 1 },
          perks: { ...s.perks, [perk]: perkLevel(s.perks, perk) + 1 },
          centerMessage: centerMessage("WILD MUTATION", perk.replaceAll("_", " ").toUpperCase(), "reward", 1500),
        };
      }

      const nextLevel = currentLevel + 1;
      const vitalityGain = id === "max_health" ? 18 : 0;
      return {
        coins: s.coins - cost,
        shopUpgrades: { ...s.shopUpgrades, [id]: nextLevel },
        maxHealth: s.maxHealth + vitalityGain,
        health: Math.min(s.maxHealth + vitalityGain, s.health + vitalityGain),
        centerMessage: centerMessage("UPGRADE BOUGHT", `${cfg.name} LV ${nextLevel}`, "reward", 1300),
      };
    });
  },

  selectClass: (id) => {
    set(s => {
      const selectedSkinId = skinFitsClass(s.selectedSkinId, id)
        ? s.selectedSkinId
        : firstCompatibleSkin(id, s.unlockedSkinIds);
      const profile = updateProfile(profile => ({
        ...profile,
        selectedClassId: id,
        selectedSkinId,
      }));
      const loadout = normalizeLoadout(profile, profile.unlockedSkinIds);
      const mods = getLoadoutModifiers(loadout.selectedClassId, loadout.selectedSkinId);
      const nextMaxHealth = Math.round(120 * mods.hpMultiplier) + s.stats.vitality * 18 + shopUpgradeLevel(s.shopUpgrades, "max_health") * 18;

      return {
        selectedClassId: loadout.selectedClassId,
        selectedSkinId: loadout.selectedSkinId,
        unlockedSkinIds: profile.unlockedSkinIds,
        walletCoins: profile.totalCoins,
        maxHealth: nextMaxHealth,
        health: Math.min(nextMaxHealth, s.health + Math.max(0, nextMaxHealth - s.maxHealth)),
        centerMessage: centerMessage("CLASS READY", getClassDefinition(id).displayName, "save", 1250),
      };
    });
  },

  selectSkin: (id) => {
    set(s => {
      if (!s.unlockedSkinIds.includes(id)) {
        return { centerMessage: centerMessage("LOCKED SKIN", `${getSkinDefinition(id).unlockCost} bank coins required`, "danger", 1200) };
      }
      if (!skinFitsClass(id, s.selectedClassId)) {
        return { centerMessage: centerMessage("CLASS MISMATCH", "Pick a compatible class first.", "danger", 1400) };
      }
      const profile = updateProfile(profile => ({
        ...profile,
        selectedSkinId: id,
      }));
      const mods = getLoadoutModifiers(s.selectedClassId, id);
      const nextMaxHealth = Math.round(120 * mods.hpMultiplier) + s.stats.vitality * 18 + shopUpgradeLevel(s.shopUpgrades, "max_health") * 18;
      return {
        selectedSkinId: profile.selectedSkinId,
        walletCoins: profile.totalCoins,
        maxHealth: nextMaxHealth,
        health: Math.min(nextMaxHealth, s.health + Math.max(0, nextMaxHealth - s.maxHealth)),
        centerMessage: centerMessage("SKIN EQUIPPED", getSkinDefinition(id).displayName, "save", 1250),
      };
    });
  },

  buySkin: (id) => {
    set(s => {
      const skin = getSkinDefinition(id);
      if (s.unlockedSkinIds.includes(id)) {
        if (!skinFitsClass(id, s.selectedClassId)) {
          return { centerMessage: centerMessage("CLASS MISMATCH", "Pick a compatible class first.", "danger", 1400) };
        }
        const profile = updateProfile(profile => ({ ...profile, selectedSkinId: id }));
        return {
          selectedSkinId: profile.selectedSkinId,
          walletCoins: profile.totalCoins,
          centerMessage: centerMessage("SKIN EQUIPPED", skin.displayName, "save", 1250),
        };
      }
      if (s.walletCoins < skin.unlockCost) {
        return { centerMessage: centerMessage("NOT ENOUGH BANK COINS", `${skin.unlockCost} required`, "danger", 1300) };
      }
      const selectedSkinId = skinFitsClass(id, s.selectedClassId) ? id : s.selectedSkinId;
      const profile = updateProfile(profile => ({
        ...profile,
        totalCoins: profile.totalCoins - skin.unlockCost,
        unlockedSkinIds: [...profile.unlockedSkinIds, id],
        selectedSkinId,
      }));
      return {
        walletCoins: profile.totalCoins,
        unlockedSkinIds: profile.unlockedSkinIds,
        selectedSkinId: profile.selectedSkinId,
        centerMessage: centerMessage("SKIN UNLOCKED", skin.displayName, "reward", 1500),
      };
    });
  },

  setSkillStatus: (id, readyAt, cooldownMs, active = false) => {
    set(s => {
      const current = s.skillStatus[id];
      if (
        current &&
        Math.abs(current.readyAt - readyAt) < 30 &&
        Math.abs(current.cooldownMs - cooldownMs) < 20 &&
        current.active === active
      ) {
        return {};
      }
      return {
        skillStatus: {
          ...s.skillStatus,
          [id]: { id, label: current?.label ?? id, readyAt, cooldownMs, active },
        },
      };
    });
  },

  setQuality: (quality) => {
    updateProfile(profile => ({ ...profile, settings: { ...profile.settings, quality } }));
    set({ quality });
  },

  refreshRecords: () => set({ records: loadRecords() }),
}));

export { getSpawnInterval };
