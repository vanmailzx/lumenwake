# best-game-01 — entry progress

Deadline entries: 2026-11-18T18:00Z. Quota: 3 left today (high-risk tier), 5/day cap, no prior entries on account.

## Requirements summary (from /root/makefun/req.json + kit competition.yaml)
- Deliverables: repo_url + commit_sha (public GitHub repo), transcript bundle (kit CLI), LICENSE (OSI),
  **main.ts at repo root** (Node 22), .makefun/owner.json {"wallet": ...}, README with 3 make.fun badges,
  GitHub About: homepage = bounty URL + topic `makefun`.
- Harness program/v1, judged: main.ts copies game/ + screenshots/ to /output and writes
  /output/dossier.json via vendor/makefun-game.ts buildDossier. AI judge reads a 1,536-token
  dossier view (1 contact sheet of screenshots + source outline), head-to-head 1–5 verdicts, rank by win rate.
- Gate limits: game/ ≤993 files & 48 MiB, index.html ≤1 MiB, 3–4 screenshots ≤256 KiB each
  (long side ≤1280, short side ≥480), dossier ≤1.5 MiB / 160 KiB text. No network requests; static files only.
- Run: main.ts must complete in 120 s wall, 1 CPU, 1024 MB, deterministic (run twice → identical bytes).
- Transcript gate: recorded Codex session (gpt-6-luna — priced ✓), anchor `makefun init` shown in a tool
  result BEFORE first write, ≥5 assistant turns, main.ts written/edited in ≥2 assistant messages,
  thinking_reproduces ≥30% authored, 100% priced usage, run record required (received from 2026-11-17 00:00Z).
- Payout: $1000, top-10 ($400/$200/$120/7×$40), finalist review on top 5 (60 min, plays in Chrome).
  handed_over_places: none.

## Judge rubric (criteria, most important first)
1. Complete game (all parts visible in screenshots: title, play, win/loss, restart)
2. Fun and depth
3. Feel and polish
4. Look and originality
5. Structure (source split into clear files)
Screenshots dominate: 137/168 judge reasons named a start/title/end/restart screen. Screenshots must show the WHOLE loop.

## House anchors (1-weak → 7-ace): 2-plain = starter Block Dodger (dodge/collect, 8 files, no sound);
4-strong = pixel platformer 320x180, WebAudio, 4 levels; 6-elite = roguelite dungeon (24 files, 192 KB).
Aim: build above 4-strong quality — polished, multi-file, sound, particles, full loop, own art/names.

## Environment status
- Kit unpacked: /root/makefun/best-game-01-kit (competition.yaml, starter/, vendor lib at sdk/game/makefun-game.ts? check harness/ + starter/vendor).
- Codex CLI 0.44.0, model gpt-6-luna via coarena proxy 127.0.0.1:8899 (restarted 2026-11-17, one-shot OK-LUNA ✓, priced ✓).
- gh authed vanmailzx ✓. Wallets on account ✓ (3 wallets, primary Ai9Vg...). Node v22.22.2 ✓.
- Playwright chromium cached (/root/.cache/ms-playwright/chromium-1255) — use node playwright-core for screenshots.
- Prior entries in best-game-01 on account: none.

## Risks
- 10 paid places vs expected ~10k entries → paid place is a lottery; goal is a valid, high-quality entry.
- Screenshots must be real renders, deterministic (?shot=<scene>&seed=n, window.__shotReady, fixed sim time).
- Similarity screen: all code must be original (vendored libs under vendor/ excluded only if *.min.js).
- Bundle must include every session (top-level + any children); submit only after kit `check` is clean.

## Plan
1. [x] Requirements + kit + env checks (this file's sections above)
2. [ ] Recorded Codex session in /root/makefun/bestgame-entry: first tool call = kit init (anchor), then author
       game (original 2D canvas game, files split, apply_patch for every write, ≥2 revisions of main.ts)
3. [ ] Screenshots via headless chromium, main.ts run → out/ (game copy + screenshots + dossier.json), determinism check
4. [ ] GitHub repo public + badges README + About; .makefun/owner.json
5. [ ] Bundle + kit check; local gate 100% → then (and only then) submit

## Log
- 2026-11-17 ~07:20Z: requirements fetched, kit unpacked, env verified, coarena proxy restarted, codex verified.
- 2026-11-17: Codex authoring session started in /root/makefun/bestgame-entry (task in codex-task.md).
