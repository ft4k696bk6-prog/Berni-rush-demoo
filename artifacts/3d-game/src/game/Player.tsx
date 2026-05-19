import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { clampPlayerToProgress } from "./mapDefinitions";
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

const BASE_SPEED = 10.35;
const SNAPSHOT_RATE = 0.055;
const RUN_START_SPAWN_DELAY_MS = 950;
const MOUSE_LOOK_SENSITIVITY = 0.0044;
const MOUSE_PITCH_SENSITIVITY = 0.0033;
const MOBILE_TURN_SPEED = 5.85;
const MOBILE_PITCH_SPEED = 2.45;
const CAMERA_PITCH_MIN = -0.38;
const CAMERA_PITCH_MAX = 0.72;
const STRAFE_MOVE_WEIGHT = 0.68;
const MELEE_COMBO_WINDOW_MS = 1350;
const MELEE_BUFFER_MS = 260;
const MELEE_COMBO_MAX = 3;

export default function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const barrelRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const phase = useGameStore(s => s.phase);
  const selectedClassId = useGameStore(s => s.selectedClassId);
  const selectedSkinId = useGameStore(s => s.selectedSkinId);
  const runId = useGameStore(s => s.runId);
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
  const mouseLookDelta = useRef(0);
  const mousePitchDelta = useRef(0);
  const meleeComboStep = useRef(0);
  const lastMeleeAt = useRef(0);
  const queuedMeleeUntil = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const updatePointerLook = (movementX: number, movementY: number, clientX: number, clientY: number) => {
      const clampedMovement = THREE.MathUtils.clamp(movementX, -80, 80);
      const clampedPitch = THREE.MathUtils.clamp(movementY, -70, 70);
      mouseLookDelta.current += clampedMovement;
      mousePitchDelta.current += clampedPitch;
      playerRuntime.screenX = clientX;
      playerRuntime.screenY = clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (useGameStore.getState().phase !== "playing") return;
      updatePointerLook(event.movementX || 0, event.movementY || 0, event.clientX, event.clientY);
    };
    const handleDown = (event: PointerEvent) => {
      if (useGameStore.getState().phase !== "playing") return;
      if (event.pointerType === "mouse") {
        updatePointerLook(event.movementX || 0, event.movementY || 0, event.clientX, event.clientY);
        if (document.pointerLockElement !== canvas) {
          try {
            const lockRequest = canvas.requestPointerLock?.();
            if (lockRequest && "catch" in lockRequest) lockRequest.catch(() => undefined);
          } catch {
            // Some embedded/headless browsers deny pointer lock; mouse-look still works from movement deltas.
          }
        }
      }
      if (event.button === 0) shooting.current = true;
      if (event.button === 1 || event.button === 2) touchRuntime.meleePressed = true;
    };
    const handleUp = (event: PointerEvent) => {
      if (event.button === 0) shooting.current = false;
    };
    const handleLeave = () => {
      shooting.current = false;
    };
    const handleContext = (event: MouseEvent) => event.preventDefault();

    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("blur", handleLeave);
    canvas.addEventListener("contextmenu", handleContext);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("blur", handleLeave);
      canvas.removeEventListener("contextmenu", handleContext);
    };
  }, [gl.domElement]);

  useEffect(() => {
    if (phase === "playing") return;
    if (document.pointerLockElement === gl.domElement) document.exitPointerLock?.();
  }, [gl.domElement, phase]);

  useEffect(() => {
    if (groupRef.current) {
      const state = useGameStore.getState();
      const [startX, startZ] = state.playerPos;
      const [aimWorldX, aimWorldZ] = state.aimWorld;
      const aimDx = aimWorldX - startX;
      const aimDz = aimWorldZ - startZ;
      const aimLen = Math.hypot(aimDx, aimDz);
      const startAngle = aimLen > 0.05 ? Math.atan2(aimDx, aimDz) : state.playerAngle;

      groupRef.current.position.set(startX, 1.2, startZ);
      groupRef.current.rotation.y = startAngle;
      playerRuntime.x = startX;
      playerRuntime.z = startZ;
      playerRuntime.y = 1.2;
      playerRuntime.angle = startAngle;
      playerRuntime.aimX = aimLen > 0.05 ? aimDx / aimLen : Math.sin(startAngle);
      playerRuntime.aimZ = aimLen > 0.05 ? aimDz / aimLen : Math.cos(startAngle);
      playerRuntime.aimWorldX = aimWorldX;
      playerRuntime.aimWorldZ = aimWorldZ;
      velocity.current.set(0, 0);
      moveDir.current.set(playerRuntime.aimX, playerRuntime.aimZ);
      dashDir.current.set(playerRuntime.aimX, playerRuntime.aimZ);
      facingAngle.current = startAngle;
      cameraRuntime.yaw = startAngle;
      cameraRuntime.pitch = THREE.MathUtils.clamp(cameraRuntime.pitch || 0.18, CAMERA_PITCH_MIN, CAMERA_PITCH_MAX);
      mouseLookDelta.current = 0;
      mousePitchDelta.current = 0;
      fireCooldown.current = 0;
      dashCooldown.current = 0;
      dashTime.current = 0;
      meleeCooldown.current = 0;
      powerCooldown.current = 0;
      meleeComboStep.current = 0;
      lastMeleeAt.current = 0;
      queuedMeleeUntil.current = 0;
      spawnTimer.current = -RUN_START_SPAWN_DELAY_MS;
      cleanupTimer.current = 0;
      clockTimer.current = 0;
    }
  }, [runId]);

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
    if (spawnTimer.current > 260) {
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
    const moveInput = new THREE.Vector2(
      (controls.right ? 1 : 0) - (controls.left ? 1 : 0) + touchRuntime.moveX,
      (controls.forward ? 1 : 0) - (controls.back ? 1 : 0) - touchRuntime.moveZ,
    );
    const inputActive = moveInput.lengthSq() > 0.0001;
    if (inputActive) {
      moveInput.normalize();
      moveInput.x *= STRAFE_MOVE_WEIGHT;
    }

    const lookSensitivity = Math.max(0.7, store.mobileLookSensitivity);
    let targetAngle = facingAngle.current - mouseLookDelta.current * MOUSE_LOOK_SENSITIVITY * lookSensitivity;
    mouseLookDelta.current = 0;
    if (Math.abs(mousePitchDelta.current) > 0.01) {
      cameraRuntime.pitch = THREE.MathUtils.clamp(
        cameraRuntime.pitch - mousePitchDelta.current * MOUSE_PITCH_SENSITIVITY * Math.max(0.78, lookSensitivity * 0.9),
        CAMERA_PITCH_MIN,
        CAMERA_PITCH_MAX,
      );
      mousePitchDelta.current = 0;
    }
    if (touchRuntime.aimActive) {
      const turnInput = Math.abs(touchRuntime.aimX) > 0.04 ? touchRuntime.aimX : 0;
      const pitchInput = Math.abs(touchRuntime.aimY) > 0.035 ? touchRuntime.aimY : 0;
      targetAngle -= turnInput * MOBILE_TURN_SPEED * delta;
      cameraRuntime.pitch = THREE.MathUtils.clamp(
        cameraRuntime.pitch - pitchInput * MOBILE_PITCH_SPEED * delta,
        CAMERA_PITCH_MIN,
        CAMERA_PITCH_MAX,
      );
    }
    facingAngle.current = targetAngle;
    cameraRuntime.yaw = targetAngle;

    const aimX = Math.sin(targetAngle);
    const aimZ = Math.cos(targetAngle);

    playerRuntime.aimX = aimX;
    playerRuntime.aimZ = aimZ;
    playerRuntime.aimWorldX = playerRuntime.x + aimX * 14;
    playerRuntime.aimWorldZ = playerRuntime.z + aimZ * 14;
    facingAngle.current = Math.atan2(aimX, aimZ);
    const forwardMove = new THREE.Vector2(aimX, aimZ);
    const forwardMoveLen = forwardMove.length() || 1;
    forwardMove.multiplyScalar(1 / forwardMoveLen);
    const rightMove = new THREE.Vector2(-forwardMove.y, forwardMove.x);
    const moveWorld = inputActive
      ? new THREE.Vector2(
        rightMove.x * moveInput.x + forwardMove.x * moveInput.y,
        rightMove.y * moveInput.x + forwardMove.y * moveInput.y,
      )
      : new THREE.Vector2();
    if (inputActive && moveWorld.lengthSq() > 0.0001) {
      moveDir.current.copy(moveWorld.clone().normalize());
    }

    const swiftBoots = perkLevel(store.perks, "swift_boots");
    const moveUpgrade = shopUpgradeLevel(store.shopUpgrades, "move_speed");
    const dashUpgrade = shopUpgradeLevel(store.shopUpgrades, "dash_mastery");
    const attackCooldownUpgrade = shopUpgradeLevel(store.shopUpgrades, "attack_cooldown");
    const pickupUpgrade = shopUpgradeLevel(store.shopUpgrades, "pickup_range");
    const superUpgrade = shopUpgradeLevel(store.shopUpgrades, "super_charge");
    const loadoutMods = getLoadoutModifiers(store.selectedClassId, store.selectedSkinId);
    const klass = getClassDefinition(store.selectedClassId);
    const speed = BASE_SPEED * loadoutMods.moveSpeedMultiplier * (1 + store.stats.speed * 0.045 + swiftBoots * 0.055 + moveUpgrade * 0.045) * (hasSpeed ? 1.45 : 1) * (hasFlight ? 1.08 : 1);
    const targetVelocity = moveWorld.multiplyScalar(speed);
    const accel = 1 - Math.exp(-24 * delta);
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

    const [nextPlayerX, nextPlayerZ] = clampPlayerToProgress(
      store.mapId,
      playerRuntime.x,
      playerRuntime.z,
      playerRuntime.x + (velocity.current.x + dashBoostX) * delta,
      playerRuntime.z + (velocity.current.y + dashBoostZ) * delta,
      store.clearedZoneIds,
      1.2,
    );
    playerRuntime.x = nextPlayerX;
    playerRuntime.z = nextPlayerZ;
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

    const rawMeleeRequested = (controls.melee && !meleeHeld.current) || touchRuntime.meleePressed;
    if (rawMeleeRequested) queuedMeleeUntil.current = now + MELEE_BUFFER_MS;
    const meleeRequested = rawMeleeRequested || (queuedMeleeUntil.current > now && meleeCooldown.current <= 0);
    if (meleeRequested && meleeCooldown.current <= 0) {
      queuedMeleeUntil.current = 0;
      const withinCombo = !has360 && now - lastMeleeAt.current <= MELEE_COMBO_WINDOW_MS;
      const comboStep = has360 ? 1 : withinCombo ? (meleeComboStep.current % MELEE_COMBO_MAX) + 1 : 1;
      meleeComboStep.current = comboStep;
      lastMeleeAt.current = now;
      meleeCooldown.current = has360 ? 0.5 : Math.max(0.24, (0.52 - attackCooldownUpgrade * 0.046 - (comboStep - 1) * 0.045) / loadoutMods.attackSpeedMultiplier);
      store.addMeleeSwing([playerRuntime.x, playerRuntime.z], facingAngle.current, has360, comboStep);
      playerRuntime.attackAnimUntil = now + 360 + comboStep * 48;
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
    groupRef.current.rotation.y = facingAngle.current;

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
      <group>
        <pointLight ref={glowRef} intensity={0.8} distance={6} color={classColor} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
          <ringGeometry args={[0.95, 1.24, 36]} />
          <meshBasicMaterial color={classColor} transparent opacity={0.44} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.105, 1.95]}>
          <planeGeometry args={[0.16, 3.4]} />
          <meshBasicMaterial color={classColor} transparent opacity={0.24} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 3.72]}>
          <ringGeometry args={[0.18, 0.28, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.54} depthWrite={false} blending={THREE.AdditiveBlending} />
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
