import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraRuntime, playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const MENU_POS = new THREE.Vector3(0, 9.5, 12.5);

export default function CameraRig() {
  const { camera } = useThree();
  const phase = useGameStore(s => s.phase);
  const targetPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (phase !== "playing" && phase !== "paused" && phase !== "upgrade") {
      targetPos.current.copy(MENU_POS);
      camera.position.lerp(targetPos.current, 1 - Math.exp(-4.2 * delta));
      camera.lookAt(0, 1.05, 0);
      return;
    }

    const compact = typeof window !== "undefined" && window.innerWidth <= 780;
    const perspective = camera as THREE.PerspectiveCamera;
    if (perspective.isPerspectiveCamera) {
      const targetFov = compact ? 72 : 66;
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 8, delta);
      perspective.updateProjectionMatrix();
    }

    const forwardX = Math.sin(cameraRuntime.yaw);
    const forwardZ = Math.cos(cameraRuntime.yaw);

    const eyeY = playerRuntime.y + (compact ? 0.82 : 0.9);
    targetPos.current.set(
      playerRuntime.x + forwardX * 0.38,
      eyeY,
      playerRuntime.z + forwardZ * 0.38,
    );
    lookTarget.current.set(
      playerRuntime.x + forwardX * 18,
      eyeY - Math.sin(cameraRuntime.pitch) * 13,
      playerRuntime.z + forwardZ * 18,
    );

    camera.position.copy(targetPos.current);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
