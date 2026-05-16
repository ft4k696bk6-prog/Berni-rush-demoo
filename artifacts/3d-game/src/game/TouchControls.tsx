import { useEffect, useRef, useState } from "react";
import { Crosshair, Gauge, Sparkles, Swords, Zap } from "lucide-react";
import { playerRuntime, touchRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const FIRE_DEADZONE = 0.1;

function clampStick(dx: number, dy: number, limit: number) {
  const len = Math.hypot(dx, dy);
  if (len <= limit) return { x: dx, y: dy, nx: dx / limit, ny: dy / limit };
  const scale = limit / len;
  return { x: dx * scale, y: dy * scale, nx: dx / len, ny: dy / len };
}

function stickLimit(pad: HTMLDivElement) {
  return Math.max(32, Math.min(48, pad.getBoundingClientRect().width * 0.36));
}

function hapticTap(strength = 8) {
  if (typeof navigator === "undefined") return;
  navigator.vibrate?.(strength);
}

export default function TouchControls() {
  const phase = useGameStore(s => s.phase);
  const leftPadRef = useRef<HTMLDivElement>(null);
  const leftKnobRef = useRef<HTMLDivElement>(null);
  const rightPadRef = useRef<HTMLDivElement>(null);
  const rightKnobRef = useRef<HTMLDivElement>(null);
  const leftPointer = useRef<number | null>(null);
  const rightPointer = useRef<number | null>(null);
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);

  useEffect(() => {
    if (phase !== "playing") {
      touchRuntime.moveX = 0;
      touchRuntime.moveZ = 0;
      touchRuntime.shooting = false;
      touchRuntime.aimActive = false;
      touchRuntime.aimX = 0;
      touchRuntime.aimY = 0;
      leftPointer.current = null;
      rightPointer.current = null;
      setLeftActive(false);
      setRightActive(false);
      if (leftKnobRef.current) leftKnobRef.current.style.transform = "translate3d(0, 0, 0)";
      if (rightKnobRef.current) rightKnobRef.current.style.transform = "translate3d(0, 0, 0)";
    }
  }, [phase]);

  const updateLeft = (event: React.PointerEvent<HTMLDivElement>) => {
    const pad = leftPadRef.current;
    const knob = leftKnobRef.current;
    if (!pad || !knob) return;
    const rect = pad.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const stick = clampStick(dx, dy, stickLimit(pad));
    touchRuntime.moveX = stick.nx;
    touchRuntime.moveZ = stick.ny;
    knob.style.transform = `translate3d(${stick.x}px, ${stick.y}px, 0)`;
  };

  const updateRight = (event: React.PointerEvent<HTMLDivElement>) => {
    const pad = rightPadRef.current;
    const knob = rightKnobRef.current;
    if (!pad || !knob) return;
    const rect = pad.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const stick = clampStick(dx, dy, stickLimit(pad));
    const len = Math.hypot(stick.nx, stick.ny);

    touchRuntime.shooting = len > FIRE_DEADZONE;
    touchRuntime.aimActive = true;
    touchRuntime.aimX = len > 0.04 ? stick.nx : 0;
    touchRuntime.aimY = len > 0.04 ? stick.ny : 0;
    playerRuntime.screenX = event.clientX;
    playerRuntime.screenY = event.clientY;
    knob.style.transform = `translate3d(${stick.x}px, ${stick.y}px, 0)`;
  };

  if (phase !== "playing") return null;

  return (
    <div className="touch-controls" aria-hidden="true">
      <div
        ref={leftPadRef}
        className={`touch-pad touch-pad-left ${leftActive ? "active" : ""}`}
        onPointerDown={event => {
          leftPointer.current = event.pointerId;
          setLeftActive(true);
          hapticTap();
          event.currentTarget.setPointerCapture(event.pointerId);
          updateLeft(event);
        }}
        onPointerMove={event => {
          if (leftPointer.current === event.pointerId) updateLeft(event);
        }}
        onPointerUp={event => {
          if (leftPointer.current !== event.pointerId) return;
          leftPointer.current = null;
          setLeftActive(false);
          touchRuntime.moveX = 0;
          touchRuntime.moveZ = 0;
          if (leftKnobRef.current) leftKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
        onPointerCancel={() => {
          leftPointer.current = null;
          setLeftActive(false);
          touchRuntime.moveX = 0;
          touchRuntime.moveZ = 0;
          if (leftKnobRef.current) leftKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
      >
        <div ref={leftKnobRef} className="touch-knob"><Gauge size={22} /></div>
      </div>

      <div className="touch-buttons">
        <button type="button" onPointerDown={() => { touchRuntime.dashPressed = true; hapticTap(12); }}>
          <Zap size={22} />
        </button>
        <button type="button" onPointerDown={() => { touchRuntime.meleePressed = true; hapticTap(12); }}>
          <Swords size={22} />
        </button>
        <button type="button" onPointerDown={() => { touchRuntime.powerPressed = true; hapticTap(18); }}>
          <Sparkles size={22} />
        </button>
      </div>

      <div
        ref={rightPadRef}
        className={`touch-pad touch-pad-right ${rightActive ? "active" : ""}`}
        onPointerDown={event => {
          rightPointer.current = event.pointerId;
          setRightActive(true);
          hapticTap();
          event.currentTarget.setPointerCapture(event.pointerId);
          updateRight(event);
        }}
        onPointerMove={event => {
          if (rightPointer.current === event.pointerId) updateRight(event);
        }}
        onPointerUp={event => {
          if (rightPointer.current !== event.pointerId) return;
          rightPointer.current = null;
          setRightActive(false);
          touchRuntime.shooting = false;
          touchRuntime.aimActive = false;
          touchRuntime.aimX = 0;
          touchRuntime.aimY = 0;
          if (rightKnobRef.current) rightKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
        onPointerCancel={() => {
          rightPointer.current = null;
          setRightActive(false);
          touchRuntime.shooting = false;
          touchRuntime.aimActive = false;
          touchRuntime.aimX = 0;
          touchRuntime.aimY = 0;
          if (rightKnobRef.current) rightKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
      >
        <div ref={rightKnobRef} className="touch-knob touch-knob-fire"><Crosshair size={24} /></div>
      </div>
    </div>
  );
}
