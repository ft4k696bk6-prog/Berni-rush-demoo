# Berni Rush - night handoff

Last updated: 2026-05-21, Europe/Warsaw.

## Product direction

Berni Rush is moving toward a fast, premium-feeling mobile roguelite with guided fantasy locations instead of one open arena.

Current target:
- third-person mobile-first control feel,
- closed rooms / short expeditions / gate transitions,
- Quaternius-style fantasy art direction,
- fast performance over decorative clutter,
- readable attacks, strong VFX, compact HUD.

## Latest checkpoint

Latest stable production before this handoff:
- GitHub branch: `main`
- Vercel production: `https://bernirushdemooo.vercel.app/`
- Recent deployed commit: `ec0f769` - `Isolate rooms and gate transitions`

Unfinished local checkpoint being saved now:
- adds active-room dressing for ruins,
- adds overhead root/beam silhouettes to make rooms feel less open,
- adds idle preloading for room/environment assets,
- deduplicates enemy FBX preload calls.

## What to do next

Highest-value next steps:
1. Run typecheck/build after this checkpoint and fix any issue immediately.
2. Apply active-room render filtering to `marsh_trail`, `mine_passage`, and `crystal_gate`, not only `ruins_path`.
3. Add gates/room transfers to the other maps so each section feels like a separate location.
4. Make mobile adaptive performance more aggressive without changing visual style: lower DPR/technical effects, not asset identity.
5. Visually QA the first 60 seconds: menu, start room, first fight, first gate transfer.
6. Then commit, push, and verify Vercel production.

## Known risks

- Too many GLTF wall panels can still cause hitches on weaker laptops/mobile.
- New room dressing should be checked visually; if it feels cluttered, remove props before adding more.
- Do not reintroduce random map swapping or texture-quality switching on fullscreen/resize.
- Keep the tester money code available for QA: `BERNIRICH`.

## Working rule

Small safe stages only:
change -> local typecheck/build -> browser smoke test -> commit -> push -> Vercel check.
