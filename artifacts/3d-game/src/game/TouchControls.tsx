import { useEffect, useRef } from "react";
import { Crosshair, Gauge, Swords, Zap } from "lucide-react";
import { playerRuntime, touchRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

const PAD_RADIUS = 58;
const KNOB_LIMIT = 42;

function clampStick(dx: number, dy: number) {
  const len = Math.hypot(dx, dy);
  if (len <= KNOB_LIMIT) return { x: dx, y: dy, nx: dx / KNOB_LIMIT, ny: dy / KNOB_LIMIT };
  const scale = KNOB_LIMIT / len;
  return { x: dx * scale, y: dy * scale, nx: dx / len, ny: dy / len };
}

export default function TouchControls() {
  const phase = useGameStore(s => s.phase);
  const leftPadRef = useRef<HTMLDivElement>(null);
  const leftKnobRef = useRef<HTMLDivElement>(null);
  const rightPadRef = useRef<HTMLDivElement>(null);
  const rightKnobRef = useRef<HTMLDivElement>(null);
  const leftPointer = useRef<number | null>(null);
  const rightPointer = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "playing") {
      touchRuntime.moveX = 0;
      touchRuntime.moveZ = 0;
      touchRuntime.shooting = false;
      touchRuntime.aimActive = false;
      leftPointer.current = null;
      rightPointer.current = null;
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
    const stick = clampStick(dx, dy);
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
    const stick = clampStick(dx, dy);
    const len = Math.hypot(stick.nx, stick.ny);
    const aimX = len > 0.12 ? stick.nx : playerRuntime.aimX;
    const aimZ = len > 0.12 ? stick.ny : playerRuntime.aimZ;

    touchRuntime.shooting = true;
    touchRuntime.aimActive = true;
    playerRuntime.aimX = aimX;
    playerRuntime.aimZ = aimZ;
    playerRuntime.aimWorldX = playerRuntime.x + aimX * 10;
    playerRuntime.aimWorldZ = playerRuntime.z + aimZ * 10;
    playerRuntime.screenX = event.clientX;
    playerRuntime.screenY = event.clientY;
    knob.style.transform = `translate3d(${stick.x}px, ${stick.y}px, 0)`;
  };

  if (phase !== "playing") return null;

  return (
    <div className="touch-controls" aria-hidden="true">
      <div
        ref={leftPadRef}
        className="touch-pad touch-pad-left"
        style={{ width: PAD_RADIUS * 2, height: PAD_RADIUS * 2 }}
        onPointerDown={event => {
          leftPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateLeft(event);
        }}
        onPointerMove={event => {
          if (leftPointer.current === event.pointerId) updateLeft(event);
        }}
        onPointerUp={event => {
          if (leftPointer.current !== event.pointerId) return;
          leftPointer.current = null;
          touchRuntime.moveX = 0;
          touchRuntime.moveZ = 0;
          if (leftKnobRef.current) leftKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
        onPointerCancel={() => {
          leftPointer.current = null;
          touchRuntime.moveX = 0;
          touchRuntime.moveZ = 0;
          if (leftKnobRef.current) leftKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
      >
        <div ref={leftKnobRef} className="touch-knob"><Gauge size={22} /></div>
      </div>

      <div className="touch-buttons">
        <button type="button" onPointerDown={() => { touchRuntime.dashPressed = true; }}>
          <Zap size={22} />
        </button>
        <button type="button" onPointerDown={() => { touchRuntime.meleePressed = true; }}>
          <Swords size={22} />
        </button>
      </div>

      <div
        ref={rightPadRef}
        className="touch-pad touch-pad-right"
        style={{ width: PAD_RADIUS * 2, height: PAD_RADIUS * 2 }}
        onPointerDown={event => {
          rightPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          updateRight(event);
        }}
        onPointerMove={event => {
          if (rightPointer.current === event.pointerId) updateRight(event);
        }}
        onPointerUp={event => {
          if (rightPointer.current !== event.pointerId) return;
          rightPointer.current = null;
          touchRuntime.shooting = false;
          touchRuntime.aimActive = false;
          if (rightKnobRef.current) rightKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
        onPointerCancel={() => {
          rightPointer.current = null;
          touchRuntime.shooting = false;
          touchRuntime.aimActive = false;
          if (rightKnobRef.current) rightKnobRef.current.style.transform = "translate3d(0, 0, 0)";
        }}
      >
        <div ref={rightKnobRef} className="touch-knob touch-knob-fire"><Crosshair size={24} /></div>
      </div>
    </div>
  );
}
