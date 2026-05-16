import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CoinItem as CoinItemType } from "./types";
import { playerRuntime } from "./gameRuntime";
import { useGameStore } from "./useGameStore";

interface Props {
  coin: CoinItemType;
}

function CoinItem({ coin }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(coin.position[0], coin.position[1], coin.position[2]));
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    t.current += delta * 7;
    const dx = playerRuntime.x - pos.current.x;
    const dz = playerRuntime.z - pos.current.z;
    const distSq = dx * dx + dz * dz;
    const magnetRange = 3.2 + useGameStore.getState().stats.luck * 0.08;

    if (distSq < magnetRange * magnetRange) {
      const dist = Math.max(0.001, Math.sqrt(distSq));
      const pull = Math.min(18, 8 + (magnetRange - dist) * 5);
      pos.current.x += (dx / dist) * pull * delta;
      pos.current.z += (dz / dist) * pull * delta;
    }

    if (distSq < 0.9 * 0.9) {
      useGameStore.getState().collectCoin(coin.id);
      return;
    }

    group.position.set(pos.current.x, 0.72 + Math.sin(t.current) * 0.12, pos.current.z);
    group.rotation.y += delta * 4.5;
  });

  return (
    <group ref={groupRef} position={coin.position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 18]} />
        <meshStandardMaterial color="#ffd85a" emissive="#ffb000" emissiveIntensity={0.55} metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.42, 20]} />
        <meshBasicMaterial color="#fff0a6" transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

export default memo(CoinItem);
