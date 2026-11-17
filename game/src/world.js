import { ARENA, STEP } from './config.js';
import { burst, stepParticles } from './particles.js';
import { beginWave, resumeAfterUpgrade, updateWaves } from './waves.js';
import { spawnEnemy, updateEnemies } from './enemies.js';
import { applyUpgrade } from './upgrades.js';

export function createWorld(rng) {
  let savedBest = 0;
  try { savedBest = Number(localStorage.getItem('lumenwake-best') || 0); } catch {}
  const world = {
    rng, status: 'title', elapsed: 0, score: 0, best: savedBest, wave: 1,
    player: { x: 640, y: 390, radius: 13, hp: 5, maxHp: 5, invulnerable: 0, dashTime: 0, dashCooldown: 0, aim: -Math.PI / 2, fireClock: 0 },
    enemies: [], shots: [], enemyShots: [], particles: [], echoes: [], history: [], rings: [], pickups: [], drones: [],
    upgrades: {}, combo: 0, comboClock: 0, bestCombo: 0, floaters: [], ambientClock: 0, waveBanner: 0, waveClock: 0,
    waveQuota: 0, spawned: 0, spawnClock: 0, intermission: 2.5, shake: 0, flash: 0, resultTime: 0, phaseFlash: 0, hitStop: 0, slowMo: 0,
  };
  beginWave(world, 1);
  return world;
}

function saveBest(world) {
  try { localStorage.setItem('lumenwake-best', String(world.best)); } catch {}
}

