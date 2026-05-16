import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Projectile as ProjType } from "./types";

interface Props {
  projectile: ProjType;
}

function Projectile({ projectile }: Props) {
  const meshRef = useRef<THREE.Object3D>(null);
  const trailRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 12;
    if (trailRef.current) {
      const material = trailRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.28 + Math.sin(projectile.age * 20) * 0.06;
    }
  });

  const length = projectile.weaponId === "laser" ? 0.95 : projectile.weaponId === "nova" ? 0.5 : 0.62;
  const angle = Math.atan2(projectile.direction[0], projectile.direction[1]);

  return (
    <group position={projectile.position} rotation={[0, angle, 0]}>
      {projectile.weaponId === "nova" ? (
        <mesh ref={meshRef} castShadow>
          <sphereGeometry args={[projectile.radius, 12, 10]} />
          <meshStandardMaterial color={projectile.color} emissive={projectile.color} emissiveIntensity={1.8} roughness={0.18} metalness={0.32} />
        </mesh>
      ) : (
        <group ref={meshRef}>
          <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[projectile.radius * 0.12, projectile.radius * 0.12, length, 7]} />
            <meshStandardMaterial color="#fff3c0" emissive={projectile.color} emissiveIntensity={0.45} roughness={0.26} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0, length * 0.54]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[projectile.radius * 0.42, projectile.radius * 0.95, 8]} />
            <meshStandardMaterial color={projectile.color} emissive={projectile.color} emissiveIntensity={1.7} roughness={0.24} metalness={0.28} />
          </mesh>
          <mesh position={[0, 0, -length * 0.34]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[projectile.radius * 0.34, projectile.radius * 0.55, 3]} />
            <meshBasicMaterial color={projectile.color} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      <mesh ref={trailRef} position={[0, 0, -length * 0.82]}>
        <planeGeometry args={[projectile.radius * 1.35, length * 1.45]} />
        <meshBasicMaterial color={projectile.color} transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default memo(Projectile);
