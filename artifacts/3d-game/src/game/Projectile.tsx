import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Projectile as ProjType } from "./types";

interface Props {
  projectile: ProjType;
}

function Trail({ color, length, width, hot = false }: { color: string; length: number; width: number; hot?: boolean }) {
  return (
    <group position={[0, 0, -length * 0.56]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[width, length]} />
        <meshBasicMaterial color={color} transparent opacity={hot ? 0.34 : 0.2} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.035, length * 0.04]}>
        <planeGeometry args={[width * 0.42, length * 0.72]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={hot ? 0.16 : 0.08} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.02, length * 0.18]}>
        <boxGeometry args={[width * 0.22, width * 0.22, length * 0.5]} />
        <meshBasicMaterial color={color} transparent opacity={hot ? 0.24 : 0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function RangerArrow({ color, radius }: { color: string; radius: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.08, radius * 0.08, 1.12, 8]} />
        <meshStandardMaterial color="#e5d4a4" roughness={0.35} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[radius * 0.33, radius * 0.66, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.35} roughness={0.2} metalness={0.42} />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * radius * 0.22, 0, -0.52]} rotation={[0, 0, side * 0.42]}>
          <boxGeometry args={[radius * 0.12, radius * 0.04, 0.26]} />
          <meshBasicMaterial color="#d8fff3" transparent opacity={0.76} />
        </mesh>
      ))}
    </group>
  );
}

function MageOrb({ color, radius }: { color: string; radius: number }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius * 0.95, 16, 12]} />
        <meshStandardMaterial color="#ff8c45" emissive={color} emissiveIntensity={2.6} roughness={0.14} metalness={0.18} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.08, radius * 0.055, 6, 28]} />
        <meshStandardMaterial color="#ffd0a0" emissive={color} emissiveIntensity={2.2} transparent opacity={0.86} />
      </mesh>
      {[0, 1, 2].map(index => {
        const angle = index * (Math.PI * 2 / 3);
        return (
          <mesh key={index} position={[Math.sin(angle) * radius * 0.62, 0, -radius * 0.35]} rotation={[0.4, angle, 0]}>
            <coneGeometry args={[radius * 0.17, radius * 0.58, 6]} />
            <meshBasicMaterial color="#ffbd67" transparent opacity={0.58} />
          </mesh>
        );
      })}
    </group>
  );
}

function AssassinBlade({ color, radius }: { color: string; radius: number }) {
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[radius * 0.14, radius * 0.08, 0.78]} />
        <meshStandardMaterial color="#1b101d" emissive={color} emissiveIntensity={1.2} roughness={0.2} metalness={0.46} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(angle => (
        <mesh key={angle} position={[Math.sin(angle) * radius * 0.38, Math.cos(angle) * radius * 0.38, 0.08]} rotation={[Math.PI / 2, 0, angle]}>
          <coneGeometry args={[radius * 0.1, radius * 0.44, 3]} />
          <meshStandardMaterial color="#f8d8ff" emissive={color} emissiveIntensity={1.8} roughness={0.12} metalness={0.66} />
        </mesh>
      ))}
    </group>
  );
}

function KnightThrow({ color, radius }: { color: string; radius: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 0.08, radius * 0.1, 0.78, 7]} />
        <meshStandardMaterial color="#6b4327" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.01, 0.38]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[radius * 0.18, radius * 0.12, radius * 0.68]} />
        <meshStandardMaterial color="#d7e8ef" emissive={color} emissiveIntensity={0.85} metalness={0.82} roughness={0.1} />
      </mesh>
      <mesh position={[radius * 0.37, 0.01, 0.38]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[radius * 0.15, radius * 0.26, 4]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.2} metalness={0.82} roughness={0.08} />
      </mesh>
    </group>
  );
}

function TankShock({ color, radius }: { color: string; radius: number }) {
  return (
    <group>
      <mesh>
        <dodecahedronGeometry args={[radius * 0.88, 0]} />
        <meshStandardMaterial color="#756145" emissive={color} emissiveIntensity={1.45} roughness={0.34} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.05, radius * 0.08, 6, 26]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -radius * 0.46]}>
        <boxGeometry args={[radius * 0.18, radius * 0.18, radius * 0.78]} />
        <meshBasicMaterial color="#fff3bd" transparent opacity={0.54} />
      </mesh>
    </group>
  );
}

