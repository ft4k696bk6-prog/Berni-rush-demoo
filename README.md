# Berni Rush

Berni Rush is a browser-based 3D arena game built with React, TypeScript, Three.js, and Zustand. It plays like a compact survival action game: pick a class, enter the arena, survive waves of enemies, collect coins, unlock skins, and tune the run through upgrades and perks.

Live demo: https://bernirushdemooo.vercel.app

## What It Does

- Runs a real-time 3D combat arena in the browser with keyboard and touch controls.
- Offers six playable class styles: Knight, Ranger, Mage, Assassin, Tank, and Miner.
- Spawns staged enemy waves with scaling health, damage, speed, rewards, elite enemies, and boss encounters.
- Includes projectiles, melee arcs, dash moves, power attacks, enemy projectiles, pickups, floating combat text, and impact effects.
- Saves profile progress, records, wallet coins, selected class, selected skin, and unlocks.
- Provides a skin shop, permanent upgrades, run perks, and weapon choices.
- Adapts rendering quality for mobile-like devices so the game stays playable outside a desktop setup.

## Why This Project Matters

The interesting part of Berni Rush is the amount of gameplay logic behind a small browser game. Combat rules, progression, balancing, save data, rendering quality, and UI state are separated from the Three.js scene, which makes the project easier to extend without turning every change into a full rewrite.

Recent work focused on making the game feel more stable and readable: clearer enemy models, better world visuals, mobile combat tuning, safer spawning, record keeping, and tester-friendly economy tools.

## Tech Stack

- React 19 and TypeScript
- Vite
- Three.js with @react-three/fiber and @react-three/drei
- Zustand for game state
- lucide-react for UI icons
- Vercel deployment

## Repository Structure

```text
artifacts/3d-game/
  src/game/       Game state, combat systems, 3D scene, UI, balancing, saves
  public/assets/  Character, enemy, environment, and license files
lib/              Shared API, database, and generated client packages
scripts/          Workspace utility scripts
```

## Running Locally

```bash
pnpm install
pnpm --filter @workspace/3d-game run dev
```

Build the deployed game:

```bash
pnpm --filter @workspace/3d-game run build
```

Run the workspace type checks:

```bash
pnpm run typecheck
```

## Current Status

Berni Rush is a playable portfolio prototype. The core loop, class system, enemies, upgrades, saves, and browser deployment are in place. The next useful improvements would be more level variety, sound design, richer enemy behaviors, and a short onboarding pass for first-time players.
