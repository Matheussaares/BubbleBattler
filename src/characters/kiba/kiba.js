import { GAME_CONFIG } from '../../config.js';

export const kibaData = {
    name: 'Kiba',
    color: '#dfe6e9',
    accent: '#d63031',
    speed: GAME_CONFIG.KIBA_SPEED,
    special: 'Gatsuuga',
    specialDamage: GAME_CONFIG.KIBA_SPECIAL_DAMAGE
};

export function drawKibaRush(ctx, player, target, animationFrameCount) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(animationFrameCount * 0.28);
    ctx.strokeStyle = '#f3f6f8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#f3f6f8';
    ctx.shadowBlur = 18;
    for (let blade = 0; blade < 8; blade++) {
        ctx.rotate((Math.PI * 2) / 8);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(10, -4);
        ctx.lineTo(28, 0);
        ctx.lineTo(10, 4);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.fillStyle = '#f3f6f8';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.arc(0, 0, player.radius - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
