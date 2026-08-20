import { GAME_CONFIG } from '../../config.js';

export const shinoData = {
    name: 'Shino',
    color: '#dfe6e9',
    accent: '#b39ddb',
    speed: GAME_CONFIG.SHINO_SPEED,
    special: 'Besouros Teleguiados',
    specialDamage: GAME_CONFIG.SHINO_SPECIAL_DAMAGE
};

export function drawShinoBeetles(ctx, player, target, animationFrameCount) {
    const spread = 26;

    ctx.save();
    for (let beetle = 0; beetle < 3; beetle++) {
        const offset = (beetle - 1) * spread;
        const x = player.x + Math.cos((beetle - 1) * 0.8 + animationFrameCount * 0.06) * (player.radius + 18 + offset * 0.4);
        const y = player.y + Math.sin((beetle - 1) * 0.8 + animationFrameCount * 0.06) * (player.radius + 18 + offset * 0.4);
        ctx.fillStyle = '#d8b4fe';
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 6, animationFrameCount * 0.08 + beetle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}