function MinerShard({ color, radius }: { color: string; radius: number }) {
  return (
    <group>
      <mesh rotation={[0.2, 0.4, 0.55]}>
        <dodecahedronGeometry args={[radius * 0.78, 0]} />
        <meshStandardMaterial color="#8a7051" emissive={color} emissiveIntensity={0.9} roughness={0.46} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.02, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[radius * 0.12, radius * 0.11, radius * 0.78]} />
        <meshStandardMaterial color="#ddd4b6" emissive={color} emissiveIntensity={0.8} roughness={0.26} metalness={0.58} />
      </mesh>
      {[0, 1, 2].map(index => (
        <mesh key={index} position={[(index - 1) * radius * 0.26, 0.02, -radius * 0.52]} rotation={[0.3, index, 0.2]}>
          <boxGeometry args={[radius * 0.08, radius * 0.08, radius * 0.2]} />
          <meshBasicMaterial color="#ffd85a" transparent opacity={0.68} />
        </mesh>
      ))}
    </group>
  );
}

function Projectile({ projectile }: Props) {
  const meshRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Group>(null);
  const style = projectile.attackStyle ?? "melee_arc";
  const angle = Math.atan2(projectile.direction[0], projectile.direction[1]);
  const radius = Math.max(0.24, projectile.radius * 1.5);
  const length = (style === "rapid_projectile" ? 1.72
    : style === "magic_orb" ? 1.34
    : style === "dash_strike" ? 1.2
    : style === "heavy_cone" ? 1.28
    : style === "pickaxe_throw" ? 1.2
    : 1.3);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const spin = style === "dash_strike" ? 24 : style === "pickaxe_throw" || style === "melee_arc" ? 13 : style === "heavy_cone" ? 5 : 9;
      meshRef.current.rotation.z += delta * spin;
      if (style === "magic_orb") meshRef.current.rotation.y += delta * 5;
    }
    if (trailRef.current) {
      const pulse = 0.9 + Math.sin(projectile.age * 18) * 0.08;
      trailRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group position={projectile.position} rotation={[0, angle, 0]} scale={projectile.critical ? 1.62 : 1.46}>
      <group ref={meshRef}>
        {style === "rapid_projectile" ? (
          <RangerArrow color={projectile.color} radius={radius} />
        ) : style === "magic_orb" || projectile.weaponId === "nova" ? (
          <MageOrb color={projectile.color} radius={radius} />
        ) : style === "dash_strike" ? (
          <AssassinBlade color={projectile.color} radius={radius} />
        ) : style === "heavy_cone" ? (
          <TankShock color={projectile.color} radius={radius} />
        ) : style === "pickaxe_throw" ? (
          <MinerShard color={projectile.color} radius={radius} />
        ) : (
          <KnightThrow color={projectile.color} radius={radius} />
        )}
      </group>

      <group ref={trailRef}>
        <Trail
          color={projectile.color}
          length={length}
          width={style === "heavy_cone" ? radius * 1.58 : style === "magic_orb" ? radius * 1.45 : radius * 1.05}
          hot={style === "magic_orb" || projectile.critical}
        />
        {(style === "magic_orb" || projectile.critical) && (
          <pointLight color={projectile.color} intensity={style === "magic_orb" ? 1.7 : 1.15} distance={style === "magic_orb" ? 5.5 : 3.6} />
        )}
        {style === "rapid_projectile" && (
          <mesh position={[0, 0.01, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 0.38, radius * 0.018, 6, 20]} />
            <meshBasicMaterial color="#d8fff3" transparent opacity={0.42} depthWrite={false} />
          </mesh>
        )}
        {style === "heavy_cone" && (
          <mesh position={[0, 0, -length * 0.68]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 0.78, radius * 0.035, 5, 22]} />
            <meshBasicMaterial color={projectile.color} transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        )}
        {style === "magic_orb" && (
          <mesh position={[0, 0, -length * 0.45]}>
            <sphereGeometry args={[radius * 0.42, 10, 8]} />
            <meshBasicMaterial color="#ffbd67" transparent opacity={0.24} depthWrite={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}

export default memo(Projectile);
