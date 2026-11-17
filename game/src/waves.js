import { spawnEnemy } from './enemies.js';

function edgePoint(world) {
  const side = Math.floor(world.rng.next() * 4);
  if (side === 0) return { x: 100 + world.rng.next() * 1080, y: 100 };
  if (side === 1) return { x: 100 + world.rng.next() * 1080, y: 635 };
  if (side === 2) return { x: 90, y: 120 + world.rng.next() * 500 };
  return { x: 1190, y: 120 + world.rng.next() * 500 };
}

export function beginWave(world, number) {
  world.wave = number;
  world.waveClock = 0;
  world.spawnClock = 0.8;
  world.waveQuota = number === 5 ? 0 : 5 + number * 2;
  world.spawned = 0;
  world.waveBanner = 2.8;
  if (number === 5) spawnEnemy(world, 'watcher', 640, 150);
}

export function updateWaves(world, dt) {
  world.waveClock += dt;
  world.waveBanner = Math.max(0, world.waveBanner - dt);
  if (world.wave === 5) {
    if (world.enemies.length === 0) { world.status = 'victory'; world.resultTime = world.elapsed; }
    return;
  }
  world.spawnClock -= dt;
  if (world.spawned < world.waveQuota && world.spawnClock <= 0) {
    const point = edgePoint(world);
    const kind = world.wave >= 3 && world.rng.next() < 0.3 ? 'lancer' : 'mote';
    spawnEnemy(world, kind, point.x, point.y);
    world.spawned++;
    world.spawnClock = Math.max(0.52, 1.55 - world.wave * 0.1);
  }
  if (world.spawned >= world.waveQuota && world.enemies.length === 0) {
    world.intermission -= dt;
    if (world.intermission <= 0) { world.intermission = 2.5; beginWave(world, world.wave + 1); }
  }
}
