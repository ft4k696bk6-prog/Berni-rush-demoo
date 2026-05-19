import type { QualityLevel } from "./types";
import type { BiomeId } from "./worldTheme";
import { getMapDefinition, type MapId, type PropMount } from "./mapDefinitions";

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
  {
    id: "quaternius-banner",
    path: quaterniusPropAsset("Banner_1.gltf"),
    biomes: ["boss_courtyard", "crystal_gate", "ruins_forest"],
    role: "prop",
    scaleRange: [1.05, 1.4],
    density: 4,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-torch",
    path: quaterniusPropAsset("Torch_Metal.gltf"),
    biomes: ["boss_courtyard", "crystal_gate", "mine_quarry"],
    role: "prop",
    scaleRange: [1.0, 1.42],
    density: 5,
    mobileLOD: "reduce",
  },
  {
    id: "quaternius-chest",
    path: quaterniusPropAsset("Chest_Wood.gltf"),
    biomes: ["ruins_forest", "boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [1.0, 1.34],
    density: 4,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-weapon-stand",
    path: quaterniusPropAsset("WeaponStand.gltf"),
    biomes: ["boss_courtyard", "mine_quarry"],
    role: "prop",
    scaleRange: [1.0, 1.36],
    density: 4,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-bench",
    path: quaterniusPropAsset("Bench.gltf"),
    biomes: ["ruins_forest", "boss_courtyard"],
    role: "prop",
    scaleRange: [1.0, 1.42],
    density: 4,
    mobileLOD: "desktop",
  },
  {
    id: "quaternius-pickaxe",
    path: quaterniusPropAsset("Pickaxe_Bronze.gltf"),
    biomes: ["mine_quarry"],
    role: "prop",
    scaleRange: [1.1, 1.55],
    density: 3,
    mobileLOD: "desktop",
  },
];

type AuthoredPlacement = {
  id: string;
  x: number;
  z: number;
  scale?: number;
  rotation?: number;
  y?: number;
  mount?: PropMount;
  tint?: string;
};

const DEF_BY_ID = new Map(worldAssetCatalog.map(def => [def.id, def]));
const deg = (value: number) => value * Math.PI / 180;

function addRing(
  placements: AuthoredPlacement[],
  id: string,
  count: number,
  radius: number,
  scale: number,
  phase = 0,
  options: { arc?: number; center?: number; faceCenter?: boolean; y?: number } = {},
) {
  const arc = options.arc ?? Math.PI * 2;
  const center = options.center ?? 0;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / count;
    const angle = center - arc * 0.5 + t * arc + phase;
    placements.push({
      id,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      scale: scale * (0.92 + (i % 4) * 0.055),
      rotation: options.faceCenter ? -angle + Math.PI * 0.5 : angle + deg((i % 3) * 17),
      y: options.y,
    });
  }
}

function addPathDetail(placements: AuthoredPlacement[], ids: string[], points: Array<[number, number]>, scale = 1) {
  points.forEach(([x, z], index) => {
    placements.push({
      id: ids[index % ids.length],
      x,
      z,
      scale: scale * (0.9 + (index % 5) * 0.045),
      rotation: deg((index * 71) % 360),
    });
  });
}

function baseHorizon(biome: BiomeId, arenaBound: number) {
  const placements: AuthoredPlacement[] = [];
  const outer = arenaBound + 22;
  const inner = arenaBound - 10;
  const treeA = biome === "mine_quarry" || biome === "marsh" ? "quaternius-dead-tree-b" : "quaternius-pine-wall";
  const treeB = biome === "mine_quarry" ? "quaternius-dead-tree-a" : "quaternius-common-wall";
  addRing(placements, treeA, 18, outer, biome === "mine_quarry" ? 1.16 : 1.36, deg(4), { faceCenter: true });
  addRing(placements, treeB, 14, inner, biome === "mine_quarry" ? 0.92 : 1.2, deg(12), { arc: Math.PI * 1.72, center: deg(92), faceCenter: true });
  addPathDetail(placements, ["quaternius-rock-medium-a", "quaternius-pebble"], [
    [-88, -54], [-77, 42], [-64, 73], [-42, -86], [44, -82], [68, 58], [84, -38], [94, 24],
  ], 1.05);
  return placements;
}

