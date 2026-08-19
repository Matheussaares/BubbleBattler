import { GAME_CONFIG } from '../../config.js';

export const narutoData = {
    name: 'Naruto',
    color: '#f07818',
    accent: '#ffd166',
    speed: GAME_CONFIG.NARUTO_SPEED,
    special: 'Rasengan',
    specialDamage: 24
};

export function drawRasengan(ctx, player, target, animationFrameCount) {
    const rotation = animationFrameCount * 0.16;
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const handDistance = player.radius + 18;
    const orbX = player.x + Math.cos(angle) * handDistance;
    const orbY = player.y + Math.sin(angle) * handDistance;
    ctx.save();
    ctx.translate(orbX, orbY);
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#66d9ff';
    ctx.fillStyle = '#36a9ff';
    ctx.strokeStyle = '#d9f8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190, 245, 255, 0.7)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(angle) * 18, -Math.sin(angle) * 18);
    ctx.lineTo(-Math.cos(angle) * 36, -Math.sin(angle) * 36);
    ctx.stroke();
    for (let spiral = 0; spiral < 4; spiral++) {
        ctx.save();
        ctx.rotate(rotation + spiral * Math.PI / 2);
        ctx.strokeStyle = spiral % 2 ? '#b8f2ff' : '#168de2';
        ctx.beginPath();
        ctx.arc(0, 0, 25 + spiral * 2, -1.2, 1.2);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}
