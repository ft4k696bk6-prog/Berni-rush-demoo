import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { QualityLevel } from "./types";

type ScenePostEffectsProps = {
  enabled: boolean;
  ruins: boolean;
  quality: QualityLevel;
};

export default function ScenePostEffects({ enabled, ruins, quality }: ScenePostEffectsProps) {
  if (!enabled) return null;

  const bloomIntensity = ruins
    ? quality === "high"
      ? 0.62
      : 0.48
    : quality === "high"
      ? 0.42
      : 0.32;

  return (
    <EffectComposer enableNormalPass={false} multisampling={quality === "high" ? 4 : 0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={ruins ? 0.5 : 0.58}
        luminanceSmoothing={0.32}
        mipmapBlur
        radius={0.68}
      />
      <Vignette
        offset={ruins ? 0.22 : 0.16}
        darkness={ruins ? (quality === "high" ? 0.42 : 0.34) : 0.24}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
