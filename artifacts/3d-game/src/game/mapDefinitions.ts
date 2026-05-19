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

export interface RoomDefinition {
  id: string;
  label: string;
  center: [number, number];
  halfSize: [number, number];
}

export interface MapWallSegment {
  id: string;
  center: [number, number];
  size: [number, number];
  height: number;
  y?: number;
  tint?: string;
}

export type CollisionShape =
  | { id: string; type: "rect"; center: [number, number]; halfSize: [number, number] }
  | { id: string; type: "circle"; center: [number, number]; radius: number };

export interface MapHazardDefinition {
  id: string;
  type: "hostile_tree";
  position: [number, number];
  radius: number;
  triggerRadius: number;
  damage: number;
  cooldownMs: number;
  windupMs: number;
  scale: number;
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
  rooms: RoomDefinition[];
  wallSegments: MapWallSegment[];
  collisions: CollisionShape[];
  hazards: MapHazardDefinition[];
  zones: EncounterZoneDefinition[];
  scenery: MapSceneryPlacement[];
}

const deg = (value: number) => value * Math.PI / 180;
const WALL_HEIGHT = 6.4;
const WALL_THICKNESS = 2.2;

const room = (id: string, label: string, x: number, z: number, hx: number, hz: number): RoomDefinition => ({
  id,
  label,
  center: [x, z],
  halfSize: [hx, hz],
});

const wall = (id: string, x: number, z: number, width: number, depth: number, height = WALL_HEIGHT, tint?: string): MapWallSegment => ({
  id,
  center: [x, z],
  size: [width, depth],
  height,
  tint,
});

const closedWalls = (
  prefix: string,
  bounds: MapBounds,
  partitionZ: number[] = [],
  doorWidth = 11,
  tint?: string,
): MapWallSegment[] => {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const cx = (bounds.minX + bounds.maxX) * 0.5;
  const cz = (bounds.minZ + bounds.maxZ) * 0.5;
  const leftX = bounds.minX - WALL_THICKNESS * 0.5;
  const rightX = bounds.maxX + WALL_THICKNESS * 0.5;
  const sideLength = Math.max(1, (width - doorWidth) * 0.5);
  const leftPartitionX = bounds.minX + sideLength * 0.5;
  const rightPartitionX = bounds.maxX - sideLength * 0.5;

  return [
    wall(`${prefix}-west`, leftX, cz, WALL_THICKNESS, depth + WALL_THICKNESS * 2, WALL_HEIGHT, tint),
    wall(`${prefix}-east`, rightX, cz, WALL_THICKNESS, depth + WALL_THICKNESS * 2, WALL_HEIGHT, tint),
    wall(`${prefix}-north`, cx, bounds.maxZ + WALL_THICKNESS * 0.5, width + WALL_THICKNESS * 2, WALL_THICKNESS, WALL_HEIGHT, tint),
    wall(`${prefix}-south`, cx, bounds.minZ - WALL_THICKNESS * 0.5, width + WALL_THICKNESS * 2, WALL_THICKNESS, WALL_HEIGHT, tint),
    ...partitionZ.flatMap((z, index) => [
      wall(`${prefix}-partition-${index}-l`, leftPartitionX, z, sideLength, WALL_THICKNESS, WALL_HEIGHT, tint),
      wall(`${prefix}-partition-${index}-r`, rightPartitionX, z, sideLength, WALL_THICKNESS, WALL_HEIGHT, tint),
    ]),
  ];
};

const wallCollisions = (walls: MapWallSegment[]): CollisionShape[] => (
  walls.map(segment => ({
    id: `wall-${segment.id}`,
    type: "rect" as const,
    center: segment.center,
    halfSize: [segment.size[0] * 0.5, segment.size[1] * 0.5] as [number, number],
  }))
);

const wallRun = (id: string, z: number, xs: number[], scale = 2.25): MapSceneryPlacement[] => {
  void id; void z; void xs; void scale;
  return [];
};

const sideWalls = (zValues: number[], left = -34, right = 34, id = "quaternius-uneven-wall", scale = 2.0): MapSceneryPlacement[] => {
  void zValues; void left; void right; void id; void scale;
  return [];
};

const groundDetails = (points: Array<[string, number, number, number?, number?]>): MapSceneryPlacement[] => (
  points.map(([id, x, z, scale = 1, rot = 0]) => ({ id, x, z, scale, rotation: deg(rot), mount: "ground" }))
);

export const MAP_SEQUENCE: MapId[] = ["ruins_path", "marsh_trail", "mine_passage", "crystal_gate"];