function fire(world, audio) {
  const player = world.player;
  const target = world.enemies.reduce((nearest, enemy) => {
    const distance = (enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2;
    return !nearest || distance < nearest.distance ? { enemy, distance } : nearest;
  }, null);
  if (target) {
    const aimTarget = target.enemy.kind === 'choir' && target.enemy.shards?.length
      ? target.enemy.shards.reduce((nearest, shard) => {
        const x = shard.x; const y = shard.y;
        const distance = (x - player.x) ** 2 + (y - player.y) ** 2;
        return !nearest || distance < nearest.distance ? { x, y, distance } : nearest;
      }, null)
      : target.enemy;
    player.aim = Math.atan2(aimTarget.y - player.y, aimTarget.x - player.x);
  }
  const count = world.upgrades.split ? 3 : 1;
  for (let index = 0; index < count; index++) {
    const angle = player.aim + (count === 1 ? 0 : (index - 1) * 0.18);
    world.shots.push({ x: player.x + Math.cos(angle) * 17, y: player.y + Math.sin(angle) * 17, vx: Math.cos(angle) * 610, vy: Math.sin(angle) * 610, life: 1.25, radius: 4, pierce: world.upgrades.pierce ? 2 : 0, damage: 1 + (world.upgrades.overflow ? 1 : 0) });
  }
  audio.pulse();
}

function hitEnemy(world, enemy, damage = 1) {
  if (enemy.kind === 'choir' && enemy.shards?.length) {
    const shard = enemy.shards.reduce((nearest, item) => {
      const distance = (item.x - world.player.x) ** 2 + (item.y - world.player.y) ** 2;
      return !nearest || distance < nearest.distance ? { item, distance } : nearest;
    }, null)?.item;
    if (shard) { shard.hp -= damage; enemy.hp -= damage; if (shard.hp <= 0) { shard.hp = shard.maxHp; world.phaseFlash = 0.18; } }
  } else enemy.hp -= damage;
  enemy.hitFlash = 0.16;
  burst(world.particles, enemy.x, enemy.y, enemy.kind === 'choir' ? '#b99cff' : enemy.kind === 'watcher' || enemy.kind === 'chorus' ? '#ff758e' : '#ffcf79', 5, world.rng, 100);
  if (enemy.hp <= 0) {
    const index = world.enemies.indexOf(enemy);
    if (index !== -1) world.enemies.splice(index, 1);
    const boss = ['watcher', 'chorus', 'choir'].includes(enemy.kind);
    world.combo = world.comboClock > 0 ? world.combo + 1 : 1; world.comboClock = 3.2;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    const points = (boss ? 2400 : enemy.kind === 'lancer' ? 180 : 100) * Math.min(5, 1 + Math.floor(world.combo / 4));
    world.score += points;
    world.floaters.push({ x: enemy.x, y: enemy.y - 18, text: `+${points}${world.combo >= 3 ? `  ×${Math.min(5, 1 + Math.floor(world.combo / 4))}` : ''}`, life: 1.15, max: 1.15, color: boss ? '#ffcf79' : '#a5f6e8' });
    burst(world.particles, enemy.x, enemy.y, boss ? '#ffcf79' : enemy.kind === 'bloom' ? '#ff91bb' : enemy.kind === 'shade' ? '#af92ff' : '#74f4df', boss ? 78 : enemy.kind === 'bloom' ? 34 : 20, world.rng, boss ? 340 : 200);
    if (!boss && world.rng.next() < 0.32) world.pickups.push({ x: enemy.x, y: enemy.y, vx: world.rng.range(-35, 35), vy: world.rng.range(-45, 15), phase: world.rng.next() * Math.PI * 2 });
    if (enemy.kind === 'bloom') for (let index = 0; index < 3; index++) spawnEnemy(world, 'mote', enemy.x + Math.cos(index * 2.094) * 24, enemy.y + Math.sin(index * 2.094) * 24);
    if (boss) { world.hitStop = 0.12; world.shake = 18; world.rings.push({ x: enemy.x, y: enemy.y, radius: 25, life: 1.3, max: 1.3, color: '#ffe19a' }); }
  }
}

function updateShots(world, dt) {
  for (let i = world.shots.length - 1; i >= 0; i--) {
    const shot = world.shots[i]; shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    let consumed = shot.life <= 0 || shot.x < 0 || shot.x > 1280 || shot.y < 0 || shot.y > 720;
    for (const enemy of [...world.enemies]) {
      if ((shot.x - enemy.x) ** 2 + (shot.y - enemy.y) ** 2 < (enemy.radius + shot.radius) ** 2) {
        hitEnemy(world, enemy, shot.damage || 1);
        if (shot.pierce > 0) shot.pierce--; else { consumed = true; break; }
      }
    }
    if (consumed) world.shots.splice(i, 1);
  }
  for (let i = world.enemyShots.length - 1; i >= 0; i--) {
    const shot = world.enemyShots[i];
    if ((shot.x - world.player.x) ** 2 + (shot.y - world.player.y) ** 2 < (world.player.radius + shot.radius) ** 2) {
      world.enemyShots.splice(i, 1); damagePlayer(world); continue;
    }
    for (const echo of world.echoes) {
      if ((shot.x - echo.x) ** 2 + (shot.y - echo.y) ** 2 < 32 ** 2) { world.enemyShots.splice(i, 1); world.score += 5; break; }
    }
  }
}

function damagePlayer(world) {
  const player = world.player;
  if (player.invulnerable > 0 || player.dashTime > 0) return;
  player.hp--; player.invulnerable = 1.15; world.shake = 17; world.flash = 0.28;
  burst(world.particles, player.x, player.y, '#ff758e', 22, world.rng, 210);
  if (player.hp <= 0) {
    world.status = 'gameover';
    world.best = Math.max(world.best, world.score);
    saveBest(world);
  }
}

function updateEcho(world, dt) {
  const player = world.player;
  world.history.push({ x: player.x, y: player.y });
  if (world.history.length > 120) {
    const memory = world.history.shift();
    world.echoes.push({ x: memory.x, y: memory.y, life: 2.4, max: 2.4 });
  }
  for (let i = world.echoes.length - 1; i >= 0; i--) {
    world.echoes[i].life -= dt;
    if (world.echoes[i].life <= 0) world.echoes.splice(i, 1);
  }
}

export function startRun(world) {
  world.status = 'playing'; world.elapsed = 0; world.score = 0; world.wave = 1;
  Object.assign(world.player, { x: 640, y: 390, hp: 5, invulnerable: 0, dashTime: 0, dashCooldown: 0, fireClock: 0 });
  world.enemies.length = 0; world.shots.length = 0; world.enemyShots.length = 0; world.particles.length = 0; world.echoes.length = 0; world.history.length = 0;
  world.rings.length = 0; world.pickups.length = 0; world.drones.length = 0; world.upgrades = {}; world.combo = 0; world.bestCombo = 0;
  world.intermission = 2.5; beginWave(world, 1);
}

export function updateWorld(world, input, audio, dt = STEP) {
  if (world.status === 'ending') {
    world.elapsed += dt * 0.2; world.victoryTimer -= dt;
    if (Math.floor(world.victoryTimer * 18) !== Math.floor((world.victoryTimer + dt) * 18)) {
      for (let index = 0; index < 4; index++) burst(world.particles, world.rng.range(120, 1160), world.rng.range(100, 660), world.rng.pick(['#ffe3a3', '#ffb7d1', '#9df6ed', '#d1b5ff']), 4, world.rng, 90);
    }
    stepParticles(world.particles, dt * 0.22);
    if (world.victoryTimer <= 0) { world.status = 'victory'; world.resultTime = world.elapsed; world.best = Math.max(world.best, world.score); saveBest(world); }
    return;
  }
  if (world.status !== 'playing') return;
  if (world.hitStop > 0) { world.hitStop = Math.max(0, world.hitStop - dt); return; }
  const player = world.player;
  world.elapsed += dt; player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt); player.dashTime = Math.max(0, player.dashTime - dt);
  world.shake = Math.max(0, world.shake - dt * 28); world.flash = Math.max(0, world.flash - dt);
  const move = input.movement();
  if (move.x || move.y) {
    const length = Math.hypot(move.x, move.y); player.x += move.x / length * 245 * dt; player.y += move.y / length * 245 * dt;
    player.aim = Math.atan2(move.y, move.x);
  } else if (input.state.pointer && input.state.fire) player.aim = Math.atan2(input.state.y - player.y, input.state.x - player.x);
  if (input.dashing && player.dashCooldown <= 0) {
    const angle = move.x || move.y ? Math.atan2(move.y, move.x) : player.aim;
    player.x += Math.cos(angle) * 126; player.y += Math.sin(angle) * 126;
    player.dashTime = 0.32; player.dashCooldown = 2.4; player.invulnerable = 0.5; audio.dash();
    burst(world.particles, player.x, player.y, '#8d77ff', 20, world.rng, 180);
    if (world.upgrades.dash) world.rings.push({ x: player.x, y: player.y, radius: 12, life: 0.65, max: 0.65, color: '#bca5ff', damage: true });
  }
  player.x = Math.max(ARENA.left + 18, Math.min(ARENA.right - 18, player.x)); player.y = Math.max(ARENA.top + 18, Math.min(ARENA.bottom - 18, player.y));
  player.fireClock -= dt;
  if ((input.firing || input.state.pointer) && player.fireClock <= 0) { fire(world, audio); player.fireClock = world.upgrades.rapid ? 0.135 : 0.19; }
  world.comboClock = Math.max(0, world.comboClock - dt); if (!world.comboClock) world.combo = 0;
  world.ambientClock -= dt;
  if (world.ambientClock <= 0) { world.ambientClock = 0.13; burst(world.particles, world.rng.range(ARENA.left, ARENA.right), ARENA.bottom, '#b8d8ff', 1, world.rng, 20); }
  if (world.upgrades.drone) {
    if (!world.drones.length) world.drones.push({ angle: 0, fireClock: 0 });
    for (const drone of world.drones) {
      drone.angle += dt * 1.6; drone.fireClock -= dt;
      drone.x = player.x + Math.cos(drone.angle) * 49; drone.y = player.y + Math.sin(drone.angle) * 34;
      if (drone.fireClock <= 0 && world.enemies.length) {
        const target = world.enemies.reduce((nearest, enemy) => !nearest || (enemy.x - drone.x) ** 2 + (enemy.y - drone.y) ** 2 < nearest.distance ? { enemy, distance: (enemy.x - drone.x) ** 2 + (enemy.y - drone.y) ** 2 } : nearest, null)?.enemy;
        if (target) { const angle = Math.atan2(target.y - drone.y, target.x - drone.x); world.shots.push({ x: drone.x, y: drone.y, vx: Math.cos(angle) * 470, vy: Math.sin(angle) * 470, life: 1.5, radius: 3 }); }
        drone.fireClock = 0.8;
      }
    }
  }
  updateEcho(world, dt); updateEnemies(world, dt); updateShots(world, dt);
  for (const enemy of [...world.enemies]) {
    if ((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2 < (enemy.radius + player.radius) ** 2) damagePlayer(world);
    for (const echo of world.echoes) {
      if (enemy.hp > 0 && (enemy.x - echo.x) ** 2 + (enemy.y - echo.y) ** 2 < (enemy.radius + 20) ** 2) {
        echo.life = 0; hitEnemy(world, enemy); break;
      }
    }
  }
  stepParticles(world.particles, dt); updateWaves(world, dt); audio.tick(dt);
  for (const floater of world.floaters) { floater.life -= dt; floater.y -= 27 * dt; }
  world.floaters = world.floaters.filter(floater => floater.life > 0);
  for (let index = world.pickups.length - 1; index >= 0; index--) {
    const pickup = world.pickups[index];
    if (world.upgrades.lure) { const angle = Math.atan2(player.y - pickup.y, player.x - pickup.x); pickup.vx += Math.cos(angle) * 70 * dt; pickup.vy += Math.sin(angle) * 70 * dt; }
    pickup.x += pickup.vx * dt; pickup.y += pickup.vy * dt;
    if ((pickup.x - player.x) ** 2 + (pickup.y - player.y) ** 2 < 28 ** 2) { world.score += 75; burst(world.particles, pickup.x, pickup.y, '#ffcf79', 10, world.rng, 90); world.pickups.splice(index, 1); }
  }
  if (world.status === 'victory') {
    world.score += Math.max(0, 5000 - Math.floor(world.elapsed * 8));
    world.best = Math.max(world.best, world.score); saveBest(world);
  }
}
