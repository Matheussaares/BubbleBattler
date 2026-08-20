import { GAME_CONFIG } from '../../config.js';

export const shikamaruData = {
    name: 'Shikamaru',
    color: '#27ae60',
    accent: '#145a32',
    speed: GAME_CONFIG.SHIKAMARU_SPEED,
    special: 'Sombra Projetada',
    specialDamage: GAME_CONFIG.SHIKAMARU_SPECIAL_DAMAGE
};

function distanceBetween(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
}

function segmentIntersectsRect(start, end, rect) {
    const directionX = end.x - start.x;
    const directionY = end.y - start.y;
    let minimum = 0;
    let maximum = 1;
    for (const [origin, direction, minimumEdge, maximumEdge] of [[start.x, directionX, rect.left, rect.right], [start.y, directionY, rect.top, rect.bottom]]) {
        if (Math.abs(direction) < 0.0001) {
            if (origin < minimumEdge || origin > maximumEdge) return false;
            continue;
        }
        const near = (minimumEdge - origin) / direction;
        const far = (maximumEdge - origin) / direction;
        minimum = Math.max(minimum, Math.min(near, far));
        maximum = Math.min(maximum, Math.max(near, far));
        if (minimum > maximum) return false;
    }
    return maximum >= 0 && minimum <= 1;
}

function getShadowPath(player, target, obstacles) {
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const startDistance = player.radius - 4;
    const targetDistance = target.radius - 4;
    const start = { x: player.x + Math.cos(angle) * startDistance, y: player.y + Math.sin(angle) * startDistance };
    const end = { x: target.x - Math.cos(angle) * targetDistance, y: target.y - Math.sin(angle) * targetDistance };
    const path = [start];
    let current = start;
    const orderedObstacles = [...obstacles].sort((first, second) => distanceBetween(start, first) - distanceBetween(start, second));

    orderedObstacles.forEach(obstacle => {
        const margin = 14;
        const rect = { left: obstacle.x - margin, right: obstacle.x + obstacle.width + margin, top: obstacle.y - margin, bottom: obstacle.y + obstacle.height + margin };
        if (!segmentIntersectsRect(current, end, rect)) return;
        const topLeft = { x: rect.left, y: rect.top };
        const topRight = { x: rect.right, y: rect.top };
        const bottomLeft = { x: rect.left, y: rect.bottom };
        const bottomRight = { x: rect.right, y: rect.bottom };
        const topLength = distanceBetween(current, topLeft) + distanceBetween(topLeft, topRight) + distanceBetween(topRight, end);
        const bottomLength = distanceBetween(current, bottomLeft) + distanceBetween(bottomLeft, bottomRight) + distanceBetween(bottomRight, end);
        const detour = topLength < bottomLength ? [topLeft, topRight] : [bottomLeft, bottomRight];
        path.push(...detour);
        current = detour[1];
    });
    path.push(end);
    return path;
}

export function getShadowPathLength(player, target, obstacles) {
    const path = getShadowPath(player, target, obstacles);
    return path.slice(1).reduce((length, point, index) => length + distanceBetween(path[index], point), 0) || 1;
}

function createSerpentinePoints(points, animationFrameCount) {
    const serpentinePoints = [points[0]];
    points.slice(1).forEach((point, index) => {
        const previous = points[index];
        const segmentLength = distanceBetween(previous, point);
        const samples = Math.max(2, Math.ceil(segmentLength / 18));
        const directionX = (point.x - previous.x) / segmentLength;
        const directionY = (point.y - previous.y) / segmentLength;
        const waveX = -directionY;
        const waveY = directionX;
        for (let sample = 1; sample <= samples; sample++) {
            const progress = sample / samples;
            const wave = Math.sin(animationFrameCount * 0.22 + (index + progress) * 3.5) * 5 * Math.sin(progress * Math.PI);
            serpentinePoints.push({ x: previous.x + (point.x - previous.x) * progress + waveX * wave, y: previous.y + (point.y - previous.y) * progress + waveY * wave });
        }
    });
    return serpentinePoints;
}

export function drawShadow(ctx, player, target, animationFrameCount, obstacles) {
    const path = getShadowPath(player, target, obstacles);
    const progress = Math.max(0, Math.min(1, player.shadowProgress || 0));
    const totalLength = path.slice(1).reduce((length, point, index) => length + distanceBetween(path[index], point), 0) || 1;
    const visibleLength = totalLength * progress;
    let travelled = 0;
    const points = [path[0]];
    for (let index = 1; index < path.length; index++) {
        const segmentLength = distanceBetween(path[index - 1], path[index]);
        if (travelled + segmentLength >= visibleLength) {
            const segmentProgress = (visibleLength - travelled) / segmentLength;
            points.push({ x: path[index - 1].x + (path[index].x - path[index - 1].x) * segmentProgress, y: path[index - 1].y + (path[index].y - path[index - 1].y) * segmentProgress });
            break;
        }
        points.push(path[index]);
        travelled += segmentLength;
    }
    const serpentinePoints = createSerpentinePoints(points, animationFrameCount);
    const width = 10 + Math.sin(animationFrameCount * 0.25) * 3;

    ctx.save();
    ctx.strokeStyle = '#050505';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 18;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    serpentinePoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.strokeStyle = '#17202a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    serpentinePoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
}
