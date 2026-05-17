import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { ENEMY_CONFIG, EnemySubType, SkinId } from "./types";
import { getSkinDefinition } from "./loadout";
import { playerRuntime } from "./gameRuntime";

function cloneScene(scene: THREE.Object3D) {
  return SkeletonUtils.clone(scene) as THREE.Object3D;
}

function prepModel(root: THREE.Object3D) {
  root.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const material = mesh.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) material.forEach(m => { m.needsUpdate = true; });
    else if (material) material.needsUpdate = true;
  });
}

function prepEnvironmentModel(root: THREE.Object3D, tint?: string) {
  const tintColor = tint ? new THREE.Color(tint) : null;
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
      if (tintColor && material.color) {
        const luminance = material.color.r * 0.2126 + material.color.g * 0.7152 + material.color.b * 0.0722;
        if (luminance < 0.08) material.color.copy(tintColor);
        else material.color.lerp(tintColor, 0.34);
      }
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

interface CharacterAssetModelProps {
  skinId: SkinId;
  preview?: boolean;
  rotatePreview?: boolean;
}

export function CharacterAssetModel({ skinId, preview = false, rotatePreview = false }: CharacterAssetModelProps) {
  const skin = getSkinDefinition(skinId);
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
  const fbx = useFBX(cfg.assetPath ?? "/assets/enemies/Skeleton.fbx");
  const scene = useMemo(() => cloneScene(fbx), [fbx, cfg.assetPath]);
  const { actions, names } = useAnimations((fbx as THREE.Group & { animations?: THREE.AnimationClip[] }).animations ?? [], groupRef);

  useEffect(() => {
    prepModel(scene);
  }, [scene]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const actionName = findActionName(names, ["walk", "run", "idle", "attack"]);
    playAction(actions, currentAction, actionName);
    if (names.length === 0) group.rotation.y += Math.sin(Date.now() * 0.002) * delta * 0.08;
  });

  return (
    <group
      ref={groupRef}
      position={[0, cfg.modelYOffset ?? -1.1, 0]}
      scale={cfg.modelScale ?? 0.01}
      rotation={[0, 0, 0]}
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
    prepEnvironmentModel(scene, tint);
  }, [scene, tint]);

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
    prepEnvironmentModel(scene, tint);
  }, [scene, tint]);

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
