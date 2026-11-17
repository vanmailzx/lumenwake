You are authoring a make.fun bounty entry for competition best-game-01 ("Make the best game", $1000, AI-judged).

HARD RULES (transcript gate — breaking any disqualifies the entry):
1. Your FIRST tool command must be exactly:
   cd /root/makefun/bestgame-entry && node /root/makefun/best-game-01-kit/cli/makefun.mjs init --competition best-game-01 --keypair /root/makefun/makefun-keypair.json
   Quote the `makefun anchor ...` line it prints. Do not write any file before that command has run.
2. Write EVERY file with apply_patch (add_file/update_file). Never use cat heredocs or redirect writes.
3. After your first version of main.ts is written, make at least 2 further apply_patch revisions to main.ts (real improvements, not no-ops).
4. All code must be original — no copying engine examples, templates or jam games. No external libraries, no network requests, no build step.
5. Do not git commit; leave the working tree for the reviewer.

WHAT TO BUILD — an original, complete, polished browser game:
- Plain ES modules under game/, canvas 2D, runs offline from static files (game/index.html entry).
- Split the source into many small files under game/src/, one clear job per file (e.g. config, rng, input, audio, particles, entities, waves, world, render, ui, shots) with names that say what they do.
- Full loop: title screen → play → win/lose (game over AND victory/results) → restart; pause; best score in localStorage; visible HUD; feedback on every action.
- Depth: escalating waves/levels or a run-based progression, 2–3 distinct enemy/obstacle kinds with different behaviours, at least one mechanic that is genuinely your own idea; difficulty curve tuned so a decent player survives 2+ minutes.
- Polish: particle effects, screen shake or hit flashes, smooth easing, WebAudio-generated sound effects (and a simple generative music loop) — all created in code, no audio files.
- Original art drawn in code (shapes/gradients/pixel sprites via canvas), original names for the game and its elements.
- Deterministic screenshots: reading URL params ?shot=<scene>&seed=<n> renders a fixed scene of the game (e.g. start / play / boss / victory) with a seeded RNG, fixed simulated time (no wall clock, no Date.now in shot mode), runs one fixed duration of simulation deterministically, then sets window.__shotReady = true. Screenshots are taken at 1280x720.
- Fixed timestep simulation (1/60 s) decoupled from rendering.

ALSO CREATE (all via apply_patch):
- main.ts at repo root (Node 22, stdlib only): copy the pattern from /root/makefun/best-game-01-kit/starter/main.ts — copies game/ and screenshots/ to $MAKEFUN_OUTPUT_DIR (default /output) and writes dossier.json with buildDossier from ./vendor/makefun-game.ts using the same limits object as the starter.
- vendor/makefun-game.ts: copy byte-for-byte from /root/makefun/best-game-01-kit/starter/vendor/makefun-game.ts (cp is allowed for this one file only).
- serve.ts: copy the pattern of the kit's starter serve.ts (static server for game/).
- shots.json listing 4 shots, e.g. [{"name":"1-title.jpg","query":"?shot=title&seed=1"},{"name":"2-play.jpg","query":"?shot=play&seed=1"},{"name":"3-boss.jpg","query":"?shot=boss&seed=1"},{"name":"4-victory.jpg","query":"?shot=victory&seed=1"}] — name them for what they show; the first is the judge's cover.
- Take the screenshots yourself: start serve.ts, render each shot with headless Chromium (playwright-core with the browser at /root/.cache/ms-playwright/chromium-1255/chrome-linux/chrome, or launch chrome --headless=new --screenshot=... --window-size=1280,720 --virtual-time-budget=15000 on http://127.0.0.1:8080/<query>), save JPEGs under screenshots/ (each ≤256 KiB, 1280x720; re-encode with sharp/ffmpeg/ImageMagick if over). Verify by viewing sizes. If screenshot capture proves impossible in this environment, still create shots.json and leave screenshots/ for the harness.
- Verify: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` runs clean and writes out/game, out/screenshots, out/dossier.json; run it twice and confirm identical output (diff -r of the two runs). Also check `node --check` or import-parse each game/src file.

Keep game/ under 48 MiB and 993 files. Report at the end: the anchor line, files created, screenshot sizes, and the determinism check result.
