import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraRuntime, playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const MENU_POS = new THREE.Vector3(0, 9.5, 12.5);

export default function CameraRig() {
  const { camera } = useThree();
  const phase = useGameStore(s => s.phase);
  const cameraViewMode = useGameStore(s => s.cameraViewMode);
  const targetPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (phase !== "playing" && phase !== "paused") {
      targetPos.current.copy(MENU_POS);
      camera.position.lerp(targetPos.current, 1 - Math.exp(-4.2 * delta));
      camera.lookAt(0, 1.05, 0);
      return;
    }

    const compact = typeof window !== "undefined" && window.innerWidth <= 780;
    const forwardX = Math.sin(cameraRuntime.yaw);
    const forwardZ = Math.cos(cameraRuntime.yaw);

    if (cameraViewMode === "first_person") {
      const eyeY = playerRuntime.y + 0.88;
      targetPos.current.set(
        playerRuntime.x + forwardX * 0.42,
        eyeY,
        playerRuntime.z + forwardZ * 0.42,
      );
      lookTarget.current.set(
        playerRuntime.x + forwardX * 16,
        eyeY - Math.sin(cameraRuntime.pitch) * 12,
        playerRuntime.z + forwardZ * 16,
      );
      camera.position.copy(targetPos.current);
      camera.lookAt(lookTarget.current);
      return;
    }

    const distance = compact ? 14.0 : 9.2;
    const height = compact ? 7.2 + cameraRuntime.pitch * 3.0 : 4.85 + cameraRuntime.pitch * 2.35;
    const lookAhead = compact ? 2.65 : 1.85;

    targetPos.current.set(
      playerRuntime.x - forwardX * distance,
      playerRuntime.y + height,
      playerRuntime.z - forwardZ * distance,
    );
    lookTarget.current.set(
      playerRuntime.x + forwardX * lookAhead,
      playerRuntime.y + 1.05 - cameraRuntime.pitch * 0.6,
      playerRuntime.z + forwardZ * lookAhead,
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-18 * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
