import type { QualityLevel } from "./types";

export type BiomeId = "ruins" | "boss_arena" | "marsh" | "crystal_arena" | "mine";

export interface BiomeTheme {
  id: BiomeId;
  label: string;
  base: string;
  baseDark: string;
  baseLight: string;
  road: string;
  roadDark: string;
  moss: string;
  stone: string;
  stoneDark: string;
  accent: string;
  accentSoft: string;
  fog: string;
  sky: string;
  hemiGround: string;
}

export const BIOME_THEMES: Record<BiomeId, BiomeTheme> = {
  ruins: {
    id: "ruins",
    label: "Overgrown Ruins",
    base: "#6f7f5e",
    baseDark: "#324c39",
    baseLight: "#9aaa77",
    road: "#8f704f",
    roadDark: "#5a452f",
    moss: "#4d754a",
    stone: "#78796f",
    stoneDark: "#525b53",
    accent: "#d1b46d",
    accentSoft: "#86b272",
    fog: "#233a33",
    sky: "#143028",
    hemiGround: "#40523b",
  },
  boss_arena: {
    id: "boss_arena",
    label: "Ancient Arena",
    base: "#716b5e",
    baseDark: "#373732",
    baseLight: "#a19070",
    road: "#9b7448",
    roadDark: "#5b432b",
    moss: "#536f48",
    stone: "#898270",
    stoneDark: "#56574e",
    accent: "#ffb85a",
    accentSoft: "#c79a5c",
    fog: "#2d322f",
    sky: "#172521",
    hemiGround: "#4f4a3c",
  },
  marsh: {
    id: "marsh",
    label: "Moonlit Marsh",
    base: "#536d5e",
    baseDark: "#263e38",
    baseLight: "#7d9272",
    road: "#6d6247",
    roadDark: "#403b2d",
    moss: "#467064",
    stone: "#69726a",
    stoneDark: "#3f514a",
    accent: "#5fffc6",
    accentSoft: "#5ca78d",
    fog: "#1f3838",
    sky: "#102928",
    hemiGround: "#314f48",
  },
  crystal_arena: {
    id: "crystal_arena",
    label: "Crystal Gate",
    base: "#686f76",
    baseDark: "#333b43",
    baseLight: "#8998a0",
    road: "#7d7060",
    roadDark: "#4a443c",
    moss: "#4f6f63",
    stone: "#808995",
    stoneDark: "#4d5862",
    accent: "#9fd7ff",
    accentSoft: "#8badd0",
    fog: "#243a46",
    sky: "#122735",
    hemiGround: "#354955",
  },
  mine: {
    id: "mine",
    label: "Old Quarry",
    base: "#5e584d",
    baseDark: "#302c29",
    baseLight: "#897d68",
    road: "#735a3f",
    roadDark: "#473525",
    moss: "#555f3f",
    stone: "#767267",
    stoneDark: "#4c4942",
    accent: "#f5b24d",
    accentSoft: "#b5844a",
    fog: "#2d2d2b",
    sky: "#161d1c",
    hemiGround: "#443f35",
  },
};

export function getBiomeForStage(stage: number): BiomeId {
  if (stage > 0 && stage % 10 === 0) return "crystal_arena";
  if (stage > 0 && stage % 5 === 0) return "boss_arena";
  const chapter = Math.floor(Math.max(0, stage - 1) / 5) % 3;
  if (chapter === 1) return "marsh";
  if (chapter === 2) return "mine";
  return "ruins";
}

export function getTextureSize(quality: QualityLevel) {
  if (quality === "high") return 4096;
  if (quality === "medium") return 2048;
  return 1024;
}
