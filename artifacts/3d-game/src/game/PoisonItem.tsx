import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ARENA_BOUND, clampToArena } from "./balance";
import { playerRuntime } from "./gameRuntime";
import { PoisonItem as EnemyType } from "./types";
import { useGameStore } from "./useGameStore";
import {
  creeperCountdownStart,
  enemyContactTimers,
  enemyFireTimers,
  poisonCurrentPos,
} from "./poisonPositions";

interface Props {
  poison: EnemyType;
}

function PoisonItem({ poison }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.MeshStandardMaterial>(null);
  const posRef = useRef<[number, number]>([poison.position[0], poison.position[2]]);
  const t = useRef(Math.random() * Math.PI * 2);

  const phase = useGameStore(s => s.phase);
  const quality = useGameStore(s => s.quality);
  const hpRatio = Math.max(0, poison.hp / poison.maxHp);
  const isBoss = poison.type === "boss10" || poison.type === "boss20";

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group || phase !== "playing") return;

    const delta = Math.min(rawDelta, 1 / 30);
    const now = Date.now();
    const store = useGameStore.getState();
    t.current += delta * (poison.type === "ghost" ? 2.2 : 1.45);

    const slow = store.activeEffects.some(e => e.type === "time_slow" && e.expiresAt > now);
    const dx = playerRuntime.x - posRef.current[0];
    const dz = playerRuntime.z - posRef.current[1];
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
    const wantsRange = poison.mechanics.includes("shoot") && !poison.mechanics.includes("melee");
    const stopDistance = wantsRange ? 5.8 : 0.2;

    if (dist > stopDistance) {
      const speed = poison.speed * (slow ? 0.42 : 1);
      posRef.current[0] += (dx / dist) * speed * delta;
      posRef.current[1] += (dz / dist) * speed * delta;
    }

    posRef.current[0] = clampToArena(posRef.current[0], 1.4);
    posRef.current[1] = clampToArena(posRef.current[1], 1.4);
    poisonCurrentPos[poison.id] = [posRef.current[0], posRef.current[1]];

    const floatAmp = poison.type === "ghost" ? 0.42 : poison.type === "elite" ? 0.16 : 0.08;
    const baseY = isBoss ? 2.0 : 1.18;
    group.position.set(posRef.current[0], baseY + Math.sin(t.current) * floatAmp, posRef.current[1]);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.atan2(dx, dz), 9, delta);

    if (poison.mechanics.includes("melee")) {
      const meleeRange = isBoss ? 3.2 : poison.type === "elite" ? 2.15 : 1.72;
      if (dist < meleeRange) {
        const last = enemyContactTimers[poison.id] ?? 0;
        const cd = isBoss ? 1200 : poison.type === "elite" ? 1350 : 1550;
        if (now - last > cd) {
          enemyContactTimers[poison.id] = now;
          store.damagePlayer(poison.damage, posRef.current[0], posRef.current[1]);
        }
      }
    }

    if (poison.mechanics.includes("shoot")) {
      const shootRange = isBoss ? 24 : poison.type === "elite" ? 18 : 14;
      if (dist < shootRange) {
        const last = enemyFireTimers[poison.id] ?? 0;
        const fireCd = isBoss ? 1650 : poison.type === "elite" ? 2100 : 2700;
        if (now - last > fireCd) {
          enemyFireTimers[poison.id] = now;
          store.fireEnemyProjectile(posRef.current[0], posRef.current[1], playerRuntime.x, playerRuntime.z, poison.damage);
        }
      }
    }

    if (poison.mechanics.includes("explode")) {
      const triggerRange = isBoss ? 4.2 : 2.75;
      if (dist < triggerRange) {
        if (!creeperCountdownStart[poison.id]) creeperCountdownStart[poison.id] = now;
        const elapsed = now - creeperCountdownStart[poison.id];
        const countdownMs = isBoss ? 2600 : 1850;
        if (flashRef.current) {
          const flash = Math.sin((elapsed / countdownMs) * Math.PI * 10) > 0;
          flashRef.current.color.set(flash ? "#fff6b0" : poison.type === "boss20" ? "#5d29ff" : "#4eff5a");
          flashRef.current.emissiveIntensity = flash ? 1.3 : 0.35;
        }
        group.scale.setScalar(poison.scale * (1 + Math.min(0.18, elapsed / countdownMs * 0.18)));
        if (elapsed > countdownMs) {
          delete creeperCountdownStart[poison.id];
          store.explodeAt(posRef.current[0], posRef.current[1], isBoss ? 6.2 : 4.0, poison.damage);
          if (!isBoss) store.damageEnemy(poison.id, 999);
        }
      } else {
        if (creeperCountdownStart[poison.id]) delete creeperCountdownStart[poison.id];
        group.scale.setScalar(poison.scale);
      }
    } else {
      group.scale.setScalar(poison.scale);
    }
  });

  const bodyColor = poison.type === "ghost" ? "#8bb7ff"
    : poison.type === "zombie" ? "#4bd46a"
    : poison.type === "creeper" ? "#f6d24a"
    : poison.type === "elite" ? "#ff4f86"
    : poison.type === "boss10" ? "#f0e5c8"
    : "#231142";
  const accent = poison.type === "boss20" ? "#b06cff" : poison.type === "elite" ? "#ffd1e0" : "#101828";

  return (
    <group ref={groupRef} position={[posRef.current[0], isBoss ? 2 : 1.2, posRef.current[1]]} scale={poison.scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <ringGeometry args={[0.74, 0.92, 24]} />
        <meshBasicMaterial color={ENEMY_RING_COLOR[poison.type]} transparent opacity={0.34} />
      </mesh>

      {poison.type === "ghost" ? (
        <group>
          <mesh castShadow position={[0, 0.1, 0]}>
            <octahedronGeometry args={[0.56, 1]} />
            <meshStandardMaterial color={bodyColor} emissive="#4f7dff" emissiveIntensity={0.42} roughness={0.22} metalness={0.25} />
          </mesh>
          <mesh position={[0.56, 0.03, 0]} rotation={[0.15, 0, -0.42]}>
            <coneGeometry args={[0.12, 0.78, 3]} />
            <meshStandardMaterial color="#c8d7ff" emissive="#7490ff" emissiveIntensity={0.25} transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.56, 0.03, 0]} rotation={[0.15, 0, 0.42]}>
            <coneGeometry args={[0.12, 0.78, 3]} />
            <meshStandardMaterial color="#c8d7ff" emissive="#7490ff" emissiveIntensity={0.25} transparent opacity={0.9} />
          </mesh>
        </group>
      ) : (
        <group>
          {poison.type === "zombie" ? (
            <>
              <mesh castShadow position={[0, 0.06, 0]} scale={[1.15, 0.72, 1.05]}>
                <sphereGeometry args={[0.58, 14, 10]} />
                <meshStandardMaterial ref={flashRef} color={bodyColor} emissive="#22a15c" emissiveIntensity={0.16} roughness={0.55} />
              </mesh>
              <mesh position={[0, 0.5, 0.03]} scale={[0.82, 0.55, 0.82]}>
                <sphereGeometry args={[0.42, 12, 8]} />
                <meshStandardMaterial color="#7cff92" roughness={0.45} />
              </mesh>
            </>
          ) : poison.type === "creeper" ? (
            <>
              <mesh castShadow position={[0, 0.2, 0]}>
                <dodecahedronGeometry args={[0.56, 0]} />
                <meshStandardMaterial ref={flashRef} color={bodyColor} emissive="#ff7a2f" emissiveIntensity={0.35} roughness={0.44} />
              </mesh>
              <mesh position={[0, 0.82, 0]}>
                <sphereGeometry args={[0.22, 10, 8]} />
                <meshStandardMaterial color="#ff7048" emissive="#ff4b2f" emissiveIntensity={0.6} />
              </mesh>
              {[[-0.34, -0.22, 0.24], [0.34, -0.22, 0.24], [-0.34, -0.22, -0.24], [0.34, -0.22, -0.24]].map(([x, y, z], index) => (
                <mesh key={index} position={[x, y, z]}>
                  <sphereGeometry args={[0.13, 8, 6]} />
                  <meshStandardMaterial color="#8c5f22" roughness={0.6} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              <mesh castShadow position={[0, 0.18, 0]}>
                <capsuleGeometry args={[0.46, isBoss ? 1.12 : 0.82, 5, 10]} />
                <meshStandardMaterial ref={flashRef} color={bodyColor} emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={0.12} roughness={0.46} metalness={isBoss ? 0.24 : 0.04} />
              </mesh>
              <mesh castShadow position={[0, isBoss ? 1.14 : 0.88, 0]}>
                <boxGeometry args={[isBoss ? 0.76 : 0.62, isBoss ? 0.68 : 0.56, isBoss ? 0.76 : 0.62]} />
                <meshStandardMaterial color={bodyColor} emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={isBoss ? 0.38 : 0.12} roughness={0.42} />
              </mesh>
            </>
          )}
        </group>
      )}

      <mesh position={[0.18, isBoss ? 1.2 : 0.92, 0.36]}>
        <sphereGeometry args={[isBoss ? 0.085 : 0.065, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={2.4} />
      </mesh>
      <mesh position={[-0.18, isBoss ? 1.2 : 0.92, 0.36]}>
        <sphereGeometry args={[isBoss ? 0.085 : 0.065, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={2.4} />
      </mesh>

      {poison.type === "elite" && (
        <mesh position={[0, 1.32, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.46, 0.035, 6, 24]} />
          <meshStandardMaterial color="#ffd1e0" emissive="#ff4f86" emissiveIntensity={1.2} />
        </mesh>
      )}

      {isBoss && (
        <>
          <mesh position={[0, 1.62, 0]} rotation={[0, t.current, 0]}>
            <torusGeometry args={[0.7, 0.05, 6, 30]} />
            <meshStandardMaterial color={accent} emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={1.1} />
          </mesh>
          {quality !== "low" && <pointLight color={ENEMY_RING_COLOR[poison.type]} intensity={2.2} distance={8} />}
        </>
      )}

      <mesh position={[0, (isBoss ? 2.05 : 1.48), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.045, 5, 28, Math.PI * 2 * hpRatio]} />
        <meshBasicMaterial color={hpRatio > 0.45 ? "#80ff7a" : hpRatio > 0.2 ? "#ffd85a" : "#ff4d5d"} />
      </mesh>
    </group>
  );
}

const ENEMY_RING_COLOR: Record<EnemyType["type"], string> = {
  ghost: "#9aa8ff",
  zombie: "#3cff7e",
  creeper: "#ffb84a",
  elite: "#ff4f86",
  boss10: "#ff7048",
  boss20: "#b06cff",
};

export default memo(PoisonItem);
