import { Canvas } from "@react-three/fiber";
import { ContactShadows, KeyboardControls } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import Arena from "./Arena";
import Player from "./Player";
import DrugItem from "./DrugItem";
import PoisonItem from "./PoisonItem";
import Projectile from "./Projectile";
import EnemyProjectile from "./EnemyProjectile";
import MeleeEffect from "./MeleeEffect";
import ImpactEffect from "./ImpactEffect";
import CameraRig from "./CameraRig";
import CoinItem from "./CoinItem";
import FloatingText from "./FloatingText";
import { useGameStore } from "./useGameStore";
import { BIOME_THEMES, getBiomeForStage } from "./worldTheme";

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
  const impactBursts = useGameStore(s => s.impactBursts);
  const coins = useGameStore(s => s.coinItems);
  const floatingTexts = useGameStore(s => s.floatingTexts);
  const phase = useGameStore(s => s.phase);
  const quality = useGameStore(s => s.quality);
  const stage = useGameStore(s => s.stage);
  const theme = BIOME_THEMES[getBiomeForStage(stage)];
  const inRun = phase === "playing" || phase === "paused" || phase === "upgrade";

  return (
    <>
      <ambientLight intensity={quality === "low" ? 0.48 : 0.42} color="#d9d1bd" />
      <directionalLight
        position={[16, 24, 18]}
        intensity={quality === "low" ? 1.55 : 2.35}
        castShadow={quality !== "low"}
        shadow-mapSize={quality === "high" ? [4096, 4096] : [2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        color="#ffe1a8"
      />
      {quality !== "low" && <hemisphereLight args={["#c9e3f2", theme.hemiGround, 0.42]} />}

      <fog attach="fog" args={[theme.fog, 48, 116]} />
      <color attach="background" args={[theme.sky]} />

      <Arena />
      {quality !== "low" && <ContactShadows position={[0, 0.045, 0]} opacity={0.5} scale={94} blur={2.25} far={18} resolution={quality === "high" ? 1024 : 512} color={theme.baseDark} />}

      {inRun && (
        <>
          <Player />
          {drugs.map(d => <DrugItem key={d.id} drug={d} />)}
          {poisons.map(p => <PoisonItem key={p.id} poison={p} />)}
          {coins.map(c => <CoinItem key={c.id} coin={c} />)}
          {projectiles.map(p => <Projectile key={p.id} projectile={p} />)}
          {enemyProjectiles.map(p => <EnemyProjectile key={p.id} projectile={p} />)}
          {meleeSwings.map(m => <MeleeEffect key={m.id} swing={m} />)}
          {impactBursts.map(b => <ImpactEffect key={b.id} burst={b} />)}
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
    if (quality === "medium") return [1, 1.7];
    return [1.15, 2.25];
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
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100vw", height: "100vh" }}
        camera={{ fov: 66, near: 0.1, far: 150, position: [0, 6, 10] }}
        onCreated={({ gl }) => {
          if (!gl.getContext()) setWebglFailed(true);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = quality === "high" ? 0.94 : 0.9;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.setClearColor("#143027");
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
