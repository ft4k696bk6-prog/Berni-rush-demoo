import type { EnemySubType } from "./types";
import type { BiomeId } from "./worldTheme";

export type MapId = "ruins_path" | "marsh_trail" | "mine_passage" | "crystal_gate" | "boss_courtyard";
export type PropMount = "ground" | "wall" | "post" | "ceiling" | "table";

export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MapSceneryPlacement {
  id: string;
  x: number;
  z: number;
  scale?: number;
  rotation?: number;
  y?: number;
  mount: PropMount;
  tint?: string;
}

export interface EncounterZoneDefinition {
  id: string;
  label: string;
  center: [number, number];
  radius: number;
  unlockAfter?: string;
  enemyTypes: EnemySubType[];
  spawnPoints: Array<[number, number]>;
}

export interface MapDefinition {
  id: MapId;
  label: string;
  biome: BiomeId;
  start: [number, number];
  startAngle: number;
  exit: { position: [number, number]; radius: number };
  bounds: MapBounds;
  zones: EncounterZoneDefinition[];
  scenery: MapSceneryPlacement[];
}

const deg = (value: number) => value * Math.PI / 180;

const wallRun = (id: string, z: number, xs: number[], scale = 2.25): MapSceneryPlacement[] => (
  xs.map((x, index) => ({
    id,
    x,
    z,
    scale: scale * (0.94 + (index % 3) * 0.05),
    rotation: deg(index % 2 === 0 ? 90 : -90),
    mount: "ground" as const,
  }))
);

const sideWalls = (zValues: number[], left = -34, right = 34, id = "quaternius-uneven-wall", scale = 2.0): MapSceneryPlacement[] => (
  zValues.flatMap((z, index) => [
    { id, x: left, z, scale: scale * (0.95 + (index % 3) * 0.04), rotation: deg(0), mount: "ground" as const },
    { id, x: right, z: z + (index % 2 ? 2 : -2), scale: scale * (0.95 + ((index + 1) % 3) * 0.04), rotation: deg(180), mount: "ground" as const },
  ])
);

const groundDetails = (points: Array<[string, number, number, number?, number?]>): MapSceneryPlacement[] => (
  points.map(([id, x, z, scale = 1, rot = 0]) => ({ id, x, z, scale, rotation: deg(rot), mount: "ground" }))
);

export const MAP_SEQUENCE: MapId[] = ["ruins_path", "marsh_trail", "mine_passage", "crystal_gate"];

