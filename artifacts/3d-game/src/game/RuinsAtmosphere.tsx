import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RoomDefinition } from "./mapDefinitions";
import type { QualityLevel } from "./types";
import type { BiomeTheme } from "./worldTheme";

const LANTERN_LIGHTS: Array<{ x: number; y: number; z: number; intensity: number }> = [
  { x: -45, y: 3.1, z: 40, intensity: 1.35 },
  { x: 45, y: 3.1, z: -34, intensity: 1.28 },
  { x: -8, y: 4.2, z: 42, intensity: 1.55 },
  { x: 14, y: 4.35, z: -34, intensity: 1.48 },
  { x: -18, y: 2.4, z: 88, intensity: 0.92 },
  { x: 14, y: 2.2, z: 8, intensity: 0.78 },
];

const SHAFT_ANCHORS: Array<{ x: number; z: number; rot: number; scale: number }> = [
  { x: -8, z: 42, rot: 0.08, scale: 1.05 },
  { x: 14, z: -34, rot: -0.12, scale: 0.98 },
  { x: -18, z: 74, rot: 0.18, scale: 1.12 },
  { x: 6, z: 12, rot: -0.05, scale: 0.94 },
];

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeLightShaftTexture(theme: BiomeTheme) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, hexToRgba(theme.accent, 0.42));
  gradient.addColorStop(0.22, hexToRgba(theme.accentSoft, 0.18));
  gradient.addColorStop(0.58, hexToRgba(theme.rimLight, 0.06));
  gradient.addColorStop(1, hexToRgba(theme.fog, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sideFade = ctx.createLinearGradient(0, 0, canvas.width, 0);
  sideFade.addColorStop(0, "rgba(0,0,0,0.55)");
  sideFade.addColorStop(0.5, "rgba(0,0,0,0)");
  sideFade.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = sideFade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function makeMistTexture(theme: BiomeTheme) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(128, 64, 8, 128, 64, 118);
  gradient.addColorStop(0, hexToRgba(theme.rimLight, 0.22));
  gradient.addColorStop(0.45, hexToRgba(theme.fog, 0.12));
  gradient.addColorStop(1, hexToRgba(theme.fog, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function pointNearRoom(room: RoomDefinition | undefined, x: number, z: number, margin = 0) {
  if (!room) return true;
  const [cx, cz] = room.center;
  const [hx, hz] = room.halfSize;
  return (
    x >= cx - hx - margin &&
    x <= cx + hx + margin &&
    z >= cz - hz - margin &&
    z <= cz + hz + margin
  );
}

function RuinsFireflies({ theme, count, room }: { theme: BiomeTheme; count: number; room?: RoomDefinition }) {
  const groupRef = useRef<THREE.Group>(null);
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: (room?.center[0] ?? 0) + (Math.sin(index * 2.17) * 0.5 + 0.5) * ((room?.halfSize[0] ?? 36) * 1.35) - ((room?.halfSize[0] ?? 36) * 0.675),
        y: 1.2 + (index % 7) * 0.55,
        z: (room?.center[1] ?? 0) + (Math.cos(index * 1.73) * 0.5 + 0.5) * ((room?.halfSize[1] ?? 80) * 1.35) - ((room?.halfSize[1] ?? 80) * 0.675),
        phase: index * 0.91,
        speed: 0.35 + (index % 5) * 0.08,
        color: index % 3 === 0 ? theme.accent : theme.accentSoft,
      })),
    [count, room, theme.accent, theme.accentSoft],
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const t = clock.elapsedTime;
    group.children.forEach((child, index) => {
      const mote = motes[index];
      child.position.set(
        mote.x + Math.sin(t * mote.speed + mote.phase) * 1.8,
        mote.y + Math.sin(t * mote.speed * 1.4 + mote.phase) * 0.45,
        mote.z + Math.cos(t * mote.speed * 0.9 + mote.phase) * 1.6,
      );
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = 0.22 + (Math.sin(t * 2.2 + mote.phase) + 1) * 0.18;
    });
  });

  return (
    <group ref={groupRef}>
      {motes.map((mote, index) => (
        <mesh key={`firefly-${index}`} position={[mote.x, mote.y, mote.z]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshBasicMaterial color={mote.color} transparent opacity={0.34} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export default function RuinsAtmosphere({ theme, quality, activeRoom }: { theme: BiomeTheme; quality: QualityLevel; activeRoom?: RoomDefinition }) {
  const shaftTexture = useMemo(() => makeLightShaftTexture(theme), [theme]);
  const mistTexture = useMemo(() => makeMistTexture(theme), [theme]);
  const lanternLights = (quality === "low" ? LANTERN_LIGHTS.slice(0, 3) : LANTERN_LIGHTS)
    .filter(light => pointNearRoom(activeRoom, light.x, light.z, 18))
    .slice(0, 3);
  const shaftCount = quality === "high" ? SHAFT_ANCHORS.length : quality === "medium" ? 3 : 2;
  const mistPatches =
    quality === "low"
      ? [{ x: -10, z: 20, rx: 38, rz: 24 }]
      : [
          { x: -18, z: 72, rx: 44, rz: 28 },
          { x: 12, z: 6, rx: 36, rz: 32 },
          { x: -8, z: -58, rx: 40, rz: 26 },
          ...(quality === "high" ? [{ x: 24, z: -18, rx: 30, rz: 22 }] : []),
        ];
  const visibleShafts = SHAFT_ANCHORS
    .filter(shaft => pointNearRoom(activeRoom, shaft.x, shaft.z, 20))
    .slice(0, shaftCount);
  const visibleMistPatches = mistPatches.filter(patch => pointNearRoom(activeRoom, patch.x, patch.z, 24)).slice(0, 2);
  const fireflyCount = quality === "high" ? 10 : quality === "medium" ? 7 : 0;

  return (
    <group>
      {lanternLights.map((light, index) => (
        <pointLight
          key={`ruins-lantern-${index}`}
          position={[light.x, light.y, light.z]}
          color={theme.accent}
          intensity={light.intensity * (quality === "high" ? 1.08 : 0.92)}
          distance={quality === "low" ? 24 : 32}
          decay={2}
          castShadow={false}
        />
      ))}

      <pointLight position={[0, 14.5, 8]} color={theme.rimLight} intensity={quality === "low" ? 0.35 : 0.62} distance={58} decay={2} />
      <spotLight
        position={[0, 18.5, 12]}
        angle={0.42}
        penumbra={0.82}
        intensity={quality === "low" ? 0.45 : 0.85}
        color={theme.accent}
        distance={72}
        castShadow={false}
      />

      {shaftTexture &&
        visibleShafts.map((shaft, index) => (
          <mesh
            key={`ruins-shaft-${index}`}
            position={[shaft.x, 9.8, shaft.z]}
            rotation={[0, shaft.rot, 0]}
            renderOrder={-4}
          >
            <planeGeometry args={[7.5 * shaft.scale, 18.5 * shaft.scale]} />
            <meshBasicMaterial
              map={shaftTexture}
              transparent
              opacity={quality === "high" ? 0.34 : 0.26}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {mistTexture &&
        visibleMistPatches.map((patch, index) => (
          <mesh key={`ruins-mist-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[patch.x, 0.18 + index * 0.02, patch.z]} renderOrder={-3}>
            <planeGeometry args={[patch.rx, patch.rz]} />
            <meshBasicMaterial
              map={mistTexture}
              transparent
              opacity={quality === "high" ? 0.42 : 0.32}
              depthWrite={false}
              blending={THREE.NormalBlending}
              color={theme.rimLight}
            />
          </mesh>
        ))}

      {fireflyCount > 0 && <RuinsFireflies theme={theme} count={fireflyCount} room={activeRoom} />}
    </group>
  );
}
