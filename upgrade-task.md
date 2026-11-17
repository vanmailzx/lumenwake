You are upgrading an existing make.fun bounty entry (competition best-game-01, "Make the best game") in this repository. The game is Lumenwake, a star-garden survival arena shooter (canvas 2D, ES modules under game/src/). Our first AI-judged score was far below Top-20. Judges look mostly at the 4 screenshots and the source outline, so this upgrade is about RICHNESS, DRAMA, and JUICE.

HARD RULES (transcript gate — breaking any disqualifies the entry):
1. Your FIRST tool command must be exactly:
   cd /root/makefun/bestgame-entry && node /root/makefun/best-game-01-kit/cli/makefun.mjs init --competition best-game-01 --keypair /root/makefun/makefun-keypair.json
   Quote the `makefun anchor ...` line it prints in your reply BEFORE any file write.
2. Edit EVERY file with apply_patch (add_file/update_file). Never cat heredocs or shell-redirect writes. cp is allowed only for vendor/makefun-game.ts (do not touch it).
3. main.ts at repo root must be edited in at least 2 separate assistant messages (real apply_patch revisions — e.g. once to expand the shot list handling, once for a comment/doc or output tidy-up). This is mandatory.
4. All code original. No external libraries, no network requests, no build step. Keep everything offline/static.
5. Do NOT git commit. Do not touch PROGRESS.md, README.md, .makefun/, screenshots/ metadata files other than regenerating the JPGs.

WHAT TO ADD (game/ — keep the multi-file structure, add new files where it clarifies):
A. New content:
   - 3 new enemy types with distinct behaviour + silhouettes: e.g. "bloom" (drifts in, swells, splits into 2-3 motes on death), "wisp" (orbits the player at radius, fires periodic slow shots), "shade" (fades out, teleports near the player, lunges). Integrate them into the wave director from wave 2 onward.
   - 2 NEW bosses beyond the existing Watcher: "Cinder Chorus" (wave 10; rotating ring core that emits spiral bullet fans and summons lancer escorts) and "Umbral Choir" (wave 15; splits into 3 singing shards that pulse AoE rings). Multi-phase with visible phase transitions.
   - 3 biomes that change with wave milestones (e.g. Star Garden -> Nebula Reef -> Dawn Vault): distinct background palette, parallax scenery layers (drifting flora/nebula wisps), and ground glow. Smooth palette crossfade between biomes.
   - Upgrade system: every 2 waves the run PAUSES briefly and shows a 3-card upgrade picker (time-featured, works with keyboard 1/2/3 and click). ~8 upgrade kinds across tiers: rapid bloom (fire rate), split prism (extra projectiles), echo drone (orbiting ally that shoots), lure light (enemy-targeting magnetism for pickups), dash veil (i-frames + shockwave on dash), piercing rays, vitality bloom (max HP + heal), overflow cascade (bigger blasts). Show current upgrades as small icons in the HUD.
   - Combo/chain meter: kills within a window build a multiplier feeding score, with on-screen flourish.
B. Juice & visual fidelity (big visual jump — this is judged):
   - Glow everywhere: additive shadowBlur passes for projectiles, player, pickups, enemies; soft radial gradients under entities.
   - More particles: death bursts (per enemy type colors), dash trail ribbons, pickup sparkles, ambient floating pollen, bullet impact sparks, boss-phase shockwave rings, victory petal storm.
   - Screen shake on player hit, boss spawns, big blasts; hit flash on enemies; brief hit-stop (few ms freeze) on boss phase change and boss death; slow-motion moment on final boss kill.
   - Background: 3-layer parallax starfield, drifting nebula blobs, subtle vignette gradient, biome-tinted arena border glow that pulses with the combo meter.
   - Floating damage/score numbers with easing.
C. Screens (all redrawn, dramatic, full-canvas):
   - TITLE: animated multi-layer starfield, huge glowing serif logo "LUMENWAKE" with light-beam sweep, subtitle, animated "press anywhere to wake the garden", controls hint, best score. First impression must land instantly.
   - GAME OVER: "the garden dims" framing, run stats (time, waves, score, best combo), prominent "press anywhere to replant" restart prompt.
   - VICTORY: dawn-breaking gradient, petal/light particles, stats, restart prompt.
   - PAUSE and UPGRADE overlays polished.
D. Deterministic screenshot scenes (shots.json, 4 shots, keep ?shot=<scene>&seed=n, fixed sim time, window.__shotReady):
   - 1-lumenwake.jpg -> title screen (scene "title")
   - 2-echo-garden.jpg -> mid-combat chaos: player with 2-3 visible upgrades, drone orbiting, combo meter high, many particles, a wisp + shade + bloom on screen (scene "play", staged formations so it looks busy and glorious)
   - 3-the-choir.jpg -> Umbral Choir boss with its 3 shards mid-barrage, bullets and rings filling space (scene "boss")
   - 4-dawn-returned.jpg -> victory dawn with petal storm and stats (scene "victory")
   Update shots.json names/queries to match. Screenshot capture with headless Chromium as before (playwright-core, /root/.cache/ms-playwright/chromium-1255/chrome-linux/chrome; serve with serve.ts). Each 1280x720 JPEG <= 256 KiB, all four visually distinct. Verify sizes and uniqueness; re-encode if over cap.
E. main.ts (repo root): update if the shot list/scenes changed; add a brief header comment describing the build; make a second apply_patch revision (e.g. tidy or doc). Keep behavior: copy game/ + screenshots/ per shots.json, buildDossier with same limits.

VERIFY (report each):
1. Anchor line printed and quoted.
2. `node --check` (or import parse) every game/src file and main.ts.
3. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` twice; `diff -r` of two runs must be clean; dossier.json written.
4. 4 screenshots: 1280x720, <=256 KiB, distinct, captured from the real game render.
5. Report: files added/changed with byte counts, screenshot sizes, determinism result.
