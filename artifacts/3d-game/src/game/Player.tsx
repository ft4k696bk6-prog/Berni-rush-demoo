import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { clampToArena, getSpawnInterval } from "./balance";
import { cameraRuntime, playerRuntime, touchRuntime } from "./gameRuntime";
import { CharacterAssetModel } from "./AssetModels";
import { getClassDefinition, getLoadoutModifiers } from "./loadout";
import { perkLevel } from "./perks";
import { shopUpgradeLevel } from "./shop";
import { useGameStore } from "./useGameStore";
import { WEAPON_CONFIG } from "./weapons";
import { poisonCurrentPos } from "./poisonPositions";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  dash = "dash",
  melee = "melee",
  power = "power",
}

const BASE_SPEED = 8.65;
const SNAPSHOT_RATE = 0.055;
const MOUSE_SENSITIVITY = 0.0031;
const MOBILE_LOOK_SPEED = 2.9;
const RUN_START_SPAWN_DELAY_MS = 950;

function getCameraYawVectors() {
  const forward2 = new THREE.Vector2(Math.sin(cameraRuntime.yaw), Math.cos(cameraRuntime.yaw)).normalize();
  const right2 = new THREE.Vector2(-Math.cos(cameraRuntime.yaw), Math.sin(cameraRuntime.yaw)).normalize();
  return { forward2, right2 };
}

function rotateCameraFromMouse(deltaX: number, deltaY: number) {
  cameraRuntime.yaw = THREE.MathUtils.euclideanModulo(cameraRuntime.yaw - deltaX * MOUSE_SENSITIVITY, Math.PI * 2);
  cameraRuntime.pitch = THREE.MathUtils.clamp(cameraRuntime.pitch + deltaY * MOUSE_SENSITIVITY * 0.82, -0.2, 0.66);
}

function dampAngle(current: number, target: number, lambda: number, delta: number) {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * (1 - Math.exp(-lambda * delta));
}

