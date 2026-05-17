import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, KeyboardControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { useCompactViewport } from "./useCompactViewport";
import type { QualityLevel } from "./types";

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
  shadows: boolean;
  contactShadows: boolean;
  shadowMapSize: [number, number];
  contactShadowResolution: number;
  performanceMin: number;
  toneMappingExposure: number;
  worldQuality: QualityLevel;
};

function detectMobileLikeViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || Math.min(window.innerWidth, window.innerHeight) <= 900;
}

function lowerQuality(quality: QualityLevel): QualityLevel {
  if (quality === "high") return "medium";
  if (quality === "medium") return "low";
  return "low";
}

function qualityAfterTier(quality: QualityLevel, renderTier: number) {
  let next = quality;
  for (let i = 0; i < renderTier; i++) next = lowerQuality(next);
  return next;
}

function getSceneProfile(quality: QualityLevel, mobileLike: boolean, renderTier: number): SceneProfile {
  const effectiveQuality = qualityAfterTier(
    mobileLike && quality === "high" ? "medium" : quality,
    Math.min(2, renderTier),
  );
  const mobileDprScale = mobileLike ? (renderTier === 0 ? 1 : renderTier === 1 ? 0.84 : 0.7) : 1;

  if (effectiveQuality === "low") {
    return {
      dpr: mobileLike ? Math.max(0.64, 0.86 * mobileDprScale) : [0.82, 1],
      antialias: false,
      powerPreference: mobileLike ? "default" : "high-performance",
      shadows: false,
      contactShadows: false,
      shadowMapSize: mobileLike ? [512, 512] : [1024, 1024],
      contactShadowResolution: mobileLike ? 192 : 384,
      performanceMin: mobileLike ? 0.38 : 0.55,
      toneMappingExposure: 0.97,
      worldQuality: "low",
    };
  }

  if (effectiveQuality === "high") {
    return {
      dpr: mobileLike ? [Math.max(0.78, 0.96 * mobileDprScale), Math.max(0.96, 1.12 * mobileDprScale)] : [1, 1.55],
      antialias: !mobileLike,
      powerPreference: mobileLike ? "default" : "high-performance",
      shadows: mobileLike ? renderTier === 0 : true,
      contactShadows: mobileLike ? false : true,
      shadowMapSize: mobileLike ? [1024, 1024] : [2048, 2048],
      contactShadowResolution: mobileLike ? 256 : 512,
      performanceMin: mobileLike ? 0.42 : 0.58,
      toneMappingExposure: mobileLike ? 1 : 1.02,
      worldQuality: "high",
    };
  }

  return {
    dpr: mobileLike ? [Math.max(0.72, 0.88 * mobileDprScale), Math.max(0.9, 1.02 * mobileDprScale)] : [0.9, 1.25],
    antialias: !mobileLike,
    powerPreference: mobileLike ? "default" : "high-performance",
    shadows: mobileLike ? renderTier === 0 : true,
    contactShadows: false,
    shadowMapSize: mobileLike ? [768, 768] : [1024, 1024],
    contactShadowResolution: mobileLike ? 224 : 512,
    performanceMin: mobileLike ? 0.42 : 0.56,
    toneMappingExposure: 0.98,
    worldQuality: "medium",
  };
}

function AdaptiveFrameBudget({ mobileLike, onTierChange }: { mobileLike: boolean; onTierChange: (tier: number) => void }) {
  const frameCount = useRef(0);
  const frameTotal = useRef(0);
  const tierRef = useRef(0);
  const { performance } = useThree();

  useEffect(() => {
    frameCount.current = 0;
    frameTotal.current = 0;
    tierRef.current = 0;
    onTierChange(0);
  }, [mobileLike, onTierChange]);

  useFrame((_, delta) => {
    frameCount.current += 1;
    frameTotal.current += Math.min(0.08, delta);
    if (frameCount.current < (mobileLike ? 90 : 120)) return;

    const fps = frameCount.current / Math.max(0.001, frameTotal.current);
    frameCount.current = 0;
    frameTotal.current = 0;
    const lowFps = mobileLike ? 36 : 46;
    const healthyFps = mobileLike ? 54 : 57;

    if (fps < lowFps && tierRef.current < 2) {
      tierRef.current += 1;
      performance.regress();
      onTierChange(tierRef.current);
    } else if (fps > healthyFps && tierRef.current > 0) {
      tierRef.current -= 1;
      onTierChange(tierRef.current);
    }
  });

  return null;
}

