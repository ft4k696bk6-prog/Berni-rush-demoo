import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeleeSwing } from "./types";

interface Props { swing: MeleeSwing; }

const DURATION = 460;

function easeOut(t: number) { return 1 - (1 - t) * (1 - t); }

function MeleeEffect({ swing }: Props) {
  const pivotRef  = useRef<THREE.Group>(null);
  const bladeRef  = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Mesh>(null);
  const trailRef  = useRef<THREE.Mesh>(null);

  // Sword swings through ±0.4π arc centered on facing direction.
  // Sword tip is at LOCAL +Z, so when rotation.y = facing = π (forward),
  // world Z = 2.4*cos(π) = -2.4 → in front of player ✓
  const startAngle = swing.angle - Math.PI * 0.4;
  const endAngle   = swing.angle + Math.PI * 0.4;

  useFrame(() => {
    const elapsed = Date.now() - swing.startedAt;
    const t = Math.min(1, elapsed / DURATION);
    const eased = easeOut(t);
    const fade = 1 - t;

    if (swing.is360) {
      // 360° spin ring
      if (ringRef.current) {
        ringRef.current.rotation.y += 0.18;
        ringRef.current.scale.setScalar(0.86 + eased * 0.34);
        const mat = ringRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = fade * (swing.hits ? 4.2 : 3.1);
        mat.opacity = fade * 0.9;
      }
    } else {
      // Directional sword swing
      if (pivotRef.current) {
        pivotRef.current.rotation.y = startAngle + (endAngle - startAngle) * eased;
      }
      if (bladeRef.current) {
        const mat = bladeRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = fade * 1.5;
      }
      if (trailRef.current) {
        const mat = trailRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = fade * 0.68;
      }
    }
  });

  const worldY = 1.1;

  if (swing.is360) {
    return (
      <group position={[swing.playerPos[0], worldY, swing.playerPos[1]]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.03, 0]}>
          <ringGeometry args={[2.25, 4.25, 72]} />
          <meshBasicMaterial
            color="#ffbd5a"
            transparent
            opacity={0.24}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={ringRef}>
          <torusGeometry args={[3.5, 0.18, 8, 48]} />
          <meshStandardMaterial
            color={swing.color ?? "#ff8800"}
            emissive={swing.color ?? "#ff6600"}
            emissiveIntensity={3}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        {Array.from({ length: Math.min(8, Math.max(3, swing.hits ?? 3)) }).map((_, index) => {
          const angle = (index / Math.min(8, Math.max(3, swing.hits ?? 3))) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.sin(angle) * 2.45, 0.05, Math.cos(angle) * 2.45]} rotation={[0.2, angle, 0]}>
              <coneGeometry args={[0.08, 0.62, 5]} />
              <meshBasicMaterial color="#fff2a8" transparent opacity={0.62} />
            </mesh>
          );
        })}
        {/* Inner ring */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2.6, 0.1, 6, 36]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive={swing.color ?? "#ff8800"}
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={pivotRef}
      position={[swing.playerPos[0], worldY, swing.playerPos[1]]}
      rotation={[0, startAngle, 0]}
    >
      {/* Swing arc trail — at +Z (same as blade) */}
      <mesh ref={trailRef} position={[0, 0.1, 1.1]}>
        <planeGeometry args={[0.95, 2.45]} />
        <meshStandardMaterial
          color="#88ddff"
          emissive={swing.color ?? "#44aaff"}
          emissiveIntensity={1}
          transparent
          opacity={0.58}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -1.02, 1.46]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 3.16, 32, 1, -Math.PI * 0.2, Math.PI * 0.4]} />
        <meshBasicMaterial color={swing.color ?? "#44aaff"} transparent opacity={0.24} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Handle — close to pivot (+Z start of sword) */}
      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[0.12, 0.12, 0.44]} />
        <meshStandardMaterial color="#4a2e0a" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Wrap rings */}
      {[-0.12, 0, 0.12].map((z, i) => (
        <mesh key={i} position={[0, 0, 0.22 + z]}>
          <torusGeometry args={[0.08, 0.022, 6, 12]} />
          <meshStandardMaterial color="#7a5528" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* Pommel (behind handle, at small +Z) */}
      <mesh position={[0, 0, -0.07]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#cc9900" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Crossguard */}
      <mesh position={[0, 0, 0.52]}>
        <boxGeometry args={[0.72, 0.1, 0.12]} />
        <meshStandardMaterial color="#cc9900" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0.36, 0, 0.52]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#aa7700" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.36, 0, 0.52]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#aa7700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Blade — extends away from player toward +Z */}
      <mesh ref={bladeRef} position={[0, 0, 1.42]}>
        <boxGeometry args={[0.09, 0.09, 1.8]} />
        <meshStandardMaterial
          color="#cce8ff"
          metalness={0.97}
          roughness={0.03}
          emissive="#88ccff"
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Fuller */}
      <mesh position={[0, 0, 1.42]}>
        <boxGeometry args={[0.025, 0.11, 1.6]} />
        <meshStandardMaterial color="#aaccee" metalness={1} roughness={0} emissive="#66aadd" emissiveIntensity={1} />
      </mesh>
      {/* Tip */}
      <mesh position={[0, 0, 2.38]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.055, 0.28, 4]} />
        <meshStandardMaterial color="#ddeeff" metalness={0.95} roughness={0.05} emissive="#88ccff" emissiveIntensity={1.5} />
      </mesh>

    </group>
  );
}

export default memo(MeleeEffect);
