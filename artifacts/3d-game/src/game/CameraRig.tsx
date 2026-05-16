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
    const velocityLeadX = THREE.MathUtils.clamp(playerRuntime.velocityX * (compact ? 0.05 : 0.08), -0.9, 0.9);
    const velocityLeadZ = THREE.MathUtils.clamp(playerRuntime.velocityZ * (compact ? 0.05 : 0.08), -0.9, 0.9);
    const aimLeadX = playerRuntime.aimX * (compact ? 1.1 : 1.7);
    const aimLeadZ = playerRuntime.aimZ * (compact ? 1.1 : 1.7);
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

    const focusX = THREE.MathUtils.clamp(follow.current.x, -ARENA_BOUND + 6, ARENA_BOUND - 6);
    const focusZ = THREE.MathUtils.clamp(follow.current.z, -ARENA_BOUND + 6, ARENA_BOUND - 6);
    const backDistance = compact ? 15.0 : 13.2;
    const height = compact ? 18.2 : 11.6;
    const cameraX = THREE.MathUtils.clamp(focusX - playerRuntime.aimX * backDistance, -ARENA_BOUND + 4, ARENA_BOUND - 4);
    const cameraZ = THREE.MathUtils.clamp(focusZ - playerRuntime.aimZ * backDistance, -ARENA_BOUND + 4, ARENA_BOUND - 4);

    targetPos.current.set(cameraX, height, cameraZ);
    lookTarget.current.set(
      playerRuntime.x + playerRuntime.aimX * (compact ? 4.0 : 5.2),
      compact ? 1.05 : 1.25,
      playerRuntime.z + playerRuntime.aimZ * (compact ? 4.0 : 5.2),
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp((compact ? -3.4 : -4.0) * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