function SceneContent({ profile }: { profile: SceneProfile }) {
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
  const compactViewport = useCompactViewport();
  const theme = BIOME_THEMES[getBiomeForStage(stage)];
  const inRun = phase === "playing" || phase === "paused" || phase === "upgrade";
  const enemyAssetBudget = profile.worldQuality === "high" ? 8 : profile.worldQuality === "medium" ? 4 : 0;
  let enemyAssetCount = 0;

  return (
    <>
      <ambientLight intensity={quality === "low" ? 0.58 : 0.5} color="#f0ead8" />
      <directionalLight
        position={[14, 26, 16]}
        intensity={quality === "low" ? 1.75 : 2.65}
        castShadow={profile.shadows}
        shadow-mapSize={profile.shadowMapSize}
        shadow-camera-far={245}
        shadow-camera-left={-138}
        shadow-camera-right={138}
        shadow-camera-top={138}
        shadow-camera-bottom={-138}
        color="#ffe1a8"
      />
      {quality !== "low" && <hemisphereLight args={["#d8f4ff", theme.hemiGround, 0.52]} />}

      <fog attach="fog" args={[theme.fog, 86, 255]} />
      <color attach="background" args={[theme.sky]} />

      <Arena qualityOverride={profile.worldQuality} />
      {profile.contactShadows && (
        <ContactShadows
          position={[0, 0.045, 0]}
          opacity={0.5}
          scale={240}
          blur={2.25}
          far={18}
          resolution={profile.contactShadowResolution}
          color={theme.baseDark}
        />
      )}

      {inRun && (
        <>
          <Player />
          {drugs.map(d => <DrugItem key={d.id} drug={d} />)}
          {poisons.map(p => {
            const isBoss = p.type === "boss_dragon" || p.type === "boss10" || p.type === "boss20";
            const assetModelAllowed = isBoss || (!compactViewport && enemyAssetCount < enemyAssetBudget);
            if (!isBoss && assetModelAllowed) enemyAssetCount += 1;
            return (
              <PoisonItem
                key={p.id}
                poison={p}
                compactViewport={compactViewport}
                renderQuality={profile.worldQuality}
                assetModelAllowed={assetModelAllowed}
              />
            );
          })}
          {coins.map(c => <CoinItem key={c.id} coin={c} />)}
          {projectiles.map(p => <Projectile key={p.id} projectile={p} renderQuality={profile.worldQuality} />)}
          {enemyProjectiles.map(p => <EnemyProjectile key={p.id} projectile={p} renderQuality={profile.worldQuality} />)}
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
  const [renderTier, setRenderTier] = useState(0);
  const quality = useGameStore(s => s.quality);
  const profile = useMemo(() => getSceneProfile(quality, mobileLike, renderTier), [quality, mobileLike, renderTier]);

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

  useEffect(() => {
    setRenderTier(0);
  }, [quality, mobileLike]);

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
        shadows={profile.shadows}
        dpr={profile.dpr}
        frameloop="always"
        performance={{ min: profile.performanceMin }}
        gl={{ antialias: profile.antialias, powerPreference: profile.powerPreference }}
        style={{ width: "100vw", height: "100vh" }}
        camera={{ fov: 58, near: 0.1, far: 300, position: [0, 10, 12] }}
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
          <AdaptiveFrameBudget mobileLike={mobileLike} onTierChange={setRenderTier} />
          <SceneContent profile={profile} />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
