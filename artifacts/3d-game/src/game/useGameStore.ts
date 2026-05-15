import { create } from "zustand";
import {
  GameState, DrugItem, PoisonItem, DrugType, EnemySubType,
  Projectile, EnemyProjectile, MeleeSwing,
  DRUG_CONFIG, ENEMY_CONFIG,
} from "./types";
import { poisonCurrentPos } from "./poisonPositions";

const ARENA = 22;
let idc = 0;
const nid = () => `e${++idc}`;

const DRUG_TYPES: DrugType[] = [
  "speed","heal","invincibility","strength","flight","time_slow","triple_shot","melee_360"
];
const REG_ENEMY: EnemySubType[] = ["ghost","zombie","creeper"];

function randEdge(): [number, number, number] {
  const a = Math.random() * Math.PI * 2;
  return [Math.cos(a) * ARENA * 0.88, 1.2, Math.sin(a) * ARENA * 0.88];
}

function spawnMushroom(): DrugItem {
  const a = Math.random() * Math.PI * 2;
  const d = 4 + Math.random() * (ARENA - 5);
  return {
    id: nid(),
    position: [Math.cos(a) * d, 1.2, Math.sin(a) * d],
    type: DRUG_TYPES[Math.floor(Math.random() * DRUG_TYPES.length)],
    collected: false,
  };
}

function spawnRegEnemy(wave: number): PoisonItem {
  let type: EnemySubType;
  if (wave < 3)       type = "zombie";
  else if (wave < 5)  type = Math.random() < 0.5 ? "zombie" : "ghost";
  else                type = REG_ENEMY[Math.floor(Math.random() * REG_ENEMY.length)];
  const cfg = ENEMY_CONFIG[type];
  const extra = Math.floor(wave / 3);
  return {
    id: nid(), position: randEdge(), type,
    collected: false, hp: cfg.baseHp + extra,
    mechanics: cfg.mechanics, scale: cfg.scale,
  };
}

function spawnBoss(wave: number): PoisonItem {
  const type: EnemySubType = wave >= 20 ? "boss20" : "boss10";
  const cfg = ENEMY_CONFIG[type];
  return {
    id: nid(), position: [0, 2.0, -ARENA * 0.7], type,
    collected: false, hp: cfg.baseHp,
    mechanics: cfg.mechanics, scale: cfg.scale,
  };
}

interface GameStore extends GameState {
  startGame: () => void;
  restartGame: () => void;
  collectDrug: (id: string) => void;
  damageEnemy: (id: string, dmg: number) => void;
  damagePlayer: (amount: number) => void;
  tickEffects: (now: number) => void;
  spawnItems: () => void;
  addScore: (n: number) => void;
  setPlayerPos: (pos: [number, number], angle: number) => void;
  fireProjectile: (ox: number, oz: number, dx: number, dz: number, count?: number) => void;
  tickProjectiles: (delta: number) => void;
  fireEnemyProjectile: (ex: number, ez: number, px: number, pz: number, damage: number) => void;
  tickEnemyProjectiles: (delta: number, px: number, pz: number) => void;
  addMeleeSwing: (playerPos: [number, number], angle: number, is360: boolean) => void;
  clearOldMelee: (now: number) => void;
  explodeAt: (ex: number, ez: number, radius: number, damage: number) => void;
}

const fresh = (): GameState => ({
  phase: "menu", score: 0, health: 100, maxHealth: 100, wave: 1,
  activeEffects: [], drugs: [], poisons: [],
  projectiles: [], enemyProjectiles: [], meleeSwings: [],
  playerPos: [0, 0], playerAngle: 0,
});

const MELEE_DUR = 400;

