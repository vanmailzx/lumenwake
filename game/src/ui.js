import { WIDTH } from './config.js';
import { UPGRADES } from './upgrades.js';

function text(ctx, value, x, y, font, color, align = 'center') {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y);
}

function panel(ctx, x, y, width, height, fill = '#0b1026dd') {
  ctx.fillStyle = fill; ctx.strokeStyle = '#bdc8ff30'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 16); ctx.fill(); ctx.stroke();
}

export function drawHud(ctx, world, audio) {
  const player = world.player;
  ctx.save(); ctx.fillStyle = '#f5f2ff'; ctx.shadowBlur = 12; ctx.shadowColor = '#8d77ff';
  text(ctx, 'LUMENWAKE', 76, 42, '800 18px Georgia, serif', '#f5f2ff', 'left'); ctx.shadowBlur = 0;
  text(ctx, `WAVE ${String(Math.max(0, world.wave)).padStart(2, '0')}  ·  ${world.wave >= 12 ? 'DAWN VAULT' : world.wave >= 7 ? 'NEBULA REEF' : 'STAR GARDEN'}`, 76, 65, '11px "DM Mono", monospace', '#aeb8d8', 'left');
  text(ctx, String(world.score).padStart(7, '0'), 1204, 43, '700 21px Manrope, sans-serif', '#c5b9ff', 'right');
  text(ctx, 'LIGHT SCORE', 1204, 64, '10px "DM Mono", monospace', '#8b97ba', 'right');
  if (world.combo > 1) {
    const scale = 1 + Math.sin(world.elapsed * 11) * 0.07;
    ctx.save(); ctx.translate(640, 104); ctx.scale(scale, scale); ctx.shadowBlur = 18; ctx.shadowColor = '#ffcf79';
    text(ctx, `CHAIN ×${Math.min(5, 1 + Math.floor(world.combo / 4))}`, 0, 0, '800 18px Manrope, sans-serif', '#ffe2a0'); ctx.restore();
    ctx.fillStyle = '#2d2642'; ctx.fillRect(530, 114, 220, 3); ctx.fillStyle = '#ffcf79'; ctx.fillRect(530, 114, 220 * world.comboClock / 3.2, 3);
  }
  text(ctx, 'VITALS', 76, 703, '10px "DM Mono", monospace', '#9ca9ce', 'left');
  for (let index = 0; index < player.maxHp; index++) {
    const x = 130 + index * 23; ctx.shadowBlur = index < player.hp ? 12 : 0; ctx.shadowColor = '#74f4df';
    ctx.fillStyle = index < player.hp ? '#74f4df' : '#27314f'; ctx.beginPath(); ctx.arc(x, 699, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0; text(ctx, 'ECHO DASH', 300, 703, '10px "DM Mono", monospace', '#9ca9ce', 'left');
  ctx.fillStyle = '#26304d'; ctx.fillRect(385, 694, 88, 6); ctx.fillStyle = '#8d77ff'; ctx.fillRect(385, 694, 88 * (1 - player.dashCooldown / 2.4), 6);
  const active = Object.keys(world.upgrades).filter(key => world.upgrades[key]);
  active.slice(0, 8).forEach((id, index) => {
    const upgrade = UPGRADES.find(item => item.id === id); const x = 510 + index * 32;
    ctx.fillStyle = '#131a35dd'; ctx.strokeStyle = `${upgrade.color}90`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, 681, 27, 27, 7); ctx.fill(); ctx.stroke();
    text(ctx, upgrade.icon, x + 13.5, 700, '14px Manrope, sans-serif', upgrade.color);
  });
  text(ctx, audio.enabled ? 'M · SOUND ON' : 'M · SOUND OFF', WIDTH - 76, 703, '10px "DM Mono", monospace', '#8190b7', 'right');
  if (world.waveBanner > 0 && world.status === 'playing') {
    ctx.globalAlpha = Math.min(1, world.waveBanner * 1.8);
    const title = world.wave === 5 ? 'THE WATCHER STIRS' : world.wave === 10 ? 'CINDER CHORUS' : world.wave === 15 ? 'THE UMBRAL CHOIR' : `GARDEN ${String(world.wave).padStart(2, '0')}`;
    text(ctx, title, WIDTH / 2, 155, '800 31px Georgia, serif', '#f5f2ff');
    text(ctx, world.wave === 5 || world.wave === 10 || world.wave === 15 ? 'BREAK THE HARMONY' : 'KEEP THE LIGHT MOVING', WIDTH / 2, 179, '11px "DM Mono", monospace', '#a9b6d5');
  }
  ctx.restore();
}

function button(ctx, label, x, y, width = 260) {
  const gradient = ctx.createLinearGradient(x - width / 2, y, x + width / 2, y + 48);
  gradient.addColorStop(0, '#d8beff'); gradient.addColorStop(0.5, '#9b8cff'); gradient.addColorStop(1, '#74dff1');
  ctx.shadowBlur = 28; ctx.shadowColor = '#887dff66'; ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.roundRect(x - width / 2, y - 24, width, 48, 10); ctx.fill(); ctx.shadowBlur = 0;
  text(ctx, label, x, y + 5, '800 12px Manrope, sans-serif', '#101632');
}

function stats(ctx, world, y) {
  panel(ctx, 390, y, 500, 84, '#11162bd9');
  const duration = Math.floor(world.resultTime || world.elapsed);
  const values = [
    ['LIGHT', String(world.score).padStart(6, '0')], ['WAVES', String(Math.max(0, world.wave)).padStart(2, '0')],
    ['TIME', `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`], ['BEST CHAIN', `×${Math.max(1, world.bestCombo)}`],
  ];
  values.forEach(([label, value], index) => {
    const x = 452 + index * 124; text(ctx, value, x, y + 39, '700 19px Manrope, sans-serif', index === 0 ? '#ffdc9d' : '#f2efff');
    text(ctx, label, x, y + 62, '9px "DM Mono", monospace', '#8995b7');
  });
}

export function drawOverlay(ctx, world) {
  if (!['title', 'paused', 'gameover', 'victory'].includes(world.status)) return;
  const title = world.status === 'title'; const victory = world.status === 'victory';
  ctx.save();
  const veil = ctx.createLinearGradient(0, 0, 0, 720);
  veil.addColorStop(0, title ? '#060a19a8' : victory ? '#3229496a' : '#070a18ad');
  veil.addColorStop(1, title ? '#050817d9' : victory ? '#c9876566' : '#060815e8');
  ctx.fillStyle = veil; ctx.fillRect(0, 0, 1280, 720);
  if (title) {
    const beam = (Math.sin(world.elapsed * 0.8) + 1) * 440;
    const sweep = ctx.createLinearGradient(beam, 0, beam + 340, 0);
    sweep.addColorStop(0, '#ffffff00'); sweep.addColorStop(0.5, '#b5d8ff18'); sweep.addColorStop(1, '#ffffff00'); ctx.fillStyle = sweep; ctx.fillRect(0, 0, 1280, 720);
    text(ctx, 'A STAR-GARDEN SURVIVAL ARENA', 640, 211, '12px "DM Mono", monospace', '#8df1e2');
    ctx.shadowBlur = 36; ctx.shadowColor = '#9c8aff';
    text(ctx, 'LUMENWAKE', 640, 326, '700 86px Georgia, "Times New Roman", serif', '#f4edff'); ctx.shadowBlur = 0;
    text(ctx, 'WHERE EVERY LAST LIGHT LEARNS TO BLOOM', 640, 365, '13px "DM Mono", monospace', '#c4cae4');
    button(ctx, 'PRESS ANYWHERE TO WAKE THE GARDEN', 640, 458, 370);
    text(ctx, 'WASD / ARROWS MOVE     SPACE / CLICK FIRE     SHIFT DASH     P PAUSE', 640, 538, '11px "DM Mono", monospace', '#9aa7cb');
    text(ctx, `BEST LIGHT  ${String(world.best).padStart(7, '0')}     M · SOUND`, 640, 577, '11px "DM Mono", monospace', '#7f8bb0');
  } else if (world.status === 'paused') {
    panel(ctx, 360, 213, 560, 300);
    text(ctx, 'THE GARDEN HOLDS ITS BREATH', 640, 278, '11px "DM Mono", monospace', '#8df1e2');
    text(ctx, 'PAUSED', 640, 355, '700 64px Georgia, serif', '#f4edff');
    text(ctx, 'Every orbit waits for your return.', 640, 390, '15px Manrope, sans-serif', '#aeb8d6');
    button(ctx, 'RETURN TO THE GARDEN', 640, 454);
    text(ctx, 'PRESS P OR ENTER TO RESUME', 640, 496, '10px "DM Mono", monospace', '#8b97ba');
  } else {
    const won = victory;
    text(ctx, won ? 'THE LONG NIGHT OPENS ITS HAND' : 'A SMALL LIGHT STILL REMEMBERS', 640, 202, '11px "DM Mono", monospace', won ? '#ffe2aa' : '#8df1e2');
    ctx.shadowBlur = 32; ctx.shadowColor = won ? '#ffca87' : '#bd9cff';
    text(ctx, won ? 'DAWN, AT LAST' : 'THE GARDEN DIMS', 640, 292, '700 61px Georgia, serif', '#fff3df'); ctx.shadowBlur = 0;
    text(ctx, won ? 'You carried a garden through the dark.' : 'Even the dark cannot unmake what you grew.', 640, 330, '15px Manrope, sans-serif', '#d2d5e5');
    stats(ctx, world, 368);
    button(ctx, won ? 'PRESS ANYWHERE TO BEGIN AGAIN' : 'PRESS ANYWHERE TO REPLANT', 640, 500, 340);
    text(ctx, `BEST LIGHT  ${String(world.best).padStart(7, '0')}   ·   ENTER OR CLICK`, 640, 552, '10px "DM Mono", monospace', '#9ca9ce');
  }
  ctx.restore();
}

export function drawUpgradeOverlay(ctx, world) {
  ctx.save(); ctx.fillStyle = '#080d20c9'; ctx.fillRect(0, 0, WIDTH, 720);
  text(ctx, 'THE GARDEN OFFERS A NEW SHAPE', 640, 188, '11px "DM Mono", monospace', '#8df1e2');
  text(ctx, 'CHOOSE YOUR LIGHT', 640, 245, '700 42px Georgia, serif', '#f4edff');
  const choices = world.upgradeChoices || [];
  choices.forEach((upgrade, index) => {
    const x = 263 + index * 277; const y = 301;
    panel(ctx, x - 119, y, 238, 224, '#111831f2');
    ctx.strokeStyle = `${upgrade.color}88`; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - 119, y, 238, 224, 16); ctx.stroke();
    ctx.shadowBlur = 25; ctx.shadowColor = upgrade.color; text(ctx, upgrade.icon, x, y + 66, '48px Manrope, sans-serif', upgrade.color); ctx.shadowBlur = 0;
    text(ctx, `${index + 1}  ·  ${upgrade.name}`, x, y + 115, '700 16px Manrope, sans-serif', '#f4edff');
    text(ctx, upgrade.text, x, y + 150, '12px Manrope, sans-serif', '#aeb9d8');
    text(ctx, 'CHOOSE', x, y + 194, '10px "DM Mono", monospace', '#7f8bb0');
  });
  text(ctx, 'PRESS 1 / 2 / 3 OR CLICK A CARD', 640, 570, '11px "DM Mono", monospace', '#a8b4d5');
  ctx.restore();
}
