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
};

export const touchRuntime = {
  moveX: 0,
  moveZ: 0,
  shooting: false,
  aimActive: false,
  dashPressed: false,
  meleePressed: false,
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
  touchRuntime.moveX = 0;
  touchRuntime.moveZ = 0;
  touchRuntime.shooting = false;
  touchRuntime.aimActive = false;
  touchRuntime.dashPressed = false;
  touchRuntime.meleePressed = false;
}
