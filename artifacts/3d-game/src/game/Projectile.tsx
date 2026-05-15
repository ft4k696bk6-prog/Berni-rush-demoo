import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Projectile as ProjType } from "./types";

interface Props {
  projectile: ProjType;
}

export default function Projectile({ projectile }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta * 20;
    if (meshRef.current) meshRef.current.rotation.z += delta * 15;
    if (trailRef.current) {
      (trailRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.4 + Math.sin(t.current) * 0.2;
    }
  });

  return (
    <group position={[projectile.position[0], projectile.position[1], projectile.position[2]]}>
      <pointLight color="#ffaa00" intensity={3} distance={3} />

      {/* Core bullet */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          color="#ffdd00"
          emissive="#ff8800"
          emissiveIntensity={3}
          roughness={0}
          metalness={0.8}
        />
      </mesh>

      {/* Trail */}
      <mesh ref={trailRef}
        position={[
          -projectile.direction[0] * 0.35,
          0,
          -projectile.direction[1] * 0.35
        ]}
      >
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.32, 6, 6]} />
        <meshStandardMaterial
          color="#ffff00"
          transparent
          opacity={0.15}
          roughness={0}
        />
      </mesh>
    </group>
  );
}
