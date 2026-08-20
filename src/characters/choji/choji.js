import { GAME_CONFIG } from '../../config.js';

export const chojiData = {
    name: 'Choji',
    color: '#d35400',
    accent: '#f39c12',
    speed: GAME_CONFIG.CHOJI_SPEED,
    special: 'Investida Borboleta'
};

export function drawChojiCharge(ctx, player, animationFrameCount) {
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = player.accent; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 14, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = player.accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 10, animationFrameCount * 0.35, animationFrameCount * 0.35 + Math.PI * 1.5); ctx.stroke(); ctx.restore();
}
