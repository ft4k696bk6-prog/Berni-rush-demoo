import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeleeSwing, VfxTheme } from "./types";

interface Props {
  swing: MeleeSwing;
}

const DURATION = 560;

type WeaponShape = "sword" | "bowKnife" | "staff" | "dagger" | "hammer" | "pickaxe";

type ThemeConfig = {
  shape: WeaponShape;
  arc: number;
  reach: number;
  tube: number;
  color: string;
  edge: string;
  metal: string;
  core: string;
};

const THEME: Record<VfxTheme, ThemeConfig> = {
  knight: {
    shape: "sword",
    arc: Math.PI * 0.92,
    reach: 2.45,
    tube: 0.045,
    color: "#9be7ff",
    edge: "#f2fbff",
    metal: "#d9f4ff",
    core: "#6cbce8",
  },
  ranger: {
    shape: "bowKnife",
    arc: Math.PI * 0.66,
    reach: 2.05,
    tube: 0.03,
    color: "#7dfcff",
    edge: "#c7fff4",
    metal: "#e1ffe9",
    core: "#42d6ae",
  },
  mage: {
    shape: "staff",
    arc: Math.PI * 0.72,
    reach: 2.22,
    tube: 0.038,
    color: "#c691ff",
    edge: "#ffb36e",
    metal: "#6c4f9b",
    core: "#ff6d3d",
  },
  assassin: {
    shape: "dagger",
    arc: Math.PI * 0.56,
    reach: 1.82,
    tube: 0.034,
    color: "#ff6fae",
    edge: "#fff0fb",
    metal: "#f6d7ff",
    core: "#61224f",
  },
  tank: {
    shape: "hammer",
    arc: Math.PI * 1.05,
    reach: 2.6,
    tube: 0.07,
    color: "#ffd36a",
    edge: "#fff3bd",
    metal: "#d6c181",
    core: "#9a6b24",
  },
  miner: {
    shape: "pickaxe",
    arc: Math.PI * 0.78,
    reach: 2.18,
    tube: 0.042,
    color: "#f7c251",
    edge: "#fff2a8",
    metal: "#d8d1b4",
    core: "#7a4b20",
  },
};

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function WeaponModel({ shape, cfg }: { shape: WeaponShape; cfg: ThemeConfig }) {
  if (shape === "staff") {
    return (
      <group>
        <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 1.75, 8]} />
          <meshStandardMaterial color="#523b2d" roughness={0.62} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0, 1.78]}>
          <sphereGeometry args={[0.2, 14, 10]} />
          <meshStandardMaterial color={cfg.edge} emissive={cfg.color} emissiveIntensity={2.5} roughness={0.16} metalness={0.18} />
        </mesh>
        <mesh position={[0, 0, 1.78]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.018, 6, 24]} />
          <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={2} transparent opacity={0.75} />
        </mesh>
      </group>
    );
  }

  if (shape === "dagger") {
    return (
      <group>
        <mesh position={[0, 0, 0.34]}>
          <boxGeometry args={[0.44, 0.07, 0.08]} />
          <meshStandardMaterial color="#2c1630" roughness={0.32} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.9]}>
          <boxGeometry args={[0.07, 0.05, 0.95]} />
          <meshStandardMaterial color={cfg.metal} emissive={cfg.color} emissiveIntensity={0.9} metalness={0.92} roughness={0.08} />
        </mesh>
        <mesh position={[0, 0, 1.43]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.22, 4]} />
          <meshStandardMaterial color="#ffffff" emissive={cfg.color} emissiveIntensity={1.2} metalness={0.9} roughness={0.06} />
        </mesh>
      </group>
    );
  }

  if (shape === "hammer") {
    return (
      <group>
        <mesh position={[0, 0, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.08, 1.36, 8]} />
          <meshStandardMaterial color="#5d4228" roughness={0.6} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0, 1.55]}>
          <boxGeometry args={[0.72, 0.42, 0.38]} />
          <meshStandardMaterial color={cfg.metal} emissive={cfg.color} emissiveIntensity={0.75} metalness={0.7} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.23, 1.55]}>
          <boxGeometry args={[0.82, 0.06, 0.42]} />
          <meshBasicMaterial color={cfg.edge} transparent opacity={0.55} />
        </mesh>
      </group>
    );
  }

  if (shape === "pickaxe") {
    return (
      <group>
        <mesh position={[0, 0, 0.83]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 1.5, 7]} />
          <meshStandardMaterial color="#6e4623" roughness={0.66} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.09, 0.1, 0.78]} />
          <meshStandardMaterial color={cfg.metal} emissive={cfg.color} emissiveIntensity={0.8} metalness={0.72} roughness={0.19} />
        </mesh>
        <mesh position={[0.44, 0, 1.5]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.07, 0.24, 5]} />
          <meshStandardMaterial color={cfg.edge} emissive={cfg.color} emissiveIntensity={1.1} metalness={0.78} roughness={0.12} />
        </mesh>
        <mesh position={[-0.44, 0, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.07, 0.24, 5]} />
          <meshStandardMaterial color={cfg.edge} emissive={cfg.color} emissiveIntensity={1.1} metalness={0.78} roughness={0.12} />
        </mesh>
      </group>
    );
  }

  if (shape === "bowKnife") {
    return (
      <group>
        <mesh position={[0, 0, 0.86]} rotation={[0, 0, 0.34]}>
          <boxGeometry args={[0.055, 0.055, 1.22]} />
          <meshStandardMaterial color={cfg.metal} emissive={cfg.color} emissiveIntensity={0.75} metalness={0.78} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 1.47]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.06, 0.18, 4]} />
          <meshStandardMaterial color={cfg.edge} emissive={cfg.color} emissiveIntensity={1.15} metalness={0.85} roughness={0.08} />
        </mesh>
        <mesh position={[0.22, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.018, 5, 18, Math.PI * 1.2]} />
          <meshStandardMaterial color="#5d3a20" roughness={0.58} metalness={0.08} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[0.12, 0.12, 0.44]} />
        <meshStandardMaterial color="#4a2e0a" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.52]}>
        <boxGeometry args={[0.74, 0.1, 0.12]} />
        <meshStandardMaterial color="#cfa557" metalness={0.82} roughness={0.17} />
      </mesh>
      <mesh position={[0, 0, 1.42]}>
        <boxGeometry args={[0.09, 0.075, 1.8]} />
        <meshStandardMaterial color={cfg.metal} metalness={0.98} roughness={0.035} emissive={cfg.color} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0, 2.38]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.058, 0.28, 4]} />
        <meshStandardMaterial color={cfg.edge} metalness={0.95} roughness={0.04} emissive={cfg.color} emissiveIntensity={1.15} />
      </mesh>
    </group>
  );
}

