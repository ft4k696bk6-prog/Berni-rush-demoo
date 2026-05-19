import type { QualityLevel } from "./types";

export type BiomeId = "ruins_forest" | "boss_courtyard" | "marsh" | "crystal_gate" | "mine_quarry";

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
  detailTint: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  hemiIntensity: number;
  keyLight: string;
  rimLight: string;
  exposure: number;
}

export const BIOME_THEMES: Record<BiomeId, BiomeTheme> = {
  ruins_forest: {
    id: "ruins_forest",
    label: "Elderwood Ruins",
    base: "#6f8459",
    baseDark: "#243a2f",
    baseLight: "#a7b873",
    road: "#9b7b55",
    roadDark: "#4e3a2b",
    moss: "#4f8852",
    stone: "#858373",
    stoneDark: "#555d50",
    accent: "#e2be68",
    accentSoft: "#93c271",
    fog: "#1d312d",
    sky: "#102822",
    hemiGround: "#3f5238",
    detailTint: "#8f9d72",
    fogNear: 92,
    fogFar: 275,
    ambientIntensity: 0.44,
    hemiIntensity: 0.58,
    keyLight: "#ffdca7",
    rimLight: "#9edcff",
    exposure: 1.02,
  },
  boss_courtyard: {
    id: "boss_courtyard",
    label: "Sunken Boss Courtyard",
    base: "#746d5d",
    baseDark: "#2e302d",
    baseLight: "#b49b72",
    road: "#a47748",
    roadDark: "#523b27",
    moss: "#566f45",
    stone: "#928a77",
    stoneDark: "#55574f",
    accent: "#ffb45d",
    accentSoft: "#d69a5b",
    fog: "#252d2a",
    sky: "#121f1d",
    hemiGround: "#4e4638",
    detailTint: "#a29576",
    fogNear: 78,
    fogFar: 250,
    ambientIntensity: 0.38,
    hemiIntensity: 0.5,
    keyLight: "#ffc47a",
    rimLight: "#ff7d4a",
    exposure: 1.03,
  },
  marsh: {
    id: "marsh",
    label: "Moonveil Marsh",
    base: "#526d5e",
    baseDark: "#203934",
    baseLight: "#809c73",
    road: "#706247",
    roadDark: "#403b2d",
    moss: "#3f806d",
    stone: "#68766d",
    stoneDark: "#3c544d",
    accent: "#6dffcf",
    accentSoft: "#67b79c",
    fog: "#173333",
    sky: "#0b2424",
    hemiGround: "#2d5249",
    detailTint: "#688f7a",
    fogNear: 66,
    fogFar: 230,
    ambientIntensity: 0.36,
    hemiIntensity: 0.64,
    keyLight: "#b6ffd9",
    rimLight: "#5fd7ff",
    exposure: 0.96,
  },
  crystal_gate: {
    id: "crystal_gate",
    label: "Crystal Gate",
    base: "#65707a",
    baseDark: "#2c3944",
    baseLight: "#92a8af",
    road: "#82735f",
    roadDark: "#48433b",
    moss: "#4a7468",
    stone: "#84909b",
    stoneDark: "#4a5b66",
    accent: "#9bdfff",
    accentSoft: "#8fb7e2",
    fog: "#1e3747",
    sky: "#0d2233",
    hemiGround: "#314b58",
    detailTint: "#7f99a3",
    fogNear: 82,
    fogFar: 260,
    ambientIntensity: 0.4,
    hemiIntensity: 0.6,
    keyLight: "#d7f5ff",
    rimLight: "#8bb7ff",
    exposure: 1,
  },
  mine_quarry: {
    id: "mine_quarry",
    label: "Ember Quarry",
    base: "#5a544a",
    baseDark: "#292724",
    baseLight: "#8a7a63",
    road: "#735a3f",
    roadDark: "#3f3023",
    moss: "#575f3c",
    stone: "#797368",
    stoneDark: "#48443d",
    accent: "#f7b44f",
    accentSoft: "#bd8546",
    fog: "#242524",
    sky: "#101817",
    hemiGround: "#423b31",
    detailTint: "#857a66",
    fogNear: 58,
    fogFar: 225,
    ambientIntensity: 0.32,
    hemiIntensity: 0.44,
    keyLight: "#ffc06f",
    rimLight: "#ff7a3d",
    exposure: 0.94,
  },
};

export function getBiomeForStage(stage: number): BiomeId {
  if (stage > 0 && stage % 10 === 0) return "crystal_gate";
  if (stage > 0 && stage % 5 === 0) return "boss_courtyard";
  const chapter = Math.floor(Math.max(0, stage - 1) / 5) % 3;
  if (chapter === 1) return "marsh";
  if (chapter === 2) return "mine_quarry";
  return "ruins_forest";
}

export function getTextureSize(quality: QualityLevel) {
  if (quality === "high") return 4096;
  if (quality === "medium") return 2048;
  return 1024;
}
