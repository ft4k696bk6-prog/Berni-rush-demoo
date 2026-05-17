import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { ARENA_BOUND } from "./balance";
import { EnvironmentAssetModel } from "./AssetModels";
import { useGameStore } from "./useGameStore";
import { BIOME_THEMES, BiomeId, getBiomeForStage, getTextureSize } from "./worldTheme";
import type { QualityLevel } from "./types";

const VISUAL_MARGIN = 64;
const VISUAL_BOUND = ARENA_BOUND + VISUAL_MARGIN;
const VISUAL_SIZE = VISUAL_BOUND * 2;
const KENNEY = "/assets/kenney/";
const TERRAIN_DETAIL_TEXTURE = "/assets/textures/ambientcg/Ground076_PREVIEW.png";
const natureAsset = (name: string) => `${KENNEY}nature/${name}`;
const townAsset = (name: string) => `${KENNEY}fantasy-town/${name}`;
const dungeonAsset = (name: string) => `${KENNEY}dungeon/${name}`;

function lcg(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

type AssetProp = {
  path: string;
  x: number;
  z: number;
  scale: number;
  rot: number;
  biomes: BiomeId[];
  tint?: string;
};

const DECOR = (() => {
  const rand = lcg(177);
  const trees: Array<{ x: number; z: number; h: number; hue: number; biomes: BiomeId[] }> = [];
  const rocks: Array<{ x: number; z: number; s: number; rot: number; biomes: BiomeId[] }> = [];
  const flowers: Array<{ x: number; z: number; color: string; biomes: BiomeId[] }> = [];
  const grass: Array<{ x: number; z: number; s: number; rot: number; color: string; biomes: BiomeId[] }> = [];
  const bushes: Array<{ x: number; z: number; s: number; hue: number; biomes: BiomeId[] }> = [];
  const roadScuffs: Array<{ x: number; z: number; w: number; d: number; rot: number; opacity: number }> = [];
  const ruins: Array<{ x: number; z: number; s: number; rot: number; broken: number; biomes: BiomeId[] }> = [];
  const ponds: Array<{ x: number; z: number; rx: number; rz: number; rot: number; biomes: BiomeId[] }> = [];
  const crystals: Array<{ x: number; z: number; s: number; rot: number; biomes: BiomeId[] }> = [];
  const horizonTrees: Array<{ x: number; z: number; h: number; hue: number; rot: number; biomes: BiomeId[] }> = [];
  const ridges: Array<{ x: number; z: number; w: number; h: number; d: number; rot: number; tone: number; biomes: BiomeId[] }> = [];
  const assets: AssetProp[] = [];

  const colors = ["#e8c96a", "#d8e0b8", "#d39d79", "#f0e3bc"];
  const grassColors = ["#426f47", "#4b7d50", "#51744a", "#3f6545"];
  const treeAssets = [
    natureAsset("tree_detailed.glb"),
    natureAsset("tree_oak.glb"),
    natureAsset("tree_pineRoundA.glb"),
    natureAsset("tree_pineRoundB.glb"),
    natureAsset("tree_pineRoundC.glb"),
    natureAsset("tree_pineRoundD.glb"),
    natureAsset("tree_pineTallA_detailed.glb"),
    natureAsset("tree_pineTallB_detailed.glb"),
  ];
  const bushAssets = [
    natureAsset("plant_bush.glb"),
    natureAsset("plant_bushDetailed.glb"),
    natureAsset("plant_bushLarge.glb"),
    natureAsset("plant_bushSmall.glb"),
    townAsset("hedge.glb"),
    townAsset("hedge-large.glb"),
  ];
  const rockAssets = [
    natureAsset("rock_largeA.glb"),
    natureAsset("rock_largeB.glb"),
    natureAsset("rock_largeC.glb"),
    natureAsset("rock_largeD.glb"),
    natureAsset("rock_smallA.glb"),
    natureAsset("rock_smallB.glb"),
    natureAsset("stone_largeA.glb"),
    natureAsset("stone_largeB.glb"),
    townAsset("rock-large.glb"),
    townAsset("rock-small.glb"),
  ];
  const plantAssets = [
    natureAsset("grass_leafs.glb"),
    natureAsset("grass_leafsLarge.glb"),
    natureAsset("flower_yellowA.glb"),
    natureAsset("flower_yellowB.glb"),
    natureAsset("flower_yellowC.glb"),
  ];
  const ruinAssets = [
    townAsset("wall-broken.glb"),
    townAsset("wall-wood-broken.glb"),
    townAsset("wall-arch.glb"),
    townAsset("wall-arch-top.glb"),
    townAsset("wall-corner.glb"),
    townAsset("wall-corner-detail.glb"),
    townAsset("pillar-stone.glb"),
    townAsset("stairs-stone.glb"),
    townAsset("fountain-round.glb"),
    natureAsset("statue_block.glb"),
    natureAsset("statue_column.glb"),
    natureAsset("statue_columnDamaged.glb"),
    natureAsset("statue_head.glb"),
    natureAsset("statue_ring.glb"),
  ];
  const mineAssets = [
    dungeonAsset("template-wall.glb"),
    dungeonAsset("template-wall-corner.glb"),
    dungeonAsset("template-wall-detail-a.glb"),
    dungeonAsset("template-floor-detail.glb"),
    dungeonAsset("gate.glb"),
    dungeonAsset("gate-metal-bars.glb"),
    natureAsset("log_large.glb"),
    natureAsset("log_stack.glb"),
  ];

  for (let i = 0; i < 42; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 4);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 4);
    if (Math.hypot(x, z) < 19) continue;
    const nearEdge = Math.abs(x) > ARENA_BOUND - 12 || Math.abs(z) > ARENA_BOUND - 12;
    trees.push({
      x,
      z,
      h: 2.15 + rand() * 1.75,
      hue: rand(),
      biomes: nearEdge ? ["ruins", "marsh"] : ["ruins"],
    });
  }

  for (let i = 0; i < 58; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    rocks.push({
      x,
      z,
      s: 0.38 + rand() * 0.92,
      rot: rand() * Math.PI,
      biomes: rand() > 0.5 ? ["ruins", "boss_arena", "crystal_arena", "mine"] : ["mine", "marsh"],
    });
  }

  for (let i = 0; i < 46; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    flowers.push({
      x,
      z,
      color: colors[Math.floor(rand() * colors.length)],
      biomes: ["ruins", "marsh"],
    });
  }

  for (let i = 0; i < 180; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 4);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 4);
    if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
    grass.push({
      x,
      z,
      s: 0.34 + rand() * 0.75,
      rot: rand() * Math.PI,
      color: grassColors[Math.floor(rand() * grassColors.length)],
      biomes: rand() > 0.16 ? ["ruins", "marsh"] : ["boss_arena"],
    });
  }

  for (let i = 0; i < 30; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 7);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 7);
    if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
    bushes.push({ x, z, s: 0.5 + rand() * 0.9, hue: rand(), biomes: ["ruins", "marsh"] });
  }

  const roadScuffSteps = Math.ceil((ARENA_BOUND - 3) / 3.1);
  for (let i = -roadScuffSteps; i <= roadScuffSteps; i++) {
    const wobble = Math.sin(i * 0.9) * 1.4;
    roadScuffs.push({
      x: i * 3.1 + (rand() - 0.5) * 1.1,
      z: wobble + (rand() - 0.5) * 0.9,
      w: 1.1 + rand() * 2.8,
      d: 0.36 + rand() * 0.82,
      rot: Math.sin(i * 0.5) * 0.12,
      opacity: 0.16 + rand() * 0.15,
    });
    roadScuffs.push({
      x: wobble * 0.72 + (rand() - 0.5) * 0.9,
      z: i * 3.1 + (rand() - 0.5) * 1.1,
      w: 0.36 + rand() * 0.82,
      d: 1.1 + rand() * 2.8,
      rot: Math.cos(i * 0.55) * 0.14,
      opacity: 0.16 + rand() * 0.15,
    });
  }

  for (let i = 0; i < 18; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 10);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 10);
    if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
    ruins.push({
      x,
      z,
      s: 0.74 + rand() * 1.45,
      rot: rand() * Math.PI,
      broken: rand(),
      biomes: rand() > 0.35 ? ["ruins", "boss_arena", "crystal_arena"] : ["mine"],
    });
  }

  for (let i = 0; i < 8; i++) {
    ponds.push({
      x: (rand() * 2 - 1) * (ARENA_BOUND - 11),
      z: (rand() * 2 - 1) * (ARENA_BOUND - 11),
      rx: 1.4 + rand() * 3.1,
      rz: 0.7 + rand() * 1.4,
      rot: rand() * Math.PI,
      biomes: ["marsh"],
    });
  }

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    crystals.push({
      x: Math.cos(angle) * (11 + rand() * 19),
      z: Math.sin(angle) * (11 + rand() * 19),
      s: 0.6 + rand() * 1.35,
      rot: angle,
      biomes: ["crystal_arena", "boss_arena", "mine"],
    });
  }

  for (let i = 0; i < 64; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 13 + rand() * (ARENA_BOUND - 17);
    const x = Math.cos(angle) * radius + (rand() - 0.5) * 3.5;
    const z = Math.sin(angle) * radius + (rand() - 0.5) * 3.5;
    const groupRoll = rand();
    const path = groupRoll > 0.76
      ? treeAssets[Math.floor(rand() * treeAssets.length)]
      : groupRoll > 0.5
        ? bushAssets[Math.floor(rand() * bushAssets.length)]
        : groupRoll > 0.2
          ? rockAssets[Math.floor(rand() * rockAssets.length)]
          : plantAssets[Math.floor(rand() * plantAssets.length)];
    assets.push({
      path,
      x,
      z,
      scale: path.includes("tree_") ? 1.2 + rand() * 0.55 : path.includes("rock") || path.includes("stone") ? 0.8 + rand() * 0.55 : 0.75 + rand() * 0.42,
      rot: rand() * Math.PI * 2,
      biomes: path.includes("tree_") || path.includes("plant_") || path.includes("grass_") || path.includes("flower_") || path.includes("hedge")
        ? ["ruins", "marsh"]
        : ["ruins", "boss_arena", "marsh", "crystal_arena", "mine"],
      tint: path.includes("tree_") ? "#4a8756" : path.includes("plant_") || path.includes("grass_") || path.includes("flower_") || path.includes("hedge") ? "#58a66a" : path.includes("rock") || path.includes("stone") ? "#858b7d" : undefined,
    });
  }

  for (let i = 0; i < 34; i++) {
    const bossArena = i % 5 === 0;
    const mine = i % 4 === 0;
    const path = mine ? mineAssets[Math.floor(rand() * mineAssets.length)] : ruinAssets[Math.floor(rand() * ruinAssets.length)];
    let x = 0;
    let z = 0;
    for (let tries = 0; tries < 8; tries++) {
      x = (rand() * 2 - 1) * (ARENA_BOUND - 12);
      z = (rand() * 2 - 1) * (ARENA_BOUND - 12);
      if (Math.hypot(x, z) > (bossArena ? 8 : 13)) break;
    }
    assets.push({
      path,
      x,
      z,
      scale: path.includes("dungeon") ? 1.45 + rand() * 0.35 : path.includes("fountain") ? 1.05 + rand() * 0.28 : 0.9 + rand() * 0.4,
      rot: rand() * Math.PI * 2,
      biomes: mine ? ["mine"] : bossArena ? ["boss_arena", "crystal_arena"] : ["ruins", "boss_arena", "crystal_arena", "mine"],
      tint: mine ? "#796f63" : path.includes("wood") || path.includes("planks") ? "#9a6b46" : "#868479",
    });
  }

  for (let i = 0; i < 78; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = ARENA_BOUND + 10 + rand() * (VISUAL_MARGIN - 18);
    horizonTrees.push({
      x: Math.cos(angle) * radius + (rand() - 0.5) * 8,
      z: Math.sin(angle) * radius + (rand() - 0.5) * 8,
      h: 3.4 + rand() * 3.8,
      hue: rand(),
      rot: rand() * Math.PI * 2,
      biomes: rand() > 0.16 ? ["ruins", "marsh"] : ["boss_arena", "crystal_arena", "mine"],
    });
  }

  for (let i = 0; i < 54; i++) {
    const angle = (i / 54) * Math.PI * 2 + (rand() - 0.5) * 0.08;
    const radius = ARENA_BOUND + 33 + rand() * (VISUAL_MARGIN - 38);
    ridges.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      w: 4.2 + rand() * 8.5,
      h: 1.8 + rand() * 5.8,
      d: 3.6 + rand() * 7.4,
      rot: -angle + Math.PI * 0.5 + (rand() - 0.5) * 0.65,
      tone: rand(),
      biomes: rand() > 0.18 ? ["ruins", "boss_arena", "marsh", "crystal_arena", "mine"] : ["mine", "crystal_arena"],
    });
  }

  return { trees, rocks, flowers, grass, bushes, roadScuffs, ruins, ponds, crystals, horizonTrees, ridges, assets };
})();

