import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DrugItem as PickupItemType, DRUG_CONFIG } from "./types";

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

function DrugItem({ drug }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);
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
    <group ref={groupRef} position={[drug.position[0], drug.position[1], drug.position[2]]}>
      <pointLight color={color} intensity={0.9} distance={3.2} />

      <mesh position={[0, -0.44, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.54, 0.16, 28]} />
        <meshStandardMaterial color="#26372f" roughness={0.78} metalness={0.12} />
      </mesh>

      <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.025, 10, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} depthWrite={false} />
      </mesh>

      <mesh castShadow>
        <sphereGeometry args={[0.36, 28, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.3}
          roughness={0.12}
          metalness={0.22}
          transparent
          opacity={0.92}
        />
      </mesh>

      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.64, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <group position={[0, 0.02, 0.38]}>
        <PickupIcon type={drug.type} color={color} />
      </group>
    </group>
  );
}

export default memo(DrugItem);
