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
import MapHazards from "./MapHazards";
import CameraRig from "./CameraRig";
import CoinItem from "./CoinItem";
import FloatingText from "./FloatingText";
import ScenePostEffects from "./ScenePostEffects";
import { useGameStore } from "./useGameStore";
import { getMapDefinition } from "./mapDefinitions";
import { BIOME_THEMES } from "./worldTheme";
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
  fillLights: boolean;
  shadowMapSize: [number, number];
  contactShadowResolution: number;
  impactBurstLimit: number;
  floatingTextLimit: number;
  performanceMin: number;
  toneMappingExposure: number;
  worldQuality: QualityLevel;
  postProcessing: boolean;
  shadowBias: number;
  shadowNormalBias: number;
};

function detectMobileLikeViewport() {
  if (typeof window === "undefined") return false;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const anyCoarsePointer = window.matchMedia("(any-pointer: coarse)").matches;
  const touchPoints = navigator.maxTouchPoints ?? 0;
  const screenWidth = window.screen?.width ?? window.innerWidth;
  const screenHeight = window.screen?.height ?? window.innerHeight;
  const handheldScreen = Math.min(screenWidth, screenHeight) <= 1180;
  return coarsePointer || (handheldScreen && (anyCoarsePointer || touchPoints > 1));
}

function resolveWorldQuality(quality: QualityLevel, mobileLike: boolean, renderTier: number): QualityLevel {
  void mobileLike;
  void renderTier;
  return quality;
}

