import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { playerRuntime } from "./gameRuntime";
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

    const compact = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 780);
    const perspective = camera as THREE.PerspectiveCamera;
    if (perspective.isPerspectiveCamera) {
      const targetFov = compact ? 55 : 49;
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 8, delta);
      perspective.updateProjectionMatrix();
    }

    const leadX = playerRuntime.aimX * (compact ? 1.7 : 2.5);
    const leadZ = playerRuntime.aimZ * (compact ? 1.7 : 2.5);
    const movingLeadX = playerRuntime.velocityX * (compact ? 0.1 : 0.14);
    const movingLeadZ = playerRuntime.velocityZ * (compact ? 0.1 : 0.14);

    targetPos.current.set(
      playerRuntime.x + leadX * 0.26 + movingLeadX,
      compact ? 16.4 : 17.8,
      playerRuntime.z + (compact ? 13.2 : 15.2) + leadZ * 0.18 + movingLeadZ,
    );
    lookTarget.current.set(
      playerRuntime.x + leadX,
      1.05,
      playerRuntime.z + leadZ,
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-9 * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
