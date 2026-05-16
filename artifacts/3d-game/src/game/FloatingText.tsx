import { memo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FloatingText as FloatingTextType } from "./types";

interface Props {
  item: FloatingTextType;
}

function FloatingText({ item }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const elapsed = Date.now() - item.createdAt;
    const t = Math.min(1, elapsed / item.duration);
    group.position.y = item.position[1] + t * 1.15;
    group.scale.setScalar(1 + t * 0.12);
  });

  return (
    <group ref={groupRef} position={item.position}>
      <Html center distanceFactor={16} className="floating-text-wrap">
        <div className="floating-text" style={{ color: item.color }}>
          {item.text}
        </div>
      </Html>
    </group>
  );
}

export default memo(FloatingText);
