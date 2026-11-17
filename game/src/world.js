import { ARENA, STEP } from './config.js';
import { burst, stepParticles } from './particles.js';
import { beginWave, updateWaves } from './waves.js';
import { updateEnemies } from './enemies.js';

export function createWorld(rng) {
  let savedBest = 0;
  try { savedBest = Number(localStorage.getItem('lumenwake-best') || 0); } catch {}
  const world = {
    rng, status: 'title', elapsed: 0, score: 0, best: savedBest, wave: 1,
    player: { x: 640, y: 390, radius: 13, hp: 5, maxHp: 5, invulnerable: 0, dashTime: 0, dashCooldown: 0, aim: -Math.PI / 2, fireClock: 0 },
    enemies: [], shots: [], enemyShots: [], particles: [], echoes: [], history: [], waveBanner: 0, waveClock: 0,
    waveQuota: 0, spawned: 0, spawnClock: 0, intermission: 2.5, shake: 0, flash: 0, resultTime: 0,
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
  if (target) player.aim = Math.atan2(target.enemy.y - player.y, target.enemy.x - player.x);
  world.shots.push({ x: player.x + Math.cos(player.aim) * 17, y: player.y + Math.sin(player.aim) * 17, vx: Math.cos(player.aim) * 610, vy: Math.sin(player.aim) * 610, life: 1.25, radius: 4 });
  audio.pulse();
}

function hitEnemy(world, enemy, damage = 1) {
  enemy.hp -= damage;
  burst(world.particles, enemy.x, enemy.y, enemy.kind === 'watcher' ? '#ff758e' : '#ffcf79', 5, world.rng, 100);
  if (enemy.hp <= 0) {
    const index = world.enemies.indexOf(enemy);
    if (index !== -1) world.enemies.splice(index, 1);
    world.score += enemy.kind === 'watcher' ? 1500 : enemy.kind === 'lancer' ? 180 : 100;
    burst(world.particles, enemy.x, enemy.y, '#74f4df', enemy.kind === 'watcher' ? 42 : 18, world.rng, enemy.kind === 'watcher' ? 260 : 180);
  }
}

function updateShots(world, dt) {
  for (let i = world.shots.length - 1; i >= 0; i--) {
    const shot = world.shots[i]; shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    let consumed = shot.life <= 0 || shot.x < 0 || shot.x > 1280 || shot.y < 0 || shot.y > 720;
    for (const enemy of [...world.enemies]) {
      if ((shot.x - enemy.x) ** 2 + (shot.y - enemy.y) ** 2 < (enemy.radius + shot.radius) ** 2) {
        hitEnemy(world, enemy); consumed = true; break;
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
  player.hp--; player.invulnerable = 1.15; world.shake = 14; world.flash = 0.22;
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
  world.intermission = 2.5; beginWave(world, 1);
}

export function updateWorld(world, input, audio, dt = STEP) {
  if (world.status !== 'playing') return;
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
  }
  player.x = Math.max(ARENA.left + 18, Math.min(ARENA.right - 18, player.x)); player.y = Math.max(ARENA.top + 18, Math.min(ARENA.bottom - 18, player.y));
  player.fireClock -= dt;
  if ((input.firing || input.state.pointer) && player.fireClock <= 0) { fire(world, audio); player.fireClock = 0.19; }
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
  if (world.status === 'victory') {
    world.score += Math.max(0, 5000 - Math.floor(world.elapsed * 8));
    world.best = Math.max(world.best, world.score); saveBest(world);
  }
}
