import { makeRng } from './rng.js';
import { createWorld, startRun, updateWorld } from './world.js';
import { spawnEnemy } from './enemies.js';
import { UPGRADES } from './upgrades.js';
import { burst } from './particles.js';

const silentAudio = { enabled: false, pulse() {}, hit() {}, dash() {}, collect() {}, tick() {} };
const stillInput = { state: { pointer: false, x: 640, y: 360, fire: false }, movement: () => ({ x: 0, y: 0 }), firing: false, dashing: false };

function setUpgrades(world, ids) {
  for (const id of ids) world.upgrades[id] = 1;
  if (world.upgrades.drone) world.drones.push({ angle: 0.9, fireClock: 0.1, x: world.player.x + 35, y: world.player.y - 28 });
}

export function prepareShot(scene, seed) {
  const world = createWorld(makeRng(seed)); world.best = 32740;
  if (scene === 'title') { world.elapsed = 12.3; return world; }
  startRun(world); world.status = 'playing'; world.score = 18640; world.bestCombo = 14; world.combo = 11; world.comboClock = 2.7;
  world.player.x = scene === 'boss' ? 355 : 630; world.player.y = scene === 'boss' ? 490 : 430;
  world.player.aim = -0.8; world.waveBanner = 0;
  if (scene === 'play') {
    world.wave = 8; world.elapsed = 48.7; setUpgrades(world, ['rapid', 'split', 'drone', 'lure', 'pierce']);
    const formation = [
      ['bloom', 835, 285], ['wisp', 970, 428], ['shade', 470, 290], ['lancer', 842, 535], ['mote', 353, 512],
      ['bloom', 1115, 210], ['shade', 1100, 562], ['mote', 730, 225], ['wisp', 260, 315], ['lancer', 535, 555],
    ];
    for (const [kind, x, y] of formation) spawnEnemy(world, kind, x, y);
    world.drones[0].x = world.player.x + 40; world.drones[0].y = world.player.y - 24;
    for (let index = 0; index < 42; index++) {
      const angle = index * 2.399; const radius = 25 + (index * 37) % 290;
      world.particles.push({ x: 640 + Math.cos(angle) * radius, y: 394 + Math.sin(angle) * radius * 0.65, vx: Math.sin(angle) * 16, vy: -10, life: 0.7 + (index % 7) * 0.1, max: 1.4, size: 1.4 + index % 3, color: ['#74f4df', '#ffcf79', '#ff8fba', '#b59cff'][index % 4] });
    }
    for (let index = 0; index < 18; index++) {
      const angle = index * Math.PI * 2 / 18;
      world.enemyShots.push({ x: 720 + Math.cos(angle) * 180, y: 382 + Math.sin(angle) * 110, vx: Math.cos(angle + 0.6) * 80, vy: Math.sin(angle + 0.6) * 80, radius: 5, color: index % 2 ? '#ff9c9c' : '#a88cff', life: 4 });
    }
    world.shots = Array.from({ length: 10 }, (_, index) => ({ x: 590 + index * 18, y: 420 - index * 10, vx: 240, vy: -210, radius: 4 }));
    world.floaters.push({ x: 773, y: 315, text: '+400  ×4', life: 0.9, max: 1.15, color: '#ffcf79' });
    world.wave = 8;
  } else if (scene === 'boss') {
    world.wave = 15; world.elapsed = 132.6; setUpgrades(world, ['rapid', 'split', 'drone', 'overflow']);
    const boss = spawnEnemy(world, 'choir', 640, 228); boss.age = 12.2; boss.bossPhase = 2;
    for (const shard of boss.shards) { shard.angle += 12.2 * -0.58; }
    world.drones[0].x = world.player.x + 35; world.drones[0].y = world.player.y - 28;
    for (let index = 0; index < 48; index++) {
      const angle = index * Math.PI * 2 / 16 + Math.floor(index / 16) * 0.22;
      const speed = 102 + (index % 4) * 19;
      world.enemyShots.push({ x: 640 + Math.cos(angle) * 120, y: 228 + Math.sin(angle) * 83, vx: Math.cos(angle + 1.1) * speed, vy: Math.sin(angle + 1.1) * speed, radius: 5 + index % 3, color: ['#c69cff', '#ff8fc8', '#78e7ff'][index % 3], life: 5 });
    }
    for (let index = 0; index < 4; index++) world.rings.push({ x: 640, y: 228, radius: 82 + index * 48, life: 0.75 + index * 0.12, max: 1.3, color: index % 2 ? '#e09bff' : '#9cecff' });
    world.enemyShots.length = 46; world.waveBanner = 0; world.phaseFlash = 0;
  } else if (scene === 'victory') {
    world.status = 'victory'; world.wave = 15; world.elapsed = 168.2; world.resultTime = 168;
    world.score = 48360; world.best = 48360; world.bestCombo = 21; world.combo = 0;
    setUpgrades(world, ['rapid', 'split', 'drone', 'lure', 'dash', 'pierce', 'vitality', 'overflow']);
    for (let index = 0; index < 105; index++) {
      const angle = index * 2.399; const radius = 60 + (index * 41) % 650;
      world.particles.push({ x: 640 + Math.cos(angle) * radius, y: 360 + Math.sin(angle) * radius * 0.48, vx: Math.sin(angle) * 42, vy: -12 - index % 38, life: 1 + (index % 10) * 0.11, max: 2.2, size: 2 + index % 4, color: ['#ffe3a3', '#ffb7d1', '#9df6ed', '#d1b5ff'][index % 4] });
    }
  }
  world.status = scene === 'victory' ? 'victory' : 'playing';
  return world;
}
