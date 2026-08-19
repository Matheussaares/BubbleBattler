import { GAME_CONFIG } from '../../config.js';

export const sasukeData = {
    name: 'Sasuke',
    color: '#3949ab',
    accent: '#80d8ff',
    speed: GAME_CONFIG.SASUKE_SPEED,
    special: 'Chidori',
    specialDamage: 28
};

export function drawChidori(ctx, player, target, animationFrameCount) {
    const rotation = animationFrameCount * 0.23;
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const handDistance = player.radius + 18;
    const orbX = player.x + Math.cos(angle) * handDistance;
    const orbY = player.y + Math.sin(angle) * handDistance;
    ctx.save();
    ctx.translate(orbX, orbY);
    ctx.shadowBlur = 22;
    ctx.shadowColor = '#b8efff';
    ctx.fillStyle = '#dffbff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let ray = 0; ray < 6; ray++) {
        const rayAngle = rotation + ray * Math.PI * 2 / 6;
        const inner = 11;
        const outer = 35 + (ray % 2) * 7;
        ctx.strokeStyle = ray % 2 ? '#d7c8ff' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rayAngle) * inner, Math.sin(rayAngle) * inner);
        ctx.lineTo(Math.cos(rayAngle + 0.18) * (inner + 10), Math.sin(rayAngle + 0.18) * (inner + 10));
        ctx.lineTo(Math.cos(rayAngle - 0.08) * outer, Math.sin(rayAngle - 0.08) * outer);
        ctx.stroke();
    }
    ctx.restore();
}
