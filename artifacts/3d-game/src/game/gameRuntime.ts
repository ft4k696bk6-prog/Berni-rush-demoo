export const playerRuntime = {
  x: 0,
  z: 0,
  y: 1.2,
  angle: Math.PI,
  aimX: 0,
  aimZ: -1,
  aimWorldX: 0,
  aimWorldZ: -8,
  velocityX: 0,
  velocityZ: 0,
  screenX: 0,
  screenY: 0,
  dashUntil: 0,
  attackAnimUntil: 0,
  attackAnimType: "shoot" as "shoot" | "slash",
};

export const cameraRuntime = {
  yaw: Math.PI,
  pitch: 0.18,
};

export function defaultCameraPitch() {
  return typeof window !== "undefined" && window.innerWidth <= 780 ? 0.26 : 0.18;
}

export const touchRuntime = {
  moveX: 0,
  moveZ: 0,
  aimX: 0,
  aimY: 0,
  shooting: false,
  aimActive: false,
  dashPressed: false,
  meleePressed: false,
  powerPressed: false,
};

export function resetPlayerRuntime() {
  playerRuntime.x = 0;
  playerRuntime.z = 0;
  playerRuntime.y = 1.2;
  playerRuntime.angle = Math.PI;
  playerRuntime.aimX = 0;
  playerRuntime.aimZ = -1;
  playerRuntime.aimWorldX = 0;
  playerRuntime.aimWorldZ = -8;
  playerRuntime.velocityX = 0;
  playerRuntime.velocityZ = 0;
  playerRuntime.screenX = window.innerWidth / 2;
  playerRuntime.screenY = window.innerHeight / 2;
  playerRuntime.dashUntil = 0;
  playerRuntime.attackAnimUntil = 0;
  playerRuntime.attackAnimType = "shoot";
  cameraRuntime.yaw = Math.PI;
  cameraRuntime.pitch = defaultCameraPitch();
  touchRuntime.moveX = 0;
  touchRuntime.moveZ = 0;
  touchRuntime.aimX = 0;
  touchRuntime.aimY = 0;
  touchRuntime.shooting = false;
  touchRuntime.aimActive = false;
  touchRuntime.dashPressed = false;
  touchRuntime.meleePressed = false;
  touchRuntime.powerPressed = false;
}
