import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { ClassId, ENEMY_CONFIG, EnemySubType, SkinId } from "./types";
import { getClassDefinition, getSkinDefinition } from "./loadout";
import { playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

function cloneScene(scene: THREE.Object3D) {
  return SkeletonUtils.clone(scene) as THREE.Object3D;
}

function prepModel(root: THREE.Object3D) {
  root.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const materials = sourceMaterials.map(source => {
      const base = source as THREE.MeshStandardMaterial;
      const material = base?.isMeshStandardMaterial
        ? base.clone()
        : new THREE.MeshStandardMaterial({ color: base?.color ?? "#d9c4a3" });
      material.roughness = Math.max(material.roughness ?? 0.54, 0.5);
      material.metalness = Math.min(material.metalness ?? 0.04, 0.18);
      material.envMapIntensity = 0.46;
      material.color?.lerp(new THREE.Color("#fff0d4"), 0.035);
      material.needsUpdate = true;
      return material;
    });
    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
  });
}

function prepEnvironmentModel(root: THREE.Object3D, tint?: string, assetPath = "") {
  const tintColor = tint ? new THREE.Color(tint) : null;
  const warmProp = /Lantern|Torch|Banner|Vine|Candle/i.test(assetPath);
  root.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (mesh.geometry) {
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }

    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const materials = sourceMaterials.map(source => {
      const base = source as THREE.MeshStandardMaterial;
      const material = base?.isMeshStandardMaterial
        ? base.clone()
        : new THREE.MeshStandardMaterial({ color: base?.color ?? "#7f826f" });
      material.roughness = Math.max(material.roughness ?? 0.74, 0.78);
      material.metalness = Math.min(material.metalness ?? 0.02, 0.08);
      material.envMapIntensity = 0.35;
      if (tintColor && material.color) {
        const luminance = material.color.r * 0.2126 + material.color.g * 0.7152 + material.color.b * 0.0722;
        if (luminance < 0.08) material.color.copy(tintColor);
        else material.color.lerp(tintColor, 0.34);
      }
      if (warmProp) {
        const glow = new THREE.Color("#ffcf73");
        material.emissive.copy(glow);
        material.emissiveIntensity = /Lantern|Torch/i.test(assetPath) ? 0.42 : 0.14;
      }
      material.color?.lerp(new THREE.Color("#fff4df"), 0.035);
      material.needsUpdate = true;
      return material;
    });
    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
  });
}

function prepEnemyModel(root: THREE.Object3D, tint: string) {
  const tintColor = new THREE.Color(tint);
  root.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (mesh.geometry) {
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }

    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const materials = sourceMaterials.map(source => {
      const base = source as THREE.MeshStandardMaterial & { map?: THREE.Texture | null };
      const material = base?.isMeshStandardMaterial
        ? base.clone()
        : new THREE.MeshStandardMaterial({ color: base?.color ?? tintColor });
      material.roughness = Math.max(material.roughness ?? 0.48, 0.42);
      material.metalness = Math.min(material.metalness ?? 0.04, 0.18);
      const luminance = material.color.r * 0.2126 + material.color.g * 0.7152 + material.color.b * 0.0722;
      if (luminance < 0.11) material.color.copy(tintColor);
      else material.color.lerp(tintColor, 0.1);
      material.emissive.copy(tintColor).multiplyScalar(0.06);
      material.envMapIntensity = 0.42;
      material.needsUpdate = true;
      return material;
    });

    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
  });
}

function findActionName(names: string[], candidates: string[]) {
  const lower = names.map(name => [name, name.toLowerCase()] as const);
  for (const candidate of candidates) {
    const match = lower.find(([, value]) => value.includes(candidate));
    if (match) return match[0];
  }
  return names[0];
}

function playAction(actions: Record<string, THREE.AnimationAction | null>, current: MutableRefObject<string>, name?: string) {
  if (!name || current.current === name) return;
  const next = actions[name];
  if (!next) return;
  const previous = actions[current.current];
  previous?.fadeOut(0.12);
  next.reset().fadeIn(0.12).play();
  current.current = name;
}

function attackCurve(now: number, duration: number) {
  const progress = THREE.MathUtils.clamp(1 - (playerRuntime.attackAnimUntil - now) / duration, 0, 1);
  const windup = THREE.MathUtils.smoothstep(progress, 0, 0.28);
  const strike = THREE.MathUtils.smoothstep(progress, 0.24, 0.48);
  const recovery = THREE.MathUtils.smoothstep(progress, 0.48, 1);
  const recoil = Math.sin(Math.min(1, progress / 0.32) * Math.PI);
  const followThrough = Math.sin(THREE.MathUtils.clamp((progress - 0.26) / 0.48, 0, 1) * Math.PI);

  return {
    progress,
    windup: recoil * (1 - strike),
    strike: followThrough * (1 - recovery * 0.35),
    recovery,
  };
}