function buildRuinsForest(arenaBound: number) {
  const p = baseHorizon("ruins_forest", arenaBound);
  addPathDetail(p, ["quaternius-stone-floor"], [[0, -24], [0, 0], [0, 24], [-22, 0], [22, 0]], 3.45);
  [
    ["quaternius-ruin-arch", 0, -42, 2.25, 0],
    ["quaternius-uneven-wall", -14, -45, 1.7, -18],
    ["quaternius-uneven-wall", 14, -45, 1.7, 18],
    ["quaternius-ruin-door", -44, 20, 1.85, 92],
    ["quaternius-plaster-wall", 46, 28, 1.55, -82],
    ["quaternius-stairs", -12, 34, 1.25, 180],
    ["quaternius-wagon", 34, -22, 1.18, -28],
    ["quaternius-bench", -33, -18, 1.18, 22],
    ["quaternius-chest", 19, 33, 1.08, 54],
    ["quaternius-lantern", -22, -38, 1.18, 15],
    ["quaternius-lantern", 22, -38, 1.18, -15],
  ].forEach(([id, x, z, scale, rot]) => p.push({ id: id as string, x: x as number, z: z as number, scale: scale as number, rotation: deg(rot as number) }));
  addPathDetail(p, ["quaternius-flowering-bush", "quaternius-bush", "quaternius-fern"], [
    [-52, -20], [-49, -9], [-58, 12], [-36, 46], [-18, 58], [36, 46], [54, 16], [58, -12], [46, -50], [-44, -54],
    [-7, -51], [10, -55], [-27, 19], [29, 15],
  ], 1.1);
  addPathDetail(p, ["quaternius-wispy-grass", "quaternius-common-grass", "quaternius-flower-cluster"], [
    [-18, -13], [-12, 18], [14, -18], [18, 14], [-35, 5], [34, -2], [-6, 38], [9, -39], [-61, 36], [62, -33],
  ], 1.0);
  return p;
}

function buildBossCourtyard(arenaBound: number) {
  const p = baseHorizon("boss_courtyard", arenaBound);
  addRing(p, "quaternius-stone-floor", 10, 18, 3.2, deg(18), { faceCenter: true, y: 0.015 });
  addRing(p, "quaternius-ruin-arch", 4, 39, 2.35, deg(45), { faceCenter: true });
  addRing(p, "quaternius-uneven-wall", 8, 52, 1.95, deg(22), { faceCenter: true });
  addRing(p, "quaternius-torch", 6, 27, 1.25, deg(30), { faceCenter: true });
  addRing(p, "quaternius-banner", 4, 47, 1.24, deg(45), { faceCenter: true });
  addPathDetail(p, ["quaternius-metal-fence"], [[-34, -18], [-34, 18], [34, -18], [34, 18]], 1.45);
  addPathDetail(p, ["quaternius-crate", "quaternius-barrel", "quaternius-weapon-stand"], [
    [-52, -8], [-48, 4], [48, -7], [51, 6], [-20, 48], [21, 50],
  ], 1.1);
  addPathDetail(p, ["quaternius-rock-medium-a", "quaternius-pebble"], [[-62, -48], [64, -45], [-67, 44], [67, 39]], 1.2);
  return p;
}

function buildMarsh(arenaBound: number) {
  const p = baseHorizon("marsh", arenaBound);
  addPathDetail(p, ["quaternius-stone-floor"], [[-18, -18], [18, 18], [-38, 20], [38, -20]], 2.4);
  addRing(p, "quaternius-dead-tree-a", 9, 58, 0.9, deg(7), { faceCenter: true });
  addRing(p, "quaternius-dead-tree-b", 7, 38, 0.78, deg(31), { arc: Math.PI * 1.55, center: deg(210), faceCenter: true });
  [
    ["quaternius-cauldron", -18, 33, 1.35, -18],
    ["quaternius-ruin-door", 42, -34, 1.55, 38],
    ["quaternius-vines", 36, -33, 1.82, 29],
    ["quaternius-wood-fence", -42, -28, 1.34, 76],
    ["quaternius-wagon", 52, 18, 1.08, -30],
  ].forEach(([id, x, z, scale, rot]) => p.push({ id: id as string, x: x as number, z: z as number, scale: scale as number, rotation: deg(rot as number) }));
  addPathDetail(p, ["quaternius-mushroom-cluster", "quaternius-bush", "quaternius-fern"], [
    [-52, 6], [-48, 18], [-28, 48], [14, 53], [47, 36], [57, -8], [29, -51], [-28, -46], [-55, -25], [8, -32],
  ], 1.14);
  addPathDetail(p, ["quaternius-wispy-grass", "quaternius-common-grass"], [
    [-24, -9], [-11, 23], [24, 8], [8, -24], [-65, 36], [63, -30], [-37, 64], [36, 61],
  ], 1.1);
  return p;
}

