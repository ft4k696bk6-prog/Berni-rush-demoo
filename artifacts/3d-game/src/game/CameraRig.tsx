import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "./useGameStore";

export default function CameraRig() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 20, 16));
  const { playerPos, phase } = useGameStore();

  useFrame(() => {
    if (phase !== "playing") {
      targetPos.current.set(0, 20, 16);
      camera.position.lerp(targetPos.current, 0.04);
      camera.lookAt(0, 0, 0);
      return;
    }

    targetPos.current.set(
      playerPos[0] * 0.4,
      20,
      playerPos[1] * 0.4 + 16
    );
    camera.position.lerp(targetPos.current, 0.07);
    camera.lookAt(playerPos[0] * 0.3, 0, playerPos[1] * 0.3);
  });

  return null;
}
