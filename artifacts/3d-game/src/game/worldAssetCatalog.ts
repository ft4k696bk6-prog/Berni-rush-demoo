import type { QualityLevel } from "./types";
import type { BiomeId } from "./worldTheme";

const QUATERNIUS_NATURE = "/assets/quaternius/stylized-nature/gltf/";
const QUATERNIUS_MEDIEVAL = "/assets/quaternius/medieval-village/gltf/";
const QUATERNIUS_PROPS = "/assets/quaternius/fantasy-props/gltf/";
const quaterniusNatureAsset = (name: string) => `${QUATERNIUS_NATURE}${name}`;
const quaterniusMedievalAsset = (name: string) => `${QUATERNIUS_MEDIEVAL}${name}`;
const quaterniusPropAsset = (name: string) => `${QUATERNIUS_PROPS}${name}`;

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
    id: "quaternius-ruin-arch",
    path: quaterniusMedievalAsset("Wall_Arch.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate"],
    role: "ruin",
    scaleRange: [1.65, 2.4],
    density: 7,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-uneven-wall",
    path: quaterniusMedievalAsset("Wall_UnevenBrick_Straight.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate", "mine_quarry"],
    role: "ruin",
    scaleRange: [1.45, 2.15],
    density: 9,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-ruin-door",
    path: quaterniusMedievalAsset("Wall_UnevenBrick_Door_Round.gltf"),
    biomes: ["boss_courtyard", "crystal_gate"],
    role: "ruin",
    scaleRange: [1.5, 2.25],
    density: 6,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-plaster-wall",
    path: quaterniusMedievalAsset("Wall_Plaster_WoodGrid.gltf"),
    biomes: ["ruins_forest", "boss_courtyard"],
    role: "ruin",
    scaleRange: [1.35, 1.95],
    density: 5,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-stairs",
    path: quaterniusMedievalAsset("Stairs_Exterior_Straight.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "crystal_gate", "mine_quarry"],
    role: "landmark",
    scaleRange: [1.15, 1.7],
    density: 4,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-stone-floor",
    path: quaterniusMedievalAsset("Floor_UnevenBrick.gltf"),
    biomes: ["boss_courtyard", "crystal_gate", "mine_quarry"],
    role: "prop",
    scaleRange: [2.8, 4.4],
    density: 9,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-wood-fence",
    path: quaterniusMedievalAsset("Prop_WoodenFence_Single.gltf"),
    biomes: ["ruins_forest", "marsh", "boss_courtyard"],
    role: "prop",
    scaleRange: [1.1, 1.65],
    density: 7,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-metal-fence",
    path: quaterniusMedievalAsset("Prop_MetalFence_Simple.gltf"),
    biomes: ["boss_courtyard", "crystal_gate"],
    role: "prop",
    scaleRange: [1.25, 1.9],
    density: 5,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-vines",
    path: quaterniusMedievalAsset("Prop_Vine5.gltf"),
    biomes: ["ruins_forest", "marsh", "crystal_gate"],
    role: "prop",
    scaleRange: [1.3, 2.2],
    density: 7,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-wagon",
    path: quaterniusMedievalAsset("Prop_Wagon.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [1.05, 1.45],
    density: 3,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-lantern",
    path: quaterniusPropAsset("Lantern_Wall.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [1.1, 1.65],
    density: 7,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-crate",
    path: quaterniusPropAsset("Crate_Wooden.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [0.95, 1.35],
    density: 7,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-barrel",
    path: quaterniusPropAsset("Barrel.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [0.95, 1.35],
    density: 6,
    mobileLOD: "keep",
  },
  {
    id: "quaternius-cauldron",
    path: quaterniusPropAsset("Cauldron.gltf"),
    biomes: ["marsh", "crystal_gate"],
    role: "landmark",
    scaleRange: [1.05, 1.6],
    density: 4,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-coin-cache",
    path: quaterniusPropAsset("Coin_Pile.gltf"),
    biomes: ["boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [1.0, 1.6],
    density: 5,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-stall",
    path: quaterniusPropAsset("Stall_Empty.gltf"),
    biomes: ["ruins_forest", "boss_courtyard"],
    role: "landmark",
    scaleRange: [1.0, 1.35],
    density: 3,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-anvil",
    path: quaterniusPropAsset("Anvil_Log.gltf"),
    biomes: ["mine_quarry"],
    role: "mine",
    scaleRange: [1.0, 1.45],
    density: 5,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-workbench",
    path: quaterniusPropAsset("Workbench.gltf"),
    biomes: ["mine_quarry", "boss_courtyard"],
    role: "mine",
    scaleRange: [1.0, 1.45],
    density: 4,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-rubble-vase",
    path: quaterniusPropAsset("Vase_Rubble_Medium.gltf"),
    biomes: ["mine_quarry", "crystal_gate"],
    role: "mine",
    scaleRange: [1.0, 1.55],
    density: 7,
    mobileLOD: "reduce",
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
  void quality;
  return def.density;
}

export function buildWorldAssetInstances(biome: BiomeId, quality: QualityLevel, arenaBound: number) {
  const rand = lcg(seedForBiome(biome) + 1000);
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
