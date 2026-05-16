import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ARENA_BOUND } from "./balance";
import { playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const MENU_POS = new THREE.Vector3(0, 23, 20);
const CAMERA_FORWARD = new THREE.Vector3(0, 0, -1);

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
    const velocityLeadX = THREE.MathUtils.clamp(playerRuntime.velocityX * (compact ? 0.04 : 0.055), -0.65, 0.65);
    const velocityLeadZ = THREE.MathUtils.clamp(playerRuntime.velocityZ * (compact ? 0.04 : 0.055), -0.65, 0.65);
    const rawX = playerRuntime.x + velocityLeadX;
    const rawZ = playerRuntime.z + velocityLeadZ + CAMERA_FORWARD.z * (compact ? 1.35 : 1.75);
    const dx = rawX - follow.current.x;
    const dz = rawZ - follow.current.z;
    const deadZone = compact ? 1.4 : 1.05;
    if (dx * dx + dz * dz > deadZone * deadZone) {
      const damp = 1 - Math.exp(-(compact ? 2.1 : 2.7) * delta);
      follow.current.x = THREE.MathUtils.lerp(follow.current.x, rawX, damp);
      follow.current.z = THREE.MathUtils.lerp(follow.current.z, rawZ, damp);
    }

    const focusX = THREE.MathUtils.clamp(follow.current.x, -ARENA_BOUND + 6, ARENA_BOUND - 6);
    const focusZ = THREE.MathUtils.clamp(follow.current.z, -ARENA_BOUND + 6, ARENA_BOUND - 6);
    const backDistance = compact ? 16.8 : 14.6;
    const height = compact ? 19.6 : 12.9;
    const cameraX = THREE.MathUtils.clamp(focusX, -ARENA_BOUND + 4, ARENA_BOUND - 4);
    const cameraZ = THREE.MathUtils.clamp(focusZ - CAMERA_FORWARD.z * backDistance, -ARENA_BOUND + 4, ARENA_BOUND - 4);

    targetPos.current.set(cameraX, height, cameraZ);
    lookTarget.current.set(
      playerRuntime.x,
      compact ? 1.0 : 1.2,
      playerRuntime.z + CAMERA_FORWARD.z * (compact ? 3.8 : 4.8),
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp((compact ? -2.7 : -3.25) * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
