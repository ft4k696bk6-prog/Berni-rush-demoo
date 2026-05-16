import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ARENA_BOUND } from "./balance";
import { playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const MENU_POS = new THREE.Vector3(0, 23, 20);

export default function CameraRig() {
  const { camera } = useThree();
  const phase = useGameStore(s => s.phase);
  const targetPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const follow = useRef(new THREE.Vector3(0, 0.6, 0));

  useFrame((_, delta) => {
    if (phase !== "playing" && phase !== "paused") {
      targetPos.current.copy(MENU_POS);
      camera.position.lerp(targetPos.current, 1 - Math.exp(-3.2 * delta));
      camera.lookAt(0, 0.2, 0);
      return;
    }

    const compact = typeof window !== "undefined" && window.innerWidth <= 780;
    const velocityLeadX = THREE.MathUtils.clamp(playerRuntime.velocityX * (compact ? 0.08 : 0.12), -1.3, 1.3);
    const velocityLeadZ = THREE.MathUtils.clamp(playerRuntime.velocityZ * (compact ? 0.08 : 0.12), -1.3, 1.3);
    const aimLeadX = playerRuntime.aimX * (compact ? 1.45 : 2.15);
    const aimLeadZ = playerRuntime.aimZ * (compact ? 1.45 : 2.15);
    const rawX = playerRuntime.x + aimLeadX + velocityLeadX;
    const rawZ = playerRuntime.z + aimLeadZ + velocityLeadZ;
    const dx = rawX - follow.current.x;
    const dz = rawZ - follow.current.z;
    const deadZone = compact ? 1.85 : 1.25;
    if (dx * dx + dz * dz > deadZone * deadZone) {
      const damp = 1 - Math.exp(-(compact ? 2.4 : 3.4) * delta);
      follow.current.x = THREE.MathUtils.lerp(follow.current.x, rawX, damp);
      follow.current.z = THREE.MathUtils.lerp(follow.current.z, rawZ, damp);
    }

    const targetX = THREE.MathUtils.clamp(follow.current.x, -ARENA_BOUND + 8, ARENA_BOUND - 8);
    const targetZ = THREE.MathUtils.clamp(follow.current.z, -ARENA_BOUND + 8, ARENA_BOUND - 8);

    targetPos.current.set(targetX, compact ? 25 : 23, targetZ + (compact ? 21 : 18.5));
    lookTarget.current.set(
      THREE.MathUtils.lerp(playerRuntime.x, targetX, compact ? 0.24 : 0.34),
      0.6,
      THREE.MathUtils.lerp(playerRuntime.z, targetZ, compact ? 0.24 : 0.34),
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp((compact ? -3.1 : -4.2) * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