function enemyYawOffset(type: EnemySubType, configured = 0) {
  const airborneWasp = type === "ranged_enemy" || type === "shooter" || type === "ghost";
  if (airborneWasp) return configured - Math.PI / 2;
  return configured;
}

const CLASS_ANIMATION: Record<ClassId, {
  runScale: number;
  shootScale: number;
  slashScale: number;
  moveLean: number;
  attackLean: number;
}> = {
  knight: { runScale: 0.96, shootScale: 0.95, slashScale: 0.92, moveLean: 0.065, attackLean: 0.13 },
  ranger: { runScale: 1.12, shootScale: 1.28, slashScale: 1.08, moveLean: 0.085, attackLean: 0.08 },
  mage: { runScale: 0.92, shootScale: 0.88, slashScale: 0.9, moveLean: 0.055, attackLean: 0.07 },
  assassin: { runScale: 1.24, shootScale: 1.34, slashScale: 1.45, moveLean: 0.11, attackLean: 0.16 },
  tank: { runScale: 0.82, shootScale: 0.82, slashScale: 0.74, moveLean: 0.045, attackLean: 0.19 },
  miner: { runScale: 0.98, shootScale: 0.96, slashScale: 0.88, moveLean: 0.07, attackLean: 0.12 },
};

interface CharacterAssetModelProps {
  skinId: SkinId;
  preview?: boolean;
  rotatePreview?: boolean;
}

