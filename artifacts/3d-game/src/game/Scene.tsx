import { Canvas } from "@react-three/fiber";
import { ContactShadows, KeyboardControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
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

type SceneProfile = {
  dpr: number | [number, number];
  antialias: boolean;
  powerPreference: WebGLPowerPreference;
  shadowMapSize: [number, number];
  contactShadowResolution: number;
  performanceMin: number;
  toneMappingExposure: number;
};

function detectMobileLikeViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || Math.min(window.innerWidth, window.innerHeight) <= 900;
}

function getSceneProfile(quality: "low" | "medium" | "high", mobileLike: boolean): SceneProfile {
  if (quality === "low") {
    return {
      dpr: mobileLike ? 0.9 : 1,
      antialias: false,
      powerPreference: mobileLike ? "default" : "high-performance",
      shadowMapSize: [1024, 1024],
      contactShadowResolution: 384,
      performanceMin: mobileLike ? 0.48 : 0.62,
      toneMappingExposure: 0.97,
    };
  }

  if (quality === "high") {
    return {
      dpr: mobileLike ? [1, 1.35] : [1.15, 2.25],
      antialias: !mobileLike,
      powerPreference: mobileLike ? "default" : "high-performance",
      shadowMapSize: mobileLike ? [2048, 2048] : [4096, 4096],
      contactShadowResolution: mobileLike ? 512 : 1024,
      performanceMin: mobileLike ? 0.5 : 0.65,
      toneMappingExposure: mobileLike ? 1 : 1.02,
    };
  }

  return {
    dpr: mobileLike ? [0.95, 1.2] : [1, 1.7],
    antialias: !mobileLike,
    powerPreference: mobileLike ? "default" : "high-performance",
    shadowMapSize: mobileLike ? [1536, 1536] : [2048, 2048],
    contactShadowResolution: mobileLike ? 448 : 512,
    performanceMin: mobileLike ? 0.5 : 0.65,
    toneMappingExposure: 0.98,
  };
}

function SceneContent({ shadowMapSize, contactShadowResolution }: { shadowMapSize: [number, number]; contactShadowResolution: number }) {
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
      <ambientLight intensity={quality === "low" ? 0.58 : 0.5} color="#f0ead8" />
      <directionalLight
        position={[14, 26, 16]}
        intensity={quality === "low" ? 1.75 : 2.65}
        castShadow={quality !== "low"}
        shadow-mapSize={shadowMapSize}
        shadow-camera-far={170}
        shadow-camera-left={-88}
        shadow-camera-right={88}
        shadow-camera-top={88}
        shadow-camera-bottom={-88}
        color="#ffe1a8"
      />
      {quality !== "low" && <hemisphereLight args={["#d8f4ff", theme.hemiGround, 0.52]} />}

      <fog attach="fog" args={[theme.fog, 72, 190]} />
      <color attach="background" args={[theme.sky]} />

      <Arena />
      {quality !== "low" && (
        <ContactShadows
          position={[0, 0.045, 0]}
          opacity={0.5}
          scale={160}
          blur={2.25}
          far={18}
          resolution={contactShadowResolution}
          color={theme.baseDark}
        />
      )}

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
  const [mobileLike, setMobileLike] = useState(() => detectMobileLikeViewport());
  const quality = useGameStore(s => s.quality);
  const profile = useMemo(() => getSceneProfile(quality, mobileLike), [quality, mobileLike]);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const syncViewport = () => setMobileLike(detectMobileLikeViewport());
    syncViewport();
    window.addEventListener("resize", syncViewport);
    if (media.addEventListener) {
      media.addEventListener("change", syncViewport);
    } else {
      media.addListener(syncViewport);
    }
    return () => {
      window.removeEventListener("resize", syncViewport);
      if (media.removeEventListener) {
        media.removeEventListener("change", syncViewport);
      } else {
        media.removeListener(syncViewport);
      }
    };
  }, []);

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
        dpr={profile.dpr}
        frameloop="always"
        performance={{ min: profile.performanceMin }}
        gl={{ antialias: profile.antialias, powerPreference: profile.powerPreference }}
        style={{ width: "100vw", height: "100vh" }}
        camera={{ fov: 58, near: 0.1, far: 220, position: [0, 10, 12] }}
        onCreated={({ gl }) => {
          if (!gl.getContext()) setWebglFailed(true);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = profile.toneMappingExposure;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.setClearColor("#143027");
        }}
      >
        <Suspense fallback={null}>
          <SceneContent shadowMapSize={profile.shadowMapSize} contactShadowResolution={profile.contactShadowResolution} />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
