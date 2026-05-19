import { memo, Suspense, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clampPointToMap } from "./mapDefinitions";
import { playerRuntime } from "./gameRuntime";
import { EnemyAssetModel } from "./AssetModels";
import { PoisonItem as EnemyType, QualityLevel } from "./types";
import { useGameStore } from "./useGameStore";
import {
  creeperCountdownStart,
  enemyContactTimers,
  enemyFireTimers,
  poisonCurrentPos,
} from "./poisonPositions";

interface Props {
  poison: EnemyType;
  renderQuality: QualityLevel;
  assetModelAllowed: boolean;
}

function PoisonItem({ poison, renderQuality, assetModelAllowed }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.MeshStandardMaterial>(null);
  const hitFlashRef = useRef<THREE.Mesh>(null);
  const meleeTelegraphRef = useRef<THREE.Mesh>(null);
  const chargeTelegraphRef = useRef<THREE.Mesh>(null);
  const shootTelegraphRef = useRef<THREE.Mesh>(null);
  const slamTelegraphRef = useRef<THREE.Mesh>(null);
  const shockwaveTelegraphRef = useRef<THREE.Mesh>(null);
  const explodeTelegraphRef = useRef<THREE.Mesh>(null);
  const windupGlowRef = useRef<THREE.Mesh>(null);
  const posRef = useRef<[number, number]>([poison.position[0], poison.position[2]]);
  const meleeWindup = useRef<number | null>(null);
  const shootWindup = useRef<{ startedAt: number; dirX: number; dirZ: number } | null>(null);
  const slamWindup = useRef<number | null>(null);
  const shockwaveWindup = useRef<number | null>(null);
  const chargeState = useRef<{ phase: "windup" | "dash" | "recover"; startedAt: number; dirX: number; dirZ: number } | null>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const previousHp = useRef(poison.hp);
  const hitPulse = useRef(0);

  const phase = useGameStore(s => s.phase);
  const quality = renderQuality;
  const hpRatio = Math.max(0, poison.hp / poison.maxHp);
  const isBoss = poison.type === "boss10" || poison.type === "boss20" || poison.type === "boss_dragon";
  const useAssetModel = Boolean(poison.assetPath) && assetModelAllowed;

  useEffect(() => {
    if (poison.hp < previousHp.current) hitPulse.current = 1;
    previousHp.current = poison.hp;
  }, [poison.hp]);

  const setTelegraph = (mesh: THREE.Mesh | null, visible: boolean, opacity: number, scale = 1) => {
    if (!mesh) return;
    mesh.visible = visible;
    mesh.scale.setScalar(scale);
    const material = mesh.material as THREE.MeshBasicMaterial;
    material.opacity = opacity;
  };
  const setWindupGlow = (visible: boolean, color = ENEMY_RING_COLOR[poison.type], opacity = 0.3, scale = 1) => {
    const mesh = windupGlowRef.current;
    if (!mesh) return;
    mesh.visible = visible;
    mesh.scale.setScalar(scale);
    const material = mesh.material as THREE.MeshBasicMaterial;
    material.color.set(color);
    material.opacity = opacity;
  };

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group || phase !== "playing") return;

    const delta = Math.min(rawDelta, 1 / 30);
    const now = Date.now();
    const store = useGameStore.getState();
    t.current += delta * (poison.type === "ghost" ? 2.35 : isBoss ? 1.28 : 2.15);

    const slow = store.activeEffects.some(e => e.type === "time_slow" && e.expiresAt > now);
    const dx = playerRuntime.x - posRef.current[0];
    const dz = playerRuntime.z - posRef.current[1];
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
    const wantsRange = poison.mechanics.includes("shoot") && !poison.mechanics.includes("melee");
    const stopDistance = wantsRange ? 8.2 : poison.mechanics.includes("slam") ? 3.6 : 0.55;
    const phaseScale = slow ? 0.42 : 1;

    setTelegraph(meleeTelegraphRef.current, false, 0);
    setTelegraph(chargeTelegraphRef.current, false, 0);
    setTelegraph(shootTelegraphRef.current, false, 0);
    setTelegraph(slamTelegraphRef.current, false, 0);
    setTelegraph(shockwaveTelegraphRef.current, false, 0);
    setTelegraph(explodeTelegraphRef.current, false, 0);
    setWindupGlow(false);

    if (poison.mechanics.includes("charge")) {
      const charge = chargeState.current;
      const last = enemyContactTimers[poison.id] ?? 0;

      if (!charge && dist > 4.2 && dist < 18 && now - last > 2100) {
        chargeState.current = { phase: "windup", startedAt: now, dirX: dx / dist, dirZ: dz / dist };
      }

      if (chargeState.current) {
        const state = chargeState.current;
        const elapsed = now - state.startedAt;
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.atan2(state.dirX, state.dirZ), 12, delta);

        if (state.phase === "windup") {
          setTelegraph(chargeTelegraphRef.current, true, 0.18 + Math.sin(elapsed * 0.018) * 0.08);
          setWindupGlow(true, "#ff7048", 0.18 + Math.sin(elapsed * 0.016) * 0.08, 0.75 + elapsed / 1300);
          if (elapsed > 520) chargeState.current = { ...state, phase: "dash", startedAt: now };
        } else if (state.phase === "dash") {
          const speed = poison.speed * 4.95 * phaseScale;
          posRef.current[0] += state.dirX * speed * delta;
          posRef.current[1] += state.dirZ * speed * delta;
          const pdx = playerRuntime.x - posRef.current[0];
          const pdz = playerRuntime.z - posRef.current[1];
          if (pdx * pdx + pdz * pdz < (1.18 + poison.scale * 0.36) ** 2) {
            enemyContactTimers[poison.id] = now;
            store.damagePlayer(poison.damage, posRef.current[0], posRef.current[1]);
            chargeState.current = { ...state, phase: "recover", startedAt: now };
          } else if (elapsed > 430) {
            enemyContactTimers[poison.id] = now;
            chargeState.current = { ...state, phase: "recover", startedAt: now };
          }
        } else if (elapsed > 720) {
          chargeState.current = null;
        }
      }
    }

    const lockedByAttack = chargeState.current !== null || meleeWindup.current !== null || slamWindup.current !== null;
    if (!lockedByAttack && dist > stopDistance) {
      let moveX = dx / dist;
      let moveZ = dz / dist;
      let sepX = 0;
      let sepZ = 0;
      for (const [id, pos] of Object.entries(poisonCurrentPos)) {
        if (id === poison.id) continue;
        const ox = posRef.current[0] - pos[0];
        const oz = posRef.current[1] - pos[1];
        const od2 = ox * ox + oz * oz;
        if (od2 < 0.001 || od2 > 3.1 * 3.1) continue;
        const od = Math.sqrt(od2);
        const force = (3.1 - od) / 3.1;
        sepX += (ox / od) * force;
        sepZ += (oz / od) * force;
      }
      moveX += sepX * 0.9;
      moveZ += sepZ * 0.9;
      const moveLen = Math.max(0.001, Math.sqrt(moveX * moveX + moveZ * moveZ));
      const speed = poison.speed * phaseScale;
      posRef.current[0] += (moveX / moveLen) * speed * delta;
      posRef.current[1] += (moveZ / moveLen) * speed * delta;
    }

    const [clampedX, clampedZ] = clampPointToMap(store.mapId, posRef.current[0], posRef.current[1], 1.4);
    posRef.current[0] = clampedX;
    posRef.current[1] = clampedZ;
    poisonCurrentPos[poison.id] = [posRef.current[0], posRef.current[1]];

    const moving = !lockedByAttack && dist > stopDistance;
    const floatAmp = poison.type === "ghost" || poison.type === "ranged_enemy" ? 0.28 : poison.type === "elite" ? 0.1 : 0.045;
    const strideBob = moving ? Math.abs(Math.sin(t.current * (isBoss ? 1.35 : 2.1))) * (isBoss ? 0.035 : 0.07) : Math.sin(t.current) * 0.018;
    const baseY = isBoss ? 2.0 : 1.18;
    group.position.set(posRef.current[0], baseY + Math.sin(t.current) * floatAmp + strideBob, posRef.current[1]);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.atan2(dx, dz), 13, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, moving ? Math.sin(t.current * 1.8) * (isBoss ? 0.025 : 0.055) : 0, 9, delta);

    if (poison.mechanics.includes("slam")) {
      const slamRange = isBoss ? 5.4 : 4.35;
      const last = enemyContactTimers[`${poison.id}:slam`] ?? 0;
      if (dist < slamRange && now - last > (isBoss ? 2200 : 2600) && !slamWindup.current) {
        slamWindup.current = now;
      }
      if (slamWindup.current) {
        const elapsed = now - slamWindup.current;
        setTelegraph(slamTelegraphRef.current, true, 0.16 + Math.min(0.28, elapsed / 2200), 0.55 + Math.min(0.65, elapsed / 780));
        setWindupGlow(true, "#ff3f50", 0.18 + Math.min(0.22, elapsed / 1800), 0.8 + Math.min(0.35, elapsed / 1200));
        if (elapsed > 780) {
          if (dist < slamRange) store.damagePlayer(poison.damage, posRef.current[0], posRef.current[1]);
          enemyContactTimers[`${poison.id}:slam`] = now;
          slamWindup.current = null;
        }
      }
    }

    if (poison.mechanics.includes("shockwave")) {
      const shockRange = isBoss ? 6.4 : 4.6;
      const last = enemyContactTimers[`${poison.id}:shockwave`] ?? 0;
      const phaseBoost = hpRatio <= 0.5 ? 0.72 : 1;
      if (dist < 10.5 && now - last > 3600 * phaseBoost && !shockwaveWindup.current) {
        shockwaveWindup.current = now;
      }
      if (shockwaveWindup.current) {
        const elapsed = now - shockwaveWindup.current;
        setTelegraph(shockwaveTelegraphRef.current, true, 0.16 + Math.min(0.28, elapsed / 2600), 0.45 + Math.min(0.85, elapsed / 920));
        setWindupGlow(true, "#ffb05e", 0.2 + Math.min(0.18, elapsed / 2400), 1 + Math.min(0.5, elapsed / 1500));
        if (elapsed > 920) {
          if (dist < shockRange) store.damagePlayer(poison.damage * 1.25, posRef.current[0], posRef.current[1]);
          enemyContactTimers[`${poison.id}:shockwave`] = now;
          shockwaveWindup.current = null;
        }
      }
    }

    if (poison.mechanics.includes("melee") && !poison.mechanics.includes("slam")) {
      const meleeRange = isBoss ? 3.2 : poison.type === "elite" ? 2.15 : poison.type === "grunt" ? 1.85 : 1.72;
      if (dist < meleeRange) {
        const last = enemyContactTimers[poison.id] ?? 0;
        const cd = isBoss ? 1200 : poison.type === "elite" ? 1350 : 1550;
        if (now - last > cd && !meleeWindup.current) {
          meleeWindup.current = now;
        }
        if (meleeWindup.current) {
          const elapsed = now - meleeWindup.current;
          setTelegraph(meleeTelegraphRef.current, true, 0.2 + Math.sin(elapsed * 0.02) * 0.08, poison.type === "grunt" ? 0.96 : 1.08);
          setWindupGlow(true, "#ff4d5d", 0.16 + Math.min(0.18, elapsed / 1300), 0.72 + Math.min(0.22, elapsed / 1100));
          if (elapsed > 420) {
            if (dist < meleeRange + 0.25) store.damagePlayer(poison.damage, posRef.current[0], posRef.current[1]);
            enemyContactTimers[poison.id] = now;
            meleeWindup.current = null;
          }
        }
      } else {
        meleeWindup.current = null;
      }
    }

    if (poison.mechanics.includes("shoot")) {
      const shootRange = isBoss ? 24 : poison.type === "elite" ? 18 : poison.type === "shooter" || poison.type === "ranged_enemy" ? 19 : 14;
      if (dist < shootRange) {
        const last = enemyFireTimers[poison.id] ?? 0;
        const fireCd = isBoss ? (hpRatio <= 0.5 ? 1250 : 1650) : poison.type === "elite" ? 2100 : poison.type === "shooter" || poison.type === "ranged_enemy" ? 2300 : 2700;
        if (now - last > fireCd && !shootWindup.current) {
          shootWindup.current = { startedAt: now, dirX: dx / dist, dirZ: dz / dist };
        }
        if (shootWindup.current) {
          const elapsed = now - shootWindup.current.startedAt;
          group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.atan2(shootWindup.current.dirX, shootWindup.current.dirZ), 14, delta);
          setTelegraph(shootTelegraphRef.current, true, 0.14 + Math.sin(elapsed * 0.017) * 0.06);
          setWindupGlow(true, "#b06cff", 0.16 + Math.sin(elapsed * 0.018) * 0.08, 0.66 + Math.min(0.3, elapsed / 1400));
          if (elapsed > 620) {
            enemyFireTimers[poison.id] = now;
            store.fireEnemyProjectile(posRef.current[0], posRef.current[1], playerRuntime.x, playerRuntime.z, poison.damage);
            shootWindup.current = null;
          }
        }
      } else {
        shootWindup.current = null;
      }
    }

    if (poison.mechanics.includes("explode")) {
      const triggerRange = isBoss ? 4.2 : 2.75;
      if (dist < triggerRange) {
        if (!creeperCountdownStart[poison.id]) creeperCountdownStart[poison.id] = now;
        const elapsed = now - creeperCountdownStart[poison.id];
        const countdownMs = isBoss ? 2600 : 1850;
        setTelegraph(explodeTelegraphRef.current, true, 0.18 + Math.min(0.24, elapsed / countdownMs * 0.24), 0.72 + Math.min(0.42, elapsed / countdownMs));
        setWindupGlow(true, "#ffb84a", 0.18 + Math.min(0.28, elapsed / countdownMs), 0.9 + Math.min(0.48, elapsed / countdownMs));
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

    if (hitPulse.current > 0) {
      const pulse = hitPulse.current;
      group.position.x += Math.sin(t.current * 28) * 0.06 * pulse;
      group.position.y += 0.08 * pulse;
      group.position.z += Math.cos(t.current * 31) * 0.045 * pulse;
      group.scale.multiplyScalar(1 + 0.055 * pulse);

      if (hitFlashRef.current) {
        hitFlashRef.current.visible = true;
        hitFlashRef.current.scale.setScalar(0.68 + (1 - pulse) * 0.52);
        const material = hitFlashRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = Math.min(0.46, pulse * 0.42);
      }

      if (flashRef.current && !poison.mechanics.includes("explode")) {
        flashRef.current.emissive.set("#ffffff");
        flashRef.current.emissiveIntensity = 0.32 + pulse * 1.9;
      }

      hitPulse.current = Math.max(0, hitPulse.current - delta * 6.2);
    } else if (hitFlashRef.current) {
      hitFlashRef.current.visible = false;
      if (flashRef.current && !poison.mechanics.includes("explode")) {
        flashRef.current.emissive.set(ENEMY_RING_COLOR[poison.type]);
        flashRef.current.emissiveIntensity = 0.16;
      }
    }
  });

  const bodyColor = poison.type === "ghost" || poison.type === "shooter" ? "#8bb7ff"
    : poison.type === "zombie" || poison.type === "grunt" ? "#4bd46a"
    : poison.type === "charger" ? "#ff9d4d"
    : poison.type === "creeper" ? "#f6d24a"
    : poison.type === "brute" ? "#d86bff"
    : poison.type === "elite" ? "#ff4f86"
    : poison.type === "boss10" ? "#f0e5c8"
    : "#231142";
  const accent = poison.type === "boss20" ? "#b06cff" : poison.type === "elite" ? "#ffd1e0" : "#101828";

  return (
    <group ref={groupRef} position={[posRef.current[0], isBoss ? 2 : 1.2, posRef.current[1]]} scale={poison.scale}>
      <mesh ref={hitFlashRef} visible={false} position={[0, isBoss ? 0.72 : 0.34, 0]}>
        <sphereGeometry args={[isBoss ? 1.35 : 0.72, 16, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <ringGeometry args={[0.74, 0.92, 24]} />
        <meshBasicMaterial color={ENEMY_RING_COLOR[poison.type]} transparent opacity={0.34} />
      </mesh>

      <mesh ref={windupGlowRef} visible={false} position={[0, isBoss ? 1.1 : 0.58, 0]}>
        <sphereGeometry args={[isBoss ? 0.92 : 0.52, 18, 12]} />
        <meshBasicMaterial color={ENEMY_RING_COLOR[poison.type]} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {useAssetModel ? (
        <Suspense fallback={
          <group>
            <mesh castShadow position={[0, isBoss ? 0.42 : 0.16, 0]} rotation={[0.2, 0.4, -0.1]} scale={[1.15, isBoss ? 1.28 : 0.88, 1]}>
              <dodecahedronGeometry args={[isBoss ? 0.92 : 0.48, 1]} />
              <meshStandardMaterial ref={flashRef} color={bodyColor} emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={0.24} roughness={0.52} />
            </mesh>
            <mesh castShadow position={[0, isBoss ? 1.3 : 0.72, 0.12]}>
              <sphereGeometry args={[isBoss ? 0.46 : 0.28, 14, 9]} />
              <meshStandardMaterial color={bodyColor} emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={0.18} roughness={0.44} />
            </mesh>
          </group>
        }>
          <EnemyAssetModel type={poison.type} />
        </Suspense>
      ) : poison.type === "ghost" || poison.type === "shooter" || poison.type === "ranged_enemy" ? (
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
          {poison.type === "zombie" || poison.type === "grunt" || poison.type === "basic_melee" || poison.type === "tank_enemy" ? (
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
          ) : poison.type === "creeper" || poison.type === "charger" || poison.type === "fast_melee" || poison.type === "exploder_enemy" ? (
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
              <mesh castShadow position={[0, isBoss ? 0.42 : 0.18, 0]} rotation={[0.16, 0.42, -0.08]} scale={[1.15, isBoss ? 1.25 : 0.88, 1]}>
                <dodecahedronGeometry args={[isBoss ? 0.76 : 0.48, 1]} />
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

      {!useAssetModel && (
        <>
          <mesh position={[0.18, isBoss ? 1.2 : 0.92, 0.36]}>
            <sphereGeometry args={[isBoss ? 0.085 : 0.065, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={2.4} />
          </mesh>
          <mesh position={[-0.18, isBoss ? 1.2 : 0.92, 0.36]}>
            <sphereGeometry args={[isBoss ? 0.085 : 0.065, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={2.4} />
          </mesh>
        </>
      )}

      {poison.type === "elite" && (
        <mesh position={[0, 1.32, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.46, 0.035, 6, 24]} />
          <meshStandardMaterial color="#ffd1e0" emissive="#ff4f86" emissiveIntensity={1.2} />
        </mesh>
      )}

      {poison.type === "charger" && (
        <>
          <mesh position={[0, 0.44, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.18, 0.92, 5]} />
            <meshStandardMaterial color="#ffe0a8" emissive="#ff6d2f" emissiveIntensity={0.85} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.22, -0.48]} scale={[1.22, 0.34, 0.46]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#9b431f" roughness={0.64} />
          </mesh>
        </>
      )}

      {poison.type === "brute" && (
        <>
          <mesh position={[0.62, 0.62, 0]} scale={[0.5, 0.48, 0.36]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6b2b86" roughness={0.58} metalness={0.12} />
          </mesh>
          <mesh position={[-0.62, 0.62, 0]} scale={[0.5, 0.48, 0.36]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6b2b86" roughness={0.58} metalness={0.12} />
          </mesh>
          <mesh position={[0, 1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.52, 0.055, 6, 28]} />
            <meshStandardMaterial color="#f2b6ff" emissive="#d86bff" emissiveIntensity={1.15} />
          </mesh>
        </>
      )}

      {isBoss && (
        <>
          <mesh position={[0, 1.62, 0]} rotation={[0, t.current, 0]}>
            <torusGeometry args={[0.7, 0.05, 6, 30]} />
            <meshStandardMaterial color={accent} emissive={ENEMY_RING_COLOR[poison.type]} emissiveIntensity={1.1} />
          </mesh>
          {hpRatio <= 0.5 && (
            <mesh position={[0, 1.9, 0]} rotation={[0, -t.current * 1.2, 0]}>
              <torusGeometry args={[0.95, 0.045, 6, 36]} />
              <meshStandardMaterial color="#ffed9a" emissive="#ff7048" emissiveIntensity={1.8} transparent opacity={0.82} />
            </mesh>
          )}
          {quality !== "low" && <pointLight color={ENEMY_RING_COLOR[poison.type]} intensity={2.2} distance={8} />}
        </>
      )}

      <mesh position={[0, (isBoss ? 2.05 : 1.48), 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.045, 5, 28, Math.PI * 2 * hpRatio]} />
        <meshBasicMaterial color={hpRatio > 0.45 ? "#80ff7a" : hpRatio > 0.2 ? "#ffd85a" : "#ff4d5d"} />
      </mesh>

      <mesh ref={meleeTelegraphRef} visible={false} rotation={[-Math.PI / 2, 0, -Math.PI * 0.22]} position={[0, -1.14, 0]}>
        <ringGeometry args={[0.38, 2.08, 28, 1, 0, Math.PI * 0.44]} />
        <meshBasicMaterial color="#ff4d5d" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={chargeTelegraphRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.16, 4.1]}>
        <planeGeometry args={[0.54, 8.2]} />
        <meshBasicMaterial color="#ff3f50" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={shootTelegraphRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 4.8]}>
        <planeGeometry args={[0.34, 9.6]} />
        <meshBasicMaterial color="#b06cff" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={slamTelegraphRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.13, 0]}>
        <ringGeometry args={[2.18, 2.7, 42]} />
        <meshBasicMaterial color="#ff3f50" transparent opacity={0.24} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={shockwaveTelegraphRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <ringGeometry args={[3.4, 6.4, 64]} />
        <meshBasicMaterial color="#ff7048" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={explodeTelegraphRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <ringGeometry args={[2.18, 2.68, 36]} />
        <meshBasicMaterial color="#ffb84a" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

const ENEMY_RING_COLOR: Record<EnemyType["type"], string> = {
  basic_melee: "#e5e2cf",
  fast_melee: "#d6a06b",
  tank_enemy: "#7dc96e",
  ranged_enemy: "#ffd45d",
  exploder_enemy: "#ff6b4c",
  boss_dragon: "#ff7048",
  grunt: "#3cff7e",
  charger: "#ff7d3d",
  shooter: "#9aa8ff",
  brute: "#d86bff",
  ghost: "#9aa8ff",
  zombie: "#3cff7e",
  creeper: "#ffb84a",
  elite: "#ff4f86",
  boss10: "#ff7048",
  boss20: "#b06cff",
};

export default memo(PoisonItem);