function buildCrystalGate(arenaBound: number) {
  const p = baseHorizon("crystal_gate", arenaBound);
  addRing(p, "quaternius-stone-floor", 8, 24, 3.0, deg(22), { faceCenter: true, y: 0.02 });
  addRing(p, "quaternius-ruin-arch", 5, 48, 2.15, deg(18), { arc: Math.PI * 1.5, center: deg(90), faceCenter: true });
  addRing(p, "quaternius-lantern", 8, 34, 1.2, deg(11), { faceCenter: true });
  addRing(p, "quaternius-vines", 5, 55, 1.7, deg(25), { faceCenter: true });
  [
    ["quaternius-ruin-door", 0, -53, 2.1, 0],
    ["quaternius-cauldron", -26, 31, 1.18, 18],
    ["quaternius-cauldron", 26, 31, 1.18, -18],
    ["quaternius-banner", -41, -17, 1.22, 65],
    ["quaternius-banner", 41, -17, 1.22, -65],
  ].forEach(([id, x, z, scale, rot]) => p.push({ id: id as string, x: x as number, z: z as number, scale: scale as number, rotation: deg(rot as number) }));
  addPathDetail(p, ["quaternius-rock-medium-a", "quaternius-rock-medium-b", "quaternius-pebble"], [
    [-58, -43], [-49, 48], [-23, 63], [22, 65], [50, 47], [61, -39], [-11, -66], [14, -65],
  ], 1.18);
  addPathDetail(p, ["quaternius-flowering-bush", "quaternius-fern"], [[-36, 7], [34, 9], [-8, 43], [9, 43]], 1.05);
  return p;
}

function buildMineQuarry(arenaBound: number) {
  const p = baseHorizon("mine_quarry", arenaBound);
  addPathDetail(p, ["quaternius-stone-floor"], [[0, -30], [0, 0], [0, 30], [-28, 0], [28, 0], [-30, -30], [30, 30]], 3.2);
  addRing(p, "quaternius-uneven-wall", 8, 58, 1.9, deg(18), { faceCenter: true });
  addRing(p, "quaternius-dead-tree-a", 6, 80, 0.82, deg(9), { faceCenter: true });
  [
    ["quaternius-stairs", 0, -58, 1.45, 0],
    ["quaternius-workbench", -28, 34, 1.22, 35],
    ["quaternius-anvil", -41, 20, 1.18, -22],
    ["quaternius-pickaxe", -33, 24, 1.25, 65],
    ["quaternius-weapon-stand", 30, 36, 1.18, -34],
    ["quaternius-chest", 47, 20, 1.12, -10],
    ["quaternius-torch", -52, -24, 1.28, 78],
    ["quaternius-torch", 52, -24, 1.28, -78],
  ].forEach(([id, x, z, scale, rot]) => p.push({ id: id as string, x: x as number, z: z as number, scale: scale as number, rotation: deg(rot as number) }));
  addPathDetail(p, ["quaternius-crate", "quaternius-barrel", "quaternius-rubble-vase"], [
    [-51, 8], [-47, 0], [-42, -10], [42, 7], [48, -2], [53, -13], [-17, 53], [17, 55], [-6, -54], [13, -51],
  ], 1.1);
  addPathDetail(p, ["quaternius-rock-medium-a", "quaternius-rock-medium-b", "quaternius-pebble"], [
    [-68, -45], [-62, 42], [-38, 68], [37, 69], [65, 45], [72, -38], [-20, -73], [24, -70], [-78, 4], [78, 6],
  ], 1.28);
  return p;
}

function mountedY(mount: PropMount | undefined, y: number | undefined) {
  if (typeof y === "number") return y;
  if (mount === "wall") return 1.75;
  if (mount === "ceiling") return 3.2;
  if (mount === "table") return 0.78;
  return 0;
}

function buildAuthoredLayout(biome: BiomeId, arenaBound: number, mapId?: MapId) {
  if (mapId) return [...baseHorizon(biome, arenaBound), ...getMapDefinition(mapId).scenery];
  if (biome === "boss_courtyard") return buildBossCourtyard(arenaBound);
  if (biome === "marsh") return buildMarsh(arenaBound);
  if (biome === "crystal_gate") return buildCrystalGate(arenaBound);
  if (biome === "mine_quarry") return buildMineQuarry(arenaBound);
  return buildRuinsForest(arenaBound);
}

export function buildWorldAssetInstances(biome: BiomeId, quality: QualityLevel, arenaBound: number, mapId?: MapId) {
  void quality;
  return buildAuthoredLayout(biome, arenaBound, mapId).flatMap((placement): WorldAssetInstance[] => {
    const def = DEF_BY_ID.get(placement.id);
    if (!def) return [];
    const fallbackScale = (def.scaleRange[0] + def.scaleRange[1]) * 0.5;
    return [{
      ...def,
      x: placement.x,
      z: placement.z,
      y: mountedY(placement.mount, placement.y),
      scale: placement.scale ?? fallbackScale,
      rotation: placement.rotation ?? 0,
      tint: placement.tint ?? def.tint,
    }];
  });
}
