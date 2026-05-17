import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";
import { useCompactViewport } from "./useCompactViewport";

const MENU_POS = new THREE.Vector3(0, 9.5, 12.5);
const DESKTOP_BACK_DISTANCE = 10.6;
const MOBILE_BACK_DISTANCE = 13.4;
const DESKTOP_HEIGHT = 6.6;
const MOBILE_HEIGHT = 8.4;

export default function CameraRig() {
  const { camera } = useThree();
  const phase = useGameStore(s => s.phase);
  const compactViewport = useCompactViewport();
  const targetPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const bobPhase = useRef(0);

  useFrame((_, delta) => {
    if (phase !== "playing" && phase !== "paused" && phase !== "upgrade") {
      targetPos.current.copy(MENU_POS);
      camera.position.lerp(targetPos.current, 1 - Math.exp(-4.2 * delta));
      camera.lookAt(0, 1.05, 0);
      return;
    }

    const compact = compactViewport;
    const perspective = camera as THREE.PerspectiveCamera;
    if (perspective.isPerspectiveCamera) {
      const targetFov = compact ? 62 : 58;
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 9, delta);
      perspective.updateProjectionMatrix();
    }

    const speed = Math.hypot(playerRuntime.velocityX, playerRuntime.velocityZ);
    const movementAlpha = THREE.MathUtils.clamp(speed / 15, 0, 1);
    bobPhase.current += delta * (2 + movementAlpha * 8);
    const bobY = Math.sin(bobPhase.current) * (compact ? 0.045 : 0.06) * movementAlpha;
    const attackRecoil = THREE.MathUtils.clamp((playerRuntime.attackAnimUntil - Date.now()) / 260, 0, 1);
    const recoilLift = attackRecoil * (compact ? 0.08 : 0.12);
    const forwardLen = Math.hypot(playerRuntime.aimX, playerRuntime.aimZ) || 1;
    const forwardX = playerRuntime.aimX / forwardLen;
    const forwardZ = playerRuntime.aimZ / forwardLen;
    const backDistance = compact ? MOBILE_BACK_DISTANCE : DESKTOP_BACK_DISTANCE;
    const height = compact ? MOBILE_HEIGHT : DESKTOP_HEIGHT;
    const aimLead = compact ? 2.4 : 3.1;

    targetPos.current.set(
      playerRuntime.x - forwardX * backDistance,
      playerRuntime.y + height + bobY + recoilLift,
      playerRuntime.z - forwardZ * backDistance,
    );
    lookTarget.current.set(
      playerRuntime.x + forwardX * aimLead,
      playerRuntime.y + 1.35,
      playerRuntime.z + forwardZ * aimLead,
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-10.5 * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
