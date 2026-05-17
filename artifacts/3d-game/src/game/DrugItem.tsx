import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DrugItem as PickupItemType, DRUG_CONFIG } from "./types";
import { useGameStore } from "./useGameStore";

interface Props {
  drug: PickupItemType;
}

const PICKUP_ACCENTS: Record<PickupItemType["type"], string> = {
  speed: "#7dfcff",
  heal: "#79ff70",
  invincibility: "#ffe66f",
  strength: "#ff8d42",
  flight: "#d8a6ff",
  time_slow: "#59ffa8",
  triple_shot: "#ff7bb5",
  melee_360: "#ffbd5a",
};

function PickupIcon({ type, color }: { type: PickupItemType["type"]; color: string }) {
  if (type === "heal") {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.15, 18, 12]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.4} roughness={0.18} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.46, 0.12, 0.08]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.2} roughness={0.18} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.12, 0.46, 0.08]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.2} roughness={0.18} />
        </mesh>
      </group>
    );
  }

  if (type === "speed" || type === "flight") {
    return (
      <group>
        <mesh rotation={[0, 0, -0.45]}>
          <coneGeometry args={[0.15, 0.5, 18]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.35} roughness={0.18} />
        </mesh>
        <mesh position={[-0.13, -0.08, 0]} rotation={[0, 0, 0.72]}>
          <coneGeometry args={[0.09, 0.32, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.7} roughness={0.18} transparent opacity={0.88} />
        </mesh>
      </group>
    );
  }

  if (type === "time_slow") {
    return (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.025, 8, 32]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.4} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.3} />
        </mesh>
        <mesh position={[0.08, 0, 0]} rotation={[0, 0, -0.85]}>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.3} />
        </mesh>
      </group>
    );
  }

  if (type === "triple_shot") {
    return (
      <group>
        {[-0.22, 0, 0.22].map((x, index) => (
          <mesh key={index} position={[x, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.7} roughness={0.18} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === "melee_360") {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.035, 8, 36]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.8} roughness={0.18} />
      </mesh>
    );
  }

  return (
    <mesh rotation={[0, 0, Math.PI / 4]}>
      <octahedronGeometry args={[0.24, 1]} />
      <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.5} roughness={0.16} />
    </mesh>
  );
}

function MagicMushroom({ type, color }: { type: PickupItemType["type"]; color: string }) {
  const capColor = type === "heal" ? "#ff5f68"
    : type === "speed" ? "#46dff6"
    : type === "invincibility" ? "#f2cf4d"
    : type === "strength" ? "#f0823c"
    : type === "flight" ? "#b686ff"
    : type === "time_slow" ? "#4fdc9a"
    : type === "triple_shot" ? "#ff72a8"
    : "#ffb45a";
  const spots = [
    [-0.18, 0.1, 0.18, 0.055],
    [0.16, 0.12, 0.22, 0.048],
    [0, 0.18, 0.27, 0.065],
    [-0.08, 0.2, -0.18, 0.04],
    [0.22, 0.08, -0.08, 0.035],
  ] as const;

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, -0.16, 0]} scale={[0.72, 1.05, 0.72]}>
        <capsuleGeometry args={[0.19, 0.34, 8, 18]} />
        <meshStandardMaterial color="#f0e6ce" roughness={0.56} metalness={0.02} emissive={color} emissiveIntensity={0.08} />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0]} scale={[1.08, 0.42, 1]}>
        <sphereGeometry args={[0.44, 34, 20]} />
        <meshStandardMaterial color={capColor} roughness={0.42} metalness={0.04} emissive={color} emissiveIntensity={0.34} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 0.78, 1]}>
        <torusGeometry args={[0.31, 0.018, 8, 36]} />
        <meshStandardMaterial color="#f8dfb9" roughness={0.48} emissive={color} emissiveIntensity={0.1} />
      </mesh>
      {spots.map(([x, y, z, size], index) => (
        <mesh key={index} position={[x, y + 0.19, z]} scale={[1, 0.32, 1]} castShadow>
          <sphereGeometry args={[size, 12, 8]} />
          <meshStandardMaterial color="#fff7d9" roughness={0.44} emissive="#ffffff" emissiveIntensity={0.12} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map(index => {
        const angle = index * Math.PI * 0.5 + 0.28;
        return (
          <mesh key={index} position={[Math.sin(angle) * 0.48, -0.02 + index * 0.018, Math.cos(angle) * 0.48]} rotation={[0.4, angle, 0]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.58} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function DrugItem({ drug }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const quality = useGameStore(s => s.quality);
  const cfg = DRUG_CONFIG[drug.type];
  const color = PICKUP_ACCENTS[drug.type] ?? cfg.color;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta * 1.7;
    groupRef.current.position.y = drug.position[1] + Math.sin(t.current) * 0.16;
    groupRef.current.rotation.y += delta * 0.9;
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 1.2;
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(t.current * 1.5) * 0.05;
    }
  });

  if (drug.collected) return null;

  return (
    <group ref={groupRef} position={[drug.position[0], drug.position[1], drug.position[2]]} scale={1.18}>
      {quality === "high" && <pointLight color={color} intensity={0.55} distance={2.7} />}

      <mesh position={[0, -0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.6, 0.13, 30]} />
        <meshStandardMaterial color="#26372f" roughness={0.82} metalness={0.08} />
      </mesh>

      <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.82, 46]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <MagicMushroom type={drug.type} color={color} />

      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
        <torusGeometry args={[0.66, 0.02, 8, 42]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <group position={[0, 0.02, 0.52]} scale={0.78}>
        <PickupIcon type={drug.type} color={color} />
      </group>
    </group>
  );
}

export default memo(DrugItem);
