import { WIDTH } from './config.js';

export function drawHud(ctx, world, audio) {
  const player = world.player;
  ctx.save();
  ctx.fillStyle = '#f5f2ff'; ctx.font = '700 18px Manrope, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('LUMENWAKE', 76, 48);
  ctx.fillStyle = '#9ca9ce'; ctx.font = '12px "DM Mono", monospace'; ctx.fillText(`WAVE  ${String(world.wave).padStart(2, '0')}`, 76, 68);
  ctx.textAlign = 'right'; ctx.fillStyle = '#c5b9ff'; ctx.font = '700 21px Manrope, sans-serif'; ctx.fillText(String(world.score).padStart(6, '0'), 1204, 48);
  ctx.fillStyle = '#9ca9ce'; ctx.font = '11px "DM Mono", monospace'; ctx.fillText('SCORE', 1204, 68);
  ctx.textAlign = 'left'; ctx.fillStyle = '#9ca9ce'; ctx.fillText('VITALS', 76, 705);
  for (let i = 0; i < player.maxHp; i++) {
    const x = 130 + i * 24; ctx.beginPath(); ctx.arc(x, 700, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < player.hp ? '#74f4df' : '#27314f'; ctx.fill();
  }
  const dashReady = 1 - player.dashCooldown / 2.4;
  ctx.fillStyle = '#9ca9ce'; ctx.fillText('ECHO DASH', 300, 705);
  ctx.fillStyle = '#26304d'; ctx.fillRect(385, 695, 90, 6); ctx.fillStyle = '#8d77ff'; ctx.fillRect(385, 695, 90 * Math.max(0, dashReady), 6);
  ctx.textAlign = 'right'; ctx.fillStyle = '#8190b7'; ctx.fillText(audio.enabled ? 'M · SOUND ON' : 'M · SOUND OFF', WIDTH - 76, 705);
  if (world.waveBanner > 0 && world.status === 'playing') {
    const alpha = Math.min(1, world.waveBanner * 1.8); ctx.globalAlpha = alpha;
    ctx.textAlign = 'center'; ctx.fillStyle = '#f5f2ff'; ctx.font = '800 32px Manrope, sans-serif';
    ctx.fillText(world.wave === 5 ? 'THE WATCHER STIRS' : `GARDEN ${String(world.wave).padStart(2, '0')}`, WIDTH / 2, 142);
    ctx.fillStyle = '#9ca9ce'; ctx.font = '12px "DM Mono", monospace'; ctx.fillText(world.wave === 5 ? 'BREAK THE ECLIPSE' : 'KEEP THE LIGHT MOVING', WIDTH / 2, 165);
  }
  ctx.restore();
}

function button(ctx, label, x, y, width = 230) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + 48);
  gradient.addColorStop(0, '#a18aff'); gradient.addColorStop(1, '#6c83ff');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(x - width / 2, y - 22, width, 48, 9); ctx.fill();
  ctx.fillStyle = '#0d1430'; ctx.font = '800 13px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 5);
}

function heading(ctx, eyebrow, title, subtitle) {
  ctx.textAlign = 'center'; ctx.fillStyle = '#74f4df'; ctx.font = '500 12px "DM Mono", monospace'; ctx.fillText(eyebrow, 640, 250);
  ctx.fillStyle = '#f5f2ff'; ctx.font = '800 66px Manrope, sans-serif'; ctx.fillText(title, 640, 328);
  ctx.fillStyle = '#a9b3d1'; ctx.font = '500 16px Manrope, sans-serif'; ctx.fillText(subtitle, 640, 370);
}

export function drawOverlay(ctx, world, onAction) {
  if (!['title', 'paused', 'gameover', 'victory'].includes(world.status)) return;
  ctx.save(); ctx.fillStyle = world.status === 'title' ? '#070b1ccc' : '#080d20d9'; ctx.fillRect(0, 0, 1280, 720);
  if (world.status === 'title') {
    heading(ctx, 'A STAR-GARDEN SURVIVAL STORY', 'LUMENWAKE', 'Your past is a weapon. Leave it somewhere worth returning to.');
    button(ctx, 'BEGIN THE JOURNEY', 640, 440);
    ctx.fillStyle = '#9ca9ce'; ctx.font = '12px "DM Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('WASD / ARROWS  MOVE     SPACE / CLICK  FIRE     SHIFT  ECHO DASH     P  PAUSE', 640, 510);
    ctx.fillStyle = '#7885ac'; ctx.fillText(`BEST LIGHT  ${String(world.best).padStart(6, '0')}     SOUND  M`, 640, 548);
    onAction.title = { x: 525, y: 415, width: 230, height: 52 };
  } else if (world.status === 'paused') {
    heading(ctx, 'THE GARDEN HOLDS ITS BREATH', 'PAUSED', 'Your echo is waiting where you left it.');
    button(ctx, 'RETURN TO THE GARDEN', 640, 440);
    ctx.fillStyle = '#a9b3d1'; ctx.font = '13px "DM Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('PRESS P OR ENTER TO RESUME', 640, 505);
  } else {
    const won = world.status === 'victory';
    heading(ctx, won ? 'THE LONG NIGHT IS OVER' : 'THE GARDEN REMEMBERS', won ? 'DAWN, AT LAST' : 'LIGHTS OUT', won ? 'Every step you took brought the morning home.' : 'Even a lost light leaves a path for the next one.');
    ctx.fillStyle = '#c5b9ff'; ctx.font = '700 24px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`FINAL LIGHT  ${String(world.score).padStart(6, '0')}`, 640, 412);
    button(ctx, won ? 'GROW ANOTHER GARDEN' : 'TRY AGAIN', 640, 480);
    ctx.fillStyle = '#8190b7'; ctx.font = '12px "DM Mono", monospace'; ctx.fillText('ENTER OR CLICK TO BEGIN AGAIN', 640, 535);
  }
  ctx.restore();
}
