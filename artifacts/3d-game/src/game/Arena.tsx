import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { ARENA_BOUND } from "./balance";
import { EnvironmentAssetModel } from "./AssetModels";
import { useGameStore } from "./useGameStore";
import { buildWorldAssetInstances } from "./worldAssetCatalog";
import { BIOME_THEMES, BiomeId, getBiomeForStage, getTextureSize } from "./worldTheme";
import type { QualityLevel } from "./types";

const VISUAL_MARGIN = 64;
const VISUAL_BOUND = ARENA_BOUND + VISUAL_MARGIN;
const VISUAL_SIZE = VISUAL_BOUND * 2;
const TERRAIN_DETAIL_TEXTURE = "/assets/textures/ambientcg/Ground076_PREVIEW.png";

function lcg(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

const DECOR = (() => {
  const rand = lcg(177);
  const roadScuffs: Array<{ x: number; z: number; w: number; d: number; rot: number; opacity: number }> = [];
  const ponds: Array<{ x: number; z: number; rx: number; rz: number; rot: number; biomes: BiomeId[] }> = [];
  const ridges: Array<{ x: number; z: number; w: number; h: number; d: number; rot: number; tone: number; biomes: BiomeId[] }> = [];

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
      biomes: rand() > 0.18 ? ["ruins_forest", "boss_courtyard", "marsh", "crystal_gate", "mine_quarry"] : ["mine_quarry", "crystal_gate"],
    });
  }

  return { roadScuffs, ponds, ridges };
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
  const rand = lcg(theme.id === "marsh" ? 1731 : theme.id === "mine_quarry" ? 1439 : theme.id === "crystal_gate" ? 1221 : 912);
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

  if (theme.id === "boss_courtyard" || theme.id === "crystal_gate") {
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

  if (theme.id === "mine_quarry") {
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
  const runId = useGameStore(s => s.runId);
  const lockedBiomeRef = useRef<{ runId: number; biome: BiomeId } | null>(null);
  if (!lockedBiomeRef.current || lockedBiomeRef.current.runId !== runId) {
    lockedBiomeRef.current = { runId, biome: getBiomeForStage(stage) };
  }
  const biome = lockedBiomeRef.current.biome;
  const theme = BIOME_THEMES[biome];
  const terrainDetailTexture = useTexture(TERRAIN_DETAIL_TEXTURE);
  const groundGeom = useMemo(() => makeTerrainGeometry(VISUAL_SIZE), []);
  const groundTexture = useMemo(() => makeGroundTexture(theme, quality), [quality, theme]);
  const skyTexture = useMemo(() => makeSkyTexture(theme), [theme]);
  const premiumAssets = useMemo(() => buildWorldAssetInstances(biome, quality, ARENA_BOUND), [biome, quality]);
  const configuredTerrainDetail = useMemo(() => {
    terrainDetailTexture.wrapS = THREE.RepeatWrapping;
    terrainDetailTexture.wrapT = THREE.RepeatWrapping;
    const repeat = quality === "high" ? 16 : quality === "medium" ? 12 : 8;
    terrainDetailTexture.repeat.set(repeat, repeat);
    terrainDetailTexture.offset.set(biome === "marsh" ? 0.17 : biome === "mine_quarry" ? 0.34 : 0.08, biome === "crystal_gate" ? 0.26 : 0.11);
    terrainDetailTexture.colorSpace = THREE.SRGBColorSpace;
    terrainDetailTexture.anisotropy = quality === "high" ? 8 : quality === "medium" ? 6 : 3;
    terrainDetailTexture.generateMipmaps = true;
    terrainDetailTexture.minFilter = THREE.LinearMipmapLinearFilter;
    terrainDetailTexture.magFilter = THREE.LinearFilter;
    terrainDetailTexture.needsUpdate = true;
    return terrainDetailTexture;
  }, [terrainDetailTexture, quality, biome]);
  const scuffCount = 42;
  const pondCount = biome === "marsh" ? 5 : 0;
  const ridgeCount = 34;

  const roadScuffs = DECOR.roadScuffs.slice(0, scuffCount);
  const biomePonds = DECOR.ponds.filter(item => item.biomes.includes(biome)).slice(0, pondCount);
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
          color={theme.detailTint}
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
          dark={biome === "mine_quarry" ? "#3e3932" : theme.stoneDark}
        />
      ))}

      {roadScuffs.map((scuff, i) => (
        <mesh key={`scuff-${i}`} rotation={[-Math.PI / 2, 0, scuff.rot]} position={[scuff.x, 0.041 + i * 0.0002, scuff.z]} receiveShadow>
          <planeGeometry args={[scuff.w, scuff.d]} />
          <meshBasicMaterial color={i % 3 === 0 ? theme.moss : theme.road} transparent opacity={scuff.opacity * (biome === "mine_quarry" ? 0.32 : 0.42)} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {biomePonds.map((pond, i) => (
        <mesh key={`pond-${i}`} rotation={[-Math.PI / 2, 0, pond.rot]} position={[pond.x, 0.024 + i * 0.0003, pond.z]} scale={[pond.rx, pond.rz, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshStandardMaterial color="#284f52" emissive="#173538" emissiveIntensity={0.16} roughness={0.22} metalness={0.02} transparent opacity={0.62} />
        </mesh>
      ))}

      {premiumAssets.map(asset => (
        <EnvironmentAssetModel
          key={`premium-${asset.id}-${asset.x.toFixed(1)}-${asset.z.toFixed(1)}`}
          path={asset.path}
          position={[asset.x, asset.y, asset.z]}
          rotation={[0, asset.rotation, 0]}
          scale={asset.scale}
          tint={asset.tint}
        />
      ))}
    </group>
  );
}
