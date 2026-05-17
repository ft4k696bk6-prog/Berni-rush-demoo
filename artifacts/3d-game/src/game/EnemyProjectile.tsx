import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EnemyProjectile as EnemyProjType } from "./types";

interface Props {
  projectile: EnemyProjType;
  renderQuality: "low" | "medium" | "high";
}

function EnemyProjectile({ projectile, renderQuality }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const angle = Math.atan2(projectile.direction[0], projectile.direction[1]);
  const lightEnabled = renderQuality !== "low";

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 5;
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 7;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.28 + Math.sin(projectile.age * 14) * 0.08;
    }
  });

  return (
    <group position={projectile.position} rotation={[0, angle, 0]} scale={1.12}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
        <ringGeometry args={[0.32, 0.5, 28]} />
        <meshBasicMaterial color="#d28cff" transparent opacity={0.24} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.27, 1]} />
        <meshStandardMaterial color="#f1c9ff" emissive="#793cff" emissiveIntensity={2.35} roughness={0.14} metalness={0.38} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.022, 6, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, -0.03, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.46, 1.1]} />
        <meshBasicMaterial color="#8f55ff" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {lightEnabled && <pointLight color="#b06cff" intensity={renderQuality === "high" ? 1.1 : 0.62} distance={3.7} />}
      {[-1, 0, 1].map(index => (
        <mesh key={index} position={[index * 0.12, 0.02, -0.42 - Math.abs(index) * 0.08]} rotation={[0.2, index * 0.4, 0]}>
          <boxGeometry args={[0.026, 0.026, 0.34]} />
          <meshBasicMaterial color={index === 0 ? "#ffffff" : "#d28cff"} transparent opacity={0.56} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default memo(EnemyProjectile);
