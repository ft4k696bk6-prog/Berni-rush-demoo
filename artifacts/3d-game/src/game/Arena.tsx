import { useMemo } from "react";
import * as THREE from "three";
import { ARENA_BOUND } from "./balance";
import { useGameStore } from "./useGameStore";

const SIZE = ARENA_BOUND * 2;

function lcg(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

const DECOR = (() => {
  const rand = lcg(177);
  const trees: Array<{ x: number; z: number; h: number; hue: number }> = [];
  const rocks: Array<{ x: number; z: number; s: number; rot: number }> = [];
  const flowers: Array<{ x: number; z: number; color: string }> = [];
  const colors = ["#ff5d8f", "#ffd85a", "#69e7ff", "#f7f0d0", "#b98cff"];

  for (let i = 0; i < 42; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 4);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 4);
    if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
    trees.push({ x, z, h: 2.2 + rand() * 2.1, hue: rand() });
  }

  for (let i = 0; i < 34; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    rocks.push({ x, z, s: 0.42 + rand() * 0.85, rot: rand() * Math.PI });
  }

  for (let i = 0; i < 56; i++) {
    const x = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    const z = (rand() * 2 - 1) * (ARENA_BOUND - 5);
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    flowers.push({ x, z, color: colors[Math.floor(rand() * colors.length)] });
  }

  return { trees, rocks, flowers };
})();

const PILLARS = [
  [-18, -16], [18, -16], [-18, 16], [18, 16],
  [-30, 0], [30, 0], [0, -30], [0, 30],
] as const;

export default function Arena() {
  const quality = useGameStore(s => s.quality);
  const groundGeom = useMemo(() => new THREE.PlaneGeometry(SIZE + 18, SIZE + 18, 1, 1), []);
  const treeCount = quality === "low" ? 10 : quality === "medium" ? 24 : DECOR.trees.length;
  const rockCount = quality === "low" ? 8 : quality === "medium" ? 20 : DECOR.rocks.length;
  const flowerCount = quality === "low" ? 0 : quality === "medium" ? 28 : DECOR.flowers.length;
  const gridLines = quality === "low" ? 7 : 11;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={groundGeom} />
        <meshStandardMaterial color="#496f72" roughness={0.9} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow>
        <planeGeometry args={[SIZE * 0.16, SIZE]} />
        <meshStandardMaterial color="#b58a57" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]} receiveShadow>
        <planeGeometry args={[SIZE, SIZE * 0.16]} />
        <meshStandardMaterial color="#b58a57" roughness={0.95} />
      </mesh>

      {Array.from({ length: gridLines }).map((_, i) => {
        const offset = -ARENA_BOUND + ((i + 1) / (gridLines + 1)) * SIZE;
        return (
          <group key={`grid-${i}`}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.012, 0]}>
              <planeGeometry args={[0.07, SIZE]} />
              <meshBasicMaterial color="#7dfcff" transparent opacity={0.1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, offset]}>
              <planeGeometry args={[SIZE, 0.07]} />
              <meshBasicMaterial color="#ffd85a" transparent opacity={0.075} />
            </mesh>
          </group>
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[ARENA_BOUND - 0.8, ARENA_BOUND, 128]} />
        <meshBasicMaterial color="#ff5d8f" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>

      {[
        [0, -ARENA_BOUND, SIZE, 0.6],
        [0, ARENA_BOUND, SIZE, 0.6],
        [-ARENA_BOUND, 0, 0.6, SIZE],
        [ARENA_BOUND, 0, 0.6, SIZE],
      ].map(([x, z, w, d], i) => (
        <group key={`wall-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
            <boxGeometry args={[w, 0.9, d]} />
            <meshStandardMaterial color="#172334" roughness={0.58} metalness={0.1} />
          </mesh>
          <mesh position={[0, 1.04, 0]}>
            <boxGeometry args={[w, 0.08, d]} />
            <meshBasicMaterial color={i < 2 ? "#7dfcff" : "#ffd85a"} transparent opacity={0.72} />
          </mesh>
        </group>
      ))}

      {PILLARS.slice(0, quality === "low" ? 4 : PILLARS.length).map(([x, z], i) => (
        <group key={`pillar-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.92, 1.05, 0.36, 8]} />
            <meshStandardMaterial color="#2b3d53" roughness={0.56} metalness={0.12} />
          </mesh>
          <mesh position={[0, 1.06, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.64, 0.76, 1.76, 8]} />
            <meshStandardMaterial color="#53687f" roughness={0.52} metalness={0.18} />
          </mesh>
          <mesh position={[0, 2.05, 0]} castShadow>
            <cylinderGeometry args={[0.95, 0.78, 0.34, 8]} />
            <meshStandardMaterial color="#2b3d53" roughness={0.56} metalness={0.12} />
          </mesh>
          <mesh position={[0, 2.36, 0]}>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#7dfcff" : "#ffd85a"} emissive={i % 2 === 0 ? "#2ed0ff" : "#ffb000"} emissiveIntensity={0.8} roughness={0.28} />
          </mesh>
        </group>
      ))}

      {DECOR.trees.slice(0, treeCount).map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, 0, tree.z]}>
          <mesh position={[0, tree.h * 0.34, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.34, tree.h * 0.68, 6]} />
            <meshStandardMaterial color="#5f3f28" roughness={0.8} />
          </mesh>
          <mesh position={[0, tree.h * 0.82, 0]} castShadow>
            <coneGeometry args={[1.05 + tree.h * 0.12, 1.65, 7]} />
            <meshStandardMaterial color={tree.hue > 0.5 ? "#2fac72" : "#2a935f"} roughness={0.64} />
          </mesh>
          {quality === "high" && (
            <mesh position={[0, tree.h * 1.1, 0]} castShadow>
              <coneGeometry args={[0.72, 1.25, 7]} />
              <meshStandardMaterial color="#41c48a" roughness={0.64} />
            </mesh>
          )}
        </group>
      ))}

      {DECOR.rocks.slice(0, rockCount).map((rock, i) => (
        <mesh key={`rock-${i}`} position={[rock.x, rock.s * 0.28, rock.z]} rotation={[0.18, rock.rot, 0.1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[rock.s, 0]} />
          <meshStandardMaterial color="#8f96a4" roughness={0.72} metalness={0.08} />
        </mesh>
      ))}

      {DECOR.flowers.slice(0, flowerCount).map((flower, i) => (
        <group key={`flower-${i}`} position={[flower.x, 0, flower.z]}>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.05, 0.36, 0.05]} />
            <meshBasicMaterial color="#1d7d4b" />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.22, 0.16, 0.22]} />
            <meshBasicMaterial color={flower.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
