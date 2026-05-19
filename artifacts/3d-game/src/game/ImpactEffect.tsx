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
  const flashRef = useRef<THREE.Mesh>(null);
  const sparks = useMemo(() => {
    const count = burst.kind === "death" ? 12 : burst.kind === "heavy" ? 10 : 7;
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 + (index % 2) * 0.18;
      return {
        angle,
        distance: 0.55 + (index % 4) * 0.18,
        height: 0.08 + (index % 3) * 0.12,
        size: 0.045 + (index % 3) * 0.012,
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

    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.82 - t * 1.65);
      flashRef.current.scale.setScalar(0.3 + eased * 0.75 * burst.power);
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
        <ringGeometry args={[ringRadius, ringRadius + 0.08, 40]} />
        <meshBasicMaterial color={burst.color} transparent opacity={0.34} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={flashRef}>
        <sphereGeometry args={[0.34, 10, 8]} />
        <meshBasicMaterial color={burst.kind === "crit" ? "#ffffff" : burst.color} transparent opacity={0.72} depthWrite={false} />
      </mesh>

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
          rotation={[0.6, spark.angle, 0.35]}
        >
          {burst.theme === "miner" || burst.kind === "heavy" ? (
            <dodecahedronGeometry args={[spark.size * 1.45, 0]} />
          ) : (
            <boxGeometry args={[spark.size, spark.size, spark.size * 5.4]} />
          )}
          <meshBasicMaterial color={sparkColor} transparent opacity={0.72} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default memo(ImpactEffect);
