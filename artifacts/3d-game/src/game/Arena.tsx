import { useMemo } from "react";
import * as THREE from "three";

const ARENA = 24;

// Pre-calculated decoration positions (deterministic, no random in render)
const TREES = (() => {
  const list: Array<{ x: number; z: number; h: number; r: number }> = [];
  const lcg = (s: number) => { let v = s; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 0xffffffff; }; };
  const r = lcg(77);
  for (let i = 0; i < 28; i++) {
    const x = (r() - 0.5) * (ARENA * 1.9);
    const z = (r() - 0.5) * (ARENA * 1.9);
    if (Math.abs(x) < ARENA - 1 && Math.abs(z) < ARENA - 1 && (Math.abs(x) > 5 || Math.abs(z) > 5)) {
      list.push({ x, z, h: 2 + r() * 2.5, r: r() });
    }
  }
  return list;
})();

const FLOWERS = (() => {
  const list: Array<{ x: number; z: number; color: string }> = [];
  const lcg = (s: number) => { let v = s; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 0xffffffff; }; };
  const r = lcg(123);
  const colors = ["#ff4488", "#ffee00", "#ff6600", "#ff2255", "#ffffff"];
  for (let i = 0; i < 40; i++) {
    const x = (r() - 0.5) * (ARENA * 1.8);
    const z = (r() - 0.5) * (ARENA * 1.8);
    if (Math.abs(x) < ARENA - 1 && Math.abs(z) < ARENA - 1 && (Math.abs(x) > 3 || Math.abs(z) > 3)) {
      list.push({ x, z, color: colors[Math.floor(r() * colors.length)] });
    }
  }
  return list;
})();

const ROCKS = (() => {
  const list: Array<{ x: number; z: number; s: number; rot: number }> = [];
  const lcg = (s: number) => { let v = s; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 0xffffffff; }; };
  const r = lcg(55);
  for (let i = 0; i < 18; i++) {
    const x = (r() - 0.5) * (ARENA * 1.8);
    const z = (r() - 0.5) * (ARENA * 1.8);
    if (Math.abs(x) < ARENA - 2 && Math.abs(z) < ARENA - 2) {
      list.push({ x, z, s: 0.4 + r() * 0.8, rot: r() * Math.PI });
    }
  }
  return list;
})();

export default function Arena() {
  const groundGeom = useMemo(() => new THREE.PlaneGeometry(ARENA * 2.5, ARENA * 2.5, 1, 1), []);

  return (
    <group>
      {/* Grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={groundGeom} />
        <meshLambertMaterial color="#3a7d3a" />
      </mesh>

      {/* Dirt border patches */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const d = ARENA * 1.05;
        return (
          <mesh key={`dirt_${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[Math.cos(angle) * d, 0.01, Math.sin(angle) * d]}>
            <planeGeometry args={[4, 4]} />
            <meshLambertMaterial color="#6b4423" />
          </mesh>
        );
      })}

      {/* Arena boundary fence posts */}
      {[...Array(20)].map((_, i) => {
        const t = i / 20;
        const positions: [number, number, number][] = [
          [(-ARENA) + t * ARENA * 2, 0, -ARENA],
          [(-ARENA) + t * ARENA * 2, 0, ARENA],
          [-ARENA, 0, (-ARENA) + t * ARENA * 2],
          [ARENA, 0, (-ARENA) + t * ARENA * 2],
        ];
        return positions.map((pos, j) => (
          <group key={`fence_${i}_${j}`} position={pos}>
            {/* Post */}
            <mesh position={[0, 0.8, 0]} castShadow>
              <boxGeometry args={[0.25, 1.6, 0.25]} />
              <meshLambertMaterial color="#5c3d1e" />
            </mesh>
            {/* Rail */}
            {j < 2 && (
              <mesh position={[0.6, 0.9, 0]} castShadow>
                <boxGeometry args={[1.2, 0.15, 0.12]} />
                <meshLambertMaterial color="#7a5230" />
              </mesh>
            )}
            {j >= 2 && (
              <mesh position={[0, 0.9, 0.6]} castShadow>
                <boxGeometry args={[0.12, 0.15, 1.2]} />
                <meshLambertMaterial color="#7a5230" />
              </mesh>
            )}
          </group>
        ));
      })}

      {/* Trees */}
      {TREES.map((t, i) => (
        <group key={`tree_${i}`} position={[t.x, 0, t.z]}>
          {/* Trunk */}
          <mesh position={[0, t.h * 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.45, t.h * 0.8, 0.45]} />
            <meshLambertMaterial color="#5c3d1e" />
          </mesh>
          {/* Leaves - 3 layers Minecraft style */}
          <mesh position={[0, t.h * 0.75, 0]} castShadow>
            <boxGeometry args={[2.2, 1.2, 2.2]} />
            <meshLambertMaterial color="#2d7d2d" />
          </mesh>
          <mesh position={[0, t.h * 0.98, 0]} castShadow>
            <boxGeometry args={[1.6, 1.0, 1.6]} />
            <meshLambertMaterial color="#3a9a3a" />
          </mesh>
          <mesh position={[0, t.h * 1.18, 0]} castShadow>
            <boxGeometry args={[1.0, 0.8, 1.0]} />
            <meshLambertMaterial color="#44aa44" />
          </mesh>
        </group>
      ))}

      {/* Rocks */}
      {ROCKS.map((r, i) => (
        <mesh key={`rock_${i}`} position={[r.x, r.s * 0.3, r.z]} rotation={[0.2, r.rot, 0.1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshLambertMaterial color="#888877" />
        </mesh>
      ))}

      {/* Flowers */}
      {FLOWERS.map((f, i) => (
        <group key={`flower_${i}`} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshLambertMaterial color="#2a6e2a" />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <boxGeometry args={[0.28, 0.2, 0.28]} />
            <meshLambertMaterial color={f.color} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <boxGeometry args={[0.12, 0.22, 0.12]} />
            <meshLambertMaterial color="#ffee55" />
          </mesh>
        </group>
      ))}

      {/* Dirt path (center cross) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[3, ARENA * 2]} />
        <meshLambertMaterial color="#8a6040" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[ARENA * 2, 3]} />
        <meshLambertMaterial color="#8a6040" />
      </mesh>

      {/* Mushrooms */}
      {[[-8, -6], [10, 8], [-12, 10], [7, -14]].map(([x, z], i) => (
        <group key={`mush_${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 1.0, 8]} />
            <meshLambertMaterial color="#ddb89a" />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <sphereGeometry args={[0.45, 8, 6]} />
            <meshLambertMaterial color="#cc3311" />
          </mesh>
          {/* White dots */}
          {[[0.2, 0.1, 0.3], [-0.2, 0.2, 0.25]].map(([dx, dy, dz], j) => (
            <mesh key={j} position={[dx, 1.1 + dy, dz]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshLambertMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
