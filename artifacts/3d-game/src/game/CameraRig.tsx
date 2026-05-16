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

  useFrame((_, delta) => {
    if (phase !== "playing" && phase !== "paused") {
      targetPos.current.copy(MENU_POS);
      camera.position.lerp(targetPos.current, 1 - Math.exp(-3.2 * delta));
      camera.lookAt(0, 0.2, 0);
      return;
    }

    const velocityLeadX = THREE.MathUtils.clamp(playerRuntime.velocityX * 0.18, -2.2, 2.2);
    const velocityLeadZ = THREE.MathUtils.clamp(playerRuntime.velocityZ * 0.18, -2.2, 2.2);
    const aimLeadX = playerRuntime.aimX * 3.25;
    const aimLeadZ = playerRuntime.aimZ * 3.25;
    const targetX = THREE.MathUtils.clamp(playerRuntime.x + aimLeadX + velocityLeadX, -ARENA_BOUND + 8, ARENA_BOUND - 8);
    const targetZ = THREE.MathUtils.clamp(playerRuntime.z + aimLeadZ + velocityLeadZ, -ARENA_BOUND + 8, ARENA_BOUND - 8);

    targetPos.current.set(targetX, 22, targetZ + 18);
    lookTarget.current.set(
      THREE.MathUtils.lerp(playerRuntime.x, targetX, 0.42),
      0.6,
      THREE.MathUtils.lerp(playerRuntime.z, targetZ, 0.42),
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-5.4 * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
