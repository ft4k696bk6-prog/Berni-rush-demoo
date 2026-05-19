import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraRuntime, playerRuntime } from "./gameRuntime";
import { clampPointToMap, getMapDefinition, pointCollidesWithMap } from "./mapDefinitions";
import { useGameStore } from "./useGameStore";
import { useCompactViewport } from "./useCompactViewport";

const MENU_POS = new THREE.Vector3(0, 9.5, 12.5);
const DESKTOP_BACK_DISTANCE = 9.4;
const MOBILE_BACK_DISTANCE = 11.2;
const DESKTOP_HEIGHT = 5.35;
const MOBILE_HEIGHT = 6.15;
const CAMERA_PITCH_MIN = -0.38;
const CAMERA_PITCH_MAX = 0.72;
const DEFAULT_ROOM_CEILING_Y = 6.95;
const CAMERA_CEILING_CLEARANCE = 0.55;
const CAMERA_WALL_TOP_CLEARANCE = 0.28;
const CAMERA_COLLISION_RADIUS = 0.72;
const CAMERA_TRACE_STEP = 0.46;
const CAMERA_MIN_Y = 3.05;
const LOOK_TARGET_MIN_Y = 1.25;
const LOOK_TARGET_MAX_BELOW_CAMERA = 0.35;

type MapDefinition = ReturnType<typeof getMapDefinition>;

function getMapCameraMaxY(map: MapDefinition, x: number, z: number) {
  const room = map.rooms.find(room => {
    const [cx, cz] = room.center;
    const [hx, hz] = room.halfSize;
    return (
      x >= cx - hx * 1.03 &&
      x <= cx + hx * 1.03 &&
      z >= cz - hz * 1.03 &&
      z <= cz + hz * 1.03
    );
  });
  const roomCeilingMaxY = room?.cameraMaxY ?? ((room?.height ?? DEFAULT_ROOM_CEILING_Y) - CAMERA_CEILING_CLEARANCE);
  const wallMaxY = map.wallSegments.reduce((maxY, segment) => Math.min(maxY, segment.height - CAMERA_WALL_TOP_CLEARANCE), roomCeilingMaxY);
  return Math.max(CAMERA_MIN_Y, Math.min(roomCeilingMaxY, wallMaxY));
}

function traceCameraToMap(mapId: MapDefinition["id"], fromX: number, fromZ: number, toX: number, toZ: number) {
  const [startX, startZ] = clampPointToMap(mapId, fromX, fromZ, CAMERA_COLLISION_RADIUS);
  const [targetX, targetZ] = clampPointToMap(mapId, toX, toZ, CAMERA_COLLISION_RADIUS);
  const dx = targetX - startX;
  const dz = targetZ - startZ;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / CAMERA_TRACE_STEP));
  let safeX = startX;
  let safeZ = startZ;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = startX + dx * t;
    const z = startZ + dz * t;
    if (pointCollidesWithMap(mapId, x, z, CAMERA_COLLISION_RADIUS)) break;
    safeX = x;
    safeZ = z;
  }

  return [safeX, safeZ] as const;
}

export default function CameraRig() {
  const { camera } = useThree();
  const phase = useGameStore(s => s.phase);
  const mapId = useGameStore(s => s.mapId);
  const compactViewport = useCompactViewport();
  const targetPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const bobPhase = useRef(0);

  useFrame((_, delta) => {
    const frameDelta = Math.min(delta, 1 / 30);

    if (phase !== "playing" && phase !== "paused" && phase !== "upgrade") {
      targetPos.current.copy(MENU_POS);
      camera.position.lerp(targetPos.current, 1 - Math.exp(-4.2 * frameDelta));
      camera.lookAt(0, 1.05, 0);
      return;
    }

    const map = getMapDefinition(mapId);
    const compact = compactViewport;
    const perspective = camera as THREE.PerspectiveCamera;
    if (perspective.isPerspectiveCamera) {
      const targetFov = compact ? 62 : 58;
      perspective.fov = THREE.MathUtils.damp(perspective.fov, targetFov, 9, frameDelta);
      perspective.updateProjectionMatrix();
    }

    const speed = Math.hypot(playerRuntime.velocityX, playerRuntime.velocityZ);
    const movementAlpha = THREE.MathUtils.clamp(speed / 15, 0, 1);
    bobPhase.current += frameDelta * (2 + movementAlpha * 8);
    const bobY = Math.sin(bobPhase.current) * (compact ? 0.028 : 0.036) * movementAlpha;
    const attackRecoil = THREE.MathUtils.clamp((playerRuntime.attackAnimUntil - Date.now()) / 260, 0, 1);
    const recoilLift = attackRecoil * (compact ? 0.045 : 0.065);
    const forwardLen = Math.hypot(playerRuntime.aimX, playerRuntime.aimZ) || 1;
    const forwardX = playerRuntime.aimX / forwardLen;
    const forwardZ = playerRuntime.aimZ / forwardLen;
    const backDistance = compact ? MOBILE_BACK_DISTANCE : DESKTOP_BACK_DISTANCE;
    const pitch = THREE.MathUtils.clamp(cameraRuntime.pitch, CAMERA_PITCH_MIN, CAMERA_PITCH_MAX);
    const normalizedPitch = pitch - 0.18;
    const height = (compact ? MOBILE_HEIGHT : DESKTOP_HEIGHT) - normalizedPitch * (compact ? 1.2 : 1.05);
    const aimLead = THREE.MathUtils.clamp((compact ? 2.25 : 2.75) + normalizedPitch * 1.35, 1.35, compact ? 3.55 : 4.35);
    const lookHeight = THREE.MathUtils.clamp(1.6 + normalizedPitch * 2.9, 0.95, 3.45);
    const desiredX = playerRuntime.x - forwardX * backDistance;
    const desiredZ = playerRuntime.z - forwardZ * backDistance;
    const [safeX, safeZ] = traceCameraToMap(map.id, playerRuntime.x, playerRuntime.z, desiredX, desiredZ);
    const cameraMaxY = getMapCameraMaxY(map, safeX, safeZ);
    const collisionRatio = THREE.MathUtils.clamp(Math.hypot(safeX - playerRuntime.x, safeZ - playerRuntime.z) / backDistance, 0, 1);
    const collisionLowering = (1 - collisionRatio) * (compact ? 0.42 : 0.32);
    const cameraY = THREE.MathUtils.clamp(
      playerRuntime.y + height + bobY + recoilLift - collisionLowering,
      CAMERA_MIN_Y,
      cameraMaxY,
    );
    const lookY = THREE.MathUtils.clamp(
      playerRuntime.y + lookHeight,
      LOOK_TARGET_MIN_Y,
      Math.max(LOOK_TARGET_MIN_Y, cameraMaxY - LOOK_TARGET_MAX_BELOW_CAMERA),
    );

    targetPos.current.set(
      safeX,
      cameraY,
      safeZ,
    );
    lookTarget.current.set(
      playerRuntime.x + forwardX * aimLead,
      lookY,
      playerRuntime.z + forwardZ * aimLead,
    );

    camera.position.lerp(targetPos.current, 1 - Math.exp(-(compact ? 14 : 16) * frameDelta));
    camera.lookAt(lookTarget.current);
  });

  return null;
}
