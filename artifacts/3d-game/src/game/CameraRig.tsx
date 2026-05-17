import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraRuntime, playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";
import { useCompactViewport } from "./useCompactViewport";

const MENU_POS = new THREE.Vector3(0, 9.5, 12.5);

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
      const targetFov = compact ? 86 : 82;
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 9, delta);
      perspective.updateProjectionMatrix();
    }

    const speed = Math.hypot(playerRuntime.velocityX, playerRuntime.velocityZ);
    const movementAlpha = THREE.MathUtils.clamp(speed / 15, 0, 1);
    bobPhase.current += delta * (2 + movementAlpha * 8);
    const bobY = Math.sin(bobPhase.current) * (compact ? 0.008 : 0.012) * movementAlpha;
    const bobX = Math.cos(bobPhase.current * 0.5) * 0.008 * movementAlpha;
    const attackRecoil = THREE.MathUtils.clamp((playerRuntime.attackAnimUntil - Date.now()) / 260, 0, 1);
    const recoilBack = attackRecoil * (compact ? 0.05 : 0.08);
    const recoilLift = attackRecoil * (compact ? 0.03 : 0.045);
    const headHeight = compact ? 0.78 : 0.83;
    const shoulderOffset = compact ? 0.03 : 0.045;
    const pitchOffset = Math.tan(cameraRuntime.pitch) * 1.55;
    const aimLen = Math.hypot(playerRuntime.aimX, playerRuntime.aimZ) || 1;
    const aimX = playerRuntime.aimX / aimLen;
    const aimZ = playerRuntime.aimZ / aimLen;
    const rightX = aimZ;
    const rightZ = -aimX;
    const sideBob = shoulderOffset + bobX;

    targetPos.current.set(
      playerRuntime.x + rightX * sideBob - aimX * recoilBack,
      playerRuntime.y + headHeight + bobY + recoilLift,
      playerRuntime.z + rightZ * sideBob - aimZ * recoilBack,
    );
    lookTarget.current.set(
      targetPos.current.x + aimX * 14,
      targetPos.current.y - pitchOffset,
      targetPos.current.z + aimZ * 14,
    );

    camera.position.copy(targetPos.current);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
