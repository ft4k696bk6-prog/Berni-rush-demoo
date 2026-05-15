import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DrugItem as MushroomItemType, DRUG_CONFIG } from "./types";

interface Props { drug: MushroomItemType; }

export default function DrugItem({ drug }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const cfg = DRUG_CONFIG[drug.type];
  const col = cfg.color;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta * 1.6;
    groupRef.current.position.y = drug.position[1] + Math.sin(t.current) * 0.3;
    groupRef.current.rotation.y += delta * 1.2;
  });

  if (drug.collected) return null;

  const renderMushroom = () => {
    switch (drug.type) {
      case "speed":
        // Mario red/white spotted mushroom
        return (
          <group>
            {/* Stem */}
            <mesh position={[0, -0.28, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.56, 10]} />
              <meshLambertMaterial color="#f5e0c8" />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.52, 12, 10]} />
              <meshLambertMaterial color="#dd1111" />
            </mesh>
            {/* White spots */}
            {[[0.24, 0.42, 0.35], [-0.24, 0.42, 0.35], [0, 0.6, 0.2], [0.35, 0.25, 0.2], [-0.35, 0.25, 0.2]].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshLambertMaterial color="#ffffff" />
              </mesh>
            ))}
            {/* Eyes on stem */}
            <mesh position={[0.1, -0.16, 0.23]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
            <mesh position={[-0.1, -0.16, 0.23]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
          </group>
        );

      case "heal":
        // Green 1-Up mushroom
        return (
          <group>
            <mesh position={[0, -0.28, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.56, 10]} />
              <meshLambertMaterial color="#f5e0c8" />
            </mesh>
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.52, 12, 10]} />
              <meshLambertMaterial color="#11bb11" />
            </mesh>
            {/* White spots */}
            {[[0.24, 0.42, 0.35], [-0.24, 0.42, 0.35], [0, 0.6, 0.18], [0.35, 0.22, 0.2], [-0.35, 0.22, 0.2]].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.1, 6, 6]} />
                <meshLambertMaterial color="#ffffff" />
              </mesh>
            ))}
            {/* "1-UP" eyes */}
            <mesh position={[0.1, -0.16, 0.23]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
            <mesh position={[-0.1, -0.16, 0.23]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
            {/* Heart on cap */}
            <mesh position={[0, 0.28, 0.4]}>
              <boxGeometry args={[0.18, 0.18, 0.04]} />
              <meshStandardMaterial color="#ff4488" emissive="#ff4488" emissiveIntensity={1} />
            </mesh>
          </group>
        );

      case "invincibility":
        // Glowing gold star mushroom
        return (
          <group>
            <mesh position={[0, -0.28, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.56, 10]} />
              <meshLambertMaterial color="#f5e0c8" />
            </mesh>
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.52, 12, 10]} />
              <meshStandardMaterial color="#ffdd00" emissive="#ffaa00" emissiveIntensity={0.8} roughness={0.2} metalness={0.3} />
            </mesh>
            {/* Star points on cap */}
            {[0, 72, 144, 216, 288].map((deg, i) => {
              const a = (deg * Math.PI) / 180;
              return (
                <mesh key={i} position={[Math.sin(a) * 0.42, 0.3, Math.cos(a) * 0.42]}>
                  <boxGeometry args={[0.14, 0.14, 0.14]} />
                  <meshStandardMaterial color="#ffee55" emissive="#ffcc00" emissiveIntensity={1.5} />
                </mesh>
              );
            })}
          </group>
        );

      case "strength":
        // Orange power mushroom (chunky and mean-looking)
        return (
          <group>
            <mesh position={[0, -0.3, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.32, 0.6, 10]} />
              <meshLambertMaterial color="#f5d0a0" />
            </mesh>
            <mesh position={[0, 0.25, 0]} castShadow>
              <sphereGeometry args={[0.58, 12, 10]} />
              <meshLambertMaterial color="#ff6600" />
            </mesh>
            {/* Angry eyebrows */}
            <mesh position={[0.16, 0.0, 0.27]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.22, 0.07, 0.06]} />
              <meshLambertMaterial color="#1a0000" />
            </mesh>
            <mesh position={[-0.16, 0.0, 0.27]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.22, 0.07, 0.06]} />
              <meshLambertMaterial color="#1a0000" />
            </mesh>
            <mesh position={[0.12, -0.08, 0.28]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
            <mesh position={[-0.12, -0.08, 0.28]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshLambertMaterial color="#222222" />
            </mesh>
          </group>
        );

      case "flight":
        // Purple cloud mushroom with wings
        return (
          <group>
            <mesh position={[0, -0.28, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.24, 0.52, 10]} />
              <meshLambertMaterial color="#f5e0c8" />
            </mesh>
            <mesh position={[0, 0.16, 0]} castShadow>
              <sphereGeometry args={[0.5, 12, 10]} />
              <meshLambertMaterial color="#bb66ff" />
            </mesh>
            {/* Wings */}
            <mesh position={[0.6, 0.18, 0]} rotation={[0, 0, 0.25]}>
              <boxGeometry args={[0.5, 0.1, 0.32]} />
              <meshStandardMaterial color="#ddaaff" emissive="#aa66ff" emissiveIntensity={0.5} transparent opacity={0.85} />
            </mesh>
            <mesh position={[-0.6, 0.18, 0]} rotation={[0, 0, -0.25]}>
              <boxGeometry args={[0.5, 0.1, 0.32]} />
              <meshStandardMaterial color="#ddaaff" emissive="#aa66ff" emissiveIntensity={0.5} transparent opacity={0.85} />
            </mesh>
            {/* Cloud puffs on cap */}
            {[[0.3, 0.42, 0.25], [-0.3, 0.42, 0.25], [0, 0.58, 0.1]].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.14, 6, 6]} />
                <meshLambertMaterial color="#eeaaff" />
              </mesh>
            ))}
          </group>
        );

      case "time_slow":
        // Teal/cyan mushroom with clock hands
        return (
          <group>
            <mesh position={[0, -0.28, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.56, 10]} />
              <meshLambertMaterial color="#f5e0c8" />
            </mesh>
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.52, 12, 10]} />
              <meshLambertMaterial color="#00bb88" />
            </mesh>
            {/* Clock face */}
            <mesh position={[0, 0.18, 0.5]}>
              <circleGeometry args={[0.28, 16]} />
              <meshLambertMaterial color="#aaffee" side={THREE.DoubleSide} />
            </mesh>
            {/* Clock hands */}
            <mesh position={[0, 0.28, 0.51]} rotation={[0, 0, t.current * 0.5]}>
              <boxGeometry args={[0.04, 0.2, 0.02]} />
              <meshLambertMaterial color="#003322" />
            </mesh>
            <mesh position={[0, 0.22, 0.51]} rotation={[0, 0, -t.current * 1.5]}>
              <boxGeometry args={[0.04, 0.14, 0.02]} />
              <meshLambertMaterial color="#001a11" />
            </mesh>
          </group>
        );

      case "triple_shot":
        // Pink mushroom with 3 bullet-tip spots
        return (
          <group>
            <mesh position={[0, -0.28, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.56, 10]} />
              <meshLambertMaterial color="#f5e0c8" />
            </mesh>
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.52, 12, 10]} />
              <meshLambertMaterial color="#ff4488" />
            </mesh>
            {/* Three bullet/orb tips */}
            {[[-0.28, 0.55, 0.2], [0, 0.65, 0.1], [0.28, 0.55, 0.2]].map(([x, y, z], i) => (
              <group key={i} position={[x, y, z]}>
                <mesh>
                  <sphereGeometry args={[0.12, 8, 8]} />
                  <meshStandardMaterial color="#ffdd00" emissive="#ff8800" emissiveIntensity={2} />
                </mesh>
                <pointLight color="#ff8800" intensity={1} distance={1.5} />
              </group>
            ))}
            {/* Eyes */}
            <mesh position={[0.1, -0.08, 0.25]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshLambertMaterial color="#330011" />
            </mesh>
            <mesh position={[-0.1, -0.08, 0.25]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshLambertMaterial color="#330011" />
            </mesh>
          </group>
        );

      case "melee_360":
        // Dark menacing mushroom with spiral
        return (
          <group>
            <mesh position={[0, -0.3, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.28, 0.58, 10]} />
              <meshLambertMaterial color="#1a0a00" />
            </mesh>
            <mesh position={[0, 0.2, 0]} castShadow>
              <sphereGeometry args={[0.54, 12, 10]} />
              <meshStandardMaterial color="#331100" emissive="#ff6600" emissiveIntensity={0.3} roughness={0.3} />
            </mesh>
            {/* Skull detail */}
            <mesh position={[0, 0.2, 0.45]}>
              <sphereGeometry args={[0.26, 8, 8]} />
              <meshStandardMaterial color="#cc8844" roughness={0.4} />
            </mesh>
            <mesh position={[0.1, 0.24, 0.69]}>
              <boxGeometry args={[0.1, 0.08, 0.06]} />
              <meshLambertMaterial color="#111111" />
            </mesh>
            <mesh position={[-0.1, 0.24, 0.69]}>
              <boxGeometry args={[0.1, 0.08, 0.06]} />
              <meshLambertMaterial color="#111111" />
            </mesh>
            <mesh position={[0, 0.09, 0.69]}>
              <boxGeometry args={[0.16, 0.07, 0.06]} />
              <meshLambertMaterial color="#111111" />
            </mesh>
            {/* Orbit ring */}
            <mesh rotation={[Math.PI / 4, t.current, 0]}>
              <torusGeometry args={[0.7, 0.04, 6, 24]} />
              <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.5} />
            </mesh>
            <mesh rotation={[-Math.PI / 4, -t.current * 0.7, 0]}>
              <torusGeometry args={[0.65, 0.04, 6, 24]} />
              <meshStandardMaterial color="#ff2200" emissive="#ff0000" emissiveIntensity={1.5} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} position={[drug.position[0], drug.position[1], drug.position[2]]}>
      <pointLight color={col} intensity={2} distance={5} />
      {renderMushroom()}
      {/* Pickup ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.04, 6, 24]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}
