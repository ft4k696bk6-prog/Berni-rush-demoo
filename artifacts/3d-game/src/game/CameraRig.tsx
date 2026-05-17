import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";
import { useCompactViewport } from "./useCompactViewport";

const MENU_POS = new THREE.Vector3(0, 9.5, 12.5);
const DESKTOP_OFFSET = new THREE.Vector3(0, 14.8, 17.2);
const MOBILE_OFFSET = new THREE.Vector3(0, 17.8, 20.8);

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
      const targetFov = compact ? 58 : 52;
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 9, delta);
      perspective.updateProjectionMatrix();
    }

    const speed = Math.hypot(playerRuntime.velocityX, playerRuntime.velocityZ);
    const movementAlpha = THREE.MathUtils.clamp(speed / 15, 0, 1);
    bobPhase.current += delta * (2 + movementAlpha * 8);
    const bobY = Math.sin(bobPhase.current) * (compact ? 0.045 : 0.06) * movementAlpha;
    const attackRecoil = THREE.MathUtils.clamp((playerRuntime.attackAnimUntil - Date.now()) / 260, 0, 1);
    const recoilLift = attackRecoil * (compact ? 0.08 : 0.12);
    const aimLen = Math.hypot(playerRuntime.aimX, playerRuntime.aimZ) || 1;
    const aimX = playerRuntime.aimX / aimLen;
    const aimZ = playerRuntime.aimZ / aimLen;
    const aimLead = compact ? 1.15 : 1.75;
    const offset = compact ? MOBILE_OFFSET : DESKTOP_OFFSET;

    targetPos.current.set(
      playerRuntime.x + aimX * aimLead * 0.24 + offset.x,
      playerRuntime.y + offset.y + bobY + recoilLift,
      playerRuntime.z + aimZ * aimLead * 0.24 + offset.z,
    );
    lookTarget.current.set(
      playerRuntime.x + aimX * aimLead,
      playerRuntime.y + 1.05,
      playerRuntime.z + aimZ * aimLead,
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-8.5 * delta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
