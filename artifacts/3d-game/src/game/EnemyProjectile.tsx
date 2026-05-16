import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EnemyProjectile as EnemyProjType } from "./types";

interface Props {
  projectile: EnemyProjType;
}

function EnemyProjectile({ projectile }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = Math.atan2(projectile.direction[0], projectile.direction[1]);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 5;
  });

  return (
    <group position={projectile.position} rotation={[0, angle, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
        <ringGeometry args={[0.3, 0.42, 18]} />
        <meshBasicMaterial color="#d28cff" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial color="#ca8cff" emissive="#793cff" emissiveIntensity={1.8} roughness={0.18} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0, -0.34]}>
        <planeGeometry args={[0.42, 0.88]} />
        <meshBasicMaterial color="#8f55ff" transparent opacity={0.34} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default memo(EnemyProjectile);
