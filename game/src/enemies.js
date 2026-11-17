import { ARENA } from './config.js';

export function spawnEnemy(world, kind, x, y) {
  const scale = 1 + Math.max(0, world.wave - 1) * 0.09;
  const enemy = { kind, x, y, age: 0, phase: world.rng.next() * Math.PI * 2, radius: kind === 'watcher' ? 42 : kind === 'lancer' ? 17 : 14, hp: kind === 'watcher' ? 24 + world.wave * 2 : kind === 'lancer' ? 3 : 2, maxHp: kind === 'watcher' ? 24 + world.wave * 2 : kind === 'lancer' ? 3 : 2, speed: (kind === 'mote' ? 66 : kind === 'lancer' ? 88 : 40) * scale, fireClock: 1.5 + world.rng.next() * 1.5 };
  world.enemies.push(enemy);
  return enemy;
}

function aimAtPlayer(world, enemy, speed, color, spread = 0) {
  const angle = Math.atan2(world.player.y - enemy.y, world.player.x - enemy.x) + spread;
  world.enemyShots.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 6, color, life: 7 });
}

export function updateEnemies(world, dt) {
  const player = world.player;
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const enemy = world.enemies[i];
    enemy.age += dt;
    if (enemy.kind === 'mote') {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.sin(enemy.age * 2.7 + enemy.phase) * 0.65;
      enemy.x += Math.cos(angle) * enemy.speed * dt; enemy.y += Math.sin(angle) * enemy.speed * dt;
    } else if (enemy.kind === 'lancer') {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const dash = Math.sin(enemy.age * 1.7 + enemy.phase) > 0.78 ? 1.9 : 0.55;
      enemy.x += Math.cos(angle) * enemy.speed * dash * dt; enemy.y += Math.sin(angle) * enemy.speed * dash * dt;
      enemy.x += Math.cos(enemy.phase + enemy.age * 2) * 18 * dt;
    } else {
      enemy.x += Math.sin(enemy.age * 0.8 + enemy.phase) * 32 * dt;
      enemy.y += Math.cos(enemy.age * 0.55 + enemy.phase) * 14 * dt;
      enemy.fireClock -= dt;
      if (enemy.fireClock <= 0) {
        enemy.fireClock = Math.max(0.65, 1.35 - world.wave * 0.04);
        for (const offset of [-0.32, 0, 0.32]) aimAtPlayer(world, enemy, 190, '#ff758e', offset);
      }
    }
    enemy.x = Math.max(ARENA.left + 26, Math.min(ARENA.right - 26, enemy.x));
    enemy.y = Math.max(ARENA.top + 24, Math.min(ARENA.bottom - 22, enemy.y));
  }
  for (let i = world.enemyShots.length - 1; i >= 0; i--) {
    const shot = world.enemyShots[i];
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    if (shot.life <= 0 || shot.x < 0 || shot.x > 1280 || shot.y < 0 || shot.y > 720) world.enemyShots.splice(i, 1);
  }
}
