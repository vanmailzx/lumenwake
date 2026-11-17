import { ARENA, COLORS, HEIGHT, WIDTH } from './config.js';
import { drawHud, drawOverlay } from './ui.js';

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
}

function drawBackground(ctx, world) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#101730'); gradient.addColorStop(0.53, '#0b1328'); gradient.addColorStop(1, '#10112b');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(640, 390, 20, 640, 390, 560);
  glow.addColorStop(0, '#322c6230'); glow.addColorStop(1, '#0a0f2200'); ctx.fillStyle = glow; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < 90; i++) {
    const x = (i * 197.33 + 19) % WIDTH;
    const y = (i * 97.17 + 43) % HEIGHT;
    const shimmer = 0.24 + (Math.sin(world.elapsed * 0.7 + i * 3.1) + 1) * 0.16;
    ctx.globalAlpha = shimmer; ctx.fillStyle = i % 7 === 0 ? '#9b9aff' : '#cad8ff';
    ctx.beginPath(); ctx.arc(x, y, i % 9 === 0 ? 1.6 : 0.85, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  roundedRect(ctx, ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 18);
  ctx.strokeStyle = '#8895d124'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); roundedRect(ctx, ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 18); ctx.clip();
  ctx.strokeStyle = '#7180bb0a'; ctx.lineWidth = 1;
  for (let x = ARENA.left + 28; x < ARENA.right; x += 48) { ctx.beginPath(); ctx.moveTo(x, ARENA.top); ctx.lineTo(x, ARENA.bottom); ctx.stroke(); }
  for (let y = ARENA.top + 28; y < ARENA.bottom; y += 48) { ctx.beginPath(); ctx.moveTo(ARENA.left, y); ctx.lineTo(ARENA.right, y); ctx.stroke(); }
  ctx.restore();
}

function drawEchoes(ctx, world) {
  for (const echo of world.echoes) {
    const alpha = Math.min(0.52, echo.life / echo.max * 0.55);
    ctx.globalAlpha = alpha; ctx.strokeStyle = COLORS.violet; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(echo.x, echo.y, 19 + (1 - alpha) * 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c5b9ff'; ctx.beginPath(); ctx.arc(echo.x, echo.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEnemy(ctx, enemy, time) {
  ctx.save(); ctx.translate(enemy.x, enemy.y);
  if (enemy.kind === 'mote') {
    ctx.rotate(time * 0.5 + enemy.phase);
    ctx.shadowBlur = 22; ctx.shadowColor = COLORS.gold; ctx.fillStyle = '#ffcf79';
    ctx.beginPath(); ctx.moveTo(0, -enemy.radius); ctx.lineTo(enemy.radius * 0.78, 0); ctx.lineTo(0, enemy.radius); ctx.lineTo(-enemy.radius * 0.78, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff1c9'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  } else if (enemy.kind === 'lancer') {
    ctx.rotate(Math.atan2(enemy.y - 360, enemy.x - 640) + Math.sin(time * 3 + enemy.phase) * 0.18);
    ctx.shadowBlur = 20; ctx.shadowColor = COLORS.coral; ctx.fillStyle = '#ff758e';
    ctx.beginPath(); ctx.moveTo(0, -enemy.radius - 7); ctx.lineTo(enemy.radius, enemy.radius); ctx.lineTo(0, enemy.radius * 0.45); ctx.lineTo(-enemy.radius, enemy.radius); ctx.closePath(); ctx.fill();
  } else {
    const pulse = 1 + Math.sin(time * 2) * 0.035;
    ctx.scale(pulse, pulse); ctx.shadowBlur = 34; ctx.shadowColor = '#ff758e';
    ctx.strokeStyle = '#ff758e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#301c3b'; ctx.beginPath(); ctx.arc(0, 0, enemy.radius - 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf79'; ctx.beginPath(); ctx.arc(0, 0, 12 + Math.sin(time * 3) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffb3d0'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const angle = time * 0.5 + i * 2.094; ctx.beginPath(); ctx.arc(0, 0, enemy.radius + 9 + i * 5, angle, angle + 0.72); ctx.stroke(); }
    if (enemy.hp < enemy.maxHp) {
      ctx.shadowBlur = 0; ctx.fillStyle = '#34233b'; ctx.fillRect(-35, -58, 70, 4);
      ctx.fillStyle = '#ff758e'; ctx.fillRect(-35, -58, 70 * Math.max(0, enemy.hp / enemy.maxHp), 4);
    }
  }
  ctx.restore();
}

function drawPlayer(ctx, player, time) {
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.aim);
  const flicker = player.invulnerable > 0 && Math.floor(time * 16) % 2 === 0;
  ctx.globalAlpha = flicker ? 0.4 : 1;
  ctx.shadowBlur = player.dashTime > 0 ? 34 : 19; ctx.shadowColor = player.dashTime > 0 ? COLORS.violet : COLORS.cyan;
  ctx.fillStyle = '#74f4df'; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -11); ctx.lineTo(-6, 0); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f5f2ff'; ctx.beginPath(); ctx.arc(1, 0, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawGame(ctx, world, audio) {
  ctx.save();
  if (world.shake > 0) ctx.translate(Math.sin(world.elapsed * 71) * world.shake, Math.cos(world.elapsed * 83) * world.shake * 0.6);
  drawBackground(ctx, world);
  if (world.status !== 'title') {
    drawEchoes(ctx, world);
    for (const shot of world.shots) { ctx.shadowBlur = 12; ctx.shadowColor = COLORS.cyan; ctx.fillStyle = '#c9fff4'; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill(); }
    for (const shot of world.enemyShots) { ctx.shadowBlur = 14; ctx.shadowColor = shot.color; ctx.fillStyle = shot.color; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill(); }
    for (const enemy of world.enemies) drawEnemy(ctx, enemy, world.elapsed);
    for (const particle of world.particles) { ctx.globalAlpha = Math.max(0, particle.life / particle.max); ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; drawPlayer(ctx, world.player, world.elapsed); drawHud(ctx, world, audio);
  }
  if (world.flash > 0) { ctx.globalAlpha = world.flash * 0.45; ctx.fillStyle = '#ff758e'; ctx.fillRect(0, 0, WIDTH, HEIGHT); ctx.globalAlpha = 1; }
  drawOverlay(ctx, world, {});
  ctx.restore();
}

export function drawBackdropOnly(ctx, time = 0) { drawBackground(ctx, { elapsed: time }); }
