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
  height?: number;
  cameraMaxY?: number;
  zoneId?: string;
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

export interface GateTriggerDefinition {
  center: [number, number];
  halfSize: [number, number];
}

export interface MapGateDefinition {
  id: string;
  label: string;
  fromRoomId: string;
  toRoomId: string;
  unlockAfter?: string;
  trigger: GateTriggerDefinition;
  blocker?: CollisionShape;
}

export interface ActiveGateTrigger {
  gate: MapGateDefinition;
  locked: boolean;
  bounds: MapBounds;
}

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
  gates?: MapGateDefinition[];
  wallSegments: MapWallSegment[];
  collisions: CollisionShape[];
  hazards: MapHazardDefinition[];
  zones: EncounterZoneDefinition[];
  scenery: MapSceneryPlacement[];
}

const deg = (value: number) => value * Math.PI / 180;
const WALL_HEIGHT = 22.0;
const WALL_THICKNESS = 4.2;

type RoomOptions = Pick<RoomDefinition, "height" | "cameraMaxY" | "zoneId">;

const room = (id: string, label: string, x: number, z: number, hx: number, hz: number, options: RoomOptions = {}): RoomDefinition => ({
  id,
  label,
  center: [x, z],
  halfSize: [hx, hz],
  ...options,
});

const wall = (id: string, x: number, z: number, width: number, depth: number, height = WALL_HEIGHT, tint?: string): MapWallSegment => ({
  id,
  center: [x, z],
  size: [width, depth],
  height,
  tint,
});

const rectCollision = (id: string, x: number, z: number, hx: number, hz: number): CollisionShape => ({
  id,
  type: "rect",
  center: [x, z],
  halfSize: [hx, hz],
});

const circleCollision = (id: string, x: number, z: number, radius: number): CollisionShape => ({
  id,
  type: "circle",
  center: [x, z],
  radius,
});

const gate = (
  id: string,
  label: string,
  fromRoomId: string,
  toRoomId: string,
  unlockAfter: string,
  x: number,
  z: number,
  hx: number,
  hz: number,
  blockerHx = hx,
  blockerHz = Math.max(1.8, hz * 0.5),
): MapGateDefinition => ({
  id,
  label,
  fromRoomId,
  toRoomId,
  unlockAfter,
  trigger: { center: [x, z], halfSize: [hx, hz] },
  blocker: rectCollision(`${id}-blocker`, x, z, blockerHx, blockerHz),
});

const perimeterWalls = (prefix: string, bounds: MapBounds, height = WALL_HEIGHT, tint?: string): MapWallSegment[] => {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const cx = (bounds.minX + bounds.maxX) * 0.5;
  const cz = (bounds.minZ + bounds.maxZ) * 0.5;

  return [
    wall(`${prefix}-west`, bounds.minX - WALL_THICKNESS * 0.5, cz, WALL_THICKNESS, depth + WALL_THICKNESS * 2, height, tint),
    wall(`${prefix}-east`, bounds.maxX + WALL_THICKNESS * 0.5, cz, WALL_THICKNESS, depth + WALL_THICKNESS * 2, height, tint),
    wall(`${prefix}-north`, cx, bounds.maxZ + WALL_THICKNESS * 0.5, width + WALL_THICKNESS * 2, WALL_THICKNESS, height, tint),
    wall(`${prefix}-south`, cx, bounds.minZ - WALL_THICKNESS * 0.5, width + WALL_THICKNESS * 2, WALL_THICKNESS, height, tint),
  ];
};

const partitionWall = (
  prefix: string,
  bounds: MapBounds,
  z: number,
  doorCenterX: number,
  doorWidth: number,
  height = WALL_HEIGHT,
  tint?: string,
): MapWallSegment[] => {
  const doorMinX = Math.max(bounds.minX, doorCenterX - doorWidth * 0.5);
  const doorMaxX = Math.min(bounds.maxX, doorCenterX + doorWidth * 0.5);
  const segments: MapWallSegment[] = [];

  if (doorMinX > bounds.minX) {
    const width = doorMinX - bounds.minX;
    segments.push(wall(`${prefix}-l`, bounds.minX + width * 0.5, z, width, WALL_THICKNESS, height, tint));
  }

  if (doorMaxX < bounds.maxX) {
    const width = bounds.maxX - doorMaxX;
    segments.push(wall(`${prefix}-r`, doorMaxX + width * 0.5, z, width, WALL_THICKNESS, height, tint));
  }

  return segments;
};

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

