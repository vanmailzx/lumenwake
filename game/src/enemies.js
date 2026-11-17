import { ARENA } from './config.js';
import { burst } from './particles.js';

export function spawnEnemy(world, kind, x, y) {
  const scale = 1 + Math.max(0, world.wave - 1) * 0.055;
  const stats = { mote: [14, 2, 66], lancer: [17, 3, 88], bloom: [21, 4, 38], wisp: [16, 3, 46], shade: [19, 3, 58], watcher: [42, 34, 0], chorus: [52, 120, 0], choir: [35, 54, 0] }[kind] || [14, 2, 55];
  const enemy = { kind, x, y, age: 0, phase: world.rng.next() * Math.PI * 2, radius: stats[0], hp: stats[1] + (kind === 'watcher' ? world.wave * 2 : 0), maxHp: stats[1] + (kind === 'watcher' ? world.wave * 2 : 0), speed: stats[2] * scale, fireClock: 1 + world.rng.next() * 1.2, hitFlash: 0 };
  if (kind === 'bloom') enemy.drawRadius = enemy.radius;
  if (kind === 'choir') enemy.shards = Array.from({ length: 3 }, (_, index) => {
    const angle = index * Math.PI * 2 / 3;
    return { angle, hp: 18, maxHp: 18, x: x + Math.cos(angle) * 102, y: y + Math.sin(angle) * 62 };
  });
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
    enemy.hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt);
    if (['watcher', 'chorus', 'choir'].includes(enemy.kind)) {
      enemy.x = 640 + Math.sin(enemy.age * 0.38) * (enemy.kind === 'choir' ? 88 : 170);
      enemy.y = (enemy.kind === 'choir' ? 225 : 180) + Math.cos(enemy.age * 0.6) * 25;
      const phase = enemy.kind === 'choir' ? enemy.age > 18 ? 3 : enemy.age > 9 ? 2 : 1 : enemy.hp < enemy.maxHp * 0.48 ? 2 : 1;
      if (phase !== enemy.bossPhase) { enemy.bossPhase = phase; world.phaseFlash = 1.4; world.hitStop = 0.09; world.shake = 12; }
      if (enemy.kind === 'choir') enemy.shards.forEach((shard, index) => {
        shard.angle += dt * (phase === 1 ? 0.34 : phase === 2 ? -0.58 : 0.85);
        shard.x = enemy.x + Math.cos(shard.angle) * (phase === 3 ? 125 : 102);
        shard.y = enemy.y + Math.sin(shard.angle) * (phase === 3 ? 78 : 62);
      });
      enemy.fireClock -= dt;
      if (enemy.fireClock <= 0) {
        enemy.fireClock = enemy.kind === 'chorus' ? phase === 1 ? 0.13 : 0.085 : phase === 1 ? 0.56 : phase === 2 ? 0.4 : 0.28;
        const count = enemy.kind === 'chorus' ? phase === 1 ? 3 : 5 : 1;
        for (let index = 0; index < count; index++) {
          const angle = enemy.kind === 'chorus' ? enemy.age * 1.7 + index * Math.PI * 2 / count : Math.atan2(player.y - enemy.y, player.x - enemy.x);
          const source = enemy.kind === 'choir' ? enemy.shards[index % enemy.shards.length] : enemy;
          world.enemyShots.push({ x: source.x ?? enemy.x, y: source.y ?? enemy.y, vx: Math.cos(angle) * 145, vy: Math.sin(angle) * 145, radius: 7, color: enemy.kind === 'choir' ? '#bb99ff' : '#ff9b75', life: 8 });
        }
        if (enemy.kind === 'choir' && phase >= 2) world.rings.push({ x: enemy.x, y: enemy.y, radius: 18, life: 1.4, max: 1.4, color: '#a98bff', damage: true });
        if (enemy.kind === 'chorus' && enemy.escorts < (phase === 1 ? 2 : 5)) {
          spawnEnemy(world, 'lancer', enemy.x + 60, enemy.y + 48);
          enemy.escorts = (enemy.escorts || 0) + 1;
        }
      }
    } else if (enemy.kind === 'mote') {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.sin(enemy.age * 2.7 + enemy.phase) * 0.65;
      enemy.x += Math.cos(angle) * enemy.speed * dt; enemy.y += Math.sin(angle) * enemy.speed * dt;
    } else if (enemy.kind === 'lancer') {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const dash = Math.sin(enemy.age * 1.7 + enemy.phase) > 0.78 ? 1.9 : 0.55;
      enemy.x += Math.cos(angle) * enemy.speed * dash * dt; enemy.y += Math.sin(angle) * enemy.speed * dash * dt;
      enemy.x += Math.cos(enemy.phase + enemy.age * 2) * 18 * dt;
    } else if (enemy.kind === 'bloom') {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.drawRadius = enemy.radius * (1 + Math.max(0, Math.sin(enemy.age * 1.9 + enemy.phase)) * 0.22);
      enemy.x += Math.cos(angle + Math.sin(enemy.age * 2) * 0.22) * enemy.speed * dt;
      enemy.y += Math.sin(angle + Math.sin(enemy.age * 2) * 0.22) * enemy.speed * dt;
    } else if (enemy.kind === 'wisp') {
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      const radiusError = Math.hypot(enemy.x - player.x, enemy.y - player.y) - 185;
      enemy.x += (-Math.sin(angle) * enemy.speed + Math.cos(angle) * radiusError * 0.7) * dt;
      enemy.y += (Math.cos(angle) * enemy.speed + Math.sin(angle) * radiusError * 0.7) * dt;
      enemy.fireClock -= dt;
      if (enemy.fireClock <= 0) { enemy.fireClock = 2.4; world.enemyShots.push({ x: enemy.x, y: enemy.y, vx: Math.cos(Math.atan2(player.y - enemy.y, player.x - enemy.x)) * 105, vy: Math.sin(Math.atan2(player.y - enemy.y, player.x - enemy.x)) * 105, radius: 6, color: '#75e8ff', life: 8 }); }
    } else if (enemy.kind === 'shade') {
      if (enemy.mode !== 'hidden' && enemy.age > 2.2 + enemy.phase % 1.5) { enemy.mode = 'hidden'; enemy.modeClock = 0.75; }
      if (enemy.mode === 'hidden') {
        enemy.modeClock -= dt;
        if (enemy.modeClock <= 0) { const angle = enemy.phase + enemy.age; enemy.x = player.x - Math.cos(angle) * 210; enemy.y = player.y - Math.sin(angle) * 150; enemy.mode = 'lunge'; enemy.modeClock = 0.55; enemy.phase += 1.7; burst(world.particles, enemy.x, enemy.y, '#ae8bff', 10, world.rng, 85); }
      } else if (enemy.mode === 'lunge') {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x); enemy.x += Math.cos(angle) * enemy.speed * 3.2 * dt; enemy.y += Math.sin(angle) * enemy.speed * 3.2 * dt;
        enemy.modeClock -= dt; if (enemy.modeClock <= 0) { enemy.mode = 'visible'; enemy.age = 0; }
      } else { const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x); enemy.x += Math.cos(angle) * enemy.speed * 0.55 * dt; enemy.y += Math.sin(angle) * enemy.speed * 0.55 * dt; }
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
  for (let index = world.rings.length - 1; index >= 0; index--) {
    const ring = world.rings[index]; ring.life -= dt; ring.radius += 175 * dt;
    if (ring.damage && !ring.triggered && Math.abs(Math.hypot(player.x - ring.x, player.y - ring.y) - ring.radius) < 14) {
      ring.triggered = true;
      if (player.invulnerable <= 0 && player.dashTime <= 0) {
        player.hp--; player.invulnerable = 1.15; world.shake = Math.max(world.shake, 8); world.flash = 0.18;
        if (player.hp <= 0) { world.status = 'gameover'; world.best = Math.max(world.best, world.score); }
      }
    }
    if (ring.life <= 0) world.rings.splice(index, 1);
  }
}
