import { makeRng } from './rng.js';
import { createWorld, startRun, updateWorld } from './world.js';
import { spawnEnemy } from './enemies.js';

const silentAudio = { enabled: false, pulse() {}, hit() {}, dash() {}, collect() {}, tick() {} };
const stillInput = { state: { pointer: false, x: 640, y: 360, fire: false }, movement: () => ({ x: 0, y: 0 }), firing: false, dashing: false };
const sceneryInput = {
  movement: () => ({ x: 0, y: 0 }), dashing: false,
  get firing() { return false; },
  state: { pointer: true, fire: false, x: 640, y: 140 },
};

function stagePlayerForScene(world, scene) {
  const formations = {
    play: { x: 638, y: 400, hp: 5 },
    boss: { x: 365, y: 430, hp: 5 },
    victory: { x: 630, y: 412, hp: 5 },
  };
  Object.assign(world.player, formations[scene]);
}

export function prepareShot(scene, seed) {
  const world = createWorld(makeRng(seed));
  world.best = 0;
  world.status = scene === 'title' ? 'title' : 'playing';
  if (scene === 'title') return world;
  startRun(world);
  world.status = 'playing';
  const steps = scene === 'boss' ? 720 : scene === 'play' ? 900 : 1100;
  stagePlayerForScene(world, scene);
  if (scene === 'boss') {
    world.wave = 5; world.enemies.length = 0; world.enemyShots.length = 0; world.shots.length = 0;
    spawnEnemy(world, 'watcher', 640, 190);
    for (let index = 0; index < 9; index++) {
      const angle = index / 9 * Math.PI * 2;
      spawnEnemy(world, index % 3 === 0 ? 'lancer' : 'mote', 640 + Math.cos(angle) * 355, 370 + Math.sin(angle) * 215);
    }
    world.waveBanner = 0;
  }
  for (let frame = 0; frame < steps; frame++) {
    updateWorld(world, stillInput, silentAudio, 1 / 60);
    if (scene !== 'boss' && scene !== 'victory') continue;
    const angle = frame / 60 * 0.66;
    sceneryInput.state.x = world.player.x + Math.cos(angle) * 250;
    sceneryInput.state.y = world.player.y + Math.sin(angle) * 150;
    world.player.aim = Math.atan2(sceneryInput.state.y - world.player.y, sceneryInput.state.x - world.player.x);
    if (frame % 15 === 0) world.shots.push({ x: world.player.x, y: world.player.y, vx: Math.cos(world.player.aim) * 450, vy: Math.sin(world.player.aim) * 450, life: 0.8, radius: 4 });
    world.elapsed = frame / 60;
  }
  if (scene === 'boss') {
    world.enemies.length = 0;
    world.enemyShots.length = 0;
    spawnEnemy(world, 'watcher', 640, 190);
    world.wave = 5;
  }
  world.status = scene === 'victory' ? 'victory' : 'playing';
  if (scene === 'victory') { world.score = 12850; world.wave = 5; world.elapsed = 167.4; world.enemies.length = 0; world.enemyShots.length = 0; }
  return world;
}
