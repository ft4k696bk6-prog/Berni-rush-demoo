import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EnvironmentAssetModel } from "./AssetModels";
import { playerRuntime } from "./gameRuntime";
import { getMapDefinition, type MapHazardDefinition } from "./mapDefinitions";
import { useGameStore } from "./useGameStore";

const HOSTILE_TREE_MODEL = "/assets/quaternius/stylized-nature/gltf/TwistedTree_1.gltf";

function HostileTreeTrap({ hazard }: { hazard: MapHazardDefinition }) {
  const rootRef = useRef<THREE.Group>(null);
  const telegraphRef = useRef<THREE.Mesh>(null);
  const lashRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef<"idle" | "windup" | "strike" | "cooldown">("idle");
  const startedAtRef = useRef(0);
  const lastStrikeRef = useRef(0);

  useFrame((_, rawDelta) => {
    const root = rootRef.current;
    const telegraph = telegraphRef.current;
    const lash = lashRef.current;
    if (!root || !telegraph || !lash) return;

    const delta = Math.min(rawDelta, 1 / 30);
    const now = Date.now();
    const store = useGameStore.getState();
    if (store.phase !== "playing") {
      telegraph.visible = false;
      lash.visible = false;
      return;
    }

    const dx = playerRuntime.x - hazard.position[0];
    const dz = playerRuntime.z - hazard.position[1];
    const dist = Math.hypot(dx, dz);

    if (phaseRef.current === "idle" && dist < hazard.triggerRadius && now - lastStrikeRef.current > hazard.cooldownMs) {
      phaseRef.current = "windup";
      startedAtRef.current = now;
    }

    const elapsed = now - startedAtRef.current;
    telegraph.visible = false;
    lash.visible = false;
    root.rotation.z = THREE.MathUtils.damp(root.rotation.z, 0, 7, delta);
    root.rotation.x = THREE.MathUtils.damp(root.rotation.x, 0, 7, delta);

    if (phaseRef.current === "windup") {
      const t = Math.min(1, elapsed / hazard.windupMs);
      telegraph.visible = true;
      telegraph.scale.setScalar(0.55 + t * 0.62);
      const material = telegraph.material as THREE.MeshBasicMaterial;
      material.opacity = 0.12 + Math.sin(now * 0.024) * 0.05 + t * 0.16;
      root.rotation.z = Math.sin(now * 0.045) * 0.045 * t;
      root.rotation.x = Math.cos(now * 0.038) * 0.032 * t;
      if (elapsed >= hazard.windupMs) {
        if (dist < hazard.radius) store.damagePlayer(hazard.damage, hazard.position[0], hazard.position[1]);
        phaseRef.current = "strike";
        startedAtRef.current = now;
        lastStrikeRef.current = now;
      }
    } else if (phaseRef.current === "strike") {
      const t = Math.min(1, elapsed / 260);
      telegraph.visible = true;
      telegraph.scale.setScalar(1.18 + t * 0.18);
      (telegraph.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.34 * (1 - t));
      lash.visible = true;
      lash.scale.set(1 + t * 0.7, 1, 1 + t * 0.2);
      (lash.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 * (1 - t);
      root.rotation.x = -0.18 * (1 - t);
      if (elapsed >= 260) {
        phaseRef.current = "cooldown";
        startedAtRef.current = now;
      }
    } else if (phaseRef.current === "cooldown" && elapsed > 680) {
      phaseRef.current = "idle";
    }
  });

  return (
    <group position={[hazard.position[0], 0.05, hazard.position[1]]}>
      <group ref={rootRef} scale={hazard.scale}>
        <EnvironmentAssetModel path={HOSTILE_TREE_MODEL} position={[0, 0, 0]} rotation={[0, Math.PI * 0.14, 0]} scale={1} tint="#526245" />
      </group>
      <mesh ref={telegraphRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <circleGeometry args={[hazard.radius, 48]} />
        <meshBasicMaterial color="#ff4c35" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={lashRef} visible={false} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, Math.PI * 0.5]}>
        <boxGeometry args={[hazard.radius * 1.6, 0.24, 0.48]} />
        <meshStandardMaterial color="#6d3e22" emissive="#ff7a2f" emissiveIntensity={0.65} roughness={0.62} />
      </mesh>
    </group>
  );
}

export default function MapHazards() {
  const mapId = useGameStore(s => s.mapId);
  const hazards = getMapDefinition(mapId).hazards;
  if (hazards.length === 0) return null;
  return (
    <>
      {hazards.map(hazard => <HostileTreeTrap key={hazard.id} hazard={hazard} />)}
    </>
  );
}
