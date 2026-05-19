import type { QualityLevel } from "./types";
import type { BiomeId } from "./worldTheme";

const KENNEY = "/assets/kenney/";
const natureAsset = (name: string) => `${KENNEY}nature/${name}`;
const townAsset = (name: string) => `${KENNEY}fantasy-town/${name}`;
const dungeonAsset = (name: string) => `${KENNEY}dungeon/${name}`;

export type WorldAssetRole =
  | "canopy"
  | "horizon"
  | "ruin"
  | "landmark"
  | "rock"
  | "grass"
  | "prop"
  | "mine";

export interface WorldAssetDefinition {
  id: string;
  path: string;
  biomes: BiomeId[];
  role: WorldAssetRole;
  scaleRange: [number, number];
  density: number;
  mobileLOD: "keep" | "reduce" | "desktop";
  tint?: string;
}

export interface WorldAssetInstance extends WorldAssetDefinition {
  x: number;
  z: number;
  y: number;
  scale: number;
  rotation: number;
}

export const worldAssetCatalog: WorldAssetDefinition[] = [
  {
    id: "hero-oak",
    path: natureAsset("tree_oak.glb"),
    biomes: ["ruins_forest", "marsh"],
    role: "canopy",
    scaleRange: [1.45, 2.1],
    density: 12,
    mobileLOD: "reduce",
    tint: "#4f8b58",
  },
  {
    id: "deep-oak",
    path: natureAsset("tree_detailed_dark.glb"),
    biomes: ["ruins_forest", "marsh"],
    role: "horizon",
    scaleRange: [1.75, 2.7],
    density: 18,
    mobileLOD: "reduce",
    tint: "#365f43",
  },
  {
    id: "pine-tall",
    path: natureAsset("tree_pineTallA_detailed.glb"),
    biomes: ["ruins_forest", "crystal_gate", "mine_quarry"],
    role: "horizon",
    scaleRange: [1.45, 2.35],
    density: 14,
    mobileLOD: "reduce",
    tint: "#3f7551",
  },
  {
    id: "premium-bush",
    path: natureAsset("plant_bushDetailed.glb"),
    biomes: ["ruins_forest", "marsh", "boss_courtyard"],
    role: "grass",
    scaleRange: [0.85, 1.55],
    density: 16,
    mobileLOD: "keep",
    tint: "#5fa56b",
  },
  {
    id: "large-stone",
    path: natureAsset("stone_largeB.glb"),
    biomes: ["ruins_forest", "boss_courtyard", "marsh", "crystal_gate", "mine_quarry"],
    role: "rock",
    scaleRange: [0.9, 1.75],
    density: 14,
    mobileLOD: "keep",
    tint: "#8a8a7a",
  },
  {
    id: "moss-rock",
    path: natureAsset("rock_largeC.glb"),
    biomes: ["ruins_forest", "marsh", "mine_quarry"],
    role: "rock",
    scaleRange: [0.95, 1.8],
    density: 12,
    mobileLOD: "keep",
    tint: "#75826e",
  },
  {
    id: "broken-arch",
    path: townAsset("wall-arch.glb"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate"],
    role: "ruin",
    scaleRange: [1.1, 1.85],
    density: 8,
    mobileLOD: "reduce",
    tint: "#8a8678",
  },
  {
    id: "stone-pillar",
    path: townAsset("pillar-stone.glb"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate", "mine_quarry"],
    role: "landmark",
    scaleRange: [1.2, 2.3],
    density: 7,
    mobileLOD: "reduce",
    tint: "#8f8a7c",
  },
  {
    id: "fountain-ritual",
    path: townAsset("fountain-round.glb"),
    biomes: ["boss_courtyard", "crystal_gate"],
    role: "landmark",
    scaleRange: [1.2, 1.85],
    density: 3,
    mobileLOD: "desktop",
    tint: "#948f82",
  },
  {
    id: "lantern-warm",
    path: townAsset("lantern.glb"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [0.85, 1.2],
    density: 8,
    mobileLOD: "reduce",
    tint: "#d8b56d",
  },
  {
    id: "wooden-cart",
    path: townAsset("cart.glb"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [0.9, 1.25],
    density: 4,
    mobileLOD: "desktop",
    tint: "#9a704e",
  },
  {
    id: "mine-gate",
    path: dungeonAsset("gate-metal-bars.glb"),
    biomes: ["mine_quarry"],
    role: "mine",
    scaleRange: [1.25, 1.9],
    density: 5,
    mobileLOD: "reduce",
    tint: "#71695f",
  },
  {
    id: "mine-wall",
    path: dungeonAsset("template-wall-detail-a.glb"),
    biomes: ["mine_quarry", "crystal_gate"],
    role: "mine",
    scaleRange: [1.35, 2.1],
    density: 9,
    mobileLOD: "reduce",
    tint: "#706b63",
  },
  {
    id: "stone-bridge",
    path: natureAsset("bridge_stone.glb"),
    biomes: ["marsh", "ruins_forest"],
    role: "landmark",
    scaleRange: [1.05, 1.5],
    density: 3,
    mobileLOD: "desktop",
    tint: "#858a78",
  },
  {
    id: "log-stack",
    path: natureAsset("log_stack.glb"),
    biomes: ["ruins_forest", "marsh", "mine_quarry"],
    role: "prop",
    scaleRange: [0.85, 1.3],
    density: 7,
    mobileLOD: "reduce",
    tint: "#805c3f",
  },
];

function lcg(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

function seedForBiome(biome: BiomeId) {
  return biome.split("").reduce((sum, char) => sum + char.charCodeAt(0), 971);
}

function countForQuality(def: WorldAssetDefinition, quality: QualityLevel) {
  const base = quality === "high" ? def.density : quality === "medium" ? Math.ceil(def.density * 0.62) : Math.ceil(def.density * 0.36);
  if (def.mobileLOD === "desktop" && quality !== "high") return Math.max(0, Math.floor(base * 0.35));
  return base;
}

export function buildWorldAssetInstances(biome: BiomeId, quality: QualityLevel, arenaBound: number) {
  const rand = lcg(seedForBiome(biome) + (quality === "high" ? 1000 : quality === "medium" ? 500 : 100));
  const margin = 7;
  const instances: WorldAssetInstance[] = [];

  for (const def of worldAssetCatalog) {
    if (!def.biomes.includes(biome)) continue;
    const count = countForQuality(def, quality);
    for (let i = 0; i < count; i++) {
      let x = 0;
      let z = 0;
      for (let tries = 0; tries < 18; tries++) {
        const angle = rand() * Math.PI * 2;
        const edgeRole = def.role === "horizon" || def.role === "canopy";
        const minRadius = edgeRole ? arenaBound * 0.52 : def.role === "landmark" || def.role === "ruin" || def.role === "mine" ? arenaBound * 0.24 : arenaBound * 0.12;
        const maxRadius = edgeRole ? arenaBound * 1.24 : arenaBound * 0.88;
        const radius = minRadius + rand() * (maxRadius - minRadius);
        x = Math.cos(angle) * radius + (rand() - 0.5) * 7;
        z = Math.sin(angle) * radius + (rand() - 0.5) * 7;
        if (Math.hypot(x, z) > (def.role === "prop" ? 12 : 18)) break;
      }

      x = Math.max(-arenaBound - 48, Math.min(arenaBound + 48, x));
      z = Math.max(-arenaBound - 48, Math.min(arenaBound + 48, z));
      instances.push({
        ...def,
        x,
        z,
        y: 0,
        scale: def.scaleRange[0] + rand() * (def.scaleRange[1] - def.scaleRange[0]),
        rotation: rand() * Math.PI * 2,
      });
    }
  }

  return instances;
}