function getSceneProfile(quality: QualityLevel, mobileLike: boolean, renderTier: number): SceneProfile {
  const mobileDprScale = mobileLike ? (renderTier === 0 ? 1 : renderTier === 1 ? 0.84 : 0.7) : 1;
  const worldQuality = resolveWorldQuality(quality, mobileLike, renderTier);
  const postProcessing = false;

  return {
    dpr: mobileLike ? [Math.max(0.72, 0.9 * mobileDprScale), Math.max(0.9, 1.06 * mobileDprScale)] : [1, 1.24],
    antialias: !mobileLike && !postProcessing,
    powerPreference: mobileLike ? "default" : "high-performance",
    shadows: mobileLike ? renderTier === 0 : renderTier < 1,
    contactShadows: false,
    fillLights: !mobileLike && renderTier === 0,
    shadowMapSize: mobileLike ? [768, 768] : renderTier === 0 ? [1536, 1536] : [1024, 1024],
    contactShadowResolution: mobileLike ? 256 : 384,
    impactBurstLimit: mobileLike ? (renderTier === 0 ? 14 : renderTier === 1 ? 10 : 6) : 32,
    floatingTextLimit: mobileLike ? (renderTier === 0 ? 12 : renderTier === 1 ? 9 : 6) : 28,
    performanceMin: mobileLike ? 0.42 : 0.58,
    toneMappingExposure: mobileLike ? (renderTier >= 2 ? 0.98 : 1) : 1.04,
    worldQuality,
    postProcessing,
    shadowBias: -0.00014,
    shadowNormalBias: 0.048,
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

function SceneLoadingFallback() {
  return (
  <>
    <color attach="background" args={["#102822"]} />
    <ambientLight intensity={0.55} />
    <mesh position={[0, 1.2, 0]}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial color="#4f8852" emissive="#2d5a3d" emissiveIntensity={0.35} />
    </mesh>
  </>
  );
}

function SceneColorGrade({ exposure }: { exposure: number }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

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
  const mapId = useGameStore(s => s.mapId);
  const map = getMapDefinition(mapId);
  const theme = BIOME_THEMES[map.biome];
  const closedRuins = mapId === "ruins_path";
  const inRun = phase === "playing" || phase === "paused" || phase === "upgrade";
  const sceneQuality = profile.worldQuality;
  const fogNear = closedRuins ? Math.max(48, theme.fogNear - 18) : theme.fogNear;
  const fogFar = closedRuins ? Math.min(210, theme.fogFar - 28) : theme.fogFar;
  const visibleImpactBursts = impactBursts.slice(-profile.impactBurstLimit);
  const visibleFloatingTexts = floatingTexts.slice(-profile.floatingTextLimit);

  return (
    <>
      <SceneColorGrade exposure={profile.toneMappingExposure * theme.exposure} />
      <ambientLight
        intensity={sceneQuality === "low" ? theme.ambientIntensity + 0.16 : theme.ambientIntensity + (closedRuins ? 0.06 : 0)}
        color={closedRuins ? "#e8efe0" : "#efe6d6"}
      />
      <directionalLight
        position={closedRuins ? [10, 26, 16] : [16, 28, 12]}
        intensity={sceneQuality === "low" ? (closedRuins ? 1.72 : 1.55) : (closedRuins ? 2.72 : 2.45)}
        castShadow={profile.shadows}
        shadow-mapSize={profile.shadowMapSize}
        shadow-bias={profile.shadowBias}
        shadow-normalBias={profile.shadowNormalBias}
        shadow-camera-near={4}
        shadow-camera-far={closedRuins ? 190 : 245}
        shadow-camera-left={closedRuins ? -96 : -138}
        shadow-camera-right={closedRuins ? 96 : 138}
        shadow-camera-top={closedRuins ? 118 : 138}
        shadow-camera-bottom={closedRuins ? -118 : -138}
        color={theme.keyLight}
      />
      {sceneQuality !== "low" && profile.fillLights && (
        <>
          <directionalLight position={[-18, 11, -24]} intensity={closedRuins ? 0.82 : 0.68} color={theme.rimLight} />
          <directionalLight position={[0, 8, -28]} intensity={closedRuins ? 0.34 : 0} color={theme.accentSoft} />
          <hemisphereLight args={[closedRuins ? "#d9f6ff" : "#d8f4ff", theme.hemiGround, theme.hemiIntensity + (closedRuins ? 0.08 : 0)]} />
        </>
      )}

      <fog attach="fog" args={[theme.fog, fogNear, fogFar]} />
      <color attach="background" args={[theme.sky]} />

      <Arena qualityOverride={profile.worldQuality} />
      {profile.contactShadows && (
        <ContactShadows
          position={[0, 0.045, 0]}
          opacity={closedRuins ? (sceneQuality === "high" ? 0.4 : 0.32) : sceneQuality === "high" ? 0.34 : 0.26}
          scale={240}
          blur={3.4}
          far={18}
          resolution={profile.contactShadowResolution}
          color={theme.baseDark}
        />
      )}

      {inRun && (
        <>
          <Player />
          <MapHazards />
          {drugs.map(d => <DrugItem key={d.id} drug={d} />)}
          {poisons.map(p => {
            const assetModelAllowed = Boolean(p.assetPath);
            return (
              <PoisonItem
                key={p.id}
                poison={p}
                renderQuality={profile.worldQuality}
                assetModelAllowed={assetModelAllowed}
              />
            );
          })}
          {coins.map(c => <CoinItem key={c.id} coin={c} />)}
          {projectiles.map(p => <Projectile key={p.id} projectile={p} renderQuality={profile.worldQuality} />)}
          {enemyProjectiles.map(p => <EnemyProjectile key={p.id} projectile={p} renderQuality={profile.worldQuality} />)}
          {meleeSwings.map(m => <MeleeEffect key={m.id} swing={m} />)}
          {visibleImpactBursts.map(b => <ImpactEffect key={b.id} burst={b} />)}
          {visibleFloatingTexts.map(t => <FloatingText key={t.id} item={t} />)}
        </>
      )}

      <CameraRig />

      <ScenePostEffects enabled={profile.postProcessing} ruins={closedRuins} quality={sceneQuality} />
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
    const pointerMedia = window.matchMedia("(pointer: coarse)");
    const anyPointerMedia = window.matchMedia("(any-pointer: coarse)");
    const syncViewport = () => setMobileLike(detectMobileLikeViewport());
    syncViewport();
    if (pointerMedia.addEventListener) {
      pointerMedia.addEventListener("change", syncViewport);
      anyPointerMedia.addEventListener("change", syncViewport);
    } else {
      pointerMedia.addListener(syncViewport);
      anyPointerMedia.addListener(syncViewport);
    }
    return () => {
      if (pointerMedia.removeEventListener) {
        pointerMedia.removeEventListener("change", syncViewport);
        anyPointerMedia.removeEventListener("change", syncViewport);
      } else {
        pointerMedia.removeListener(syncViewport);
        anyPointerMedia.removeListener(syncViewport);
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
        gl={{ antialias: profile.antialias, stencil: profile.postProcessing, powerPreference: profile.powerPreference }}
        style={{ width: "100vw", height: "100vh" }}
        camera={{ fov: 58, near: 0.1, far: 300, position: [0, 10, 12] }}
        onCreated={({ gl }) => {
          if (!gl.getContext()) setWebglFailed(true);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = profile.toneMappingExposure;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.shadowMap.enabled = true;
          gl.setClearColor("#143027");
        }}
      >
        <Suspense fallback={<SceneLoadingFallback />}>
          <AdaptiveFrameBudget mobileLike={mobileLike} onTierChange={setRenderTier} />
          <SceneContent profile={profile} />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}