function FirstPersonCaster({ color }: { color: string }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Group>(null);
  const chargeRef = useRef<THREE.Mesh>(null);
  const compact = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 780);

  useFrame((_, delta) => {
    const active = Date.now() < playerRuntime.attackAnimUntil && playerRuntime.attackAnimType === "shoot";
    const remaining = Math.max(0, playerRuntime.attackAnimUntil - Date.now()) / 260;

    if (coreRef.current) {
      coreRef.current.visible = !compact || active;
      coreRef.current.rotation.z += delta * 4.2;
      coreRef.current.position.z = active ? 0.16 - remaining * 0.1 : 0.12;
      const material = coreRef.current.material as THREE.MeshStandardMaterial;
      material.emissive.set(color);
      material.emissiveIntensity = active ? 2.4 : 0.85;
    }

    if (chargeRef.current) {
      chargeRef.current.visible = !compact || active;
      chargeRef.current.rotation.z -= delta * 9;
      const material = chargeRef.current.material as THREE.MeshStandardMaterial;
      material.emissive.set(color);
      material.emissiveIntensity = active ? 2.2 : 1.0;
    }

    if (flashRef.current) {
      flashRef.current.visible = active;
      const pulse = active ? 0.72 + (1 - remaining) * 0.5 : 0.4;
      flashRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={compact ? [0.02, 0.06, 1.36] : [-0.28, 0.22, 1.22]} rotation={[0.08, 0.04, 0]} scale={compact ? 0.34 : 0.54}>
      <mesh ref={coreRef} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.085, 0.62, 12]} />
        <meshStandardMaterial color="#201812" emissive={color} emissiveIntensity={0.9} roughness={0.34} metalness={0.58} />
      </mesh>
      <mesh ref={chargeRef} position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.012, 6, 32]} />
        <meshStandardMaterial color="#f9fff0" emissive={color} emissiveIntensity={1.1} transparent opacity={0.82} roughness={0.18} metalness={0.3} />
      </mesh>
      <group ref={flashRef} visible={false} position={[0, 0, 0.78]}>
        <pointLight intensity={2.2} distance={4.2} color={color} />
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.42, 14]} />
          <meshBasicMaterial color={color} transparent opacity={0.58} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.014, 6, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.62} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {[-1, 0, 1].map(index => (
          <mesh key={index} position={[index * 0.08, 0.01, -0.06 + Math.abs(index) * 0.04]} rotation={[0.3, index * 0.5, index * 0.24]}>
            <boxGeometry args={[0.015, 0.015, 0.18]} />
            <meshBasicMaterial color="#fff1b8" transparent opacity={0.72} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const barrelRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const phase = useGameStore(s => s.phase);
  const selectedClassId = useGameStore(s => s.selectedClassId);
  const selectedSkinId = useGameStore(s => s.selectedSkinId);
  const [, getKeys] = useKeyboardControls<Controls>();
  const { gl } = useThree();

  const velocity = useRef(new THREE.Vector2());
  const moveDir = useRef(new THREE.Vector2(0, -1));
  const dashDir = useRef(new THREE.Vector2(0, -1));
  const shooting = useRef(false);
  const fireCooldown = useRef(0);
  const dashCooldown = useRef(0);
  const dashTime = useRef(0);
  const dashHeld = useRef(false);
  const meleeCooldown = useRef(0);
  const meleeHeld = useRef(false);
  const powerCooldown = useRef(0);
  const powerHeld = useRef(false);
  const pulseT = useRef(0);
  const snapshotTimer = useRef(0);
  const skillSnapshotTimer = useRef(0);
  const spawnTimer = useRef(0);
  const clockTimer = useRef(0);
  const cleanupTimer = useRef(0);
  const facingAngle = useRef(Math.PI);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMove = (event: PointerEvent) => {
      if (useGameStore.getState().phase !== "playing") return;
      if (event.pointerType && event.pointerType !== "mouse") return;
      if (event.movementX === 0 && event.movementY === 0) return;
      rotateCameraFromMouse(event.movementX, event.movementY);
      playerRuntime.screenX = window.innerWidth / 2;
      playerRuntime.screenY = window.innerHeight / 2;
    };
    const handleDown = (event: PointerEvent) => {
      if (useGameStore.getState().phase !== "playing") return;
      if (event.pointerType === "mouse" && document.pointerLockElement !== canvas) {
        const lock = canvas.requestPointerLock?.();
        if (lock && "catch" in lock) lock.catch(() => undefined);
      }
      if (event.button === 0) shooting.current = true;
    };
    const handleUp = () => { shooting.current = false; };
    const handleLeave = () => { shooting.current = false; };
    const handleContext = (event: MouseEvent) => event.preventDefault();

    canvas.addEventListener("pointermove", handleMove);
    canvas.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("blur", handleLeave);
    canvas.addEventListener("contextmenu", handleContext);

    return () => {
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("blur", handleLeave);
      canvas.removeEventListener("contextmenu", handleContext);
    };
  }, [gl.domElement]);

  useEffect(() => {
    if (phase === "playing" && groupRef.current) {
      groupRef.current.position.set(0, 1.2, 0);
      groupRef.current.rotation.y = Math.PI;
      playerRuntime.x = 0;
      playerRuntime.z = 0;
      playerRuntime.y = 1.2;
      playerRuntime.angle = Math.PI;
      playerRuntime.aimX = 0;
      playerRuntime.aimZ = -1;
      playerRuntime.aimWorldX = 0;
      playerRuntime.aimWorldZ = -8;
      cameraRuntime.yaw = Math.PI;
      cameraRuntime.pitch = 0.18;
      velocity.current.set(0, 0);
      moveDir.current.set(0, -1);
      dashDir.current.set(0, -1);
      fireCooldown.current = 0;
      dashCooldown.current = 0;
      dashTime.current = 0;
      meleeCooldown.current = 0;
      powerCooldown.current = 0;
      spawnTimer.current = -RUN_START_SPAWN_DELAY_MS;
      cleanupTimer.current = 0;
      clockTimer.current = 0;
    }
  }, [phase]);

  useFrame((_, rawDelta) => {
    if (phase !== "playing" || !groupRef.current) return;

    const delta = Math.min(rawDelta, 1 / 30);
    const now = Date.now();
    const store = useGameStore.getState();
    pulseT.current += delta;
    fireCooldown.current = Math.max(0, fireCooldown.current - delta);
    dashCooldown.current = Math.max(0, dashCooldown.current - delta);
    dashTime.current = Math.max(0, dashTime.current - delta);
    meleeCooldown.current = Math.max(0, meleeCooldown.current - delta);
    powerCooldown.current = Math.max(0, powerCooldown.current - delta);

    store.tickEffects(now);
    store.tickProjectiles(delta);
    store.tickEnemyProjectiles(delta, playerRuntime.x, playerRuntime.z);

    cleanupTimer.current += delta;
    if (cleanupTimer.current > 0.12) {
      store.clearOldMelee(now);
      store.tickFloaters(now);
      cleanupTimer.current = 0;
    }

    clockTimer.current += delta;
    if (clockTimer.current > 0.5) {
      store.tickGameClock(clockTimer.current);
      clockTimer.current = 0;
    }

    spawnTimer.current += delta * 1000;
    if (spawnTimer.current > getSpawnInterval(store.stage, store.quality)) {
      store.spawnItems();
      spawnTimer.current = 0;
    }

    const activeEffects = store.activeEffects;
    const hasSpeed = activeEffects.some(e => e.type === "speed" && e.expiresAt > now);
    const hasFlight = activeEffects.some(e => e.type === "flight" && e.expiresAt > now);
    const hasInv = activeEffects.some(e => e.type === "invincibility" && e.expiresAt > now);
    const hasStr = activeEffects.some(e => e.type === "strength" && e.expiresAt > now);
    const hasTimeSlow = activeEffects.some(e => e.type === "time_slow" && e.expiresAt > now);
    const has360 = activeEffects.some(e => e.type === "melee_360" && e.expiresAt > now);

    const controls = getKeys();
    const { forward2, right2 } = getCameraYawVectors();
    const screenRight = (controls.right ? 1 : 0) - (controls.left ? 1 : 0) + touchRuntime.moveX;
    const screenForward = (controls.forward ? 1 : 0) - (controls.back ? 1 : 0) - touchRuntime.moveZ;
    const input = new THREE.Vector2(
      right2.x * screenRight + forward2.x * screenForward,
      right2.y * screenRight + forward2.y * screenForward,
    );
    const inputActive = input.lengthSq() > 0;

    if (inputActive) {
      input.normalize();
      moveDir.current.copy(input);
    }

    if (touchRuntime.aimActive) {
      cameraRuntime.yaw = THREE.MathUtils.euclideanModulo(cameraRuntime.yaw - touchRuntime.aimX * MOBILE_LOOK_SPEED * delta, Math.PI * 2);
      cameraRuntime.pitch = THREE.MathUtils.clamp(cameraRuntime.pitch + touchRuntime.aimY * MOBILE_LOOK_SPEED * 0.62 * delta, -0.2, 0.66);
    }

    const aimX = Math.sin(cameraRuntime.yaw);
    const aimZ = Math.cos(cameraRuntime.yaw);
    playerRuntime.aimX = aimX;
    playerRuntime.aimZ = aimZ;
    playerRuntime.aimWorldX = playerRuntime.x + aimX * 14;
    playerRuntime.aimWorldZ = playerRuntime.z + aimZ * 14;
    playerRuntime.screenX = typeof window !== "undefined" ? window.innerWidth / 2 : playerRuntime.screenX;
    playerRuntime.screenY = typeof window !== "undefined" ? window.innerHeight / 2 : playerRuntime.screenY;
    facingAngle.current = cameraRuntime.yaw;

    const swiftBoots = perkLevel(store.perks, "swift_boots");
    const moveUpgrade = shopUpgradeLevel(store.shopUpgrades, "move_speed");
    const dashUpgrade = shopUpgradeLevel(store.shopUpgrades, "dash_mastery");
    const attackCooldownUpgrade = shopUpgradeLevel(store.shopUpgrades, "attack_cooldown");
    const pickupUpgrade = shopUpgradeLevel(store.shopUpgrades, "pickup_range");
    const superUpgrade = shopUpgradeLevel(store.shopUpgrades, "super_charge");
    const loadoutMods = getLoadoutModifiers(store.selectedClassId, store.selectedSkinId);
    const klass = getClassDefinition(store.selectedClassId);
    const speed = BASE_SPEED * loadoutMods.moveSpeedMultiplier * (1 + store.stats.speed * 0.045 + swiftBoots * 0.055 + moveUpgrade * 0.045) * (hasSpeed ? 1.45 : 1) * (hasFlight ? 1.08 : 1);
    const targetVelocity = input.multiplyScalar(speed);
    const accel = 1 - Math.exp(-17 * delta);
    velocity.current.lerp(targetVelocity, accel);

    const dashRequested = (controls.dash && !dashHeld.current) || touchRuntime.dashPressed;
    if (dashRequested && dashCooldown.current <= 0) {
      dashDir.current.copy(moveDir.current.lengthSq() > 0 ? moveDir.current : new THREE.Vector2(playerRuntime.aimX, playerRuntime.aimZ));
      if (dashDir.current.lengthSq() < 0.01) dashDir.current.set(0, -1);
      dashDir.current.normalize();
      dashTime.current = 0.16;
      dashCooldown.current = Math.max(0.32, 0.82 - store.stats.speed * 0.025 - swiftBoots * 0.035 - dashUpgrade * 0.055);
      playerRuntime.dashUntil = now + 190;
    }
    touchRuntime.dashPressed = false;
    dashHeld.current = controls.dash;

    let dashBoostX = 0;
    let dashBoostZ = 0;
    if (dashTime.current > 0) {
      const dashPower = 26 + store.stats.speed * 0.55 + swiftBoots * 1.25 + dashUpgrade * 1.6;
      dashBoostX = dashDir.current.x * dashPower;
      dashBoostZ = dashDir.current.y * dashPower;
    }

    playerRuntime.x = clampToArena(playerRuntime.x + (velocity.current.x + dashBoostX) * delta, 1.2);
    playerRuntime.z = clampToArena(playerRuntime.z + (velocity.current.y + dashBoostZ) * delta, 1.2);
    playerRuntime.velocityX = velocity.current.x;
    playerRuntime.velocityZ = velocity.current.y;
    playerRuntime.angle = facingAngle.current;
    playerRuntime.y = hasFlight ? THREE.MathUtils.lerp(playerRuntime.y, 1.75, 0.08) : THREE.MathUtils.lerp(playerRuntime.y, 1.2, 0.14);

    const weapon = WEAPON_CONFIG[store.currentWeapon];
    const rapid = perkLevel(store.perks, "rapid_fire");
    const fireRate = weapon.fireRate * 1.12 * loadoutMods.attackSpeedMultiplier * (1 + store.stats.superpower * 0.012 + rapid * 0.085) * (hasSpeed ? 1.05 : 1);
    if ((shooting.current || touchRuntime.shooting) && fireCooldown.current <= 0) {
      store.fireWeapon(playerRuntime.x, playerRuntime.z, playerRuntime.aimX, playerRuntime.aimZ);
      playerRuntime.attackAnimUntil = now + 260;
      playerRuntime.attackAnimType = "shoot";
      fireCooldown.current = 1 / fireRate;
    }

    const meleeRequested = (controls.melee && !meleeHeld.current) || touchRuntime.meleePressed;
    if (meleeRequested && meleeCooldown.current <= 0) {
      meleeCooldown.current = has360 ? 0.5 : Math.max(0.36, (0.68 - attackCooldownUpgrade * 0.046) / loadoutMods.attackSpeedMultiplier);
      store.addMeleeSwing([playerRuntime.x, playerRuntime.z], facingAngle.current, has360);
      playerRuntime.attackAnimUntil = now + 430;
      playerRuntime.attackAnimType = "slash";
    }
    touchRuntime.meleePressed = false;
    meleeHeld.current = controls.melee;

    const powerRequested = (controls.power && !powerHeld.current) || touchRuntime.powerPressed;
    if (powerRequested && powerCooldown.current <= 0) {
      store.addMeleeSwing([playerRuntime.x, playerRuntime.z], facingAngle.current, true);
      powerCooldown.current = Math.max(4.1, (7.6 - store.stats.superpower * 0.045 - superUpgrade * 0.55) * loadoutMods.cooldownMultiplier);
      playerRuntime.attackAnimUntil = now + 620;
      playerRuntime.attackAnimType = "slash";
    }
    touchRuntime.powerPressed = false;
    powerHeld.current = controls.power;

    if (hasStr) {
      for (const enemy of store.poisons) {
        const live = poisonCurrentPos[enemy.id] ?? [enemy.position[0], enemy.position[2]];
        const dx = live[0] - playerRuntime.x;
        const dz = live[1] - playerRuntime.z;
        if (dx * dx + dz * dz < (1.45 + enemy.scale * 0.4) ** 2) {
          store.damageEnemy(enemy.id, 8 + store.stats.strength * 0.9);
        }
      }
    }

    for (const drug of store.drugs) {
      const dx = drug.position[0] - playerRuntime.x;
      const dz = drug.position[2] - playerRuntime.z;
      const pickupRadius = 2.0 + pickupUpgrade * 0.42;
      if (dx * dx + dz * dz < pickupRadius * pickupRadius) store.collectDrug(drug.id);
    }

    groupRef.current.position.set(playerRuntime.x, playerRuntime.y, playerRuntime.z);
    groupRef.current.rotation.y = dampAngle(groupRef.current.rotation.y, facingAngle.current, 15, delta);

    if (bodyRef.current) {
      const moving = velocity.current.lengthSq() > 0.25;
      bodyRef.current.position.y = moving ? Math.sin(pulseT.current * 16) * 0.055 : Math.sin(pulseT.current * 5) * 0.018;
    }
    if (barrelRef.current) {
      const recoil = fireCooldown.current > 0 ? Math.min(0.16, fireCooldown.current * 0.3) : 0;
      barrelRef.current.position.z = 0.72 - recoil;
      (barrelRef.current.material as THREE.MeshStandardMaterial).emissive.set(klass.color);
    }
    if (glowRef.current) {
      const pulse = 0.6 + Math.sin(pulseT.current * 9) * 0.25;
      if (hasInv) {
        glowRef.current.color.set("#ffdf4f");
        glowRef.current.intensity = 2.7 + pulse;
      } else if (dashTime.current > 0) {
        glowRef.current.color.set("#8af7ff");
        glowRef.current.intensity = 2.6;
      } else if (hasStr) {
        glowRef.current.color.set("#ff6b2e");
        glowRef.current.intensity = 2.2 + pulse;
      } else if (hasTimeSlow) {
        glowRef.current.color.set("#59ffa8");
        glowRef.current.intensity = 1.8 + pulse;
      } else {
        glowRef.current.color.set(klass.color);
        glowRef.current.intensity = store.quality === "low" ? 0.5 : 0.85;
      }
    }

    snapshotTimer.current += delta;
    if (snapshotTimer.current > SNAPSHOT_RATE) {
      store.setPlayerSnapshot(
        [playerRuntime.x, playerRuntime.z],
        facingAngle.current,
        [playerRuntime.aimWorldX, playerRuntime.aimWorldZ],
      );
      snapshotTimer.current = 0;
    }

    skillSnapshotTimer.current += delta;
    if (skillSnapshotTimer.current > 0.12) {
      const dashCdMs = Math.max(320, 820 - store.stats.speed * 25 - swiftBoots * 35 - dashUpgrade * 55);
      const powerCdMs = Math.max(4100, (7600 - store.stats.superpower * 45 - superUpgrade * 550) * loadoutMods.cooldownMultiplier);
      store.setSkillStatus("dash", now + dashCooldown.current * 1000, dashCdMs, dashTime.current > 0);
      store.setSkillStatus("power_slash", now + powerCooldown.current * 1000, powerCdMs, powerCooldown.current <= 0);
      store.setSkillStatus("energy_shot", now + fireCooldown.current * 1000, Math.max(90, (1 / fireRate) * 1000), shooting.current || touchRuntime.shooting);
      skillSnapshotTimer.current = 0;
    }
  });

  const classColor = getClassDefinition(selectedClassId).color;

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      <FirstPersonCaster color={classColor} />

      <group visible={false}>
        <pointLight ref={glowRef} intensity={0.8} distance={6} color={classColor} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.58, 0]}>
          <ringGeometry args={[0.95, 1.24, 36]} />
          <meshBasicMaterial color={classColor} transparent opacity={0.44} />
        </mesh>

        <group ref={bodyRef}>
          <Suspense fallback={
            <group>
              <mesh castShadow position={[0, 0, 0]}>
                <capsuleGeometry args={[0.46, 0.92, 6, 14]} />
                <meshStandardMaterial color={classColor} roughness={0.5} metalness={0.08} />
              </mesh>
              <mesh castShadow position={[0, 0.74, 0.02]}>
                <sphereGeometry args={[0.42, 16, 12]} />
                <meshStandardMaterial color="#f1bb8b" roughness={0.42} />
              </mesh>
            </group>
          }>
            <CharacterAssetModel skinId={selectedSkinId} />
          </Suspense>
        </group>

        <mesh ref={barrelRef} castShadow position={[0, 0.18, 0.74]}>
          <boxGeometry args={[0.09, 0.09, 0.78]} />
          <meshStandardMaterial color="#fff3c0" emissive={classColor} emissiveIntensity={0.82} roughness={0.28} metalness={0.4} />
        </mesh>

        <mesh position={[0, 1.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.026, 6, 32]} />
          <meshStandardMaterial color={classColor} emissive={classColor} emissiveIntensity={1.25} transparent opacity={0.72} />
        </mesh>
      </group>
    </group>
  );
}
