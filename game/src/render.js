import { ARENA, COLORS, HEIGHT, WIDTH } from './config.js';
import { drawHud, drawOverlay, drawUpgradeOverlay } from './ui.js';

const BIOMES = [
  { top: '#111831', mid: '#11152b', low: '#19152f', glow: '#8d77ff', flora: '#6be7d1' },
  { top: '#092332', mid: '#111a34', low: '#1c1738', glow: '#63d9f2', flora: '#73f4df' },
  { top: '#423044', mid: '#252344', low: '#172848', glow: '#ffcc84', flora: '#ffd195' },
];

function round(ctx, x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }

function mixColor(first, second, amount) {
  const channels = [1, 3, 5].map(offset => Math.round(parseInt(first.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(second.slice(offset, offset + 2), 16) * amount));
  return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

function drawBackground(ctx, world) {
  const milestone = world.wave >= 12 ? 2 : world.wave >= 7 ? 1 : 0;
  const transitionStart = milestone === 0 ? 6 : milestone === 1 ? 11 : 16;
  const blend = Math.max(0, Math.min(1, (world.wave - transitionStart) / 2));
  const from = BIOMES[milestone]; const to = BIOMES[Math.min(2, milestone + 1)];
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, mixColor(from.top, to.top, blend));
  gradient.addColorStop(0.52, mixColor(from.mid, to.mid, blend));
  gradient.addColorStop(1, mixColor(from.low, to.low, blend));
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let layer = 0; layer < 3; layer++) for (let index = 0; index < 74; index++) {
    const id = index + layer * 74; const drift = world.elapsed * (4 + layer * 9);
    const x = (id * (197.33 + layer * 17) + 19 + drift) % WIDTH;
    const y = (id * (97.17 + layer * 11) + 43 + Math.sin(world.elapsed * 0.15 + id) * layer * 4) % HEIGHT;
    ctx.globalAlpha = 0.18 + (Math.sin(world.elapsed * (0.7 + layer * 0.12) + id * 3.1) + 1) * 0.15;
    ctx.fillStyle = id % 7 === 0 ? to.glow : '#d5e6ff';
    ctx.beginPath(); ctx.arc(x, y, layer === 2 ? 1.5 : 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let index = 0; index < 8; index++) {
    const x = (index * 213 + world.elapsed * (6 + index % 3 * 5)) % (WIDTH + 180) - 90;
    const y = 120 + (index * 83) % 510 + Math.sin(world.elapsed * 0.24 + index) * 24;
    const haze = ctx.createRadialGradient(x, y, 0, x, y, 112 + index % 4 * 24);
    haze.addColorStop(0, `${to.glow}14`); haze.addColorStop(1, `${to.glow}00`);
    ctx.fillStyle = haze; ctx.fillRect(x - 150, y - 150, 300, 300);
  }
  ctx.globalAlpha = 1;
  const arenaGlow = 0.4 + (world.comboClock > 0 ? Math.sin(world.elapsed * 10) * 0.3 + 0.3 : 0);
  round(ctx, ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 18);
  ctx.shadowBlur = 18 + world.combo * 2; ctx.shadowColor = to.glow; ctx.strokeStyle = `${to.glow}${Math.round(24 + arenaGlow * 36).toString(16)}`; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.save(); round(ctx, ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 18); ctx.clip();
  const floor = ctx.createLinearGradient(0, ARENA.top, 0, ARENA.bottom); floor.addColorStop(0, `${to.glow}04`); floor.addColorStop(1, `${to.glow}13`); ctx.fillStyle = floor; ctx.fillRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top);
  ctx.strokeStyle = '#b0c8ff0a'; ctx.lineWidth = 1;
  for (let x = ARENA.left + 28; x < ARENA.right; x += 48) { ctx.beginPath(); ctx.moveTo(x, ARENA.top); ctx.lineTo(x, ARENA.bottom); ctx.stroke(); }
  for (let y = ARENA.top + 28; y < ARENA.bottom; y += 48) { ctx.beginPath(); ctx.moveTo(ARENA.left, y); ctx.lineTo(ARENA.right, y); ctx.stroke(); }
  for (let index = 0; index < 22; index++) {
    const x = (index * 59 + world.elapsed * (8 + index % 5 * 3)) % 1200;
    const y = 120 + (index * 67) % 510 + Math.sin(world.elapsed * 0.4 + index) * 11;
    ctx.globalAlpha = 0.22 + Math.sin(world.elapsed + index) * 0.1; ctx.fillStyle = to.flora;
    ctx.beginPath(); ctx.ellipse(x, y, 2.3, 8 + index % 5, Math.sin(world.elapsed * 0.2 + index), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  const vignette = ctx.createRadialGradient(640, 360, 230, 640, 360, 740);
  vignette.addColorStop(0, '#02071100'); vignette.addColorStop(1, '#020610aa'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function glow(ctx, x, y, radius, color, alpha = 0.3) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`); gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawEnemy(ctx, enemy, time) {
  const color = { mote: '#ffcf79', lancer: '#ff758e', bloom: '#ff8fba', wisp: '#72e6ff', shade: '#a88cff', watcher: '#ff758e', chorus: '#ff976d', choir: '#c49aff' }[enemy.kind] || '#ffcf79';
  ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.globalAlpha = enemy.kind === 'shade' && enemy.mode === 'hidden' ? 0.16 : 1;
  glow(ctx, 0, 0, enemy.radius * 2.9, color, 0.26);
  ctx.rotate(time * 0.48 + enemy.phase);
  ctx.shadowBlur = enemy.kind === 'watcher' || enemy.kind === 'chorus' || enemy.kind === 'choir' ? 36 : 24; ctx.shadowColor = color;
  if (enemy.kind === 'mote') {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -enemy.radius); ctx.lineTo(enemy.radius * 0.8, 0); ctx.lineTo(0, enemy.radius); ctx.lineTo(-enemy.radius * 0.8, 0); ctx.closePath(); ctx.fill();
  } else if (enemy.kind === 'lancer') {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -enemy.radius - 10); ctx.lineTo(enemy.radius, enemy.radius); ctx.lineTo(0, enemy.radius * 0.35); ctx.lineTo(-enemy.radius, enemy.radius); ctx.closePath(); ctx.fill();
  } else if (enemy.kind === 'bloom') {
    const size = enemy.drawRadius || enemy.radius;
    for (let index = 0; index < 6; index++) { ctx.rotate(Math.PI / 3); ctx.fillStyle = index % 2 ? '#ffb5d2' : color; ctx.beginPath(); ctx.ellipse(0, -size * 0.55, size * 0.32, size * 0.63, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fff0be'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  } else if (enemy.kind === 'wisp') {
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, enemy.radius, 0.3, Math.PI * 1.7); ctx.stroke();
    ctx.fillStyle = '#e5fbff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (enemy.kind === 'shade') {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -enemy.radius); ctx.lineTo(enemy.radius * 0.9, -2); ctx.lineTo(0, enemy.radius + 7); ctx.lineTo(-enemy.radius * 0.9, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4edff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  } else if (enemy.kind === 'choir') {
    ctx.restore();
    for (const [index, shard] of enemy.shards.entries()) {
      const color = ['#c39cff', '#ff91ce', '#75e8ff'][index];
      glow(ctx, shard.x, shard.y, 55, color, 0.36);
      ctx.save(); ctx.translate(shard.x, shard.y); ctx.rotate(-time * (index % 2 ? 0.7 : 1));
      ctx.shadowBlur = 29; ctx.shadowColor = color; ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(13, 0); ctx.lineTo(0, 17); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff2ff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.translate(enemy.x, enemy.y);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let index = 0; index < 4; index++) { ctx.beginPath(); ctx.arc(0, 0, enemy.radius + index * 12, time * (index % 2 ? -0.8 : 0.8) + index, time * (index % 2 ? -0.8 : 0.8) + index + 1.8); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#f2dfff'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = enemy.kind === 'watcher' ? 6 : 8; ctx.beginPath(); ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = enemy.kind === 'chorus' ? '#3b1a2a' : '#301c3b'; ctx.beginPath(); ctx.arc(0, 0, enemy.radius - 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf79'; ctx.beginPath(); ctx.arc(0, 0, enemy.kind === 'chorus' ? 17 : 12, 0, Math.PI * 2); ctx.fill();
    for (let index = 0; index < 3; index++) { ctx.strokeStyle = '#ffd5bd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, enemy.radius + 12 + index * 10, time * 0.7 + index * 2.094, time * 0.7 + index * 2.094 + 0.72); ctx.stroke(); }
  }
  ctx.restore();
  if (enemy.hitFlash > 0) { ctx.globalAlpha = enemy.hitFlash * 4; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (enemy.maxHp > 10) {
    ctx.fillStyle = '#251b35'; ctx.fillRect(enemy.x - 48, enemy.y - enemy.radius - 27, 96, 5);
    ctx.fillStyle = color; ctx.fillRect(enemy.x - 48, enemy.y - enemy.radius - 27, 96 * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
}

function drawPlayer(ctx, player, time) {
  glow(ctx, player.x, player.y, 78, '#74f4df', 0.34);
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.aim);
  const flicker = player.invulnerable > 0 && Math.floor(time * 16) % 2 === 0;
  ctx.globalAlpha = flicker ? 0.38 : 1; ctx.shadowBlur = player.dashTime > 0 ? 38 : 25; ctx.shadowColor = player.dashTime > 0 ? COLORS.violet : COLORS.cyan;
  ctx.fillStyle = '#74f4df'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -12); ctx.lineTo(-7, 0); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f5f2ff'; ctx.beginPath(); ctx.arc(1, 0, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawActors(ctx, world, audio) {
  for (const echo of world.echoes) { ctx.globalAlpha = Math.min(0.52, echo.life / echo.max * 0.55); ctx.strokeStyle = COLORS.violet; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(echo.x, echo.y, 19 + (1 - echo.life / echo.max) * 10, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (const pickup of world.pickups) { glow(ctx, pickup.x, pickup.y, 30, '#ffcf79', 0.5); ctx.fillStyle = '#ffdf91'; ctx.beginPath(); ctx.arc(pickup.x, pickup.y, 6, 0, Math.PI * 2); ctx.fill(); }
  for (const shot of world.shots) { glow(ctx, shot.x, shot.y, 25, '#74f4df', 0.38); ctx.shadowBlur = 16; ctx.shadowColor = COLORS.cyan; ctx.fillStyle = '#e4fff9'; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill(); }
  for (const shot of world.enemyShots) { glow(ctx, shot.x, shot.y, 26, shot.color, 0.38); ctx.shadowBlur = 17; ctx.shadowColor = shot.color; ctx.fillStyle = shot.color; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill(); }
  for (const ring of world.rings) { ctx.globalAlpha = ring.life / ring.max; ctx.strokeStyle = ring.color; ctx.lineWidth = 4; ctx.shadowBlur = 22; ctx.shadowColor = ring.color; ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  for (const enemy of world.enemies) drawEnemy(ctx, enemy, world.elapsed);
  for (const particle of world.particles) { ctx.globalAlpha = Math.max(0, particle.life / particle.max); ctx.shadowBlur = 12; ctx.shadowColor = particle.color; ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  for (const drone of world.drones) { glow(ctx, drone.x, drone.y, 28, '#bd9cff', 0.55); ctx.strokeStyle = '#d4b8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(drone.x, drone.y, 8, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(drone.x, drone.y, 3, 0, Math.PI * 2); ctx.fill(); }
  drawPlayer(ctx, world.player, world.elapsed);
  for (const floater of world.floaters) { ctx.globalAlpha = floater.life / floater.max; ctx.fillStyle = floater.color; ctx.shadowBlur = 12; ctx.shadowColor = floater.color; ctx.font = '700 15px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(floater.text, floater.x, floater.y); }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0; drawHud(ctx, world, audio);
}

export function drawGame(ctx, world, audio) {
  ctx.save();
  if (world.shake > 0) ctx.translate(Math.sin(world.elapsed * 71) * world.shake, Math.cos(world.elapsed * 83) * world.shake * 0.6);
  drawBackground(ctx, world);
  if (world.status !== 'title' && world.status !== 'paused' && world.status !== 'upgrade') drawActors(ctx, world, audio);
  if (world.flash > 0) { ctx.globalAlpha = world.flash * 0.45; ctx.fillStyle = '#ff758e'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }
  if (world.phaseFlash > 0) { ctx.globalAlpha = Math.min(0.3, world.phaseFlash * 0.18); ctx.fillStyle = '#e8c5ff'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }
  drawOverlay(ctx, world, {});
  if (world.status === 'upgrade') drawUpgradeOverlay(ctx, world);
  ctx.restore();
}

export function drawBackdropOnly(ctx, time = 0) { drawBackground(ctx, { elapsed: time, wave: 1, combo: 0, comboClock: 0 }); }