const roomShellWalls = (
  prefix: string,
  bounds: MapBounds,
  height = WALL_HEIGHT,
  tint?: string,
  openings: { north?: [number, number]; south?: [number, number] } = {},
): MapWallSegment[] => {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const cx = (bounds.minX + bounds.maxX) * 0.5;
  const cz = (bounds.minZ + bounds.maxZ) * 0.5;
  const north = openings.north
    ? partitionWall(`${prefix}-north`, bounds, bounds.maxZ + WALL_THICKNESS * 0.5, openings.north[0], openings.north[1], height, tint)
    : [wall(`${prefix}-north`, cx, bounds.maxZ + WALL_THICKNESS * 0.5, width + WALL_THICKNESS * 2, WALL_THICKNESS, height, tint)];
  const south = openings.south
    ? partitionWall(`${prefix}-south`, bounds, bounds.minZ - WALL_THICKNESS * 0.5, openings.south[0], openings.south[1], height, tint)
    : [wall(`${prefix}-south`, cx, bounds.minZ - WALL_THICKNESS * 0.5, width + WALL_THICKNESS * 2, WALL_THICKNESS, height, tint)];

  return [
    wall(`${prefix}-west`, bounds.minX - WALL_THICKNESS * 0.5, cz, WALL_THICKNESS, depth + WALL_THICKNESS * 2, height, tint),
    wall(`${prefix}-east`, bounds.maxX + WALL_THICKNESS * 0.5, cz, WALL_THICKNESS, depth + WALL_THICKNESS * 2, height, tint),
    ...north,
    ...south,
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
  return xs.map((x, index) => ({
    id,
    x,
    z,
    scale,
    rotation: deg(index % 2 === 0 ? 0 : 180),
    mount: "ground",
  }));
};

const sideWalls = (zValues: number[], left = -34, right = 34, id = "quaternius-uneven-wall", scale = 2.0): MapSceneryPlacement[] => {
  return zValues.flatMap((z, index) => [
    {
      id,
      x: left,
      z,
      scale,
      rotation: deg(90 + (index % 2 === 0 ? 0 : 8)),
      mount: "ground" as const,
    },
    {
      id,
      x: right,
      z,
      scale,
      rotation: deg(-90 - (index % 2 === 0 ? 0 : 8)),
      mount: "ground" as const,
    },
  ]);
};

const groundDetails = (points: Array<[string, number, number, number?, number?]>): MapSceneryPlacement[] => (
  points.map(([id, x, z, scale = 1, rot = 0]) => ({ id, x, z, scale, rotation: deg(rot), mount: "ground" }))
);

export const MAP_SEQUENCE: MapId[] = ["ruins_path", "marsh_trail", "mine_passage", "crystal_gate"];

const ruinsBounds: MapBounds = { minX: -48, maxX: 48, minZ: -108, maxZ: 108 };
const ruinsEntryBounds: MapBounds = { minX: -48, maxX: 16, minZ: 40, maxZ: 110 };
const ruinsHallBounds: MapBounds = { minX: -24, maxX: 48, minZ: -38, maxZ: 46 };
const ruinsRootBounds: MapBounds = { minX: -46, maxX: 28, minZ: -112, maxZ: -32 };
const marshBounds: MapBounds = { minX: -30, maxX: 30, minZ: -78, maxZ: 82 };
const mineBounds: MapBounds = { minX: -26, maxX: 26, minZ: -78, maxZ: 84 };
const crystalBounds: MapBounds = { minX: -30, maxX: 30, minZ: -80, maxZ: 82 };
const bossBounds: MapBounds = { minX: -42, maxX: 42, minZ: -52, maxZ: 58 };

const ruinsWalls = [
  ...roomShellWalls("ruins-entry-room", ruinsEntryBounds, 24.2, "#53614f", { south: [-8, 17] }),
  ...roomShellWalls("ruins-hall-room", ruinsHallBounds, 24.8, "#4d5e49", { north: [-8, 17], south: [14, 16] }),
  ...roomShellWalls("ruins-root-room", ruinsRootBounds, 25.2, "#3f503f", { north: [14, 16], south: [-10, 18] }),
  wall("ruins-entry-west-rootwall", -43, 74, 7.2, 52, 24.4, "#465a45"),
  wall("ruins-entry-east-rootwall", 41, 85, 7.0, 40, 23.8, "#465a45"),
  wall("ruins-hall-west-buttress", -42, 4, 7.2, 60, 24.8, "#435341"),
  wall("ruins-hall-east-buttress", 42, -3, 7.0, 54, 24.8, "#435341"),
  wall("ruins-root-west-buttress", -42, -74, 7.4, 58, 25.2, "#3f503f"),
  wall("ruins-root-east-buttress", 40, -70, 7.1, 48, 25.2, "#3f503f"),
  wall("ruins-entry-view-blocker-a", -22, 39, 24, 4.2, 24.5, "#4d5e49"),
  wall("ruins-entry-view-blocker-b", 20, 45, 22, 4.2, 24.5, "#4d5e49"),
  wall("ruins-root-view-blocker-a", -16, -31, 22, 4.2, 25.0, "#465a45"),
  wall("ruins-root-view-blocker-b", 34, -37, 18, 4.2, 25.0, "#465a45"),
];
const marshWalls = closedWalls("marsh", marshBounds, [30, -22], 13, "#425c52");
const mineWalls = closedWalls("mine", mineBounds, [34, -22], 12, "#5b5045");
const crystalWalls = closedWalls("crystal", crystalBounds, [30, -24], 12, "#5b6178");
const bossWalls = closedWalls("boss", bossBounds, [], 16, "#6b5a52");

export const MAP_DEFINITIONS: Record<MapId, MapDefinition> = {
  ruins_path: {
    id: "ruins_path",
    label: "Elderwood Ruin Enclosure",
    biome: "ruins_forest",
    start: [-18, 96],
    startAngle: Math.PI,
    exit: { position: [-10, -98], radius: 8 },
    bounds: ruinsBounds,
    rooms: [
      room("entry_clearing", "Entry Clearing", -18, 75, 32, 35, { height: 26.8, cameraMaxY: 19.4, zoneId: "entry_clearing" }),
      room("ruin_hall", "Ruin Hall", 14, 4, 36, 42, { height: 28.0, cameraMaxY: 20.2, zoneId: "ruin_hall" }),
      room("root_gate", "Root Gate", -10, -72, 36, 40, { height: 27.6, cameraMaxY: 19.8, zoneId: "root_gate" }),
    ],
    gates: [
      gate("entry_clearing_to_ruin_hall", "Root-Sealed Archway", "entry_clearing", "ruin_hall", "entry_clearing", -8, 42, 12, 6, 10.4, 2.7),
      gate("ruin_hall_to_root_gate", "Ancient Root Gate", "ruin_hall", "root_gate", "ruin_hall", 14, -34, 12, 6, 10.4, 2.7),
    ],
    wallSegments: ruinsWalls,
    collisions: [
      ...wallCollisions(ruinsWalls),
      circleCollision("ruins-entry-fallen-pillar", -31, 84, 3.2),
      circleCollision("ruins-entry-root-knot", 9, 62, 2.8),
      rectCollision("ruins-hall-broken-dais", 10, 13, 6.8, 2.8),
      circleCollision("ruins-hall-cracked-column", 28, -16, 3.1),
      rectCollision("ruins-root-braid-left", -29, -65, 3.1, 12.5),
      rectCollision("ruins-root-braid-right", 23, -82, 2.8, 11.5),
      circleCollision("ruins-root-altar-block", -8, -57, 3.2),
    ],
    hazards: [
      { id: "ruins-tree-ambush-a", type: "hostile_tree", position: [-36, 58], radius: 4.5, triggerRadius: 9.2, damage: 18, cooldownMs: 3600, windupMs: 780, scale: 0.44 },
      { id: "ruins-tree-ambush-b", type: "hostile_tree", position: [32, -20], radius: 4.7, triggerRadius: 9.6, damage: 20, cooldownMs: 4000, windupMs: 820, scale: 0.46 },
      { id: "ruins-tree-ambush-c", type: "hostile_tree", position: [-35, -84], radius: 5.0, triggerRadius: 10.2, damage: 22, cooldownMs: 4300, windupMs: 860, scale: 0.5 },
    ],
    zones: [
      {
        id: "entry_clearing",
        label: "Entry Clearing",
        center: [-18, 65],
        radius: 16,
        enemyTypes: ["basic_melee", "basic_melee", "ranged_enemy", "fast_melee"],
        spawnPoints: [[-37, 72], [2, 83], [-20, 53], [-35, 58]],
      },
      {
        id: "ruin_hall",
        label: "Ruin Hall",
        center: [14, 4],
        radius: 31,
        unlockAfter: "entry_clearing",
        enemyTypes: ["basic_melee", "fast_melee", "ranged_enemy", "tank_enemy"],
        spawnPoints: [[-6, 4], [34, 17], [16, -19], [31, -8]],
      },
      {
        id: "root_gate",
        label: "Root Gate",
        center: [-10, -72],
        radius: 29,
        unlockAfter: "ruin_hall",
        enemyTypes: ["tank_enemy", "basic_melee", "fast_melee", "ranged_enemy", "exploder_enemy"],
        spawnPoints: [[-31, -74], [11, -75], [-10, -94], [-25, -51], [14, -58]],
      },
    ],
    scenery: [
      ...sideWalls([98, 72, 42, 6, -34, -70, -102], -52, 52, "quaternius-uneven-wall", 2.22),
      ...wallRun("quaternius-ruin-arch", -102, [-34, -10, 14], 2.6),
      ...wallRun("quaternius-uneven-wall", 110, [-36, -18, 0, 18, 36], 2.6),
      ...sideWalls([84, 54, 20, -10, -48, -84], -58, 58, "quaternius-pine-wall", 1.72),
      ...groundDetails([
        ["quaternius-stone-floor", -18, 98, 3.55, 0],
        ["quaternius-stone-floor", -18, 72, 3.75, 5],
        ["quaternius-stone-floor", -5, 40, 3.15, -6],
        ["quaternius-stone-floor", 14, 14, 3.9, 0],
        ["quaternius-stone-floor", 14, -18, 3.45, 10],
        ["quaternius-stone-floor", 0, -46, 3.25, -8],
        ["quaternius-stone-floor", -10, -74, 3.95, 0],
        ["quaternius-stone-floor", -10, -100, 3.3, 0],
        ["quaternius-ruin-door", -10, -118, 2.7, 0],
        ["quaternius-ruin-arch", -8, 42, 2.2, 0],
        ["quaternius-ruin-arch", 14, -34, 2.35, 0],
        ["quaternius-stairs", 27, -35, 1.6, 90],
        ["quaternius-crate", -35, 91, 1.2, 24],
        ["quaternius-barrel", 31, 25, 1.14, -34],
        ["quaternius-bench", -30, 4, 1.24, 88],
        ["quaternius-chest", 18, -91, 1.1, -28],
        ["quaternius-flowering-bush", -43, 99, 1.32, 15],
        ["quaternius-bush", 40, 98, 1.38, -20],
        ["quaternius-vines", -45, -45, 1.8, 84],
        ["quaternius-rock-medium-a", -41, -103, 1.3, 42],
        ["quaternius-rock-medium-b", 36, -104, 1.26, -38],
      ]),
      { id: "quaternius-lantern", x: -45, z: 40, scale: 1.26, rotation: deg(90), mount: "wall", y: 2.45 },
      { id: "quaternius-lantern", x: 45, z: -34, scale: 1.26, rotation: deg(-90), mount: "wall", y: 2.45 },
      { id: "quaternius-banner", x: -8, z: 42.8, scale: 1.18, rotation: deg(0), mount: "wall", y: 3.25 },
      { id: "quaternius-banner", x: 14, z: -33.2, scale: 1.22, rotation: deg(0), mount: "wall", y: 3.35 },
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
      room("marsh-entry", "Reed Bed", -8, 56, 22, 20, { height: 22.5, cameraMaxY: 16.2, zoneId: "reed-bed" }),
      room("marsh-shrine", "Sunken Shrine", 8, 5, 24, 26, { height: 23.5, cameraMaxY: 16.8, zoneId: "sunken-shrine" }),
      room("marsh-gate", "Bog Gate", 12, -52, 23, 22, { height: 22.8, cameraMaxY: 16.2, zoneId: "bog-gate" }),
    ],
    gates: [
      gate("marsh_entry_to_shrine", "Sinking Reed Gate", "marsh-entry", "marsh-shrine", "reed-bed", 0, 30, 10, 5, 9.4, 2.4),
      gate("marsh_shrine_to_gate", "Bog Shrine Gate", "marsh-shrine", "marsh-gate", "sunken-shrine", 0, -22, 10, 5, 9.4, 2.4),
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
      room("mine-entry", "Timber Entry", 0, 58, 20, 20, { height: 23.8, cameraMaxY: 16.8, zoneId: "timber-entry" }),
      room("mine-yard", "Ore Yard", 0, 5, 22, 26, { height: 24.8, cameraMaxY: 17.2, zoneId: "ore-yard" }),
      room("mine-deep", "Deep Gate", 0, -53, 21, 22, { height: 23.8, cameraMaxY: 16.8, zoneId: "deep-gate" }),
    ],
    gates: [
      gate("mine_entry_to_yard", "Timber Lift Gate", "mine-entry", "mine-yard", "timber-entry", 0, 34, 9, 5, 8.8, 2.4),
      gate("mine_yard_to_deep", "Ore Gate", "mine-yard", "mine-deep", "ore-yard", 0, -22, 9, 5, 8.8, 2.4),
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
      room("crystal-entry", "Blue Steps", 0, 55, 24, 21, { height: 24.2, cameraMaxY: 17.0, zoneId: "blue-steps" }),
      room("crystal-crossing", "Rune Crossing", 0, 3, 25, 27, { height: 25.4, cameraMaxY: 17.8, zoneId: "rune-crossing" }),
      room("crystal-mouth", "Gate Mouth", 0, -56, 24, 22, { height: 24.6, cameraMaxY: 17.2, zoneId: "gate-mouth" }),
    ],
    gates: [
      gate("crystal_entry_to_crossing", "Blue Rune Gate", "crystal-entry", "crystal-crossing", "blue-steps", 0, 30, 10, 5, 9.4, 2.4),
      gate("crystal_crossing_to_mouth", "Crystal Mouth Gate", "crystal-crossing", "crystal-mouth", "rune-crossing", 0, -24, 10, 5, 9.4, 2.4),
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

function boundsFromRect(center: [number, number], halfSize: [number, number]): MapBounds {
  return {
    minX: center[0] - halfSize[0],
    maxX: center[0] + halfSize[0],
    minZ: center[1] - halfSize[1],
    maxZ: center[1] + halfSize[1],
  };
}

function pointInRect(center: [number, number], halfSize: [number, number], x: number, z: number) {
  return (
    x >= center[0] - halfSize[0] &&
    x <= center[0] + halfSize[0] &&
    z >= center[1] - halfSize[1] &&
    z <= center[1] + halfSize[1]
  );
}

export function getRoomBounds(mapId: MapId, roomId: string) {
  const room = getMapDefinition(mapId).rooms.find(item => item.id === roomId);
  return room ? boundsFromRect(room.center, room.halfSize) : null;
}

export function isInsideRoom(room: RoomDefinition, x: number, z: number) {
  return pointInRect(room.center, room.halfSize, x, z);
}

export function getActiveRoom(mapId: MapId, x: number, z: number) {
  return getMapDefinition(mapId).rooms.find(room => isInsideRoom(room, x, z)) ?? null;
}

export function getActiveRoomBounds(mapId: MapId, x: number, z: number) {
  const room = getActiveRoom(mapId, x, z);
  return room ? boundsFromRect(room.center, room.halfSize) : getMapDefinition(mapId).bounds;
}

export function getActiveRoomCameraMaxY(mapId: MapId, x: number, z: number) {
  const room = getActiveRoom(mapId, x, z);
  return room?.cameraMaxY ?? room?.height ?? 7.2;
}

export function getMapGates(mapId: MapId) {
  return getMapDefinition(mapId).gates ?? [];
}

export function isGateUnlocked(gate: MapGateDefinition, clearedZoneIds: string[]) {
  return !gate.unlockAfter || clearedZoneIds.includes(gate.unlockAfter);
}

export function getGateTriggerBounds(gate: MapGateDefinition) {
  return boundsFromRect(gate.trigger.center, gate.trigger.halfSize);
}

export function getActiveGateTrigger(mapId: MapId, x: number, z: number, clearedZoneIds: string[] = []): ActiveGateTrigger | null {
  const gate = getMapGates(mapId).find(item => pointInRect(item.trigger.center, item.trigger.halfSize, x, z));
  if (!gate) return null;

  return {
    gate,
    locked: !isGateUnlocked(gate, clearedZoneIds),
    bounds: getGateTriggerBounds(gate),
  };
}

export function getLockedGateCollisionShapes(mapId: MapId, clearedZoneIds: string[]) {
  return getMapGates(mapId)
    .filter(item => !isGateUnlocked(item, clearedZoneIds))
    .map(item => item.blocker ?? rectCollision(`gate-${item.id}-fallback-blocker`, item.trigger.center[0], item.trigger.center[1], item.trigger.halfSize[0], item.trigger.halfSize[1]));
}

function pointCollidesWithShapes(shapes: CollisionShape[], x: number, z: number, radius = 0.8) {
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

export function pointCollidesWithMap(mapId: MapId, x: number, z: number, radius = 0.8) {
  return pointCollidesWithShapes(getMapCollisionShapes(mapId), x, z, radius);
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

function resolveMovementAgainstShapes(
  mapId: MapId,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  radius = 0.8,
  extraShapes: CollisionShape[] = [],
): [number, number] {
  const shapes = extraShapes.length > 0
    ? [...getMapCollisionShapes(mapId), ...extraShapes]
    : getMapCollisionShapes(mapId);
  const [boundedX, boundedZ] = clampPointToMap(mapId, toX, toZ, radius);
  if (!pointCollidesWithShapes(shapes, boundedX, boundedZ, radius)) return [boundedX, boundedZ];

  const [xOnly] = clampPointToMap(mapId, boundedX, fromZ, radius);
  if (!pointCollidesWithShapes(shapes, xOnly, fromZ, radius)) return [xOnly, fromZ];

  const [, zOnly] = clampPointToMap(mapId, fromX, boundedZ, radius);
  if (!pointCollidesWithShapes(shapes, fromX, zOnly, radius)) return [fromX, zOnly];

  let x = boundedX;
  let z = boundedZ;
  for (let i = 0; i < 4; i++) {
    for (const shape of shapes) {
      [x, z] = pushOutOfShape(shape, x, z, radius);
    }
    [x, z] = clampPointToMap(mapId, x, z, radius);
  }

  return pointCollidesWithShapes(shapes, x, z, radius) ? clampPointToMap(mapId, fromX, fromZ, radius) : [x, z];
}

export function resolveMapMovement(mapId: MapId, fromX: number, fromZ: number, toX: number, toZ: number, radius = 0.8): [number, number] {
  return resolveMovementAgainstShapes(mapId, fromX, fromZ, toX, toZ, radius);
}

export function clampPlayerToProgress(mapId: MapId, fromX: number, fromZ: number, x: number, z: number, clearedZoneIds: string[], margin = 1): [number, number] {
  const map = getMapDefinition(mapId);
  if (map.gates?.length) {
    return resolveMovementAgainstShapes(
      mapId,
      fromX,
      fromZ,
      x,
      z,
      margin,
      getLockedGateCollisionShapes(mapId, clearedZoneIds),
    );
  }

  const [clampedX, clampedZ] = resolveMapMovement(mapId, fromX, fromZ, x, z, margin);
  const nextZone = getNextUnlockedZone(mapId, clearedZoneIds);
  if (!nextZone) return [clampedX, clampedZ];

  const forwardGateZ = nextZone.center[1] - nextZone.radius - 8;
  return [clampedX, Math.max(forwardGateZ, clampedZ)];
}

export function segmentHitsMapCollision(mapId: MapId, ax: number, az: number, bx: number, bz: number, radius = 0.22, clearedZoneIds: string[] = []) {
  const shapes = clearedZoneIds.length > 0
    ? [...getMapCollisionShapes(mapId), ...getLockedGateCollisionShapes(mapId, clearedZoneIds)]
    : getMapCollisionShapes(mapId);
  const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.2));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    if (pointCollidesWithShapes(shapes, x, z, radius)) return true;
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
