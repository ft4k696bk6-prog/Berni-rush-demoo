import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PoisonItem as EnemyType, ENEMY_CONFIG } from "./types";
import { useGameStore } from "./useGameStore";
import {
  poisonCurrentPos, enemyContactTimers,
  enemyFireTimers, creeperCountdownStart,
} from "./poisonPositions";

interface Props { poison: EnemyType; }

const BOUND = 21;

export default function PoisonItem({ poison }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef<[number, number]>([poison.position[0], poison.position[2]]);
  const t = useRef(Math.random() * Math.PI * 2);
  const flashRef = useRef<THREE.Mesh>(null);

  const { phase, playerPos, activeEffects, fireEnemyProjectile, damagePlayer, explodeAt, damageEnemy } = useGameStore();
  const cfg = ENEMY_CONFIG[poison.type];
  const isBoss = poison.type === "boss10" || poison.type === "boss20";
  const hpRatio = Math.max(0, poison.hp / cfg.baseHp);

  useFrame((_, delta) => {
    if (!groupRef.current || poison.collected || phase !== "playing") return;
    t.current += delta * 1.5;
    const now = Date.now();

    const slow = activeEffects.some(e => e.type === "time_slow" && e.expiresAt > now);
    const speed = cfg.speed * (slow ? 0.3 : 1);

    // Move toward player
    const dx = playerPos[0] - posRef.current[0];
    const dz = playerPos[1] - posRef.current[1];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.1) {
      posRef.current[0] += (dx / dist) * speed * delta;
      posRef.current[1] += (dz / dist) * speed * delta;
    }
    posRef.current[0] = THREE.MathUtils.clamp(posRef.current[0], -BOUND, BOUND);
    posRef.current[1] = THREE.MathUtils.clamp(posRef.current[1], -BOUND, BOUND);

    // Update registry so collision/bullet systems see live position
    poisonCurrentPos[poison.id] = [posRef.current[0], posRef.current[1]];

    const baseY = isBoss ? 2.0 : 1.2;
    const floatAmp = poison.type === "ghost" ? 0.4 : 0.08;
    groupRef.current.position.set(
      posRef.current[0],
      baseY + Math.sin(t.current) * floatAmp,
      posRef.current[1],
    );

    // Face player
    if (dist > 0.1) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.1);
    }

    // ── Mechanic: MELEE (zombie / boss) ──
    if (poison.mechanics.includes("melee")) {
      const meleeRange = isBoss ? 3.0 : 1.8;
      if (dist < meleeRange) {
        const last = enemyContactTimers[poison.id] ?? 0;
        const cd = isBoss ? 1200 : 1600;
        if (now - last > cd) {
          enemyContactTimers[poison.id] = now;
          damagePlayer(cfg.damage);
        }
      }
    }

    // ── Mechanic: SHOOT (ghost / boss) ──
    if (poison.mechanics.includes("shoot")) {
      const shootRange = isBoss ? 20 : 13;
      if (dist < shootRange) {
        const last = enemyFireTimers[poison.id] ?? 0;
        const fireCd = isBoss ? 2000 : 2800;
        if (now - last > fireCd) {
          enemyFireTimers[poison.id] = now;
          fireEnemyProjectile(
            posRef.current[0], posRef.current[1],
            playerPos[0], playerPos[1],
            cfg.damage,
          );
        }
      }
    }

    // ── Mechanic: EXPLODE (creeper / boss) ──
    if (poison.mechanics.includes("explode")) {
      const triggerRange = isBoss ? 4.0 : 2.8;
      if (dist < triggerRange) {
        if (!creeperCountdownStart[poison.id]) {
          creeperCountdownStart[poison.id] = now;
        }
        const elapsed = now - creeperCountdownStart[poison.id];
        const countdownMs = isBoss ? 3000 : 2200;

        // Flash during countdown
        if (flashRef.current) {
          const flash = Math.sin((elapsed / countdownMs) * Math.PI * 8) > 0;
          (flashRef.current.material as THREE.MeshLambertMaterial).color.set(flash ? "#ffffff" : "#33bb33");
        }

        if (elapsed > countdownMs) {
          delete creeperCountdownStart[poison.id];
          const blastRadius = isBoss ? 6 : 4;
          explodeAt(posRef.current[0], posRef.current[1], blastRadius, cfg.damage);
          if (!isBoss) damageEnemy(poison.id, 99); // creeper dies after exploding
        }
      } else {
        // Reset countdown if creeper retreated
        if (creeperCountdownStart[poison.id]) delete creeperCountdownStart[poison.id];
        if (flashRef.current) {
          (flashRef.current.material as THREE.MeshLambertMaterial).color.set("#33bb33");
        }
      }
    }
  });

  if (poison.collected) return null;

  const s = poison.scale;

  const renderModel = () => {
    switch (poison.type) {
      case "ghost":
        return (
          <group scale={[s, s, s]}>
            {/* Ghost body */}
            <mesh castShadow>
              <sphereGeometry args={[0.65, 12, 10]} />
              <meshStandardMaterial color="#f0f0ff" transparent opacity={0.82} roughness={0.2} metalness={0} emissive="#8888ff" emissiveIntensity={0.15} />
            </mesh>
            {/* Wavy skirt */}
            {[-0.4, -0.15, 0.15, 0.4].map((x, i) => (
              <mesh key={i} position={[x, -0.55 + Math.sin((t.current + i) * 2) * 0.1, 0]}>
                <sphereGeometry args={[0.22, 8, 6]} />
                <meshStandardMaterial color="#e0e0ff" transparent opacity={0.7} />
              </mesh>
            ))}
            {/* Eyes */}
            <mesh position={[0.22, 0.15, 0.55]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#000022" />
            </mesh>
            <mesh position={[-0.22, 0.15, 0.55]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#000022" />
            </mesh>
            {/* Pupils (red glow) */}
            <mesh position={[0.22, 0.15, 0.68]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
            </mesh>
            <mesh position={[-0.22, 0.15, 0.68]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
            </mesh>
            {/* Open mouth */}
            <mesh position={[0, -0.12, 0.62]}>
              <boxGeometry args={[0.28, 0.14, 0.06]} />
              <meshStandardMaterial color="#220044" />
            </mesh>
            <pointLight color="#8888ff" intensity={1.5} distance={4} />
          </group>
        );

      case "zombie":
        return (
          <group scale={[s, s, s]}>
            {/* Head */}
            <mesh position={[0, 1.05, 0]} castShadow>
              <boxGeometry args={[0.72, 0.72, 0.72]} />
              <meshLambertMaterial color="#5a9a5a" />
            </mesh>
            {/* Dark eyes */}
            <mesh position={[0.2, 1.12, 0.37]}>
              <boxGeometry args={[0.18, 0.12, 0.04]} />
              <meshStandardMaterial color="#001a00" emissive="#003300" emissiveIntensity={1} />
            </mesh>
            <mesh position={[-0.2, 1.12, 0.37]}>
              <boxGeometry args={[0.18, 0.12, 0.04]} />
              <meshStandardMaterial color="#001a00" emissive="#003300" emissiveIntensity={1} />
            </mesh>
            {/* Mouth slash */}
            <mesh position={[0, 0.9, 0.37]}>
              <boxGeometry args={[0.3, 0.06, 0.04]} />
              <meshLambertMaterial color="#003300" />
            </mesh>
            {/* Body */}
            <mesh position={[0, 0.28, 0]} castShadow>
              <boxGeometry args={[0.78, 0.84, 0.52]} />
              <meshLambertMaterial color="#2a5a2a" />
            </mesh>
            {/* Torn shirt detail */}
            <mesh position={[0, 0.38, 0.27]}>
              <boxGeometry args={[0.6, 0.5, 0.05]} />
              <meshLambertMaterial color="#1a3a1a" />
            </mesh>
            {/* Arms outstretched */}
            <mesh position={[0.78, 0.45, 0.2]} rotation={[0.6, 0, 0.1]} castShadow>
              <boxGeometry args={[0.38, 0.75, 0.38]} />
              <meshLambertMaterial color="#5a9a5a" />
            </mesh>
            <mesh position={[-0.78, 0.45, 0.2]} rotation={[0.6, 0, -0.1]} castShadow>
              <boxGeometry args={[0.38, 0.75, 0.38]} />
              <meshLambertMaterial color="#5a9a5a" />
            </mesh>
            {/* Legs */}
            <mesh position={[0.22, -0.48, Math.sin(t.current * 3) * 0.1]} castShadow>
              <boxGeometry args={[0.34, 0.68, 0.38]} />
              <meshLambertMaterial color="#1a4a1a" />
            </mesh>
            <mesh position={[-0.22, -0.48, -Math.sin(t.current * 3) * 0.1]} castShadow>
              <boxGeometry args={[0.34, 0.68, 0.38]} />
              <meshLambertMaterial color="#1a4a1a" />
            </mesh>
          </group>
        );

      case "creeper":
        return (
          <group scale={[s, s, s]}>
            {/* Head */}
            <mesh ref={flashRef} position={[0, 1.05, 0]} castShadow>
              <boxGeometry args={[0.72, 0.72, 0.72]} />
              <meshLambertMaterial color="#33bb33" />
            </mesh>
            {/* Creeper face (dark boxes) */}
            <mesh position={[0.18, 1.18, 0.37]}>
              <boxGeometry args={[0.2, 0.18, 0.04]} />
              <meshLambertMaterial color="#0a2a0a" />
            </mesh>
            <mesh position={[-0.18, 1.18, 0.37]}>
              <boxGeometry args={[0.2, 0.18, 0.04]} />
              <meshLambertMaterial color="#0a2a0a" />
            </mesh>
            <mesh position={[0, 0.92, 0.37]}>
              <boxGeometry args={[0.14, 0.2, 0.04]} />
              <meshLambertMaterial color="#0a2a0a" />
            </mesh>
            <mesh position={[0.18, 0.85, 0.37]}>
              <boxGeometry args={[0.18, 0.14, 0.04]} />
              <meshLambertMaterial color="#0a2a0a" />
            </mesh>
            <mesh position={[-0.18, 0.85, 0.37]}>
              <boxGeometry args={[0.18, 0.14, 0.04]} />
              <meshLambertMaterial color="#0a2a0a" />
            </mesh>
            {/* Body */}
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[0.55, 0.82, 0.46]} />
              <meshLambertMaterial color="#2e9a2e" />
            </mesh>
            {/* 4 stubby legs */}
            {[[-0.18, -0.5, 0.14], [0.18, -0.5, 0.14], [-0.18, -0.5, -0.14], [0.18, -0.5, -0.14]].map(([lx, ly, lz], i) => (
              <mesh key={i} position={[lx, ly, lz]} castShadow>
                <boxGeometry args={[0.24, 0.44, 0.24]} />
                <meshLambertMaterial color="#228822" />
              </mesh>
            ))}
          </group>
        );

      case "boss10":
        return (
          <group scale={[s, s, s]}>
            {/* Skeleton King body */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[1.0, 1.3, 0.65]} />
              <meshLambertMaterial color="#ddddcc" />
            </mesh>
            {/* Rib lines */}
            {[-0.4, -0.15, 0.1, 0.35].map((y, i) => (
              <mesh key={i} position={[0, y, 0.34]}>
                <boxGeometry args={[0.82, 0.1, 0.06]} />
                <meshLambertMaterial color="#aaaaaa" />
              </mesh>
            ))}
            {/* Head */}
            <mesh position={[0, 1.15, 0]} castShadow>
              <boxGeometry args={[0.9, 0.82, 0.82]} />
              <meshLambertMaterial color="#eeeecc" />
            </mesh>
            {/* Red glowing eyes */}
            <mesh position={[0.22, 1.22, 0.42]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            <mesh position={[-0.22, 1.22, 0.42]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
            </mesh>
            {/* Crown */}
            {[-0.3, 0, 0.3].map((x, i) => (
              <mesh key={i} position={[x, 1.72, 0]} castShadow>
                <boxGeometry args={[0.2, 0.35 + (i === 1 ? 0.2 : 0), 0.2]} />
                <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.5} metalness={0.8} />
              </mesh>
            ))}
            {/* Huge arms */}
            <mesh position={[1.0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.45, 1.1, 0.42]} />
              <meshLambertMaterial color="#ddddcc" />
            </mesh>
            <mesh position={[-1.0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.45, 1.1, 0.42]} />
              <meshLambertMaterial color="#ddddcc" />
            </mesh>
            <pointLight color="#ff3300" intensity={3} distance={8} />
          </group>
        );

      case "boss20":
        return (
          <group scale={[s, s, s]}>
            {/* Dark Lord body */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[1.1, 1.5, 0.72]} />
              <meshStandardMaterial color="#110011" emissive="#440066" emissiveIntensity={0.5} roughness={0.3} metalness={0.6} />
            </mesh>
            {/* Cape */}
            <mesh position={[0, 0.3, -0.42]}>
              <boxGeometry args={[1.5, 1.7, 0.08]} />
              <meshStandardMaterial color="#1a0033" emissive="#330055" emissiveIntensity={0.3} transparent opacity={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.4, 0]} castShadow>
              <boxGeometry args={[1.0, 0.9, 0.9]} />
              <meshStandardMaterial color="#0a0011" emissive="#330044" emissiveIntensity={0.4} roughness={0.2} metalness={0.7} />
            </mesh>
            {/* 4 glowing eyes */}
            {[[0.28, 1.5, 0.46], [-0.28, 1.5, 0.46], [0.1, 1.28, 0.46], [-0.1, 1.28, 0.46]].map(([ex, ey, ez], i) => (
              <mesh key={i} position={[ex, ey, ez]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={4} />
              </mesh>
            ))}
            {/* Horns */}
            <mesh position={[0.35, 1.95, 0]} rotation={[0, 0, 0.3]} castShadow>
              <coneGeometry args={[0.12, 0.55, 6]} />
              <meshStandardMaterial color="#330033" emissive="#aa00ff" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[-0.35, 1.95, 0]} rotation={[0, 0, -0.3]} castShadow>
              <coneGeometry args={[0.12, 0.55, 6]} />
              <meshStandardMaterial color="#330033" emissive="#aa00ff" emissiveIntensity={0.6} />
            </mesh>
            {/* Giant arms */}
            <mesh position={[1.1, 0.5, 0]} castShadow>
              <boxGeometry args={[0.5, 1.3, 0.48]} />
              <meshStandardMaterial color="#110011" emissive="#220033" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[-1.1, 0.5, 0]} castShadow>
              <boxGeometry args={[0.5, 1.3, 0.48]} />
              <meshStandardMaterial color="#110011" emissive="#220033" emissiveIntensity={0.3} />
            </mesh>
            <pointLight color="#aa00ff" intensity={5} distance={12} />
            <pointLight color="#ff0033" intensity={2} distance={8} />
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} position={[posRef.current[0], isBoss ? 2.0 : 1.2, posRef.current[1]]}>
      {renderModel()}

      {/* HP bar */}
      <mesh position={[0, (isBoss ? 3.2 : 1.8) * s, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6 * s, 0.05 * s, 4, 24, Math.PI * 2 * hpRatio]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}
