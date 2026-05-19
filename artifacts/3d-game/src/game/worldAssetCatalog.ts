import type { QualityLevel } from "./types";
import type { BiomeId } from "./worldTheme";

const QUATERNIUS_NATURE = "/assets/quaternius/stylized-nature/gltf/";
const KENNEY = "/assets/kenney/";
const quaterniusNatureAsset = (name: string) => `${QUATERNIUS_NATURE}${name}`;
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
    id: "quaternius-common-tree-a",
    path: quaterniusNatureAsset("CommonTree_1.gltf"),
    biomes: ["ruins_forest", "marsh"],
    role: "canopy",
    scaleRange: [0.86, 1.2],
    density: 15,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-common-tree-b",
    path: quaterniusNatureAsset("CommonTree_3.gltf"),
    biomes: ["ruins_forest", "marsh"],
    role: "canopy",
    scaleRange: [0.9, 1.24],
    density: 12,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-pine-wall",
    path: quaterniusNatureAsset("Pine_3.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "marsh", "crystal_gate"],
    role: "horizon",
    scaleRange: [1.02, 1.52],
    density: 20,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-common-wall",
    path: quaterniusNatureAsset("CommonTree_5.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "marsh", "crystal_gate", "mine_quarry"],
    role: "horizon",
    scaleRange: [1.0, 1.44],
    density: 16,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-dead-tree-a",
    path: quaterniusNatureAsset("DeadTree_1.gltf"),
    biomes: ["marsh", "mine_quarry", "crystal_gate"],
    role: "canopy",
    scaleRange: [0.62, 0.92],
    density: 10,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-dead-tree-b",
    path: quaterniusNatureAsset("DeadTree_3.gltf"),
    biomes: ["marsh", "mine_quarry", "crystal_gate"],
    role: "horizon",
    scaleRange: [0.8, 1.18],
    density: 12,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-twisted-landmark",
    path: quaterniusNatureAsset("TwistedTree_1.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate"],
    role: "canopy",
    scaleRange: [0.26, 0.46],
    density: 7,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-flowering-bush",
    path: quaterniusNatureAsset("Bush_Common_Flowers.gltf"),
    biomes: ["ruins_forest", "marsh", "boss_courtyard"],
    role: "grass",
    scaleRange: [0.9, 1.42],
    density: 18,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-bush",
    path: quaterniusNatureAsset("Bush_Common.gltf"),
    biomes: ["ruins_forest", "marsh", "boss_courtyard", "crystal_gate"],
    role: "grass",
    scaleRange: [0.9, 1.55],
    density: 19,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-wispy-grass",
    path: quaterniusNatureAsset("Grass_Wispy_Tall.gltf"),
    biomes: ["ruins_forest", "marsh", "boss_courtyard"],
    role: "grass",
    scaleRange: [0.72, 1.22],
    density: 28,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-common-grass",
    path: quaterniusNatureAsset("Grass_Common_Tall.gltf"),
    biomes: ["ruins_forest", "marsh"],
    role: "grass",
    scaleRange: [0.78, 1.28],
    density: 24,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-fern",
    path: quaterniusNatureAsset("Fern_1.gltf"),
    biomes: ["ruins_forest", "marsh"],
    role: "grass",
    scaleRange: [0.8, 1.28],
    density: 14,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-flower-cluster",
    path: quaterniusNatureAsset("Flower_4_Group.gltf"),
    biomes: ["ruins_forest", "marsh"],
    role: "grass",
    scaleRange: [0.72, 1.1],
    density: 9,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-mushroom-cluster",
    path: quaterniusNatureAsset("Mushroom_Laetiporus.gltf"),
    biomes: ["ruins_forest", "marsh"],
    role: "grass",
    scaleRange: [0.92, 1.55],
    density: 8,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-rock-medium-a",
    path: quaterniusNatureAsset("Rock_Medium_3.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "marsh", "crystal_gate", "mine_quarry"],
    role: "rock",
    scaleRange: [0.64, 1.14],
    density: 15,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-rock-medium-b",
    path: quaterniusNatureAsset("Rock_Medium_1.gltf"),
    biomes: ["ruins_forest", "marsh", "mine_quarry"],
    role: "rock",
    scaleRange: [0.66, 1.18],
    density: 12,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-path-rocks",
    path: quaterniusNatureAsset("RockPath_Round_Wide.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate", "mine_quarry"],
    role: "prop",
    scaleRange: [1.05, 1.75],
    density: 10,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-pebble",
    path: quaterniusNatureAsset("Pebble_Round_3.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "marsh", "crystal_gate", "mine_quarry"],
    role: "rock",
    scaleRange: [0.65, 1.2],
    density: 16,
    mobileLOD: "keep",
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
    scaleRange: [1.15, 2.0],
    density: 5,
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