export const MAP_DEFINITIONS: Record<MapId, MapDefinition> = {
  ruins_path: {
    id: "ruins_path",
    label: "Elderwood Road",
    biome: "ruins_forest",
    start: [0, 86],
    startAngle: Math.PI,
    exit: { position: [0, -88], radius: 8 },
    bounds: { minX: -46, maxX: 46, minZ: -100, maxZ: 96 },
    zones: [
      {
        id: "outer-gate",
        label: "Outer Gate",
        center: [0, 50],
        radius: 18,
        enemyTypes: ["basic_melee", "basic_melee", "ranged_enemy"],
        spawnPoints: [[-12, 45], [12, 42], [0, 33]],
      },
      {
        id: "broken-court",
        label: "Broken Court",
        center: [0, 8],
        radius: 20,
        unlockAfter: "outer-gate",
        enemyTypes: ["basic_melee", "fast_melee", "ranged_enemy"],
        spawnPoints: [[-18, 4], [17, 1], [-5, -10]],
      },
      {
        id: "old-arch",
        label: "Old Arch",
        center: [0, -45],
        radius: 22,
        unlockAfter: "broken-court",
        enemyTypes: ["tank_enemy", "basic_melee", "fast_melee", "ranged_enemy"],
        spawnPoints: [[-18, -48], [18, -50], [0, -64], [-8, -35]],
      },
    ],
    scenery: [
      ...sideWalls([74, 48, 20, -10, -42, -72], -35, 35, "quaternius-uneven-wall", 2.05),
      ...wallRun("quaternius-ruin-arch", -72, [-20, 0, 20], 2.35),
      ...groundDetails([
        ["quaternius-stone-floor", 0, 82, 3.3, 0],
        ["quaternius-stone-floor", 0, 48, 3.0, 0],
        ["quaternius-stone-floor", 0, 8, 3.1, 0],
        ["quaternius-stone-floor", 0, -45, 3.35, 0],
        ["quaternius-ruin-door", 0, -88, 2.35, 0],
        ["quaternius-stairs", -17, -25, 1.45, 90],
        ["quaternius-crate", -25, 61, 1.16, 24],
        ["quaternius-barrel", 24, 30, 1.12, -34],
        ["quaternius-bench", -24, -4, 1.22, 88],
        ["quaternius-chest", 24, -62, 1.08, -28],
        ["quaternius-flowering-bush", -30, 73, 1.28, 15],
        ["quaternius-bush", 30, 69, 1.35, -20],
        ["quaternius-rock-medium-a", -31, -83, 1.24, 42],
        ["quaternius-rock-medium-b", 31, -85, 1.2, -38],
      ]),
    ],
  },
  marsh_trail: {
    id: "marsh_trail",
    label: "Moonveil Marsh Trail",
    biome: "marsh",
    start: [-12, 84],
    startAngle: Math.PI,
    exit: { position: [18, -86], radius: 8 },
    bounds: { minX: -54, maxX: 54, minZ: -98, maxZ: 96 },
    zones: [
      {
        id: "reed-bed",
        label: "Reed Bed",
        center: [-12, 46],
        radius: 19,
        enemyTypes: ["fast_melee", "basic_melee", "ranged_enemy"],
        spawnPoints: [[-27, 42], [0, 40], [-13, 28]],
      },
      {
        id: "sunken-shrine",
        label: "Sunken Shrine",
        center: [12, 2],
        radius: 22,
        unlockAfter: "reed-bed",
        enemyTypes: ["ranged_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-3, 4], [25, 8], [13, -15]],
      },
      {
        id: "bog-gate",
        label: "Bog Gate",
        center: [18, -48],
        radius: 22,
        unlockAfter: "sunken-shrine",
        enemyTypes: ["tank_enemy", "ranged_enemy", "fast_melee", "basic_melee"],
        spawnPoints: [[1, -43], [31, -45], [17, -66], [28, -31]],
      },
    ],
    scenery: [
      ...sideWalls([76, 50, 22, -6, -34, -64], -39, 42, "quaternius-dead-tree-b", 1.16),
      ...groundDetails([
        ["quaternius-stone-floor", -12, 82, 2.65, 10],
        ["quaternius-stone-floor", -12, 46, 2.75, -8],
        ["quaternius-stone-floor", 12, 2, 3.1, 18],
        ["quaternius-stone-floor", 18, -48, 3.05, -12],
        ["quaternius-ruin-door", 18, -86, 2.12, 8],
        ["quaternius-cauldron", -25, -4, 1.35, -16],
        ["quaternius-vines", -33, 11, 1.8, 84],
        ["quaternius-wood-fence", 36, 26, 1.35, -65],
        ["quaternius-mushroom-cluster", -31, 55, 1.32, 12],
        ["quaternius-mushroom-cluster", 37, -54, 1.25, -22],
        ["quaternius-fern", -32, -35, 1.25, 40],
        ["quaternius-bush", 36, 70, 1.36, -16],
        ["quaternius-rock-medium-a", -38, -79, 1.35, 0],
        ["quaternius-rock-medium-b", 42, -78, 1.28, 0],
      ]),
    ],
  },
  mine_passage: {
    id: "mine_passage",
    label: "Ember Quarry Passage",
    biome: "mine_quarry",
    start: [0, 88],
    startAngle: Math.PI,
    exit: { position: [0, -88], radius: 8 },
    bounds: { minX: -40, maxX: 40, minZ: -100, maxZ: 98 },
    zones: [
      {
        id: "timber-entry",
        label: "Timber Entry",
        center: [0, 48],
        radius: 17,
        enemyTypes: ["basic_melee", "tank_enemy", "ranged_enemy"],
        spawnPoints: [[-13, 42], [13, 42], [0, 30]],
      },
      {
        id: "ore-yard",
        label: "Ore Yard",
        center: [0, 3],
        radius: 20,
        unlockAfter: "timber-entry",
        enemyTypes: ["tank_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-18, 1], [18, 0], [0, -14]],
      },
      {
        id: "deep-gate",
        label: "Deep Gate",
        center: [0, -50],
        radius: 22,
        unlockAfter: "ore-yard",
        enemyTypes: ["tank_enemy", "ranged_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-19, -47], [19, -49], [0, -68], [-9, -34]],
      },
    ],
    scenery: [
      ...sideWalls([74, 48, 22, -5, -34, -64], -31, 31, "quaternius-uneven-wall", 2.3),
      ...groundDetails([
        ["quaternius-stone-floor", 0, 82, 3.0, 0],
        ["quaternius-stone-floor", 0, 48, 3.0, 0],
        ["quaternius-stone-floor", 0, 3, 3.2, 0],
        ["quaternius-stone-floor", 0, -50, 3.35, 0],
        ["quaternius-stairs", 0, -88, 1.65, 0],
        ["quaternius-workbench", -23, 28, 1.2, 55],
        ["quaternius-anvil", -25, 12, 1.15, -28],
        ["quaternius-pickaxe", -19, 15, 1.25, 66],
        ["quaternius-weapon-stand", 24, -19, 1.16, -48],
        ["quaternius-crate", -24, -58, 1.12, 25],
        ["quaternius-barrel", 25, 58, 1.15, -30],
        ["quaternius-rubble-vase", 24, -62, 1.18, 18],
        ["quaternius-rock-medium-a", -33, -83, 1.45, 0],
        ["quaternius-rock-medium-b", 33, -82, 1.38, 0],
      ]),
    ],
  },
  crystal_gate: {
    id: "crystal_gate",
    label: "Crystal Gate",
    biome: "crystal_gate",
    start: [0, 86],
    startAngle: Math.PI,
    exit: { position: [0, -88], radius: 8 },
    bounds: { minX: -50, maxX: 50, minZ: -100, maxZ: 96 },
    zones: [
      {
        id: "blue-steps",
        label: "Blue Steps",
        center: [0, 42],
        radius: 20,
        enemyTypes: ["ranged_enemy", "basic_melee", "fast_melee"],
        spawnPoints: [[-18, 36], [18, 36], [0, 24]],
      },
      {
        id: "rune-crossing",
        label: "Rune Crossing",
        center: [0, -6],
        radius: 22,
        unlockAfter: "blue-steps",
        enemyTypes: ["ranged_enemy", "tank_enemy", "exploder_enemy"],
        spawnPoints: [[-19, -7], [19, -7], [0, -24]],
      },
      {
        id: "gate-mouth",
        label: "Gate Mouth",
        center: [0, -55],
        radius: 23,
        unlockAfter: "rune-crossing",
        enemyTypes: ["tank_enemy", "ranged_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-20, -50], [20, -50], [0, -72], [-8, -39]],
      },
    ],
    scenery: [
      ...sideWalls([72, 43, 12, -18, -48, -74], -37, 37, "quaternius-ruin-arch", 2.0),
      ...groundDetails([
        ["quaternius-stone-floor", 0, 82, 3.1, 0],
        ["quaternius-stone-floor", 0, 42, 3.2, 0],
        ["quaternius-stone-floor", 0, -6, 3.3, 0],
        ["quaternius-stone-floor", 0, -55, 3.45, 0],
        ["quaternius-ruin-door", 0, -88, 2.45, 0],
        ["quaternius-cauldron", -24, -12, 1.2, 16],
        ["quaternius-cauldron", 24, -12, 1.2, -16],
        ["quaternius-torch", -31, 42, 1.28, 0],
        ["quaternius-torch", 31, 42, 1.28, 0],
        ["quaternius-flowering-bush", -36, 65, 1.22, 30],
        ["quaternius-fern", 36, 63, 1.2, -20],
        ["quaternius-rock-medium-a", -38, -78, 1.34, 0],
        ["quaternius-rock-medium-b", 38, -78, 1.3, 0],
      ]),
    ],
  },
  boss_courtyard: {
    id: "boss_courtyard",
    label: "Sunken Boss Courtyard",
    biome: "boss_courtyard",
    start: [0, 62],
    startAngle: Math.PI,
    exit: { position: [0, -62], radius: 9 },
    bounds: { minX: -64, maxX: 64, minZ: -76, maxZ: 76 },
    zones: [
      {
        id: "dragon-ring",
        label: "Dragon Ring",
        center: [0, 0],
        radius: 48,
        enemyTypes: ["boss_dragon", "ranged_enemy", "fast_melee", "basic_melee", "tank_enemy"],
        spawnPoints: [[0, -10], [-26, 12], [26, 12], [-18, -28], [18, -28]],
      },
    ],
    scenery: [
      ...wallRun("quaternius-uneven-wall", 54, [-42, -21, 0, 21, 42], 2.15),
      ...wallRun("quaternius-uneven-wall", -54, [-42, -21, 0, 21, 42], 2.15),
      ...groundDetails([
        ["quaternius-stone-floor", 0, 48, 3.55, 0],
        ["quaternius-stone-floor", 0, 16, 3.7, 0],
        ["quaternius-stone-floor", 0, -16, 3.7, 0],
        ["quaternius-stone-floor", 0, -48, 3.55, 0],
        ["quaternius-ruin-door", 0, -66, 2.4, 0],
        ["quaternius-ruin-arch", -43, 0, 2.25, 90],
        ["quaternius-ruin-arch", 43, 0, 2.25, -90],
        ["quaternius-torch", -33, 31, 1.34, 0],
        ["quaternius-torch", 33, 31, 1.34, 0],
        ["quaternius-torch", -33, -31, 1.34, 0],
        ["quaternius-torch", 33, -31, 1.34, 0],
        ["quaternius-weapon-stand", -42, -34, 1.18, 35],
        ["quaternius-chest", 42, -34, 1.12, -35],
        ["quaternius-crate", -50, 24, 1.1, 20],
        ["quaternius-barrel", 50, 24, 1.1, -20],
      ]),
    ],
  },
};

export function getMapIdForStage(stage: number): MapId {
  if (stage > 0 && stage % 5 === 0) return "boss_courtyard";
  return MAP_SEQUENCE[(Math.max(1, stage) - 1) % MAP_SEQUENCE.length];
}

export function getMapDefinition(mapId: MapId) {
  return MAP_DEFINITIONS[mapId];
}

export function getMapForStage(stage: number) {
  return getMapDefinition(getMapIdForStage(stage));
}

export function clampPointToMap(mapId: MapId, x: number, z: number, margin = 1): [number, number] {
  const bounds = getMapDefinition(mapId).bounds;
  return [
    Math.max(bounds.minX + margin, Math.min(bounds.maxX - margin, x)),
    Math.max(bounds.minZ + margin, Math.min(bounds.maxZ - margin, z)),
  ];
}

export function clampPlayerToProgress(mapId: MapId, x: number, z: number, clearedZoneIds: string[], margin = 1): [number, number] {
  const [clampedX, clampedZ] = clampPointToMap(mapId, x, z, margin);
  const nextZone = getNextUnlockedZone(mapId, clearedZoneIds);
  if (!nextZone) return [clampedX, clampedZ];

  const forwardGateZ = nextZone.center[1] - nextZone.radius - 8;
  return [clampedX, Math.max(forwardGateZ, clampedZ)];
}

export function getZoneEnemyTypes(stage: number, mapId: MapId, zoneId: string) {
  const zone = getMapDefinition(mapId).zones.find(item => item.id === zoneId);
  if (!zone) return [] as EnemySubType[];
  const types = [...zone.enemyTypes];
  const isBossZone = types.some(type => type === "boss_dragon" || type === "boss10" || type === "boss20");
  if (!isBossZone) {
    const bonus = Math.min(3, Math.floor(Math.max(0, stage - 1) / 3));
    for (let i = 0; i < bonus; i++) types.push(zone.enemyTypes[i % zone.enemyTypes.length]);
  }
  return types;
}

export function getMapEnemyTotalForStage(stage: number, mapId = getMapIdForStage(stage)) {
  return getMapDefinition(mapId).zones.reduce((total, zone) => total + getZoneEnemyTypes(stage, mapId, zone.id).length, 0);
}

export function getMapWaveCountForStage(stage: number, mapId = getMapIdForStage(stage)) {
  return getMapDefinition(mapId).zones.length;
}

export function getNextUnlockedZone(mapId: MapId, clearedZoneIds: string[]) {
  const cleared = new Set(clearedZoneIds);
  return getMapDefinition(mapId).zones.find(zone => !cleared.has(zone.id) && (!zone.unlockAfter || cleared.has(zone.unlockAfter))) ?? null;
}

export function isInsideZone(zone: EncounterZoneDefinition, x: number, z: number) {
  const dx = zone.center[0] - x;
  const dz = zone.center[1] - z;
  return dx * dx + dz * dz <= zone.radius * zone.radius;
}

export function isAtExit(mapId: MapId, x: number, z: number) {
  const exit = getMapDefinition(mapId).exit;
  const dx = exit.position[0] - x;
  const dz = exit.position[1] - z;
  return dx * dx + dz * dz <= exit.radius * exit.radius;
}
