import { GAME_CONFIG } from '../../config.js';

export const hinataData = {
    name: 'Hinata',
    color: '#dfe4ef',
    accent: '#1f3a5f',
    speed: GAME_CONFIG.HINATA_SPEED,
    special: 'Byakugan',
    specialDamage: GAME_CONFIG.HINATA_SPECIAL_DAMAGE
};

export function drawHinataRotation(ctx, player, target, animationFrameCount) {
    const baseRadius = player.radius + 12;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(animationFrameCount * 0.2);
    ctx.strokeStyle = '#7ab8ff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#7ab8ff';
    for (let slice = 0; slice < 10; slice++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos((slice / 10) * Math.PI * 2) * baseRadius, Math.sin((slice / 10) * Math.PI * 2) * baseRadius);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = 'rgba(122,184,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
