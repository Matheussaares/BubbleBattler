import { GAME_CONFIG } from '../../config.js';

export const shinoData = {
    name: 'Shino',
    color: '#b39ddb',
    accent: '#7c3aed',
    speed: GAME_CONFIG.SHINO_SPEED,
    special: 'Besouros Teleguiados',
    specialDamage: GAME_CONFIG.SHINO_SPECIAL_DAMAGE
};

export function drawShinoBeetles(ctx, projectiles) {
    ctx.save();
    projectiles.filter(projectile => projectile.type === 'shino').forEach(projectile => {
        ctx.fillStyle = '#6d28d9';
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(projectile.x, projectile.y, 9, 6, projectile.direction, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    ctx.restore();
}
