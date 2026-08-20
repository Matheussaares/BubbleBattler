import { GAME_CONFIG } from '../../config.js';

export const inoData = { name: 'Ino', color: '#9b59b6', accent: '#f5b7d2', speed: GAME_CONFIG.INO_SPEED, special: 'Rosa Venenosa', specialDamage: GAME_CONFIG.INO_POISON_DAMAGE };
export const chojiData = { name: 'Choji', color: '#d35400', accent: '#f39c12', speed: GAME_CONFIG.CHOJI_SPEED, special: 'Investida Borboleta' };

export function drawPoisonRose(ctx, player, target, animationFrameCount) {
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const distance = player.radius + 22;
    ctx.save(); ctx.translate(player.x + Math.cos(angle) * distance, player.y + Math.sin(angle) * distance); ctx.rotate(animationFrameCount * 0.08);
    ctx.fillStyle = '#f5b7d2'; ctx.strokeStyle = '#7d3c98'; ctx.lineWidth = 2;
    for (let petal = 0; petal < 5; petal++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.ellipse(0, -8, 6, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

export function drawChojiCharge(ctx, player, animationFrameCount) {
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = player.accent; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 14, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = player.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 10, animationFrameCount * 0.35, animationFrameCount * 0.35 + Math.PI * 1.5); ctx.stroke(); ctx.restore();
}
