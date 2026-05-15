import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EnemyProjectile as EnemyProjType } from "./types";

interface Props { projectile: EnemyProjType; }

export default function EnemyProjectile({ projectile: proj }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta * 5;
    if (meshRef.current) meshRef.current.rotation.y += delta * 3;
  });

  return (
    <group position={[proj.position[0], proj.position[1], proj.position[2]]}>
      <pointLight color="#8844ff" intensity={3} distance={3} />
      {/* Outer wisp */}
      <mesh>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshStandardMaterial
          color="#8844ff"
          transparent
          opacity={0.35}
          roughness={0}
        />
      </mesh>
      {/* Core */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.16]} />
        <meshStandardMaterial
          color="#cc88ff"
          emissive="#8833ff"
          emissiveIntensity={3}
          roughness={0}
          metalness={0.5}
        />
      </mesh>
      {/* Trail */}
      <mesh position={[
        -proj.direction[0] * 0.3,
        0,
        -proj.direction[1] * 0.3,
      ]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial
          color="#6622cc"
          emissive="#4400aa"
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}
