import type { WeaponId } from "./types";

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  shortName: string;
  price: number;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  range: number;
  pellets: number;
  spread: number;
  radius: number;
  color: string;
  description: string;
  special: string;
}

export const WEAPON_CONFIG: Record<WeaponId, WeaponConfig> = {
  blaster: {
    id: "blaster",
    name: "Basic Blaster",
    shortName: "Blaster",
    price: 0,
    damage: 1.35,
    fireRate: 4.4,
    projectileSpeed: 30,
    range: 34,
    pellets: 1,
    spread: 0,
    radius: 0.34,
    color: "#ffd84a",
    description: "Reliable single-shot weapon with clean aim.",
    special: "Balanced",
  },
  rapid: {
    id: "rapid",
    name: "Rapid Pistol",
    shortName: "Rapid",
    price: 45,
    damage: 0.82,
    fireRate: 8.6,
    projectileSpeed: 34,
    range: 31,
    pellets: 1,
    spread: 0.035,
    radius: 0.28,
    color: "#69e7ff",
    description: "Lower damage, very high fire rate.",
    special: "Fast fire",
  },
  shotgun: {
    id: "shotgun",
    name: "Scatter Shotgun",
    shortName: "Shotgun",
    price: 85,
    damage: 0.95,
    fireRate: 1.85,
    projectileSpeed: 27,
    range: 21,
    pellets: 5,
    spread: 0.2,
    radius: 0.32,
    color: "#ff9a3d",
    description: "Short range cone that deletes crowds up close.",
    special: "Wide spread",
  },
  laser: {
    id: "laser",
    name: "Ion Laser",
    shortName: "Laser",
    price: 140,
    damage: 1.2,
    fireRate: 6.2,
    projectileSpeed: 42,
    range: 42,
    pellets: 1,
    spread: 0.01,
    radius: 0.26,
    color: "#ff4fd8",
    description: "Fast piercing bolts with strong superpower scaling.",
    special: "Piercing",
  },
  nova: {
    id: "nova",
    name: "Nova Cannon",
    shortName: "Nova",
    price: 220,
    damage: 2.3,
    fireRate: 1.35,
    projectileSpeed: 24,
    range: 30,
    pellets: 1,
    spread: 0,
    radius: 0.72,
    color: "#9cff5a",
    description: "Heavy orb with area pressure.",
    special: "Splash",
  },
  arcane: {
    id: "arcane",
    name: "Arcane Prism",
    shortName: "Prism",
    price: 330,
    damage: 1.05,
    fireRate: 4.0,
    projectileSpeed: 31,
    range: 36,
    pellets: 3,
    spread: 0.12,
    radius: 0.36,
    color: "#b98cff",
    description: "Three magical lances with extra luck scaling.",
    special: "Triple magic",
  },
};

export const WEAPON_ORDER: WeaponId[] = ["blaster", "rapid", "shotgun", "laser", "nova", "arcane"];
