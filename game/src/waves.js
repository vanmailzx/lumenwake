import { spawnEnemy } from './enemies.js';
import { offerUpgrades } from './upgrades.js';

const BOSSES = { 5: 'watcher', 10: 'chorus', 15: 'choir' };

function edgePoint(world) {
  const side = Math.floor(world.rng.next() * 4);
  if (side === 0) return { x: 100 + world.rng.next() * 1080, y: 100 };
  if (side === 1) return { x: 100 + world.rng.next() * 1080, y: 635 };
  if (side === 2) return { x: 90, y: 120 + world.rng.next() * 500 };
  return { x: 1190, y: 120 + world.rng.next() * 500 };
}

export function beginWave(world, number) {
  world.wave = number; world.waveClock = 0; world.spawnClock = 0.8;
  world.waveQuota = BOSSES[number] ? 0 : 5 + number * 2;
  world.spawned = 0; world.waveBanner = 2.8;
  if (BOSSES[number]) {
    spawnEnemy(world, BOSSES[number], 640, number === 15 ? 230 : 170);
    world.shake = Math.max(world.shake, 9); world.phaseFlash = 1.3;
  }
}

export function updateWaves(world, dt) {
  world.waveClock += dt; world.waveBanner = Math.max(0, world.waveBanner - dt);
  world.phaseFlash = Math.max(0, world.phaseFlash - dt);
  if (BOSSES[world.wave]) {
    if (world.enemies.length === 0) {
      if (world.wave === 15) { world.status = 'ending'; world.victoryTimer = 0.9; world.resultTime = world.elapsed; world.slowMo = 0.8; world.shake = 20; }
      else { world.intermission = 2; world.wave = -world.wave; }
    }
    return;
  }
  if (world.wave < 0) {
    world.intermission -= dt;
    if (world.intermission <= 0) { world.intermission = 2.5; beginWave(world, Math.abs(world.wave) + 1); }
    return;
  }
  world.spawnClock -= dt;
  if (world.spawned < world.waveQuota && world.spawnClock <= 0) {
    const point = edgePoint(world); const roll = world.rng.next();
    let kind = 'mote';
    if (world.wave >= 2) kind = roll < 0.23 ? 'bloom' : roll < 0.43 ? 'wisp' : roll < 0.60 ? 'shade' : roll < 0.79 ? 'lancer' : 'mote';
    spawnEnemy(world, kind, point.x, point.y); world.spawned++;
    world.spawnClock = Math.max(0.43, 1.55 - world.wave * 0.065);
  }
  if (world.spawned >= world.waveQuota && world.enemies.length === 0) {
    world.intermission -= dt;
    if (world.intermission <= 0) {
      world.intermission = 2.5;
      const next = world.wave + 1;
      if (world.wave % 2 === 0 && next < 15) { world.pendingWave = next; offerUpgrades(world); }
      else beginWave(world, next);
    }
  }
}

export function resumeAfterUpgrade(world) {
  const next = world.pendingWave || world.wave + 1;
  world.status = 'playing'; world.intermission = 2.5; beginWave(world, next);
}