function MeleeEffect({ swing }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const arcRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groundRef = useRef<THREE.Mesh>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const theme = swing.theme ?? "knight";
  const cfg = THEME[theme];
  const comboStep = swing.is360 ? 1 : Math.max(1, Math.min(3, swing.comboStep ?? 1));
  const comboPower = 1 + (comboStep - 1) * 0.13;
  const comboDir = comboStep === 2 ? -1 : 1;
  const visualArc = cfg.arc * (1 + (comboStep - 1) * 0.12);
  const startAngle = comboDir > 0 ? swing.angle - visualArc * 0.5 : swing.angle + visualArc * 0.5;
  const endAngle = comboDir > 0 ? swing.angle + visualArc * 0.5 : swing.angle - visualArc * 0.5;

  useFrame(() => {
    const elapsed = Date.now() - swing.startedAt;
    const t = clamp01(elapsed / DURATION);
    const anticipation = clamp01(t / 0.18);
    const hit = clamp01((t - 0.18) / 0.46);
    const recovery = clamp01((t - 0.68) / 0.32);
    const fade = 1 - recovery;

    if (swing.is360) {
      if (rootRef.current) {
        rootRef.current.rotation.y += 0.2;
        rootRef.current.scale.setScalar(0.84 + easeOut(t) * 0.3);
      }
      if (shockRef.current) {
        const mat = shockRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = fade * 0.44;
        shockRef.current.scale.setScalar(0.72 + easeOut(t) * 1.5);
      }
      if (edgeRef.current) {
        const mat = edgeRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = fade * (swing.hits ? 4.4 : 3.2);
        mat.opacity = fade * 0.88;
      }
      if (coreRef.current) {
        const mat = coreRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = fade * 0.38;
        coreRef.current.rotation.y -= 0.12;
      }
      return;
    }

    const prePull = 0.18 * (1 - anticipation);
    const swingProgress = easeOut(hit);
    if (pivotRef.current) {
      pivotRef.current.rotation.y = startAngle - prePull + (endAngle - startAngle + prePull * 0.5) * swingProgress;
    }

    if (weaponRef.current) {
      const recoil = Math.sin(hit * Math.PI) * 0.1;
      weaponRef.current.position.y = -0.04 + recoil;
      weaponRef.current.scale.setScalar((0.86 + anticipation * 0.08 + Math.sin(hit * Math.PI) * 0.16) * comboPower);
    }

    if (arcRef.current) {
      const mat = arcRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = clamp01(Math.sin(hit * Math.PI)) * (0.5 + comboStep * 0.07) * fade;
      arcRef.current.scale.setScalar((0.72 + hit * 0.42) * comboPower);
    }

    if (edgeRef.current) {
      const mat = edgeRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = clamp01(Math.sin(hit * Math.PI)) * 0.82 * fade;
      mat.emissiveIntensity = (2.6 + (swing.hits ?? 0) * 0.18 + (comboStep - 1) * 0.85) * fade;
    }

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = clamp01(Math.sin(hit * Math.PI)) * 0.28 * fade;
      coreRef.current.scale.setScalar((0.82 + hit * 0.34) * comboPower);
    }

    if (groundRef.current) {
      const mat = groundRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.08 + anticipation * 0.08 + hit * 0.12) * fade;
    }
  });

  const worldY = 1.1;

  if (swing.is360) {
    const color = swing.color ?? cfg.color;
    return (
      <group ref={rootRef} position={[swing.playerPos[0], worldY, swing.playerPos[1]]}>
        <mesh ref={shockRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]}>
          <ringGeometry args={[1.7, 4.35, 72]} />
          <meshBasicMaterial color="#ffbd5a" transparent opacity={0.34} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={edgeRef}>
          <torusGeometry args={[3.36, 0.13, 8, 72]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.8} transparent opacity={0.86} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.98, 0]}>
          <ringGeometry args={[2.28, 3.82, 72]} />
          <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.045, 6, 56]} />
          <meshStandardMaterial color="#fff2a8" emissive={color} emissiveIntensity={2.2} transparent opacity={0.62} />
        </mesh>
        {Array.from({ length: Math.min(14, Math.max(7, swing.hits ?? 7)) }).map((_, index) => {
          const angle = (index / Math.min(14, Math.max(7, swing.hits ?? 7))) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.sin(angle) * 2.65, 0.04, Math.cos(angle) * 2.65]} rotation={[0.3, angle, 0]}>
              <coneGeometry args={[0.055, 0.78, 5]} />
              <meshBasicMaterial color="#fff2a8" transparent opacity={0.78} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          );
        })}
      </group>
    );
  }

  return (
    <group position={[swing.playerPos[0], worldY, swing.playerPos[1]]}>
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, swing.angle]} position={[0, -1.03, 0]}>
        <ringGeometry args={[0.82, cfg.reach + 0.55 + (comboStep - 1) * 0.24, 44, 1, Math.PI * 0.5 - visualArc * 0.5, visualArc]} />
        <meshBasicMaterial color={cfg.color} transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <group ref={pivotRef} rotation={[0, startAngle, 0]}>
        <group ref={weaponRef}>
          <WeaponModel shape={cfg.shape} cfg={cfg} />
        </group>

        <mesh ref={arcRef} position={[0, 0.44, cfg.reach * 0.68]} rotation={[0, 0, 0]}>
          <torusGeometry args={[cfg.reach * 0.5, cfg.tube * (2.55 + comboStep * 0.18), 8, 48, Math.PI * (1.14 + comboStep * 0.08)]} />
          <meshBasicMaterial color={cfg.color} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh ref={coreRef} position={[0, 0.43, cfg.reach * 0.74]} rotation={[0, 0, 0]}>
          <torusGeometry args={[cfg.reach * 0.42, cfg.tube * (4.4 + comboStep * 0.24), 6, 34, Math.PI * (0.92 + comboStep * 0.08)]} />
          <meshBasicMaterial color={cfg.core} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh ref={edgeRef} position={[0, 0.48, cfg.reach * 0.72]} rotation={[0, 0, 0]}>
          <torusGeometry args={[cfg.reach * 0.54, cfg.tube * (1 + comboStep * 0.12), 6, 48, Math.PI * (1.02 + comboStep * 0.08)]} />
          <meshStandardMaterial color={cfg.edge} emissive={cfg.color} emissiveIntensity={2.4} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>

        {Array.from({ length: (theme === "tank" ? 9 : theme === "assassin" ? 5 : 7) + comboStep }).map((_, index) => {
          const offset = (index - 3) * 0.12;
          const z = cfg.reach * (0.54 + index * 0.035);
          return (
            <mesh key={index} position={[offset, 0.28 + (index % 2) * 0.12, z]} rotation={[0.15, 0, -0.62 + index * 0.08]}>
              {theme === "miner" || theme === "tank" ? (
                <dodecahedronGeometry args={[0.045 + index * 0.003, 0]} />
              ) : (
                <coneGeometry args={[0.035 + index * 0.002, 0.32 + index * 0.025, 5]} />
              )}
              <meshBasicMaterial color={theme === "assassin" ? "#ffffff" : cfg.edge} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export default memo(MeleeEffect);
