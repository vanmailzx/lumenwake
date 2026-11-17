import { STEP, WIDTH, HEIGHT } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { makeRng } from './rng.js';
import { drawGame } from './render.js';
import { prepareShot } from './shots.js';
import { createWorld, startRun, updateWorld } from './world.js';
import { applyUpgrade } from './upgrades.js';
import { resumeAfterUpgrade } from './waves.js';

const canvas = document.querySelector('#game');
canvas.width = WIDTH; canvas.height = HEIGHT;
const ctx = canvas.getContext('2d', { alpha: false });
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
const shotMode = ['title', 'play', 'boss', 'victory'].includes(shot);
const seed = Number(query.get('seed') || 1);
const input = createInput(canvas);
const audio = createAudio(() => {});
let world = shotMode ? prepareShot(shot, seed) : createWorld(makeRng(seed || Math.floor(Math.random() * 0xffffffff)));
let accumulator = 0;
let previous = shotMode ? 0 : performance.now();
let frameHandle = 0;

function render() {
  drawGame(ctx, world, audio);
  if (shotMode) window.__shotReady = true;
}

  if (shotMode) {
  render();
} else {
  canvas.addEventListener('pointerdown', () => {
    if (world.status === 'title' || world.status === 'gameover' || world.status === 'victory' || world.status === 'ending') startRun(world);
    else if (world.status === 'paused') world.status = 'playing';
    else if (world.status === 'upgrade') {
      const index = Math.max(0, Math.min(2, Math.floor((input.state.x - 144) / 277)));
      applyUpgrade(world, world.upgradeChoices?.[index]?.id); resumeAfterUpgrade(world);
    }
    audio.unlock();
  });
  function frame(now) {
    const delta = Math.min(0.1, (now - previous) / 1000); previous = now;
    accumulator += delta;
    if (input.state.pause) {
      input.state.pause = false;
      if (world.status === 'playing') world.status = 'paused'; else if (world.status === 'paused') world.status = 'playing';
    }
    if (input.state.audio) { input.state.audio = false; audio.toggle(); }
    if (input.state.confirm) {
      input.state.confirm = false;
      if (world.status === 'title' || world.status === 'gameover' || world.status === 'victory' || world.status === 'ending') startRun(world);
      else if (world.status === 'paused') world.status = 'playing';
      else if (world.status === 'upgrade' && world.upgradeChoices?.[0]) {
        applyUpgrade(world, world.upgradeChoices[0].id); resumeAfterUpgrade(world);
      }
      audio.unlock();
    }
    if (input.state.choice) {
      const index = input.state.choice - 1; input.state.choice = 0;
      if (world.status === 'upgrade' && world.upgradeChoices?.[index]) {
        applyUpgrade(world, world.upgradeChoices[index].id); resumeAfterUpgrade(world);
      }
    }
    while (accumulator >= STEP) {
      updateWorld(world, input, audio, STEP);
      if (['title', 'paused', 'upgrade'].includes(world.status)) world.elapsed += STEP;
      accumulator -= STEP;
    }
    render(); frameHandle = requestAnimationFrame(frame);
  }
  frameHandle = requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frameHandle), { once: true });
}