function makeTerrainGeometry(size: number) {
  const geometry = new THREE.PlaneGeometry(size, size, 112, 112);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const d = Math.hypot(x, y) / (size * 0.5);
    const broad = Math.sin(x * 0.026 + y * 0.017) * 0.035 + Math.cos(x * 0.041 - y * 0.023) * 0.024;
    const fine = Math.sin(x * 0.13 + y * 0.09) * 0.008;
    const playableFade = THREE.MathUtils.smoothstep(d, 0.04, 0.18);
    const edgeLift = THREE.MathUtils.smoothstep(d, 0.7, 1) * 0.06;
    position.setZ(i, (broad + fine + edgeLift) * playableFade);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function makeGroundTexture(theme: typeof BIOME_THEMES[BiomeId], quality: ReturnType<typeof useGameStore.getState>["quality"]) {
  const rand = lcg(theme.id === "marsh" ? 1731 : theme.id === "mine" ? 1439 : theme.id === "crystal_arena" ? 1221 : 912);
  const size = getTextureSize(quality);
  const extent = VISUAL_BOUND;
  const point = (x: number, z: number) => [
    ((x + extent) / (extent * 2)) * size,
    ((z + extent) / (extent * 2)) * size,
  ] as const;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = theme.base;
  ctx.fillRect(0, 0, size, size);

  const baseShade = ctx.createLinearGradient(0, 0, size, size);
  baseShade.addColorStop(0, hexToRgba(theme.baseLight, 0.16));
  baseShade.addColorStop(0.48, hexToRgba(theme.base, 0.02));
  baseShade.addColorStop(1, hexToRgba(theme.baseDark, 0.2));
  ctx.fillStyle = baseShade;
  ctx.fillRect(0, 0, size, size);

  const terrainVeil = ctx.createRadialGradient(size * 0.5, size * 0.52, size * 0.05, size * 0.5, size * 0.5, size * 0.66);
  terrainVeil.addColorStop(0, hexToRgba(theme.baseLight, 0.06));
  terrainVeil.addColorStop(0.45, hexToRgba(theme.base, 0.03));
  terrainVeil.addColorStop(1, hexToRgba(theme.baseDark, 0.08));
  ctx.fillStyle = terrainVeil;
  ctx.fillRect(0, 0, size, size);

  const speckles = quality === "high" ? 7600 : quality === "medium" ? 5200 : 2800;
  for (let i = 0; i < speckles; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1.2 + rand() * (quality === "high" ? 7 : 5);
    const alpha = 0.028 + rand() * 0.08;
    const tone = rand();
    ctx.fillStyle = tone > 0.72
      ? hexToRgba(theme.road, alpha)
      : tone > 0.38
        ? hexToRgba(theme.moss, alpha)
        : hexToRgba(theme.baseDark, alpha);
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.8 + rand()), r * (0.55 + rand()), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const patches = quality === "high" ? 260 : quality === "medium" ? 160 : 80;
  for (let i = 0; i < patches; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 24 + rand() * 112;
    const h = 12 + rand() * 58;
    ctx.fillStyle = hexToRgba(rand() > 0.46 ? theme.roadDark : theme.moss, 0.022 + rand() * 0.045);
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const fibreStrokes = quality === "high" ? 720 : quality === "medium" ? 420 : 180;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < fibreStrokes; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const length = 14 + rand() * (quality === "high" ? 98 : 64);
    const angle = rand() * Math.PI * 2;
    const bend = (rand() - 0.5) * 0.9;
    const colorRoll = rand();
    ctx.strokeStyle = colorRoll > 0.72
      ? hexToRgba(theme.baseLight, 0.035 + rand() * 0.035)
      : colorRoll > 0.38
        ? hexToRgba(theme.roadDark, 0.03 + rand() * 0.045)
        : hexToRgba(theme.moss, 0.03 + rand() * 0.04);
    ctx.lineWidth = 0.7 + rand() * (quality === "high" ? 2.6 : 1.7);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + bend) * length * 0.45,
      y + Math.sin(angle + bend) * length * 0.45,
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    );
    ctx.stroke();
  }
  ctx.restore();

  const softStains = quality === "high" ? 42 : quality === "medium" ? 28 : 14;
  for (let i = 0; i < softStains; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const radius = size * (0.026 + rand() * 0.085);
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, hexToRgba(rand() > 0.45 ? theme.baseDark : theme.moss, 0.05 + rand() * 0.055));
    stain.addColorStop(1, hexToRgba(theme.baseDark, 0));
    ctx.fillStyle = stain;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const drawRoad = (points: Array<[number, number]>, width: number) => {
    const draw = (strokeWidth: number, color: string, alpha: number) => {
      ctx.save();
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.beginPath();
      points.forEach(([x, z], index) => {
        const [px, py] = point(x, z);
        if (index === 0) ctx.moveTo(px, py);
        else {
          const previous = points[index - 1];
          const [cx, cy] = point((previous[0] + x) * 0.5 + Math.sin(index * 1.7) * 0.9, (previous[1] + z) * 0.5 + Math.cos(index * 1.3) * 0.7);
          ctx.quadraticCurveTo(cx, cy, px, py);
        }
      });
      ctx.stroke();
      ctx.restore();
    };
    draw(width * 1.72, theme.roadDark, 0.12);
    draw(width * 1.22, theme.road, 0.3);
    draw(width * 0.68, theme.road, 0.2);
  };

  const roadWidth = size * (4.6 / (extent * 2));
  drawRoad([[-extent, 4], [-29, 2.8], [-17, 5.6], [-5, 1.4], [9, 3.4], [24, -2.6], [extent, -1.4]], roadWidth);
  drawRoad([[-2.6, -extent], [0.4, -31], [-3.6, -18], [2.4, -6], [-1.2, 9], [3.4, 24], [1.4, extent]], roadWidth * 0.92);

  if (theme.id === "boss_arena" || theme.id === "crystal_arena") {
    const [cx, cy] = point(0, 0);
    ctx.save();
    ctx.strokeStyle = hexToRgba(theme.accent, 0.24);
    ctx.lineWidth = size * 0.012;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.18, size * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(theme.stone, 0.18);
    ctx.lineWidth = size * 0.028;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.245, size * 0.245, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (theme.id === "marsh") {
    for (let i = 0; i < 44; i++) {
      ctx.fillStyle = `rgba(65, 123, 116, ${0.04 + rand() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(rand() * size, rand() * size, 24 + rand() * 84, 9 + rand() * 30, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (theme.id === "mine") {
    for (let i = 0; i < 120; i++) {
      const x = rand() * size;
      const y = rand() * size;
      ctx.strokeStyle = `rgba(34, 29, 24, ${0.035 + rand() * 0.07})`;
      ctx.lineWidth = 1 + rand() * 2.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rand() - 0.5) * 140, y + (rand() - 0.5) * 90);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = quality === "high" ? 16 : quality === "medium" ? 10 : 4;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeSkyTexture(theme: typeof BIOME_THEMES[BiomeId]) {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, theme.sky);
  gradient.addColorStop(0.34, theme.fog);
  gradient.addColorStop(0.72, hexToRgba(theme.baseDark, 0.94));
  gradient.addColorStop(1, hexToRgba(theme.base, 0.96));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.36, 0, canvas.width * 0.5, canvas.height * 0.36, canvas.height * 0.58);
  glow.addColorStop(0, hexToRgba(theme.accentSoft, 0.18));
  glow.addColorStop(0.5, hexToRgba(theme.fog, 0.04));
  glow.addColorStop(1, hexToRgba(theme.sky, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function RuinCluster({ x, z, s, rot, broken, color, dark }: { x: number; z: number; s: number; rot: number; broken: number; color: string; dark: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} scale={s}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.88, 1.02, 0.2, 18]} />
        <meshStandardMaterial color={dark} roughness={0.86} metalness={0.03} />
      </mesh>
      {[0, 1, 2].map(i => {
        const angle = rot + i * 2.05;
        const height = 0.72 + ((i + broken) % 1) * 0.78;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.68, height * 0.5 + 0.12, Math.sin(angle) * 0.68]} rotation={[0.02 * i, angle, 0.08 - i * 0.03]} castShadow receiveShadow>
            <cylinderGeometry args={[0.14, 0.19, height, 12]} />
            <meshStandardMaterial color={i === 1 ? color : dark} roughness={0.88} metalness={0.02} />
          </mesh>
        );
      })}
      <mesh position={[0.18, 0.38, -0.24]} rotation={[0.12, 0.45, -0.16]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color={color} roughness={0.92} metalness={0.02} />
      </mesh>
    </group>
  );
}

function CrystalCluster({ x, z, s, rot, color }: { x: number; z: number; s: number; rot: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]} scale={s}>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[(i - 1) * 0.22, 0.42 + i * 0.12, i === 1 ? -0.08 : 0.06]} rotation={[0.1, i * 0.4, -0.08 + i * 0.08]} castShadow>
          <coneGeometry args={[0.16 + i * 0.03, 0.9 + i * 0.18, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.4} metalness={0.08} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function HorizonRidge({ x, z, w, h, d, rot, tone, color, dark }: { x: number; z: number; w: number; h: number; d: number; rot: number; tone: number; color: string; dark: string }) {
  return (
    <group position={[x, h * 0.36 - 0.08, z]} rotation={[0, rot, 0]}>
      <mesh scale={[w, h, d]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.64, 1]} />
        <meshStandardMaterial color={tone > 0.52 ? color : dark} roughness={0.96} metalness={0.01} />
      </mesh>
      <mesh position={[w * 0.08, h * 0.3, -d * 0.12]} scale={[w * 0.58, h * 0.72, d * 0.48]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial color={tone > 0.72 ? color : dark} roughness={0.98} metalness={0.01} />
      </mesh>
    </group>
  );
}

export default function Arena({ qualityOverride }: { qualityOverride?: QualityLevel }) {
  const storedQuality = useGameStore(s => s.quality);
  const quality = qualityOverride ?? storedQuality;
  const stage = useGameStore(s => s.stage);
  const biome = getBiomeForStage(stage);
  const theme = BIOME_THEMES[biome];
  const terrainDetailTexture = useTexture(TERRAIN_DETAIL_TEXTURE);
  const groundGeom = useMemo(() => makeTerrainGeometry(VISUAL_SIZE), []);
  const groundTexture = useMemo(() => makeGroundTexture(theme, quality), [quality, theme]);
  const skyTexture = useMemo(() => makeSkyTexture(theme), [theme]);
  const configuredTerrainDetail = useMemo(() => {
    terrainDetailTexture.wrapS = THREE.RepeatWrapping;
    terrainDetailTexture.wrapT = THREE.RepeatWrapping;
    const repeat = quality === "high" ? 16 : quality === "medium" ? 12 : 8;
    terrainDetailTexture.repeat.set(repeat, repeat);
    terrainDetailTexture.offset.set(biome === "marsh" ? 0.17 : biome === "mine" ? 0.34 : 0.08, biome === "crystal_arena" ? 0.26 : 0.11);
    terrainDetailTexture.colorSpace = THREE.SRGBColorSpace;
    terrainDetailTexture.anisotropy = quality === "high" ? 8 : quality === "medium" ? 6 : 3;
    terrainDetailTexture.generateMipmaps = true;
    terrainDetailTexture.minFilter = THREE.LinearMipmapLinearFilter;
    terrainDetailTexture.magFilter = THREE.LinearFilter;
    terrainDetailTexture.needsUpdate = true;
    return terrainDetailTexture;
  }, [terrainDetailTexture, quality, biome]);
  const treeCount = quality === "low" ? 6 : quality === "medium" ? 13 : 22;
  const rockCount = quality === "low" ? 10 : quality === "medium" ? 22 : 36;
  const flowerCount = quality === "low" ? 5 : quality === "medium" ? 13 : 24;
  const grassCount = quality === "low" ? 18 : quality === "medium" ? 46 : 72;
  const bushCount = quality === "low" ? 5 : quality === "medium" ? 12 : 20;
  const ruinCount = quality === "low" ? 3 : quality === "medium" ? 7 : 13;
  const assetCount = quality === "low" ? 0 : quality === "medium" ? 10 : 24;
  const scuffCount = quality === "low" ? 12 : quality === "medium" ? 24 : 38;
  const pondCount = quality === "low" ? 1 : quality === "medium" ? 3 : 5;
  const crystalCount = quality === "low" ? 3 : quality === "medium" ? 7 : 10;
  const horizonTreeCount = quality === "low" ? 8 : quality === "medium" ? 18 : 34;
  const ridgeCount = quality === "low" ? 8 : quality === "medium" ? 18 : 30;

  const biomeTrees = DECOR.trees.filter(item => item.biomes.includes(biome)).slice(0, treeCount);
  const biomeRocks = DECOR.rocks.filter(item => item.biomes.includes(biome)).slice(0, rockCount);
  const biomeFlowers = DECOR.flowers.filter(item => item.biomes.includes(biome)).slice(0, flowerCount);
  const biomeGrass = DECOR.grass.filter(item => item.biomes.includes(biome)).slice(0, grassCount);
  const biomeBushes = DECOR.bushes.filter(item => item.biomes.includes(biome)).slice(0, bushCount);
  const biomeRuins = DECOR.ruins.filter(item => item.biomes.includes(biome)).slice(0, ruinCount);
  const biomeAssets = DECOR.assets
    .filter(item => item.biomes.includes(biome))
    .filter(item => !(item.path.includes("tree_") || item.path.includes("grass_") || item.path.includes("flower_") || item.path.includes("hedge")))
    .slice(0, assetCount);
  const roadScuffs = DECOR.roadScuffs.slice(0, scuffCount);
  const biomePonds = DECOR.ponds.filter(item => item.biomes.includes(biome)).slice(0, pondCount);
  const biomeCrystals = DECOR.crystals.filter(item => item.biomes.includes(biome)).slice(0, crystalCount);
  const biomeHorizonTrees = DECOR.horizonTrees.filter(item => item.biomes.includes(biome)).slice(0, horizonTreeCount);
  const biomeRidges = DECOR.ridges.filter(item => item.biomes.includes(biome)).slice(0, ridgeCount);
  const edgeVeilOpacity = quality === "low" ? 0.1 : quality === "medium" ? 0.13 : 0.16;

  return (
    <group>
      {skyTexture && (
        <mesh position={[0, 42, 0]} scale={[VISUAL_BOUND * 1.62, VISUAL_BOUND * 0.62, VISUAL_BOUND * 1.62]} renderOrder={-10}>
          <sphereGeometry args={[1, 48, 20]} />
          <meshBasicMaterial map={skyTexture} side={THREE.BackSide} depthWrite={false} fog={false} />
        </mesh>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={groundGeom} />
        <meshStandardMaterial
          map={groundTexture ?? undefined}
          bumpMap={groundTexture ?? undefined}
          bumpScale={quality === "high" ? 0.05 : 0.03}
          color="#ffffff"
          roughness={0.96}
          metalness={0.01}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} receiveShadow>
        <planeGeometry args={[VISUAL_SIZE, VISUAL_SIZE]} />
        <meshBasicMaterial
          map={configuredTerrainDetail}
          color={biome === "mine" ? "#8c806d" : biome === "marsh" ? "#6b907d" : "#8b9676"}
          transparent
          opacity={quality === "low" ? 0.075 : quality === "medium" ? 0.1 : 0.12}
          depthWrite={false}
          blending={THREE.MultiplyBlending}
          premultipliedAlpha
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.122, 0]}>
        <ringGeometry args={[ARENA_BOUND * 0.88, VISUAL_BOUND - 4, 128]} />
        <meshBasicMaterial color={theme.baseDark} transparent opacity={edgeVeilOpacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {biomeRidges.map((ridge, i) => (
        <HorizonRidge
          key={`ridge-${i}`}
          x={ridge.x}
          z={ridge.z}
          w={ridge.w}
          h={ridge.h}
          d={ridge.d}
          rot={ridge.rot}
          tone={ridge.tone}
          color={biome === "marsh" ? "#3f6255" : theme.stone}
          dark={biome === "mine" ? "#3e3932" : theme.stoneDark}
        />
      ))}

      {roadScuffs.map((scuff, i) => (
        <mesh key={`scuff-${i}`} rotation={[-Math.PI / 2, 0, scuff.rot]} position={[scuff.x, 0.041 + i * 0.0002, scuff.z]} receiveShadow>
          <planeGeometry args={[scuff.w, scuff.d]} />
          <meshBasicMaterial color={i % 3 === 0 ? theme.moss : theme.roadDark} transparent opacity={scuff.opacity * (biome === "mine" ? 0.82 : 1)} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {biomePonds.map((pond, i) => (
        <mesh key={`pond-${i}`} rotation={[-Math.PI / 2, 0, pond.rot]} position={[pond.x, 0.024 + i * 0.0003, pond.z]} scale={[pond.rx, pond.rz, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshStandardMaterial color="#284f52" emissive="#173538" emissiveIntensity={0.16} roughness={0.22} metalness={0.02} transparent opacity={0.62} />
        </mesh>
      ))}

      {biomeHorizonTrees.map((tree, i) => (
        <group key={`horizon-tree-${i}`} position={[tree.x, 0, tree.z]} rotation={[0, tree.rot, 0]}>
          <mesh position={[0, tree.h * 0.32, 0]} castShadow={quality === "high"} receiveShadow>
            <cylinderGeometry args={[0.24, 0.48, tree.h * 0.64, 18]} />
            <meshStandardMaterial color={biome === "marsh" ? "#3d3329" : "#5b4633"} roughness={0.9} />
          </mesh>
          <mesh position={[0, tree.h * 0.77, 0]} scale={[1.15, 0.8, 1.04]} castShadow={quality !== "low"}>
            <sphereGeometry args={[1.08 + tree.h * 0.13, 36, 22]} />
            <meshStandardMaterial color={biome === "marsh" ? "#2f6258" : tree.hue > 0.5 ? "#3f6f4b" : "#335a42"} roughness={0.88} />
          </mesh>
          <mesh position={[0.34, tree.h * 0.95, -0.12]} scale={[0.78, 0.56, 0.72]} castShadow={quality === "high"}>
            <sphereGeometry args={[0.82 + tree.h * 0.08, 28, 18]} />
            <meshStandardMaterial color={biome === "marsh" ? "#3b7567" : "#4f8257"} roughness={0.86} />
          </mesh>
        </group>
      ))}

      {biomeRuins.map((ruin, i) => (
        <RuinCluster key={`pillar-${i}`} x={ruin.x} z={ruin.z} s={ruin.s} rot={ruin.rot} broken={ruin.broken} color={theme.stone} dark={theme.stoneDark} />
      ))}

      {biomeTrees.map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, 0, tree.z]}>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.86 + tree.h * 0.09, 30]} />
            <meshBasicMaterial color={theme.baseDark} transparent opacity={0.18} depthWrite={false} />
          </mesh>
          <mesh position={[0, tree.h * 0.34, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.34, tree.h * 0.68, 28]} />
            <meshStandardMaterial color={biome === "marsh" ? "#43382b" : "#604a34"} roughness={0.88} />
          </mesh>
          <mesh position={[0, tree.h * 0.75, 0]} scale={[1.18, 0.78, 1.05]} castShadow>
            <sphereGeometry args={[0.84 + tree.h * 0.14, 44, 28]} />
            <meshStandardMaterial color={biome === "marsh" ? "#315f57" : tree.hue > 0.5 ? "#436f4a" : "#385f40"} roughness={0.86} />
          </mesh>
          {quality === "high" && (
            <>
              <mesh position={[0.2, tree.h * 1.0, -0.1]} scale={[0.94, 0.64, 0.86]} castShadow>
                <sphereGeometry args={[0.7 + tree.h * 0.08, 40, 24]} />
                <meshStandardMaterial color={biome === "marsh" ? "#3a7465" : "#4f7953"} roughness={0.82} />
              </mesh>
              <mesh position={[-0.28, tree.h * 0.9, 0.18]} scale={[0.72, 0.54, 0.78]} castShadow>
                <sphereGeometry args={[0.58 + tree.h * 0.06, 36, 22]} />
                <meshStandardMaterial color={biome === "marsh" ? "#2f5a52" : "#315a3c"} roughness={0.84} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {biomeRocks.map((rock, i) => (
        <mesh key={`rock-${i}`} position={[rock.x, rock.s * 0.28, rock.z]} rotation={[0.18, rock.rot, 0.1]} scale={[1.28, 0.6, 0.94]} castShadow receiveShadow>
          <sphereGeometry args={[rock.s, 24, 16]} />
          <meshStandardMaterial color={i % 3 === 0 ? theme.stone : theme.stoneDark} roughness={0.86} metalness={0.03} />
        </mesh>
      ))}

      {biomeBushes.map((bush, i) => (
        <group key={`bush-${i}`} position={[bush.x, 0, bush.z]}>
          <mesh position={[0, bush.s * 0.34, 0]} scale={[1.16, 0.7, 0.96]} castShadow receiveShadow>
            <sphereGeometry args={[bush.s, 28, 18]} />
            <meshStandardMaterial color={biome === "marsh" ? "#317764" : bush.hue > 0.5 ? "#438f57" : "#376f4b"} roughness={0.78} />
          </mesh>
          <mesh position={[bush.s * 0.38, bush.s * 0.27, -bush.s * 0.18]} scale={[0.74, 0.54, 0.72]} castShadow>
            <sphereGeometry args={[bush.s * 0.74, 24, 16]} />
            <meshStandardMaterial color={biome === "marsh" ? "#429178" : "#4f9c64"} roughness={0.78} />
          </mesh>
        </group>
      ))}

      {biomeGrass.map((tuft, i) => (
        <group key={`grass-${i}`} position={[tuft.x, 0, tuft.z]} rotation={[0, tuft.rot, 0]}>
          {[0, 1, 2, 3].map(blade => (
            <mesh key={blade} position={[(blade - 1.5) * 0.07 * tuft.s, 0.15 * tuft.s, 0]} rotation={[0.1 + blade * 0.03, blade * 0.72, (blade - 1.5) * 0.16]}>
              <coneGeometry args={[0.035 * tuft.s, 0.38 * tuft.s, 8]} />
              <meshBasicMaterial color={biome === "marsh" ? "#3f806b" : tuft.color} />
            </mesh>
          ))}
        </group>
      ))}

      {biomeFlowers.map((flower, i) => (
        <group key={`flower-${i}`} position={[flower.x, 0, flower.z]}>
          <mesh position={[0, 0.19, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 0.36, 8]} />
            <meshBasicMaterial color="#237a4d" />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.12, 12, 8]} />
            <meshStandardMaterial color={flower.color} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {biomeCrystals.map((crystal, i) => (
        <CrystalCluster key={`crystal-${i}`} x={crystal.x} z={crystal.z} s={crystal.s} rot={crystal.rot} color={theme.accent} />
      ))}

      {biomeAssets.map((asset, i) => (
        <EnvironmentAssetModel
          key={`${asset.path}-${i}`}
          path={asset.path}
          position={[asset.x, 0, asset.z]}
          rotation={[0, asset.rot, 0]}
          scale={asset.scale}
          tint={asset.tint ?? (biome === "marsh" ? theme.moss : undefined)}
        />
      ))}
    </group>
  );
}
