# Berni Rush

Berni Rush is a playable browser-based 3D arena game prototype built with React, TypeScript, Three.js and Zustand. It is a side project for real-time interaction, game state, rendering and browser deployment.

PL: Berni Rush to interaktywny projekt game web. Nie jest prezentowany jako aplikacja biznesowa ani dopracowany produkt komercyjny.

## Live demo

https://bernirushdemooo.vercel.app

## Screenshots

Screenshots should be added to `docs/screenshots/`. Placeholder links are intentionally not included.

## Features

- Real-time 3D arena gameplay in the browser.
- Keyboard and touch controls.
- Playable class styles, skins and loadout choices.
- Enemy waves, elites and boss encounters.
- Projectiles, melee effects, pickups and floating combat text.
- Saved local progress for profile, records, wallet coins, class and skins.
- Mobile-aware rendering quality adjustments.

## Tech stack

- React
- TypeScript
- Vite
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Zustand
- PNPM workspace
- Vercel

## Project structure

- `artifacts/3d-game/` — deployed browser game.
- `artifacts/3d-game/src/game/` — gameplay state, combat systems, scene and UI.
- `artifacts/3d-game/public/assets/` — character, enemy and environment assets.
- `lib/` — generated/shared API packages from the workspace template.
- `scripts/` — utility scripts.
- `docs/` — roadmap, changelog, issue backlog and screenshots folder.

## Getting started

```bash
git clone https://github.com/ft4k696bk6-prog/Berni-rush-demoo.git
cd Berni-rush-demoo
pnpm install
pnpm --filter @workspace/3d-game run dev
```

Quality checks:

```bash
pnpm run typecheck
pnpm run build
```

## Game mechanics

- Choose a class and enter an arena.
- Survive enemy waves while collecting coins and pickups.
- Upgrade run perks, weapons and persistent progress.
- Avoid enemy attacks and use class movement/combat tools to stay alive.

## What I learned

- Managing game state separately from 3D rendering.
- Working with Three.js through React components.
- Balancing a small combat loop for browser play.
- Persisting local game progress.
- Deploying and documenting a non-business interactive project honestly.

## Roadmap

- Add onboarding for first-time players.
- Improve sound design and feedback.
- Add more enemy behavior variety.
- Add screenshots and short gameplay clips.
- Add focused tests around pure balancing/save helpers where practical.

## Status

Playable prototype / Side project.

## License

MIT.
