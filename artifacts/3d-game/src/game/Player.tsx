import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "./useGameStore";
import { poisonCurrentPos } from "./poisonPositions";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  melee = "melee",
}

const BASE_SPEED = 9;
const JUMP_FORCE = 12;
const GRAVITY = -28;

function useMemo_() {
  return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
}

const tickTimer  = { current: 0 };
const spawnTimer = { current: 0 };

export default function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.PointLight>(null);

  const [, getKeys] = useKeyboardControls<Controls>();
  const { gl, camera } = useThree();

  const store    = useGameStore();
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);

  const velY        = useRef(0);
  const onGround    = useRef(true);
  const meleeCD     = useRef(0);
  const pulseT      = useRef(0);
  const facingAngle = useRef(Math.PI); // start facing away from camera
  const groundPlane = useMemo_();

  useEffect(() => {
    if (store.phase === "playing" && groupRef.current) {
      groupRef.current.position.set(0, 1.2, 0);
      facingAngle.current = Math.PI;
      velY.current = 0;
      onGround.current = true;
    }
  }, [store.phase]);

  const handleClick = useCallback((e: MouseEvent) => {
    const s = storeRef.current;
    if (s.phase !== "playing" || !groupRef.current) return;
    const px = groupRef.current.position.x;
    const pz = groupRef.current.position.z;

    const rect = gl.domElement.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, hit);
    if (!hit) return;

    const dx = hit.x - px;
    const dz = hit.z - pz;
    const now = Date.now();
    const hasTriple = s.activeEffects.some(e => e.type === "triple_shot" && e.expiresAt > now);
    s.fireProjectile(px, pz, dx, dz, hasTriple ? 3 : 1);
    facingAngle.current = Math.atan2(dx, dz);
  }, [gl, camera, groundPlane]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [gl, handleClick]);

  useFrame((_, delta) => {
    if (store.phase !== "playing" || !groupRef.current) return;
    const now = Date.now();
    pulseT.current  += delta * 3;
    meleeCD.current  = Math.max(0, meleeCD.current - delta);

    storeRef.current.tickEffects(now);
    storeRef.current.clearOldMelee(now);
    storeRef.current.tickProjectiles(delta);

    const px = groupRef.current.position.x;
    const pz = groupRef.current.position.z;

    // Tick enemy projectiles (ghost shots) against player position
    storeRef.current.tickEnemyProjectiles(delta, px, pz);

    // Score tick
    if (!tickTimer.current) tickTimer.current = now;
    if (now - tickTimer.current > 1000) {
      storeRef.current.addScore(10);
      tickTimer.current = now;
    }

    // Spawn timer
    if (!spawnTimer.current) spawnTimer.current = now;
    if (now - spawnTimer.current > 1800) {
      storeRef.current.spawnItems();
      spawnTimer.current = now;
    }

    const { activeEffects } = storeRef.current;
    const hasSpeed    = activeEffects.some(e => e.type === "speed"      && e.expiresAt > now);
    const hasFlight   = activeEffects.some(e => e.type === "flight"     && e.expiresAt > now);
    const hasInv      = activeEffects.some(e => e.type === "invincibility" && e.expiresAt > now);
    const hasStr      = activeEffects.some(e => e.type === "strength"   && e.expiresAt > now);
    const hasTimeSlow = activeEffects.some(e => e.type === "time_slow"  && e.expiresAt > now);
    const has360      = activeEffects.some(e => e.type === "melee_360"  && e.expiresAt > now);

    const controls = getKeys();

    // Jump
    if (controls.jump && onGround.current) {
      velY.current = JUMP_FORCE;
      onGround.current = false;
    }
    if (!onGround.current) {
      velY.current += GRAVITY * delta;
      groupRef.current.position.y += velY.current * delta;
      if (groupRef.current.position.y <= 1.2) {
        groupRef.current.position.y = 1.2;
        velY.current = 0;
        onGround.current = true;
      }
    }

    // Melee (Enter)
    if (controls.melee && meleeCD.current <= 0) {
      meleeCD.current = has360 ? 0.5 : 0.7;
      const mx = groupRef.current.position.x;
      const mz = groupRef.current.position.z;
      storeRef.current.addMeleeSwing([mx, mz], facingAngle.current, has360);
    }

    // Movement
    const speed = BASE_SPEED * (hasSpeed ? 2.8 : 1) * (hasFlight ? 1.2 : 1);
    const move  = new THREE.Vector3();
    if (controls.forward) move.z -= 1;
    if (controls.back)    move.z += 1;
    if (controls.left)    move.x -= 1;
    if (controls.right)   move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      groupRef.current.position.x += move.x;
      groupRef.current.position.z += move.z;
      facingAngle.current = Math.atan2(move.x, move.z);
    }

    const B = 21;
    groupRef.current.position.x = THREE.MathUtils.clamp(groupRef.current.position.x, -B, B);
    groupRef.current.position.z = THREE.MathUtils.clamp(groupRef.current.position.z, -B, B);

    if (hasFlight && onGround.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 3.5, 0.08);
    }

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, facingAngle.current, 0.2);

    if (glowRef.current) {
      if      (hasInv)      { glowRef.current.color.set("#ffdd00"); glowRef.current.intensity = 3 + Math.sin(pulseT.current * 4) * 1.5; }
      else if (hasSpeed)    { glowRef.current.color.set("#00ffff"); glowRef.current.intensity = 2 + Math.sin(pulseT.current * 6); }
      else if (hasStr)      { glowRef.current.color.set("#ff4400"); glowRef.current.intensity = 2.5 + Math.sin(pulseT.current * 3); }
      else if (hasFlight)   { glowRef.current.color.set("#dd88ff"); glowRef.current.intensity = 3 + Math.sin(pulseT.current * 2); }
      else if (hasTimeSlow) { glowRef.current.color.set("#44ff88"); glowRef.current.intensity = 2 + Math.sin(pulseT.current * 2); }
      else if (has360)      { glowRef.current.color.set("#ff8800"); glowRef.current.intensity = 2.5 + Math.sin(pulseT.current * 4); }
      else                  { glowRef.current.color.set("#ffffff"); glowRef.current.intensity = 0.3; }
    }

    if (bodyRef.current && move.lengthSq() > 0) {
      bodyRef.current.position.y = Math.sin(pulseT.current * 10) * 0.06;
    }

    storeRef.current.setPlayerPos(
      [groupRef.current.position.x, groupRef.current.position.z],
      facingAngle.current,
    );

    // Mushroom collection
    for (const drug of storeRef.current.drugs) {
      if (drug.collected) continue;
      const ddx = drug.position[0] - groupRef.current.position.x;
      const ddz = drug.position[2] - groupRef.current.position.z;
      if (ddx * ddx + ddz * ddz < 2.0 * 2.0) storeRef.current.collectDrug(drug.id);
    }

    // Strength powerup: instantly kill enemies on touch
    if (hasStr) {
      for (const p of storeRef.current.poisons) {
        if (p.collected) continue;
        const live = poisonCurrentPos[p.id];
        const ex = live ? live[0] : p.position[0];
        const ez = live ? live[1] : p.position[2];
        const ddx = ex - groupRef.current.position.x;
        const ddz = ez - groupRef.current.position.z;
        if (ddx * ddx + ddz * ddz < 1.6 * 1.6) storeRef.current.damageEnemy(p.id, 99);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.2, 0]}>
      <pointLight ref={glowRef} intensity={0.3} distance={6} color="#ffffff" />

      {/* Body */}
      <mesh ref={bodyRef} castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 1.3, 0.65]} />
        <meshLambertMaterial color="#cc3311" />
      </mesh>
      <mesh castShadow position={[0, 0.1, 0.33]}>
        <boxGeometry args={[0.7, 0.9, 0.05]} />
        <meshLambertMaterial color="#881100" />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.75, 0.72, 0.72]} />
        <meshLambertMaterial color="#d4936a" />
      </mesh>
      {/* Hair */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[0.76, 0.22, 0.73]} />
        <meshLambertMaterial color="#1a0a00" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.2, 0.98, 0.37]}>
        <boxGeometry args={[0.16, 0.14, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.2, 0.98, 0.37]}>
        <boxGeometry args={[0.16, 0.14, 0.05]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      {/* Arms */}
      <mesh castShadow position={[0.75, 0.1, 0]}>
        <boxGeometry args={[0.38, 0.9, 0.38]} />
        <meshLambertMaterial color="#cc3311" />
      </mesh>
      <mesh castShadow position={[-0.75, 0.1, 0]}>
        <boxGeometry args={[0.38, 0.9, 0.38]} />
        <meshLambertMaterial color="#cc3311" />
      </mesh>
      {/* Hands */}
      <mesh castShadow position={[0.75, -0.45, 0]}>
        <boxGeometry args={[0.32, 0.3, 0.32]} />
        <meshLambertMaterial color="#d4936a" />
      </mesh>
      <mesh castShadow position={[-0.75, -0.45, 0]}>
        <boxGeometry args={[0.32, 0.3, 0.32]} />
        <meshLambertMaterial color="#d4936a" />
      </mesh>
      {/* Legs */}
      <mesh castShadow position={[0.28, -1.05, 0]}>
        <boxGeometry args={[0.36, 0.75, 0.4]} />
        <meshLambertMaterial color="#222244" />
      </mesh>
      <mesh castShadow position={[-0.28, -1.05, 0]}>
        <boxGeometry args={[0.36, 0.75, 0.4]} />
        <meshLambertMaterial color="#222244" />
      </mesh>
      {/* Shoes */}
      <mesh castShadow position={[0.28, -1.5, 0.1]}>
        <boxGeometry args={[0.38, 0.2, 0.52]} />
        <meshLambertMaterial color="#111111" />
      </mesh>
      <mesh castShadow position={[-0.28, -1.5, 0.1]}>
        <boxGeometry args={[0.38, 0.2, 0.52]} />
        <meshLambertMaterial color="#111111" />
      </mesh>
    </group>
  );
}

