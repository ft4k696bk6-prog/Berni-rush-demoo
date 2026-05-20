import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ImpactBurst } from "./types";

interface Props {
  burst: ImpactBurst;
}

const THEME_ACCENT: Record<ImpactBurst["theme"], string> = {
  knight: "#f2fbff",
  ranger: "#d8fff3",
  mage: "#ffb36e",
  assassin: "#ffd5ee",
  tank: "#fff0ad",
  miner: "#ffd26a",
};

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function ImpactEffect({ burst }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const sparks = useMemo(() => {
    const count = burst.kind === "death" ? 14 : burst.kind === "heavy" ? 11 : 8;
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 + (index % 2) * 0.18;
      return {
        angle,
        distance: 0.58 + (index % 4) * 0.2,
        height: 0.1 + (index % 3) * 0.13,
        size: 0.05 + (index % 3) * 0.014,
        tilt: 0.24 + (index % 4) * 0.08,
      };
    });
  }, [burst.kind]);

  useFrame(() => {
    const elapsed = Date.now() - burst.createdAt;
    const t = Math.min(1, elapsed / burst.duration);
    const eased = easeOut(t);
    const fade = 1 - t;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(0.78 + eased * 0.72 * burst.power);
    }

    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = fade * (burst.kind === "heavy" ? 0.48 : 0.34);
      ringRef.current.scale.setScalar(0.45 + eased * (burst.kind === "heavy" ? 1.55 : 1.05) * burst.power);
    }

    if (haloRef.current) {
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = fade * (burst.kind === "crit" ? 0.42 : 0.26);
      haloRef.current.scale.setScalar(0.32 + eased * (burst.kind === "heavy" ? 1.25 : 0.86) * burst.power);
      haloRef.current.rotation.z += 0.04;
    }

    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.96 - t * 1.8);
      flashRef.current.scale.setScalar(0.38 + eased * 0.82 * burst.power);
    }
  });

  const accent = THEME_ACCENT[burst.theme];
  const ringRadius = burst.kind === "heavy" ? 0.92 : burst.kind === "magic" ? 0.66 : 0.48;
  const sparkColor = burst.kind === "crit" ? "#ffffff" : burst.theme === "miner" ? "#ffd85a" : accent;

  return (
    <group ref={groupRef} position={burst.position}>
      {burst.kind !== "hit" && (
        <pointLight color={burst.color} intensity={burst.kind === "death" ? 1.5 : 0.9} distance={burst.kind === "heavy" ? 5.2 : 3.8} />
      )}

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.96, 0]}>
        <ringGeometry args={[ringRadius, ringRadius + 0.11, 44]} />
        <meshBasicMaterial color={burst.color} transparent opacity={0.38} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.94, 0]}>
        <ringGeometry args={[ringRadius * 0.18, ringRadius * 0.76, 36]} />
        <meshBasicMaterial color={accent} transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={flashRef}>
        <sphereGeometry args={[0.42, 12, 8]} />
        <meshBasicMaterial color={burst.kind === "crit" ? "#ffffff" : burst.color} transparent opacity={0.82} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {[0, 1, 2, 3].map(index => {
        const angle = index * Math.PI * 0.5 + 0.18;
        return (
          <mesh key={`ray-${index}`} position={[Math.sin(angle) * 0.28, 0.02, Math.cos(angle) * 0.28]} rotation={[Math.PI / 2, 0, angle]}>
            <coneGeometry args={[0.085, 0.86 + ringRadius * 0.28, 5]} />
            <meshBasicMaterial color={burst.kind === "crit" ? "#ffffff" : accent} transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}

      {burst.kind === "magic" && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.028, 6, 28]} />
          <meshStandardMaterial color={accent} emissive={burst.color} emissiveIntensity={2.4} transparent opacity={0.72} />
        </mesh>
      )}

      {burst.kind === "heavy" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.88, 0]}>
          <circleGeometry args={[0.7, 28]} />
          <meshBasicMaterial color={burst.color} transparent opacity={0.13} depthWrite={false} />
        </mesh>
      )}

      {sparks.map((spark, index) => (
        <mesh
          key={index}
          position={[
            Math.sin(spark.angle) * spark.distance,
            spark.height,
            Math.cos(spark.angle) * spark.distance,
          ]}
          rotation={[spark.tilt, spark.angle, 0.35]}
        >
          {burst.theme === "miner" || burst.kind === "heavy" ? (
            <dodecahedronGeometry args={[spark.size * 1.45, 0]} />
          ) : (
            <coneGeometry args={[spark.size * 0.78, spark.size * 6.4, 5]} />
          )}
          <meshBasicMaterial color={sparkColor} transparent opacity={0.78} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export default memo(ImpactEffect);
