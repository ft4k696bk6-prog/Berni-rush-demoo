import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { clampToArena, getSpawnInterval } from "./balance";
import { playerRuntime, touchRuntime } from "./gameRuntime";
import { perkLevel } from "./perks";
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
}

const BASE_SPEED = 8.7;
const SNAPSHOT_RATE = 0.055;

export default function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const barrelRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const phase = useGameStore(s => s.phase);
  const [, getKeys] = useKeyboardControls<Controls>();
  const { gl, camera } = useThree();

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseNdc = useMemo(() => new THREE.Vector2(), []);
  const aimHit = useMemo(() => new THREE.Vector3(), []);

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
  const pulseT = useRef(0);
  const snapshotTimer = useRef(0);
  const spawnTimer = useRef(0);
  const clockTimer = useRef(0);
  const cleanupTimer = useRef(0);
  const facingAngle = useRef(Math.PI);

  const updateAimFromPointer = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    mouseNdc.set(nx, ny);
    raycaster.setFromCamera(mouseNdc, camera);
    raycaster.ray.intersectPlane(groundPlane, aimHit);

    playerRuntime.screenX = clientX;
    playerRuntime.screenY = clientY;

    const dx = aimHit.x - playerRuntime.x;
    const dz = aimHit.z - playerRuntime.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0.05) {
      playerRuntime.aimX = dx / len;
      playerRuntime.aimZ = dz / len;
      playerRuntime.aimWorldX = aimHit.x;
      playerRuntime.aimWorldZ = aimHit.z;
      facingAngle.current = Math.atan2(playerRuntime.aimX, playerRuntime.aimZ);
    }
  }, [aimHit, camera, gl.domElement, groundPlane, mouseNdc, raycaster]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMove = (event: PointerEvent) => updateAimFromPointer(event.clientX, event.clientY);
    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      updateAimFromPointer(event.clientX, event.clientY);
      shooting.current = true;
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
  }, [gl.domElement, updateAimFromPointer]);

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
      velocity.current.set(0, 0);
      moveDir.current.set(0, -1);
      dashDir.current.set(0, -1);
      fireCooldown.current = 0;
      dashCooldown.current = 0;
      dashTime.current = 0;
      meleeCooldown.current = 0;
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
    const input = new THREE.Vector2(
      (controls.right ? 1 : 0) - (controls.left ? 1 : 0),
      (controls.back ? 1 : 0) - (controls.forward ? 1 : 0),
    );
    input.x += touchRuntime.moveX;
    input.y += touchRuntime.moveZ;
    const inputActive = input.lengthSq() > 0;

    if (inputActive) {
      input.normalize();
      moveDir.current.copy(input);
    }

    const swiftBoots = perkLevel(store.perks, "swift_boots");
    const speed = BASE_SPEED * (1 + store.stats.speed * 0.045 + swiftBoots * 0.055) * (hasSpeed ? 1.45 : 1) * (hasFlight ? 1.08 : 1);
    const targetVelocity = input.multiplyScalar(speed);
    const accel = 1 - Math.exp(-18 * delta);
    velocity.current.lerp(targetVelocity, accel);

    const dashRequested = (controls.dash && !dashHeld.current) || touchRuntime.dashPressed;
    if (dashRequested && dashCooldown.current <= 0) {
      dashDir.current.copy(moveDir.current.lengthSq() > 0 ? moveDir.current : new THREE.Vector2(playerRuntime.aimX, playerRuntime.aimZ));
      if (dashDir.current.lengthSq() < 0.01) dashDir.current.set(0, -1);
      dashDir.current.normalize();
      dashTime.current = 0.16;
      dashCooldown.current = Math.max(0.42, 0.82 - store.stats.speed * 0.025 - swiftBoots * 0.035);
      playerRuntime.dashUntil = now + 190;
    }
    touchRuntime.dashPressed = false;
    dashHeld.current = controls.dash;

    let dashBoostX = 0;
    let dashBoostZ = 0;
    if (dashTime.current > 0) {
      const dashPower = 26 + store.stats.speed * 0.55 + swiftBoots * 1.25;
      dashBoostX = dashDir.current.x * dashPower;
      dashBoostZ = dashDir.current.y * dashPower;
    }

    playerRuntime.x = clampToArena(playerRuntime.x + (velocity.current.x + dashBoostX) * delta, 1.2);
    playerRuntime.z = clampToArena(playerRuntime.z + (velocity.current.y + dashBoostZ) * delta, 1.2);
    playerRuntime.velocityX = velocity.current.x;
    playerRuntime.velocityZ = velocity.current.y;
    playerRuntime.angle = facingAngle.current;
    playerRuntime.y = hasFlight ? THREE.MathUtils.lerp(playerRuntime.y, 1.75, 0.08) : THREE.MathUtils.lerp(playerRuntime.y, 1.2, 0.14);

    if (touchRuntime.aimActive) {
      facingAngle.current = Math.atan2(playerRuntime.aimX, playerRuntime.aimZ);
    }

    const weapon = WEAPON_CONFIG[store.currentWeapon];
    const rapid = perkLevel(store.perks, "rapid_fire");
    const fireRate = weapon.fireRate * (1 + store.stats.superpower * 0.012 + rapid * 0.085) * (hasSpeed ? 1.05 : 1);
    if ((shooting.current || touchRuntime.shooting) && fireCooldown.current <= 0) {
      store.fireWeapon(playerRuntime.x, playerRuntime.z, playerRuntime.aimX, playerRuntime.aimZ);
      fireCooldown.current = 1 / fireRate;
    }

    const meleeRequested = (controls.melee && !meleeHeld.current) || touchRuntime.meleePressed;
    if (meleeRequested && meleeCooldown.current <= 0) {
      meleeCooldown.current = has360 ? 0.5 : 0.68;
      store.addMeleeSwing([playerRuntime.x, playerRuntime.z], facingAngle.current, has360);
    }
    touchRuntime.meleePressed = false;
    meleeHeld.current = controls.melee;

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
      if (dx * dx + dz * dz < 2.0 * 2.0) store.collectDrug(drug.id);
    }

    groupRef.current.position.set(playerRuntime.x, playerRuntime.y, playerRuntime.z);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, facingAngle.current, 15, delta);

    if (bodyRef.current) {
      const moving = velocity.current.lengthSq() > 0.25;
      bodyRef.current.position.y = moving ? Math.sin(pulseT.current * 16) * 0.055 : Math.sin(pulseT.current * 5) * 0.018;
    }
    if (barrelRef.current) {
      const recoil = fireCooldown.current > 0 ? Math.min(0.16, fireCooldown.current * 0.3) : 0;
      barrelRef.current.position.z = 0.72 - recoil;
      (barrelRef.current.material as THREE.MeshStandardMaterial).emissive.set(weapon.color);
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
        glowRef.current.color.set(weapon.color);
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
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      <pointLight ref={glowRef} intensity={0.8} distance={6} color="#ffd84a" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.58, 0]}>
        <ringGeometry args={[0.95, 1.24, 36]} />
        <meshBasicMaterial color="#7dfcff" transparent opacity={0.44} />
      </mesh>

      <mesh castShadow position={[0, -0.08, -0.29]}>
        <boxGeometry args={[1.02, 1.44, 0.18]} />
        <meshStandardMaterial color="#23336a" roughness={0.64} metalness={0.05} />
      </mesh>

      <mesh ref={bodyRef} castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.46, 0.92, 6, 14]} />
        <meshStandardMaterial color="#2ed0a2" roughness={0.5} metalness={0.08} />
      </mesh>

      <mesh castShadow position={[0, 0.74, 0.02]}>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color="#f1bb8b" roughness={0.42} />
      </mesh>

      <mesh castShadow position={[0, 0.88, -0.05]}>
        <coneGeometry args={[0.58, 0.62, 7]} />
        <meshStandardMaterial color="#1a826c" roughness={0.55} metalness={0.06} />
      </mesh>

      <mesh castShadow position={[0, 1.16, -0.08]}>
        <coneGeometry args={[0.46, 0.42, 7]} />
        <meshStandardMaterial color="#166858" roughness={0.58} />
      </mesh>

      <mesh ref={barrelRef} castShadow position={[0, 0.24, 0.74]}>
        <boxGeometry args={[0.08, 0.08, 0.86]} />
        <meshStandardMaterial color="#fff3c0" emissive="#ffd84a" emissiveIntensity={0.8} roughness={0.28} metalness={0.4} />
      </mesh>

      <group position={[0.53, 0.12, 0.62]} rotation={[0.08, 0.15, -0.08]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0.28]}>
          <torusGeometry args={[0.56, 0.035, 8, 28, Math.PI * 1.38]} />
          <meshStandardMaterial color="#d89a3b" roughness={0.38} metalness={0.34} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.12, 6]} />
          <meshBasicMaterial color="#f8efe0" />
        </mesh>
      </group>

      <mesh castShadow position={[0.5, -0.1, 0.12]} rotation={[0, 0, -0.24]}>
        <capsuleGeometry args={[0.15, 0.62, 5, 8]} />
        <meshStandardMaterial color="#2ed0a2" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[-0.5, -0.1, 0.12]} rotation={[0, 0, 0.24]}>
        <capsuleGeometry args={[0.15, 0.62, 5, 8]} />
        <meshStandardMaterial color="#2ed0a2" roughness={0.5} />
      </mesh>

      <mesh castShadow position={[0.24, -1.02, 0.02]}>
        <capsuleGeometry args={[0.15, 0.7, 5, 8]} />
        <meshStandardMaterial color="#25345f" roughness={0.58} />
      </mesh>
      <mesh castShadow position={[-0.24, -1.02, 0.02]}>
        <capsuleGeometry args={[0.15, 0.7, 5, 8]} />
        <meshStandardMaterial color="#25345f" roughness={0.58} />
      </mesh>

      <mesh position={[0.16, 0.78, 0.36]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#7dfcff" emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[-0.16, 0.78, 0.36]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#7dfcff" emissiveIntensity={1.3} />
      </mesh>

      <group position={[-0.48, 0.12, -0.32]} rotation={[0.2, -0.32, -0.2]}>
        {[0, 0.11, 0.22].map((offset, index) => (
          <mesh key={index} position={[offset, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.92, 6]} />
            <meshStandardMaterial color="#ffe8a2" roughness={0.38} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
