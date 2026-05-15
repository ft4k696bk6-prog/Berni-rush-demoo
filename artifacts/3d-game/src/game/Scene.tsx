import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Suspense, useState } from "react";
import Arena from "./Arena";
import Player from "./Player";
import DrugItem from "./DrugItem";
import PoisonItem from "./PoisonItem";
import Projectile from "./Projectile";
import EnemyProjectile from "./EnemyProjectile";
import MeleeEffect from "./MeleeEffect";
import CameraRig from "./CameraRig";
import { useGameStore } from "./useGameStore";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
  melee = "melee",
}

const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back,    keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left,    keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right,   keys: ["ArrowRight", "KeyD"] },
  { name: Controls.jump,    keys: ["Space"] },
  { name: Controls.melee,   keys: ["Enter"] },
];

function SceneContent() {
  const { drugs, poisons, projectiles, enemyProjectiles, meleeSwings, phase } = useGameStore();

  return (
    <>
      {/* Bright daylight for Minecraft look */}
      <ambientLight intensity={0.7} color="#e8f4e8" />
      <directionalLight
        position={[15, 30, 20]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        color="#fffde8"
      />
      <directionalLight position={[-10, 15, -10]} intensity={0.35} color="#aaddff" />
      {/* Sky hemisphere */}
      <hemisphereLight args={["#87ceeb", "#3a7d3a", 0.5]} />

      {/* Sky color (fog) */}
      <fog attach="fog" args={["#7ec8e3", 35, 85]} />
      <color attach="background" args={["#87ceeb"]} />

      <Arena />

      {phase === "playing" && (
        <>
          <Player />
          {drugs.map(d => <DrugItem key={d.id} drug={d} />)}
          {poisons.map(p => <PoisonItem key={p.id} poison={p} />)}
          {projectiles.map(p => <Projectile key={p.id} projectile={p} />)}
          {enemyProjectiles.map(p => <EnemyProjectile key={p.id} projectile={p} />)}
          {meleeSwings.map(m => <MeleeEffect key={m.id} swing={m} />)}
        </>
      )}

      <CameraRig />
    </>
  );
}

export default function Scene() {
  const [webglFailed, setWebglFailed] = useState(false);

  if (webglFailed) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#1a3d1a", color: "#88ff88",
        fontFamily: "monospace", textAlign: "center", padding: 40,
      }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <div style={{ fontSize: 20, marginBottom: 8 }}>WebGL Not Available</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Please open in Chrome or Firefox on a desktop.
          </div>
        </div>
      </div>
    );
  }

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        style={{ width: "100vw", height: "100vh" }}
        camera={{ fov: 58, near: 0.1, far: 150, position: [0, 20, 16] }}
        onCreated={({ gl }) => {
          if (!gl.getContext()) setWebglFailed(true);
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
