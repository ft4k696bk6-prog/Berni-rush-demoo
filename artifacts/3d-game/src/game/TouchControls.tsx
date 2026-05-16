import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Crosshair, Gauge, Sparkles, Swords, Zap } from "lucide-react";
import { playerRuntime, touchRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const BASE_PAD_SIZE = 118;

function clampStick(dx: number, dy: number, limit: number) {
  const len = Math.hypot(dx, dy);
  if (len <= limit) return { x: dx, y: dy, nx: dx / limit, ny: dy / limit };
  const scale = limit / len;
  return { x: dx * scale, y: dy * scale, nx: dx / len, ny: dy / len };
}

function applyAimCurve(nx: number, ny: number, deadzone: number, sensitivity: number) {
  const len = Math.hypot(nx, ny);
  if (len <= deadzone || len < 1e-6) return { x: 0, y: 0 };
  const normalized = Math.min(1, (len - deadzone) / (1 - deadzone));
  const curved = (normalized * 0.58 + normalized * normalized * 0.42) * sensitivity;
  const scaled = curved / len;
  return { x: nx * scaled, y: ny * scaled };
}

function hapticTap(strength = 8) {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.(strength);
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button, a, input, select, textarea"));
}

export default function TouchControls() {
  const phase = useGameStore(s => s.phase);
  const mobileLookDeadzone = useGameStore(s => s.mobileLookDeadzone);
  const mobileLookSensitivity = useGameStore(s => s.mobileLookSensitivity);
  const leftPadRef = useRef<HTMLDivElement>(null);
  const leftKnobRef = useRef<HTMLDivElement>(null);
  const rightPadRef = useRef<HTMLDivElement>(null);
  const rightKnobRef = useRef<HTMLDivElement>(null);
  const leftPointer = useRef<number | null>(null);
  const rightPointer = useRef<number | null>(null);
  const leftOrigin = useRef({ x: 0, y: 0 });
  const rightOrigin = useRef({ x: 0, y: 0 });
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);

  const resetLeft = () => {
    leftPointer.current = null;
    setLeftActive(false);
    touchRuntime.moveX = 0;
    touchRuntime.moveZ = 0;
    if (leftPadRef.current) {
      leftPadRef.current.style.left = "";
      leftPadRef.current.style.top = "";
      leftPadRef.current.style.right = "";
      leftPadRef.current.style.bottom = "";
      leftPadRef.current.style.transform = "";
    }
    if (leftKnobRef.current) leftKnobRef.current.style.transform = "translate3d(0, 0, 0)";
  };

  const resetRight = () => {
    rightPointer.current = null;
    setRightActive(false);
    touchRuntime.shooting = false;
    touchRuntime.aimActive = false;
    touchRuntime.aimX = 0;
    touchRuntime.aimY = 0;
    if (rightPadRef.current) {
      rightPadRef.current.style.left = "";
      rightPadRef.current.style.top = "";
      rightPadRef.current.style.right = "";
      rightPadRef.current.style.bottom = "";
      rightPadRef.current.style.transform = "";
    }
    if (rightKnobRef.current) rightKnobRef.current.style.transform = "translate3d(0, 0, 0)";
  };

  useEffect(() => {
    if (phase !== "playing") {
      resetLeft();
      resetRight();
    }
  }, [phase]);

  const placePad = (pad: HTMLDivElement | null, x: number, y: number) => {
    if (!pad) return;
    const size = pad.getBoundingClientRect().width || BASE_PAD_SIZE;
    const half = size / 2;
    const minX = half + 8;
    const maxX = window.innerWidth - half - 8;
    const minY = half + 8;
    const maxY = window.innerHeight - half - 8;
    const px = Math.max(minX, Math.min(maxX, x));
    const py = Math.max(minY, Math.min(maxY, y));
    pad.style.left = `${px - half}px`;
    pad.style.top = `${py - half}px`;
    pad.style.right = "auto";
    pad.style.bottom = "auto";
    pad.style.transform = "scale(1)";
  };

  const updateLeft = (event: PointerEvent<HTMLDivElement>) => {
    const pad = leftPadRef.current;
    const knob = leftKnobRef.current;
    if (!pad || !knob) return;
    const size = pad.getBoundingClientRect().width || BASE_PAD_SIZE;
    const limit = Math.max(42, Math.min(62, size * 0.42));
    const dx = event.clientX - leftOrigin.current.x;
    const dy = event.clientY - leftOrigin.current.y;
    const stick = clampStick(dx, dy, limit);
    touchRuntime.moveX = stick.nx;
    touchRuntime.moveZ = stick.ny;
    knob.style.transform = `translate3d(${stick.x}px, ${stick.y}px, 0)`;
  };

  const updateRight = (event: PointerEvent<HTMLDivElement>) => {
    const pad = rightPadRef.current;
    const knob = rightKnobRef.current;
    if (!pad || !knob) return;
    const limit = Math.max(78, Math.min(168, Math.min(window.innerWidth, window.innerHeight) * 0.34));
    const dx = event.clientX - rightOrigin.current.x;
    const dy = event.clientY - rightOrigin.current.y;
    const stick = clampStick(dx, dy, limit);
    const curvedAim = applyAimCurve(stick.nx, stick.ny, Math.max(0.08, mobileLookDeadzone), Math.max(0.42, mobileLookSensitivity * 0.72));

    touchRuntime.shooting = true;
    touchRuntime.aimActive = true;
    if (Math.hypot(curvedAim.x, curvedAim.y) > 0.02) {
      touchRuntime.aimX = curvedAim.x;
      touchRuntime.aimY = curvedAim.y;
      playerRuntime.aimWorldX = playerRuntime.x + curvedAim.x * 12;
      playerRuntime.aimWorldZ = playerRuntime.z + curvedAim.y * 12;
    }
    playerRuntime.screenX = event.clientX;
    playerRuntime.screenY = event.clientY;
    knob.style.transform = `translate3d(${stick.x * 0.72}px, ${stick.y * 0.72}px, 0)`;
  };

  if (phase !== "playing") return null;

  return (
    <div className="touch-controls" aria-hidden="true">
      <div
        className="touch-zone touch-move-zone"
        onPointerDown={event => {
          if (isInteractiveTarget(event.target)) return;
          leftPointer.current = event.pointerId;
          leftOrigin.current = { x: event.clientX, y: event.clientY };
          setLeftActive(true);
          hapticTap();
          placePad(leftPadRef.current, event.clientX, event.clientY);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Synthetic/mobile browser edge cases can report a pointer before it is capturable.
          }
          event.preventDefault();
          event.stopPropagation();
          updateLeft(event);
        }}
        onPointerMove={event => {
          if (leftPointer.current === event.pointerId) {
            event.preventDefault();
            updateLeft(event);
          }
        }}
        onPointerUp={event => {
          if (leftPointer.current !== event.pointerId) return;
          resetLeft();
        }}
        onPointerCancel={resetLeft}
      />

      <div
        className="touch-zone touch-aim-zone"
        onPointerDown={event => {
          if (isInteractiveTarget(event.target)) return;
          rightPointer.current = event.pointerId;
          rightOrigin.current = { x: event.clientX, y: event.clientY };
          setRightActive(true);
          hapticTap();
          placePad(rightPadRef.current, event.clientX, event.clientY);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Synthetic/mobile browser edge cases can report a pointer before it is capturable.
          }
          event.preventDefault();
          event.stopPropagation();
          updateRight(event);
        }}
        onPointerMove={event => {
          if (rightPointer.current === event.pointerId) {
            event.preventDefault();
            updateRight(event);
          }
        }}
        onPointerUp={event => {
          if (rightPointer.current !== event.pointerId) return;
          resetRight();
        }}
        onPointerCancel={resetRight}
      />

      <div ref={leftPadRef} className={`touch-pad touch-pad-left ${leftActive ? "active" : ""}`}>
        <div ref={leftKnobRef} className="touch-knob"><Gauge size={22} /></div>
      </div>

      <div className="touch-buttons">
        <button type="button" onPointerDown={event => { event.preventDefault(); touchRuntime.dashPressed = true; hapticTap(12); }}>
          <Zap size={22} />
        </button>
        <button type="button" onPointerDown={event => { event.preventDefault(); touchRuntime.meleePressed = true; hapticTap(12); }}>
          <Swords size={22} />
        </button>
        <button type="button" onPointerDown={event => { event.preventDefault(); touchRuntime.powerPressed = true; hapticTap(18); }}>
          <Sparkles size={22} />
        </button>
      </div>

      <div ref={rightPadRef} className={`touch-pad touch-pad-right touch-pad-fire ${rightActive ? "active" : ""}`}>
        <div ref={rightKnobRef} className="touch-knob touch-knob-fire"><Crosshair size={24} /></div>
      </div>
    </div>
  );
}