export function CharacterAssetModel({ skinId, preview = false, rotatePreview = false }: CharacterAssetModelProps) {
  const skin = getSkinDefinition(skinId);
  const selectedClassId = useGameStore(s => s.selectedClassId);
  const classDef = getClassDefinition(selectedClassId);
  const anim = CLASS_ANIMATION[selectedClassId];
  const groupRef = useRef<THREE.Group>(null);
  const currentAction = useRef("");
  const gltf = useGLTF(skin.prefab);
  const scene = useMemo(() => cloneScene(gltf.scene), [gltf.scene, skin.prefab]);
  const { actions, names } = useAnimations(gltf.animations, groupRef);

  useEffect(() => {
    prepModel(scene);
  }, [scene]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (rotatePreview) group.rotation.y += delta * 0.55;

    const now = Date.now();
    const speed = Math.hypot(playerRuntime.velocityX, playerRuntime.velocityZ);
    const attacking = Date.now() < playerRuntime.attackAnimUntil;
    const actionName = preview
      ? findActionName(names, ["idle"])
      : attacking
        ? findActionName(names, playerRuntime.attackAnimType === "shoot" ? ["shoot", "punch", "swordslash"] : ["swordslash", "punch", "shoot"])
        : speed > 0.7
          ? findActionName(names, ["run", "walk"])
          : findActionName(names, ["idle"]);
    playAction(actions, currentAction, actionName);
    const action = actionName ? actions[actionName] : null;
    if (action) {
      const movementRate = THREE.MathUtils.clamp(speed / 5.2, 0.72, 1.18);
      action.timeScale = preview ? 1 : attacking
        ? playerRuntime.attackAnimType === "shoot" ? anim.shootScale : anim.slashScale
        : speed > 0.7 ? anim.runScale * movementRate : 1;
    }

    if (!preview) {
      const moving = speed > 0.18;
      const forward = speed > 0.05
        ? (playerRuntime.velocityX * Math.sin(playerRuntime.angle) + playerRuntime.velocityZ * Math.cos(playerRuntime.angle)) / Math.max(0.001, speed)
        : 0;
      const side = speed > 0.05
        ? (playerRuntime.velocityX * Math.cos(playerRuntime.angle) - playerRuntime.velocityZ * Math.sin(playerRuntime.angle)) / Math.max(0.001, speed)
        : 0;
      const duration = playerRuntime.attackAnimType === "shoot" ? 300 : 560;
      const attack = attackCurve(now, duration);
      const classWeight = classDef.attackType === "heavy_cone" ? 1.18 : classDef.attackType === "dash_strike" ? 0.86 : 1;
      const walkCycle = now * (0.009 + speed * 0.0012);
      const walkWeight = THREE.MathUtils.clamp(speed / 6, 0, 1);
      const walkBob = moving && !attacking ? Math.abs(Math.sin(walkCycle)) * walkWeight * 0.024 : 0;
      const walkSway = moving && !attacking ? Math.sin(walkCycle * 0.5) * walkWeight * 0.028 : 0;
      const attackLean = (attack.windup * 0.58 - attack.strike * 1.25 + attack.recovery * 0.12) * anim.attackLean * classWeight;
      const attackLift = (attack.strike * 0.052 - attack.windup * 0.018) * (playerRuntime.attackAnimType === "slash" ? 1 : 0.45);
      const attackStep = attack.strike * (playerRuntime.attackAnimType === "shoot" ? -0.095 : -0.05) + attack.windup * 0.035;

      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, forward * anim.moveLean + attackLean, 14, delta);
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, -side * anim.moveLean * 0.72 + walkSway, 13, delta);
      group.position.y = THREE.MathUtils.damp(group.position.y, walkBob + attackLift, 16, delta);
      group.position.z = THREE.MathUtils.damp(group.position.z, attackStep, 16, delta);
    }
  });

  return (
    <group
      ref={groupRef}
      position={skin.previewOffset}
      scale={skin.previewScale * (preview ? 0.68 : 1)}
      rotation={[0, preview ? Math.PI * 0.15 : Math.PI, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}

interface EnemyAssetModelProps {
  type: EnemySubType;
}

export function EnemyAssetModel({ type }: EnemyAssetModelProps) {
  const cfg = ENEMY_CONFIG[type];
  const groupRef = useRef<THREE.Group>(null);
  const currentAction = useRef("");
  const phase = useRef(Math.random() * Math.PI * 2);
  const fbx = useFBX(cfg.assetPath ?? "/assets/enemies/Skeleton.fbx");
  const scene = useMemo(() => cloneScene(fbx), [fbx, cfg.assetPath]);
  const { actions, names } = useAnimations((fbx as THREE.Group & { animations?: THREE.AnimationClip[] }).animations ?? [], groupRef);

  useEffect(() => {
    prepEnemyModel(scene, cfg.color);
  }, [cfg.color, scene]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    phase.current += delta * Math.max(1.2, cfg.speed * 0.72);
    const actionName = findActionName(names, ["walk", "run", "idle", "attack"]);
    playAction(actions, currentAction, actionName);
    const action = actionName ? actions[actionName] : null;
    if (action) action.timeScale = type === "boss_dragon" ? 0.78 : cfg.speed > 4.4 ? 1.16 : cfg.speed < 2.4 ? 0.72 : 0.94;
    const airborne = type === "ranged_enemy" || type === "shooter" || type === "ghost";
    const bob = airborne
      ? Math.sin(phase.current * 1.7) * 0.075
      : Math.abs(Math.sin(phase.current * 0.95)) * (type === "tank_enemy" || type === "brute" ? 0.014 : 0.025);
    group.position.y = THREE.MathUtils.damp(group.position.y, bob, 9, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, airborne ? Math.sin(phase.current * 1.25) * 0.035 : type === "tank_enemy" || type === "boss_dragon" ? 0.018 : Math.sin(phase.current * 0.72) * 0.014, 9, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, airborne ? Math.sin(phase.current * 2.1) * 0.055 : 0, 9, delta);
  });

  return (
    <group
      ref={groupRef}
      position={[0, cfg.modelYOffset ?? -1.1, 0]}
      scale={cfg.modelScale ?? 0.01}
      rotation={[0, enemyYawOffset(type, cfg.modelYawOffset), 0]}
    >
      <primitive object={scene} />
    </group>
  );
}

interface EnvironmentAssetModelProps {
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  tint?: string;
}

function EnvironmentFBXModel({ path, position, rotation = [0, 0, 0], scale = 1, tint }: EnvironmentAssetModelProps) {
  const fbx = useFBX(path);
  const scene = useMemo(() => cloneScene(fbx), [fbx, path]);

  useEffect(() => {
    prepEnvironmentModel(scene, tint, path);
  }, [scene, tint, path]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function EnvironmentGLBModel({ path, position, rotation = [0, 0, 0], scale = 1, tint }: EnvironmentAssetModelProps) {
  const gltf = useGLTF(path);
  const scene = useMemo(() => cloneScene(gltf.scene), [gltf.scene, path]);

  useEffect(() => {
    prepEnvironmentModel(scene, tint, path);
  }, [scene, tint, path]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

export function EnvironmentAssetModel(props: EnvironmentAssetModelProps) {
  if (props.path.endsWith(".glb") || props.path.endsWith(".gltf")) return <EnvironmentGLBModel {...props} />;
  return <EnvironmentFBXModel {...props} />;
}

export function preloadEnvironmentAsset(path: string) {
  if (path.endsWith(".glb") || path.endsWith(".gltf")) {
    useGLTF.preload(path);
    return;
  }
  useFBX.preload(path);
}

Array.from(new Set(Object.values(ENEMY_CONFIG).map(cfg => cfg.assetPath).filter(Boolean))).forEach(path => {
  if (path) useFBX.preload(path);
});
