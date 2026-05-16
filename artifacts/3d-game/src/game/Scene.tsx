import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import Arena from "./Arena";
import Player from "./Player";
import DrugItem from "./DrugItem";
import PoisonItem from "./PoisonItem";
import Projectile from "./Projectile";
import EnemyProjectile from "./EnemyProjectile";
import MeleeEffect from "./MeleeEffect";
import CameraRig from "./CameraRig";
import CoinItem from "./CoinItem";
import FloatingText from "./FloatingText";
import { useGameStore } from "./useGameStore";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  dash = "dash",
  melee = "melee",
  power = "power",
}

const keyMap = [
  { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.dash, keys: ["Space", "ShiftLeft", "ShiftRight"] },
  { name: Controls.melee, keys: ["Enter", "KeyF"] },
  { name: Controls.power, keys: ["KeyQ", "KeyE"] },
];

function SceneContent() {
  const drugs = useGameStore(s => s.drugs);
  const poisons = useGameStore(s => s.poisons);
  const projectiles = useGameStore(s => s.projectiles);
  const enemyProjectiles = useGameStore(s => s.enemyProjectiles);
  const meleeSwings = useGameStore(s => s.meleeSwings);
  const coins = useGameStore(s => s.coinItems);
  const floatingTexts = useGameStore(s => s.floatingTexts);
  const phase = useGameStore(s => s.phase);
  const quality = useGameStore(s => s.quality);
  const inRun = phase === "playing" || phase === "paused" || phase === "upgrade";

  return (
    <>
      <ambientLight intensity={quality === "low" ? 0.75 : 0.62} color="#eaf7ff" />
      <directionalLight
        position={[18, 32, 18]}
        intensity={quality === "low" ? 1.15 : 1.55}
        castShadow={quality !== "low"}
        shadow-mapSize={quality === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-far={100}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        color="#fff7df"
      />
      {quality !== "low" && <hemisphereLight args={["#84d8ff", "#122d38", 0.52]} />}

      <fog attach="fog" args={["#123848", 48, 104]} />
      <color attach="background" args={["#0b2432"]} />

      <Arena />

      {inRun && (
        <>
          <Player />
          {drugs.map(d => <DrugItem key={d.id} drug={d} />)}
          {poisons.map(p => <PoisonItem key={p.id} poison={p} />)}
          {coins.map(c => <CoinItem key={c.id} coin={c} />)}
          {projectiles.map(p => <Projectile key={p.id} projectile={p} />)}
          {enemyProjectiles.map(p => <EnemyProjectile key={p.id} projectile={p} />)}
          {meleeSwings.map(m => <MeleeEffect key={m.id} swing={m} />)}
          {floatingTexts.map(t => <FloatingText key={t.id} item={t} />)}
        </>
      )}

      <CameraRig />
    </>
  );
}

export default function Scene() {
  const [webglFailed, setWebglFailed] = useState(false);
  const quality = useGameStore(s => s.quality);
  const dpr = useMemo<[number, number] | number>(() => {
    if (quality === "low") return 1;
    if (quality === "medium") return [1, 1.35];
    return [1, 1.75];
  }, [quality]);

  if (webglFailed) {
    return (
      <div className="webgl-fallback">
        <div>
          <div className="webgl-icon">!</div>
          <div className="webgl-title">WebGL Not Available</div>
          <div className="webgl-copy">Please open the game in a modern desktop browser.</div>
        </div>
      </div>
    );
  }

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows={quality !== "low"}
        dpr={dpr}
        frameloop="always"
        performance={{ min: 0.65 }}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        style={{ width: "100vw", height: "100vh" }}
        camera={{ fov: 54, near: 0.1, far: 150, position: [0, 22, 18] }}
        onCreated={({ gl }) => {
          if (!gl.getContext()) setWebglFailed(true);
          gl.setClearColor("#0b2432");
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
