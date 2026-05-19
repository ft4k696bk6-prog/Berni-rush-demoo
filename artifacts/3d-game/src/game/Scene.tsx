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

function getSceneProfile(_quality: QualityLevel, mobileLike: boolean, renderTier: number): SceneProfile {
  const mobileDprScale = mobileLike ? (renderTier === 0 ? 1 : renderTier === 1 ? 0.84 : 0.7) : 1;

  return {
    dpr: mobileLike ? [Math.max(0.78, 0.96 * mobileDprScale), Math.max(0.96, 1.12 * mobileDprScale)] : [1, 1.35],
    antialias: !mobileLike,
    powerPreference: mobileLike ? "default" : "high-performance",
    shadows: mobileLike ? renderTier === 0 : renderTier < 2,
    contactShadows: mobileLike ? false : renderTier === 0,
    shadowMapSize: mobileLike ? [1024, 1024] : renderTier === 0 ? [1536, 1536] : [1024, 1024],
    contactShadowResolution: mobileLike ? 256 : 384,
    performanceMin: mobileLike ? 0.42 : 0.58,
    toneMappingExposure: mobileLike ? 1 : 1.02,
    worldQuality: "high",
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
  const quality = useGameStore(s => s.quality);
  const mapId = useGameStore(s => s.mapId);
  const theme = BIOME_THEMES[getMapDefinition(mapId).biome];
  const inRun = phase === "playing" || phase === "paused" || phase === "upgrade";

  return (
    <>
      <SceneColorGrade exposure={profile.toneMappingExposure * theme.exposure} />
      <ambientLight intensity={quality === "low" ? theme.ambientIntensity + 0.16 : theme.ambientIntensity} color="#efe6d6" />
      <directionalLight
        position={[16, 28, 12]}
        intensity={quality === "low" ? 1.55 : 2.45}
        castShadow={profile.shadows}
        shadow-mapSize={profile.shadowMapSize}
        shadow-camera-far={245}
        shadow-camera-left={-138}
        shadow-camera-right={138}
        shadow-camera-top={138}
        shadow-camera-bottom={-138}
        color={theme.keyLight}
      />
      {quality !== "low" && (
        <>
          <directionalLight position={[-18, 11, -24]} intensity={0.68} color={theme.rimLight} />
          <hemisphereLight args={["#d8f4ff", theme.hemiGround, theme.hemiIntensity]} />
        </>
      )}

      <fog attach="fog" args={[theme.fog, theme.fogNear, theme.fogFar]} />
      <color attach="background" args={[theme.sky]} />

      <Arena qualityOverride={profile.worldQuality} />
      {profile.contactShadows && (
        <ContactShadows
          position={[0, 0.045, 0]}
          opacity={quality === "high" ? 0.34 : 0.26}
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
