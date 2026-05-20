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
  const trailRef = useRef<THREE.Group>(null);
  const angle = Math.atan2(projectile.direction[0], projectile.direction[1]);
  const lightEnabled = renderQuality !== "low";

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 5;
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 7;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.28 + Math.sin(projectile.age * 14) * 0.08;
    }
    if (trailRef.current) {
      const pulse = 0.96 + Math.sin(projectile.age * 16) * 0.08;
      trailRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group position={projectile.position} rotation={[0, angle, 0]} scale={1.26}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
        <ringGeometry args={[0.34, 0.56, 32]} />
        <meshBasicMaterial color="#d28cff" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.4, 14, 10]} />
        <meshBasicMaterial color="#8f55ff" transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.31, 1]} />
        <meshStandardMaterial color="#f7dcff" emissive="#793cff" emissiveIntensity={2.75} roughness={0.12} metalness={0.42} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.026, 6, 34]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.34} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={trailRef} position={[0, 0, -0.58]}>
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.58, 1.28]} />
          <meshBasicMaterial color="#8f55ff" transparent opacity={0.36} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, 0.01, 0.18]}>
          <coneGeometry args={[0.28, 0.96, 7]} />
          <meshBasicMaterial color="#d28cff" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, 0.02, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.014, 5, 18]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      {lightEnabled && <pointLight color="#b06cff" intensity={renderQuality === "high" ? 1.1 : 0.62} distance={3.7} />}
      {[-1, 0, 1].map(index => (
        <mesh key={index} position={[index * 0.12, 0.02, -0.42 - Math.abs(index) * 0.08]} rotation={[0.2, index * 0.4, 0]}>
          <coneGeometry args={[0.035, 0.42, 5]} />
          <meshBasicMaterial color={index === 0 ? "#ffffff" : "#d28cff"} transparent opacity={0.62} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export default memo(EnemyProjectile);