export const useGameStore = create<GameStore>((set, get) => ({
  ...fresh(),

  startGame: () => {
    const drugs = Array.from({ length: 7 }, spawnMushroom);
    const poisons = Array.from({ length: 5 }, () => spawnRegEnemy(1));
    set({ ...fresh(), phase: "playing", drugs, poisons });
  },

  restartGame: () => get().startGame(),

  collectDrug: (id) => {
    const { drugs, activeEffects, health, maxHealth, score } = get();
    const drug = drugs.find(d => d.id === id);
    if (!drug || drug.collected) return;
    const cfg = DRUG_CONFIG[drug.type];
    const now = Date.now();
    const newDrugs = drugs.map(d => d.id === id ? { ...d, collected: true } : d);
    // Heal is instant
    if (drug.type === "heal") {
      set({ drugs: newDrugs, health: Math.min(maxHealth, health + 40), score: score + 100 });
      return;
    }
    set({
      drugs: newDrugs,
      activeEffects: [
        ...activeEffects.filter(e => e.type !== drug.type),
        { type: drug.type, expiresAt: now + cfg.duration * 1000 },
      ],
      score: score + 100,
    });
  },

  damageEnemy: (id, dmg) => {
    const { poisons, score, activeEffects } = get();
    const p = poisons.find(x => x.id === id);
    if (!p || p.collected) return;
    const now = Date.now();
    const str = activeEffects.some(e => e.type === "strength" && e.expiresAt > now);
    const realDmg = str ? 99 : dmg;
    const newHp = p.hp - realDmg;
    if (newHp <= 0) {
      const bonus = (p.type === "boss10" || p.type === "boss20") ? 500 : 30;
      set({
        poisons: poisons.map(x => x.id === id ? { ...x, collected: true } : x),
        score: score + bonus,
      });
    } else {
      set({ poisons: poisons.map(x => x.id === id ? { ...x, hp: newHp } : x) });
    }
  },

  damagePlayer: (amount) => {
    const { health, activeEffects, phase } = get();
    if (phase !== "playing") return;
    const now = Date.now();
    const inv = activeEffects.some(e => e.type === "invincibility" && e.expiresAt > now);
    if (inv) return;
    const newHp = Math.max(0, health - amount);
    set({ health: newHp, phase: newHp <= 0 ? "gameover" : "playing" });
  },

  tickEffects: (now) => {
    const active = get().activeEffects.filter(e => e.expiresAt > now);
    if (active.length !== get().activeEffects.length) set({ activeEffects: active });
  },

  spawnItems: () => {
    const { drugs, poisons, wave } = get();
    let np = poisons;
    let nd = drugs;
    let nw = wave;

    const alive = poisons.filter(p => !p.collected);
    const aliveCount = alive.length;

    // Advance wave when all enemies cleared
    if (aliveCount === 0 && poisons.length > 0) {
      nw = wave + 1;
    }

    // Spawn boss at wave 10 or 20 (once each)
    const hasBoss = alive.some(p => p.type === "boss10" || p.type === "boss20");
    if ((nw === 10 || nw === 20) && !hasBoss) {
      np = [...np, spawnBoss(nw)];
    }

    // Regular spawning
    const maxEnemies = Math.min(4 + nw * 2, 20);
    if (aliveCount < maxEnemies) {
      np = [...np, spawnRegEnemy(nw)];
    }

    if (drugs.filter(d => !d.collected).length < 6) {
      nd = [...nd, spawnMushroom()];
    }

    set({ drugs: nd, poisons: np, wave: nw });
  },

  addScore: (n) => set(s => ({ score: s.score + n })),

  setPlayerPos: (pos, angle) => set({ playerPos: pos, playerAngle: angle }),

  fireProjectile: (ox, oz, dx, dz, count = 1) => {
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.001) return;
    const base: [number, number] = [dx / len, dz / len];
    const spreads = count === 1
      ? [0]
      : count === 3 ? [-0.28, 0, 0.28] : [0];
    const newProjs: Projectile[] = spreads.map(offset => {
      const angle = Math.atan2(base[0], base[1]) + offset;
      return {
        id: nid(),
        position: [ox, 1.2, oz] as [number, number, number],
        direction: [Math.sin(angle), Math.cos(angle)] as [number, number],
        speed: 28, age: 0,
      };
    });
    set(s => ({ projectiles: [...s.projectiles.slice(-40), ...newProjs] }));
  },

  tickProjectiles: (delta) => {
    const { projectiles, poisons, score } = get();
    const B = 25;
    let ns = score;
    let np = [...poisons];

    const alive = projectiles
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
        if (p.age > 2.5) return false;
        if (Math.abs(p.position[0]) > B || Math.abs(p.position[2]) > B) return false;
        let hit = false;
        np = np.map(enemy => {
          if (enemy.collected || hit) return enemy;
          const live = poisonCurrentPos[enemy.id];
          const ex = live ? live[0] : enemy.position[0];
          const ez = live ? live[1] : enemy.position[2];
          const dd = (p.position[0] - ex) ** 2 + (p.position[2] - ez) ** 2;
          const r = enemy.scale * 1.4;
          if (dd < r * r) {
            hit = true;
            const newHp = enemy.hp - 1;
            if (newHp <= 0) {
              ns += (enemy.type === "boss10" || enemy.type === "boss20") ? 500 : 30;
              return { ...enemy, collected: true };
            }
            return { ...enemy, hp: newHp };
          }
          return enemy;
        });
        return !hit;
      });

    set({ projectiles: alive, poisons: np, score: ns });
  },

  fireEnemyProjectile: (ex, ez, px, pz, damage) => {
    const dx = px - ex, dz = pz - ez;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) return;
    const proj: EnemyProjectile = {
      id: nid(),
      position: [ex, 1.5, ez],
      direction: [dx / len, dz / len],
      speed: 8, age: 0, damage,
    };
    set(s => ({ enemyProjectiles: [...s.enemyProjectiles.slice(-30), proj] }));
  },

  tickEnemyProjectiles: (delta, px, pz) => {
    const { enemyProjectiles } = get();
    let tookDamage = false;
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
        if (p.age > 5) return false;
        const dd = (p.position[0] - px) ** 2 + (p.position[2] - pz) ** 2;
        if (dd < 1.2 * 1.2) {
          tookDamage = true;
          totalDmg += p.damage;
          return false;
        }
        return true;
      });

    if (tookDamage) {
      set({ enemyProjectiles: alive });
      get().damagePlayer(totalDmg);
    } else if (alive.length !== enemyProjectiles.length) {
      set({ enemyProjectiles: alive });
    }
  },

  addMeleeSwing: (playerPos, angle, is360) => {
    const swing: MeleeSwing = { id: nid(), startedAt: Date.now(), playerPos, angle, is360 };
    set(s => ({ meleeSwings: [...s.meleeSwings, swing] }));

    const { poisons } = get();
    const RANGE = is360 ? 3.8 : 3.2;
    const ARC = is360 ? Math.PI * 2 : Math.PI * 0.85;
    let ns = get().score;
    const np = poisons.map(p => {
      if (p.collected) return p;
      const live = poisonCurrentPos[p.id];
      const ex = live ? live[0] : p.position[0];
      const ez = live ? live[1] : p.position[2];
      const dx = ex - playerPos[0];
      const dz = ez - playerPos[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > RANGE) return p;
      if (!is360) {
        const ea = Math.atan2(dx, dz);
        let diff = ea - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) > ARC / 2) return p;
      }
      const newHp = p.hp - 2;
      if (newHp <= 0) {
        ns += (p.type === "boss10" || p.type === "boss20") ? 500 : 30;
        return { ...p, collected: true };
      }
      return { ...p, hp: newHp };
    });
    set({ poisons: np, score: ns });
  },

  clearOldMelee: (now) => {
    const alive = get().meleeSwings.filter(m => now - m.startedAt < MELEE_DUR);
    if (alive.length !== get().meleeSwings.length) set({ meleeSwings: alive });
  },

  explodeAt: (ex, ez, radius, damage) => {
    const { playerPos } = get();
    const dd = (ex - playerPos[0]) ** 2 + (ez - playerPos[1]) ** 2;
    if (dd < radius * radius) {
      get().damagePlayer(damage);
    }
  },
}));