const ruinsBounds: MapBounds = { minX: -28, maxX: 28, minZ: -78, maxZ: 84 };
const marshBounds: MapBounds = { minX: -30, maxX: 30, minZ: -78, maxZ: 82 };
const mineBounds: MapBounds = { minX: -26, maxX: 26, minZ: -78, maxZ: 84 };
const crystalBounds: MapBounds = { minX: -30, maxX: 30, minZ: -80, maxZ: 82 };
const bossBounds: MapBounds = { minX: -42, maxX: 42, minZ: -52, maxZ: 58 };

const ruinsWalls = closedWalls("ruins", ruinsBounds, [34, -24], 12, "#53614f");
const marshWalls = closedWalls("marsh", marshBounds, [30, -22], 13, "#425c52");
const mineWalls = closedWalls("mine", mineBounds, [34, -22], 12, "#5b5045");
const crystalWalls = closedWalls("crystal", crystalBounds, [30, -24], 12, "#5b6178");
const bossWalls = closedWalls("boss", bossBounds, [], 16, "#6b5a52");

export const MAP_DEFINITIONS: Record<MapId, MapDefinition> = {
  ruins_path: {
    id: "ruins_path",
    label: "Elderwood Road",
    biome: "ruins_forest",
    start: [0, 72],
    startAngle: Math.PI,
    exit: { position: [0, -70], radius: 7 },
    bounds: ruinsBounds,
    rooms: [
      room("ruins-entry", "Entry Hall", 0, 58, 22, 20),
      room("ruins-court", "Broken Court", 0, 4, 24, 28),
      room("ruins-sanctum", "Old Arch", 0, -54, 23, 22),
    ],
    wallSegments: ruinsWalls,
    collisions: [
      ...wallCollisions(ruinsWalls),
      { id: "ruins-crate-block", type: "circle", center: [-22, 58], radius: 2.2 },
      { id: "ruins-chest-block", type: "circle", center: [21, -58], radius: 2.1 },
    ],
    hazards: [
      { id: "ruins-tree-ambush-a", type: "hostile_tree", position: [-21, 38], radius: 4.2, triggerRadius: 8.6, damage: 18, cooldownMs: 3600, windupMs: 780, scale: 0.42 },
      { id: "ruins-tree-ambush-b", type: "hostile_tree", position: [21, -30], radius: 4.6, triggerRadius: 9.2, damage: 21, cooldownMs: 4100, windupMs: 820, scale: 0.46 },
    ],
    zones: [
      {
        id: "outer-gate",
        label: "Outer Gate",
        center: [0, 58],
        radius: 18,
        enemyTypes: ["basic_melee", "basic_melee", "ranged_enemy"],
        spawnPoints: [[-15, 48], [15, 47], [0, 41]],
      },
      {
        id: "broken-court",
        label: "Broken Court",
        center: [0, 4],
        radius: 22,
        unlockAfter: "outer-gate",
        enemyTypes: ["basic_melee", "fast_melee", "ranged_enemy"],
        spawnPoints: [[-18, -6], [18, -7], [0, -16]],
      },
      {
        id: "old-arch",
        label: "Old Arch",
        center: [0, -54],
        radius: 21,
        unlockAfter: "broken-court",
        enemyTypes: ["tank_enemy", "basic_melee", "fast_melee", "ranged_enemy"],
        spawnPoints: [[-18, -58], [18, -59], [0, -69], [-10, -43]],
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
    start: [-12, 70],
    startAngle: Math.PI,
    exit: { position: [14, -70], radius: 7 },
    bounds: marshBounds,
    rooms: [
      room("marsh-entry", "Reed Bed", -8, 56, 22, 20),
      room("marsh-shrine", "Sunken Shrine", 8, 5, 24, 26),
      room("marsh-gate", "Bog Gate", 12, -52, 23, 22),
    ],
    wallSegments: marshWalls,
    collisions: [
      ...wallCollisions(marshWalls),
      { id: "marsh-cauldron-block", type: "circle", center: [-22, -4], radius: 2.2 },
      { id: "marsh-rock-block", type: "circle", center: [-24, -66], radius: 2.4 },
    ],
    hazards: [
      { id: "marsh-tree-ambush-a", type: "hostile_tree", position: [-23, 31], radius: 4.4, triggerRadius: 9.5, damage: 20, cooldownMs: 3900, windupMs: 860, scale: 0.4 },
      { id: "marsh-tree-ambush-b", type: "hostile_tree", position: [24, -32], radius: 4.8, triggerRadius: 9.4, damage: 22, cooldownMs: 4300, windupMs: 900, scale: 0.43 },
    ],
    zones: [
      {
        id: "reed-bed",
        label: "Reed Bed",
        center: [-8, 56],
        radius: 19,
        enemyTypes: ["fast_melee", "basic_melee", "ranged_enemy"],
        spawnPoints: [[-22, 49], [7, 46], [-10, 37]],
      },
      {
        id: "sunken-shrine",
        label: "Sunken Shrine",
        center: [8, 5],
        radius: 22,
        unlockAfter: "reed-bed",
        enemyTypes: ["ranged_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-9, -3], [23, -1], [8, -17]],
      },
      {
        id: "bog-gate",
        label: "Bog Gate",
        center: [12, -52],
        radius: 22,
        unlockAfter: "sunken-shrine",
        enemyTypes: ["tank_enemy", "ranged_enemy", "fast_melee", "basic_melee"],
        spawnPoints: [[-5, -51], [26, -54], [12, -67], [23, -39]],
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
    start: [0, 72],
    startAngle: Math.PI,
    exit: { position: [0, -70], radius: 7 },
    bounds: mineBounds,
    rooms: [
      room("mine-entry", "Timber Entry", 0, 58, 20, 20),
      room("mine-yard", "Ore Yard", 0, 5, 22, 26),
      room("mine-deep", "Deep Gate", 0, -53, 21, 22),
    ],
    wallSegments: mineWalls,
    collisions: [
      ...wallCollisions(mineWalls),
      { id: "mine-workbench-block", type: "circle", center: [-19, 25], radius: 2.2 },
      { id: "mine-weapon-stand-block", type: "circle", center: [20, -18], radius: 1.9 },
    ],
    hazards: [],
    zones: [
      {
        id: "timber-entry",
        label: "Timber Entry",
        center: [0, 58],
        radius: 17,
        enemyTypes: ["basic_melee", "tank_enemy", "ranged_enemy"],
        spawnPoints: [[-15, 49], [15, 48], [0, 39]],
      },
      {
        id: "ore-yard",
        label: "Ore Yard",
        center: [0, 5],
        radius: 20,
        unlockAfter: "timber-entry",
        enemyTypes: ["tank_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-17, -3], [17, -4], [0, -17]],
      },
      {
        id: "deep-gate",
        label: "Deep Gate",
        center: [0, -53],
        radius: 22,
        unlockAfter: "ore-yard",
        enemyTypes: ["tank_enemy", "ranged_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-17, -55], [17, -56], [0, -68], [-9, -40]],
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
    start: [0, 72],
    startAngle: Math.PI,
    exit: { position: [0, -72], radius: 7 },
    bounds: crystalBounds,
    rooms: [
      room("crystal-entry", "Blue Steps", 0, 55, 24, 21),
      room("crystal-crossing", "Rune Crossing", 0, 3, 25, 27),
      room("crystal-mouth", "Gate Mouth", 0, -56, 24, 22),
    ],
    wallSegments: crystalWalls,
    collisions: [
      ...wallCollisions(crystalWalls),
      { id: "crystal-cauldron-left", type: "circle", center: [-22, -10], radius: 2.1 },
      { id: "crystal-cauldron-right", type: "circle", center: [22, -10], radius: 2.1 },
    ],
    hazards: [],
    zones: [
      {
        id: "blue-steps",
        label: "Blue Steps",
        center: [0, 55],
        radius: 20,
        enemyTypes: ["ranged_enemy", "basic_melee", "fast_melee"],
        spawnPoints: [[-19, 47], [19, 47], [0, 37]],
      },
      {
        id: "rune-crossing",
        label: "Rune Crossing",
        center: [0, 3],
        radius: 22,
        unlockAfter: "blue-steps",
        enemyTypes: ["ranged_enemy", "tank_enemy", "exploder_enemy"],
        spawnPoints: [[-19, -5], [19, -6], [0, -18]],
      },
      {
        id: "gate-mouth",
        label: "Gate Mouth",
        center: [0, -56],
        radius: 23,
        unlockAfter: "rune-crossing",
        enemyTypes: ["tank_enemy", "ranged_enemy", "fast_melee", "exploder_enemy"],
        spawnPoints: [[-20, -58], [20, -58], [0, -72], [-8, -42]],
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
    start: [0, 42],
    startAngle: Math.PI,
    exit: { position: [0, -45], radius: 8 },
    bounds: bossBounds,
    rooms: [
      room("boss-arena", "Dragon Ring", 0, 2, 36, 45),
    ],
    wallSegments: bossWalls,
    collisions: [
      ...wallCollisions(bossWalls),
      { id: "boss-left-arch-block", type: "circle", center: [-35, 0], radius: 3.2 },
      { id: "boss-right-arch-block", type: "circle", center: [35, 0], radius: 3.2 },
    ],
    hazards: [],
    zones: [
      {
        id: "dragon-ring",
        label: "Dragon Ring",
        center: [0, 0],
        radius: 36,
        enemyTypes: ["boss_dragon", "ranged_enemy", "fast_melee", "basic_melee", "tank_enemy"],
        spawnPoints: [[0, -14], [-26, 14], [26, 14], [-18, -28], [18, -28]],
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

export function getMapCollisionShapes(mapId: MapId) {
  return getMapDefinition(mapId).collisions;
}

export function pointCollidesWithMap(mapId: MapId, x: number, z: number, radius = 0.8) {
  const shapes = getMapCollisionShapes(mapId);
  return shapes.some(shape => {
    if (shape.type === "circle") {
      const dx = x - shape.center[0];
      const dz = z - shape.center[1];
      return dx * dx + dz * dz < (shape.radius + radius) ** 2;
    }

    return (
      x > shape.center[0] - shape.halfSize[0] - radius &&
      x < shape.center[0] + shape.halfSize[0] + radius &&
      z > shape.center[1] - shape.halfSize[1] - radius &&
      z < shape.center[1] + shape.halfSize[1] + radius
    );
  });
}

function pushOutOfShape(shape: CollisionShape, x: number, z: number, radius: number): [number, number] {
  if (shape.type === "circle") {
    const dx = x - shape.center[0];
    const dz = z - shape.center[1];
    const minDist = shape.radius + radius;
    const dist = Math.max(0.0001, Math.hypot(dx, dz));
    if (dist >= minDist) return [x, z];
    return [shape.center[0] + (dx / dist) * minDist, shape.center[1] + (dz / dist) * minDist];
  }

  const minX = shape.center[0] - shape.halfSize[0] - radius;
  const maxX = shape.center[0] + shape.halfSize[0] + radius;
  const minZ = shape.center[1] - shape.halfSize[1] - radius;
  const maxZ = shape.center[1] + shape.halfSize[1] + radius;
  if (x <= minX || x >= maxX || z <= minZ || z >= maxZ) return [x, z];

  const left = Math.abs(x - minX);
  const right = Math.abs(maxX - x);
  const bottom = Math.abs(z - minZ);
  const top = Math.abs(maxZ - z);
  const smallest = Math.min(left, right, bottom, top);
  if (smallest === left) return [minX, z];
  if (smallest === right) return [maxX, z];
  if (smallest === bottom) return [x, minZ];
  return [x, maxZ];
}

export function resolveMapMovement(mapId: MapId, fromX: number, fromZ: number, toX: number, toZ: number, radius = 0.8): [number, number] {
  const [boundedX, boundedZ] = clampPointToMap(mapId, toX, toZ, radius);
  if (!pointCollidesWithMap(mapId, boundedX, boundedZ, radius)) return [boundedX, boundedZ];

  const [xOnly] = clampPointToMap(mapId, boundedX, fromZ, radius);
  if (!pointCollidesWithMap(mapId, xOnly, fromZ, radius)) return [xOnly, fromZ];

  const [, zOnly] = clampPointToMap(mapId, fromX, boundedZ, radius);
  if (!pointCollidesWithMap(mapId, fromX, zOnly, radius)) return [fromX, zOnly];

  let x = boundedX;
  let z = boundedZ;
  for (let i = 0; i < 4; i++) {
    for (const shape of getMapCollisionShapes(mapId)) {
      [x, z] = pushOutOfShape(shape, x, z, radius);
    }
    [x, z] = clampPointToMap(mapId, x, z, radius);
  }

  return pointCollidesWithMap(mapId, x, z, radius) ? clampPointToMap(mapId, fromX, fromZ, radius) : [x, z];
}

export function clampPlayerToProgress(mapId: MapId, fromX: number, fromZ: number, x: number, z: number, clearedZoneIds: string[], margin = 1): [number, number] {
  const [clampedX, clampedZ] = resolveMapMovement(mapId, fromX, fromZ, x, z, margin);
  const nextZone = getNextUnlockedZone(mapId, clearedZoneIds);
  if (!nextZone) return [clampedX, clampedZ];

  const forwardGateZ = nextZone.center[1] - nextZone.radius - 8;
  return [clampedX, Math.max(forwardGateZ, clampedZ)];
}

export function segmentHitsMapCollision(mapId: MapId, ax: number, az: number, bx: number, bz: number, radius = 0.22) {
  const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.2));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    if (pointCollidesWithMap(mapId, x, z, radius)) return true;
  }
  return false;
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
