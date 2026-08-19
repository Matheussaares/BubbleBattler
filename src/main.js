const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
import { GAME_CONFIG } from './config.js';
import { narutoData, drawRasengan } from './characters/naruto/naruto.js';
import { sasukeData, drawChidori } from './characters/sasuke/sasuke.js';
import { sakuraData } from './characters/sakura/sakura.js';

const characterData = {
    naruto: narutoData,
    sasuke: sasukeData,
    sakura: sakuraData
};
const characters = Object.keys(characterData);
let p1Selection = null;
let p2Selection = null;
let gameMode = 'pvp';
let aiDifficulty = 'easy';
let isPaused = false;
let gameOver = false;
let gameInterval = null;
let keys = {};
let p1;
let p2;
let gems = [];
let obstacles = [];
let particles = [];
let animationFrameCount = 0;
let gemSpawnTimer = 0;
let obstacleCycleTimer = 0;
let obstacleRespawnDelay = 0;

const startButton = document.getElementById('start-btn');

document.getElementById('game-mode').addEventListener('change', event => {
    gameMode = event.target.value;
    const aiContainer = document.getElementById('ai-difficulty-container');
    const p1Title = document.getElementById('p1-title');
    const p2Title = document.getElementById('p2-title');
    if (gameMode === 'pvp') {
        aiContainer.classList.add('hidden');
        p1Title.innerText = "Jogador 1 (WASD | Esp. 'E')";
        p2Title.innerText = "Jogador 2 (Setas | Esp. 'Shift')";
        p2Selection = null;
        document.querySelectorAll('.character-btn[data-player="2"]').forEach(button => button.classList.remove('selected'));
        startButton.disabled = true;
        return;
    }
    aiContainer.classList.remove('hidden');
    p1Title.innerText = gameMode === 'ai-ai' ? 'Máquina 1 (IA | Especial Auto)' : "Jogador 1 (WASD | Esp. 'E')";
    p2Title.innerText = gameMode === 'ai-ai' ? 'Máquina 2 (IA | Especial Auto)' : 'Máquina (IA | Especial Auto)';
    if (!p1Selection) p1Selection = characters[Math.floor(Math.random() * characters.length)];
    const available = characters.filter(character => character !== p1Selection);
    if (!p2Selection || p2Selection === p1Selection) p2Selection = available[Math.floor(Math.random() * available.length)];
    updateCharacterSelection(1, p1Selection);
    updateCharacterSelection(2, p2Selection);
    startButton.disabled = false;
});

document.getElementById('ai-level').addEventListener('change', event => { aiDifficulty = event.target.value; });
document.querySelectorAll('.character-btn').forEach(button => {
    button.addEventListener('click', event => {
        const selectedButton = event.currentTarget;
        const player = selectedButton.dataset.player;
        const character = selectedButton.getAttribute('data-character');
        document.querySelectorAll(`.character-btn[data-player="${player}"]`).forEach(item => item.classList.remove('selected'));
        selectedButton.classList.add('selected');
        if (player === '1') p1Selection = character;
        else p2Selection = character;
        if (gameMode !== 'pvp' && player === '1' && p1Selection) {
            p2Selection = characters.filter(item => item !== p1Selection)[Math.floor(Math.random() * 2)];
            updateCharacterSelection(2, p2Selection);
        }
        if (gameMode !== 'pvp') {
            startButton.disabled = false;
        } else {
            startButton.disabled = !(p1Selection && p2Selection);
        }
    });
});

function updateCharacterSelection(player, character) {
    document.querySelectorAll(`.character-btn[data-player="${player}"]`).forEach(button => {
        button.classList.toggle('selected', button.getAttribute('data-character') === character);
    });
}

document.getElementById('start-btn').addEventListener('click', () => {
    if (!p1Selection || !p2Selection) return;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    initGame();
});
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('in-game-restart-btn').addEventListener('click', initGame);
document.getElementById('exit-btn').addEventListener('click', returnToMenu);
document.getElementById('restart-btn').addEventListener('click', returnToMenu);

function initGame() {
    isPaused = false;
    gameOver = false;
    gems = [];
    particles = [];
    animationFrameCount = 0;
    gemSpawnTimer = 0;
    p1 = createPlayer(200, 300, p1Selection, 3, 2);
    p2 = createPlayer(600, 300, p2Selection, -3, -2);
    obstacles = createObstacles();
    obstacleCycleTimer = 120 + Math.floor(Math.random() * 61);
    obstacleRespawnDelay = 0;
    spawnGem(p1.x - 90, p1.y);
    spawnGem(p2.x + 90, p2.y);
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('pause-btn').innerText = 'Pausar';
    document.getElementById('winner-text').innerText = '';
    document.getElementById('restart-btn').classList.add('hidden');
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (gameInterval) clearInterval(gameInterval);
    draw();
    gameInterval = setInterval(update, 1000 / GAME_CONFIG.FRAME_RATE);
}

function createPlayer(x, y, character, vx, vy) {
    return { x, y, radius: GAME_CONFIG.PLAYER_RADIUS, hp: GAME_CONFIG.INITIAL_HP, gems: 0, character, ...characterData[character], vx, vy, specialActive: false, specialTimer: 0, specialDashTimer: 0, attackCooldown: 0, aiDecisionTimer: 0, aiAttackTimer: 70, aiGemFocusTimer: 0, aiStrafeDirection: 1 };
}

function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    document.getElementById('pause-screen').classList.toggle('hidden', !isPaused);
    document.getElementById('pause-btn').innerText = isPaused ? 'Continuar' : 'Pausar';
}
function returnToMenu() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = null;
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    keys = {};
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('game-container').classList.add('hidden');
}
function handleKeyDown(event) {
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift'].includes(event.key)) event.preventDefault();
    keys[event.key] = true;
    if ((event.key === 'e' || event.key === 'E') && p1 && p1.gems >= 3 && !p1.specialActive) activateSpecial(p1);
    if (event.key === 'Shift' && p2 && p2.gems >= 3 && !p2.specialActive) activateSpecial(p2);
}
function handleKeyUp(event) { keys[event.key] = false; }

function activateSpecial(player) {
    player.gems = 0;
    player.specialActive = true;
    player.specialTimer = player.character === 'sakura' ? GAME_CONFIG.SAKURA_SPECIAL_DURATION : GAME_CONFIG.SPECIAL_DURATION;
    player.specialDashTimer = player.character === 'sakura' ? 0 : 22;
    createExplosion(player.x, player.y, player.accent, player.character === 'sakura' ? 10 : 5);
}
function createExplosion(x, y, color, amount = 8) {
    for (let particle = 0; particle < amount; particle++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: Math.random() * 4 + 2, color, alpha: 1 });
    }
}
function spawnGem(x = Math.random() * (canvas.width - 60) + 30, y = Math.random() * (canvas.height - 60) + 30) {
    let gemX = x;
    let gemY = y;
    let attempts = 0;
    while (isGemBlocked(gemX, gemY) && attempts < 60) {
        gemX = Math.random() * (canvas.width - 60) + 30;
        gemY = Math.random() * (canvas.height - 60) + 30;
        attempts++;
    }
    if (!isGemBlocked(gemX, gemY)) gems.push({ x: gemX, y: gemY, radius: 12 });
}
function isGemBlocked(x, y) {
    return obstacles.some(obstacle => {
        const nearestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
        const nearestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
        return Math.hypot(x - nearestX, y - nearestY) < 18;
    });
}
function spawnGemPair() {
    spawnGem();
    spawnGem();
}
function createObstacles() {
    const generated = [];
    let attempts = 0;
    const obstacleCount = 3 + Math.floor(Math.random() * 4);
    while (generated.length < obstacleCount && attempts < 100) {
        attempts++;
        const obstacle = {
            x: Math.random() * (canvas.width - 260) + 130,
            y: Math.random() * (canvas.height - 180) + 90,
            width: 45 + Math.random() * 45,
            height: 35 + Math.random() * 45
        };
        const overlapsStart = [p1, p2].some(player => player && player.x > obstacle.x - player.radius && player.x < obstacle.x + obstacle.width + player.radius && player.y > obstacle.y - player.radius && player.y < obstacle.y + obstacle.height + player.radius);
        const overlapsOther = generated.some(item => obstacle.x < item.x + item.width + 35 && obstacle.x + obstacle.width + 35 > item.x && obstacle.y < item.y + item.height + 35 && obstacle.y + obstacle.height + 35 > item.y);
        if (!overlapsStart && !overlapsOther) generated.push(obstacle);
    }
    return generated;
}
function moveBlockedGems() {
    gems.forEach(gem => {
        if (!isGemBlocked(gem.x, gem.y)) return;
        let attempts = 0;
        do {
            gem.x = Math.random() * (canvas.width - 60) + 30;
            gem.y = Math.random() * (canvas.height - 60) + 30;
            attempts++;
        } while (isGemBlocked(gem.x, gem.y) && attempts < 60);
    });
}
function update() {
    if (isPaused || gameOver) return;
    animationFrameCount++;
    gemSpawnTimer++;
    if (obstacleRespawnDelay > 0) {
        obstacleRespawnDelay--;
    } else {
        obstacleCycleTimer--;
    }
    if (obstacleCycleTimer <= 0 && obstacleRespawnDelay === 0 && obstacles.length > 0) {
        obstacles = [];
        obstacleRespawnDelay = 20;
    }
    if (obstacleRespawnDelay === 0 && obstacles.length === 0) {
        obstacles = createObstacles();
        moveBlockedGems();
        obstacleCycleTimer = 120 + Math.floor(Math.random() * 61);
    }
    if (gemSpawnTimer > 150 && gems.length < 2) {
        spawnGemPair();
        gemSpawnTimer = 0;
    }
    let p1Ax = 0;
    let p1Ay = 0;
    if (keys.w || keys.W) p1Ay = -0.42;
    if (keys.s || keys.S) p1Ay = 0.42;
    if (keys.a || keys.A) p1Ax = -0.42;
    if (keys.d || keys.D) p1Ax = 0.42;
    let p2Ax = 0;
    let p2Ay = 0;
    if (gameMode === 'pvp') {
        if (keys.ArrowUp) p2Ay = -0.42;
        if (keys.ArrowDown) p2Ay = 0.42;
        if (keys.ArrowLeft) p2Ax = -0.42;
        if (keys.ArrowRight) p2Ax = 0.42;
    } else {
        const aiSpeed = aiDifficulty === 'hard' ? 0.5 : aiDifficulty === 'medium' ? 0.36 : 0.25;
        const p2Move = getAiMove(p2, p1, aiSpeed);
        p2Ax = p2Move.x;
        p2Ay = p2Move.y;
        if (gameMode === 'ai-ai') {
            const p1Move = getAiMove(p1, p2, aiSpeed);
            p1Ax = p1Move.x;
            p1Ay = p1Move.y;
        }
    }
    if (gameMode === 'ai' || gameMode === 'ai-ai') {
        if (p2.gems >= 3 && !p2.specialActive) activateSpecial(p2);
    }
    if (gameMode === 'ai-ai' && p1.gems >= 3 && !p1.specialActive) activateSpecial(p1);
    updateSpecial(p1);
    updateSpecial(p2);
    p1.attackCooldown = Math.max(0, p1.attackCooldown - 1);
    p2.attackCooldown = Math.max(0, p2.attackCooldown - 1);
    movePlayer(p1, p1Ax, p1Ay);
    movePlayer(p2, p2Ax, p2Ay);
    resolveObstacleCollision(p1);
    resolveObstacleCollision(p2);
    updateParticles();
    collectGems();
    collidePlayers();
    updateHud();
    draw();
}
function resolveObstacleCollision(player) {
    obstacles.forEach(obstacle => {
        const nearestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
        const nearestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));
        let offsetX = player.x - nearestX;
        let offsetY = player.y - nearestY;
        const distance = Math.hypot(offsetX, offsetY);
        if (distance >= player.radius) return;
        if (distance === 0) {
            const left = player.x - obstacle.x;
            const right = obstacle.x + obstacle.width - player.x;
            const top = player.y - obstacle.y;
            const bottom = obstacle.y + obstacle.height - player.y;
            const smallest = Math.min(left, right, top, bottom);
            if (smallest === left) { offsetX = -1; offsetY = 0; }
            else if (smallest === right) { offsetX = 1; offsetY = 0; }
            else if (smallest === top) { offsetX = 0; offsetY = -1; }
            else { offsetX = 0; offsetY = 1; }
        } else {
            offsetX /= distance;
            offsetY /= distance;
        }
        const pushDistance = distance === 0 ? player.radius : player.radius - distance;
        player.x += offsetX * pushDistance;
        player.y += offsetY * pushDistance;
        const velocityAlongNormal = player.vx * offsetX + player.vy * offsetY;
        if (velocityAlongNormal < 0) {
            player.vx -= velocityAlongNormal * offsetX * 1.2;
            player.vy -= velocityAlongNormal * offsetY * 1.2;
        }
        player.aiDecisionTimer = 0;
    });
}
function getAiMove(player, opponent, speed) {
    let x = opponent.x - player.x;
    let y = opponent.y - player.y;
    const distance = Math.hypot(x, y) || 1;

    player.aiDecisionTimer--;
    if (player.aiDecisionTimer <= 0) {
        player.aiDecisionTimer = 35 + Math.floor(Math.random() * 35);
        player.aiStrafeDirection = Math.random() < 0.5 ? -1 : 1;
    }

    player.aiGemFocusTimer = Math.max(0, player.aiGemFocusTimer - 1);
    if (player.aiGemFocusTimer > 0 && player.gems < 3 && gems.length) {
        const gem = gems.reduce((closest, item) => Math.hypot(player.x - item.x, player.y - item.y) < Math.hypot(player.x - closest.x, player.y - closest.y) ? item : closest);
        x = gem.x - player.x;
        y = gem.y - player.y;
    } else if (opponent.specialActive && opponent.character !== 'sakura' && distance < 250) {
        const awayX = player.x - opponent.x;
        const awayY = player.y - opponent.y;
        const perpendicularX = -awayY * player.aiStrafeDirection;
        const perpendicularY = awayX * player.aiStrafeDirection;
        x = awayX * 0.72 + perpendicularX * 0.28;
        y = awayY * 0.72 + perpendicularY * 0.28;
    } else if (player.specialActive) {
        x = opponent.x - player.x;
        y = opponent.y - player.y;
    } else if (player.gems < 3 && gems.length) {
        const gem = gems.reduce((closest, item) => Math.hypot(player.x - item.x, player.y - item.y) < Math.hypot(player.x - closest.x, player.y - closest.y) ? item : closest);
        x = gem.x - player.x;
        y = gem.y - player.y;
    } else if (distance < 190) {
        player.aiAttackTimer--;
        if (player.aiAttackTimer <= 0) player.aiAttackTimer = 55 + Math.floor(Math.random() * 45);
        const isAttacking = player.aiAttackTimer > 25;
        const perpendicularX = -y * player.aiStrafeDirection;
        const perpendicularY = x * player.aiStrafeDirection;
        const approachWeight = isAttacking ? 0.9 : 0.2;
        x = x * approachWeight + perpendicularX * (1 - approachWeight);
        y = y * approachWeight + perpendicularY * (1 - approachWeight);
    } else if (distance < 145) {
        x = player.x - opponent.x;
        y = player.y - opponent.y;
    }
    const length = Math.hypot(x, y) || 1;
    const collectingGems = player.gems < 3 && gems.length > 0;
    const movementSpeed = speed * (collectingGems ? 1.25 : player.specialActive && player.character !== 'sakura' ? 1.35 : player.specialActive ? 1.15 : 1);
    return { x: x / length * movementSpeed, y: y / length * movementSpeed };
}
function updateSpecial(player) {
    if (!player.specialActive) return;
    player.specialTimer--;
    player.specialDashTimer = Math.max(0, player.specialDashTimer - 1);
    if (player.character === 'sakura' && player.specialTimer % 15 === 0) {
        player.hp = Math.min(GAME_CONFIG.INITIAL_HP, player.hp + GAME_CONFIG.SAKURA_HEAL_AMOUNT);
        createExplosion(player.x, player.y, player.accent, 3);
    }
    if (player.specialTimer <= 0) player.specialActive = false;
}
function movePlayer(player, ax, ay) {
    if (['naruto', 'sasuke'].includes(player.character) && player.specialActive) {
        const target = player === p1 ? p2 : p1;
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const dashForce = player.specialDashTimer > 0 ? 2.1 : 0.85;
        ax += Math.cos(angle) * dashForce;
        ay += Math.sin(angle) * dashForce;
    }
    if (ax || ay) { player.vx *= 0.9; player.vy *= 0.9; }
    player.vx += ax;
    player.vy += ay;
    const speed = Math.hypot(player.vx, player.vy);
    const maxSpeed = player.speed * (player.specialActive && player.character !== 'sakura' ? 1.45 : 1);
    if (speed > maxSpeed) { player.vx = player.vx / speed * maxSpeed; player.vy = player.vy / speed * maxSpeed; }
    player.x += player.vx;
    player.y += player.vy;
    if (player.x - player.radius < 0 || player.x + player.radius > canvas.width) { player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x)); player.vx *= -1; }
    if (player.y - player.radius < 0 || player.y + player.radius > canvas.height) { player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y)); player.vy *= -1; }
}
function updateParticles() {
    particles.forEach((particle, index) => { particle.x += particle.vx; particle.y += particle.vy; particle.alpha -= 0.03; if (particle.alpha <= 0) particles.splice(index, 1); });
}
function collectGems() {
    gems.forEach((gem, index) => {
        if (Math.hypot(p1.x - gem.x, p1.y - gem.y) < p1.radius + gem.radius) { if (p1.gems < 3) p1.gems++; gems.splice(index, 1); }
        else if (Math.hypot(p2.x - gem.x, p2.y - gem.y) < p2.radius + gem.radius) { if (p2.gems < 3) p2.gems++; gems.splice(index, 1); }
    });
}
function collidePlayers() {
    const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    if (distance >= p1.radius + p2.radius) return;
    const p1Offensive = p1.specialActive && p1.character !== 'sakura';
    const p2Offensive = p2.specialActive && p2.character !== 'sakura';
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const normalX = Math.cos(angle);
    const normalY = Math.sin(angle);
    const overlap = p1.radius + p2.radius - distance;
    const separation = overlap * 0.5 + 4;
    p1.x -= normalX * separation; p1.y -= normalY * separation;
    p2.x += normalX * separation; p2.y += normalY * separation;
    const relativeVelocity = (p2.vx - p1.vx) * normalX + (p2.vy - p1.vy) * normalY;
    const bounceImpulse = Math.max(1.7, Math.min(3.1, Math.abs(relativeVelocity) * 0.7 + 1.4));
    p1.vx = p1.vx * 0.58 - normalX * bounceImpulse;
    p1.vy = p1.vy * 0.58 - normalY * bounceImpulse;
    p2.vx = p2.vx * 0.58 + normalX * bounceImpulse;
    p2.vy = p2.vy * 0.58 + normalY * bounceImpulse;
    p1.aiGemFocusTimer = 60;
    p2.aiGemFocusTimer = 60;
    p1.aiDecisionTimer = 0;
    p2.aiDecisionTimer = 0;
    if (p1Offensive && p2Offensive) {
        p1.hp -= GAME_CONFIG.CONTACT_DAMAGE * 6;
        p2.hp -= GAME_CONFIG.CONTACT_DAMAGE * 6;
        p1.specialActive = false;
        p2.specialActive = false;
        createExplosion((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, '#ffffff', 18);
        return;
    }
    if (p1Offensive) {
        p2.hp -= p1.character === 'naruto' ? GAME_CONFIG.NARUTO_SPECIAL_DAMAGE : GAME_CONFIG.SASUKE_SPECIAL_DAMAGE;
        p1.specialActive = false;
        p1.attackCooldown = 20;
        createExplosion(p2.x, p2.y, p1.accent, 14);
        return;
    }
    if (p2Offensive) {
        p1.hp -= p2.character === 'naruto' ? GAME_CONFIG.NARUTO_SPECIAL_DAMAGE : GAME_CONFIG.SASUKE_SPECIAL_DAMAGE;
        p2.specialActive = false;
        p2.attackCooldown = 20;
        createExplosion(p1.x, p1.y, p2.accent, 14);
        return;
    }
    if (p1.attackCooldown <= 0) {
            p2.hp -= GAME_CONFIG.CONTACT_DAMAGE;
            p1.attackCooldown = 34;
            createExplosion(p2.x, p2.y, p1.accent, 5);
    }
    if (p2.attackCooldown <= 0) {
            p1.hp -= GAME_CONFIG.CONTACT_DAMAGE;
            p2.attackCooldown = 34;
            createExplosion(p1.x, p1.y, p2.accent, 5);
    }
}
function updateHud() {
    document.getElementById('p1-hp').innerText = Math.max(0, Math.ceil(p1.hp));
    document.getElementById('p1-gems').innerText = p1.gems;
    document.getElementById('p1-spec').innerText = p1.specialActive ? `${p1.special} ATIVO!` : p1.gems >= 3 ? 'ESPECIAL PRONTO!' : '';
    document.getElementById('p2-hp').innerText = Math.max(0, Math.ceil(p2.hp));
    document.getElementById('p2-gems').innerText = p2.gems;
    document.getElementById('p2-spec').innerText = p2.specialActive ? `${p2.special} ATIVO!` : p2.gems >= 3 ? 'ESPECIAL PRONTO!' : '';
    if (p1.hp <= 0 || p2.hp <= 0) {
        gameOver = true;
        clearInterval(gameInterval);
        document.getElementById('winner-text').innerText = p1.hp <= 0 ? p2.hp <= 0 ? 'Empate!' : `${p2.name} venceu!` : `${p1.name} venceu!`;
        document.getElementById('restart-btn').classList.remove('hidden');
    }
}
function draw() {
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2f3640';
    ctx.lineWidth = 1;
    for (let position = 0; position < canvas.width; position += 40) {
        ctx.beginPath(); ctx.moveTo(position, 0); ctx.lineTo(position, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, position); ctx.lineTo(canvas.width, position); ctx.stroke();
    }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, canvas.width, canvas.height);
    obstacles.forEach(obstacle => {
        ctx.fillStyle = '#485460';
        ctx.strokeStyle = '#a4b0be';
        ctx.lineWidth = 3;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    gems.forEach(gem => { ctx.beginPath(); ctx.arc(gem.x, gem.y, gem.radius + Math.sin(animationFrameCount * 0.2) * 2, 0, Math.PI * 2); ctx.fillStyle = '#fbc531'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.stroke(); });
    particles.forEach(particle => { ctx.globalAlpha = particle.alpha; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2); ctx.fillStyle = particle.color; ctx.fill(); ctx.globalAlpha = 1; });
    drawPlayer(p1); drawPlayer(p2);
}
function drawPlayer(player) {
    if (!player) return;
    ctx.save();
    if (player.specialActive && player.character === 'sakura') {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#9cff57'; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 16, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#9cff57'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = player.color; ctx.strokeStyle = player.specialActive ? player.accent : '#ffffff'; ctx.lineWidth = player.specialActive ? 5 : 4;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawHair(player);
    if (player.specialActive && player.character === 'naruto') drawRasengan(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    if (player.specialActive && player.character === 'sasuke') drawChidori(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(player.name, player.x, player.y - 3); ctx.font = 'bold 14px Arial'; ctx.fillText(Math.max(0, Math.ceil(player.hp)), player.x, player.y + 13);
    ctx.restore();
}
function drawHair(player) {
    ctx.save();
    ctx.fillStyle = player.character === 'naruto' ? '#f7b733' : player.character === 'sasuke' ? '#171b3d' : '#f28bb4';
    ctx.strokeStyle = player.character === 'naruto' ? '#d88716' : player.character === 'sasuke' ? '#080b20' : '#b94377';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (player.character === 'naruto') {
        ctx.moveTo(player.x - 29, player.y - 5); ctx.lineTo(player.x - 25, player.y - 26); ctx.lineTo(player.x - 15, player.y - 19); ctx.lineTo(player.x - 10, player.y - 34); ctx.lineTo(player.x - 1, player.y - 21); ctx.lineTo(player.x + 9, player.y - 35); ctx.lineTo(player.x + 13, player.y - 19); ctx.lineTo(player.x + 26, player.y - 28); ctx.lineTo(player.x + 24, player.y - 7);
    } else if (player.character === 'sasuke') {
        ctx.moveTo(player.x - 30, player.y - 1); ctx.lineTo(player.x - 26, player.y - 22); ctx.lineTo(player.x - 12, player.y - 17); ctx.lineTo(player.x - 7, player.y - 35); ctx.lineTo(player.x + 2, player.y - 20); ctx.lineTo(player.x + 14, player.y - 32); ctx.lineTo(player.x + 15, player.y - 17); ctx.lineTo(player.x + 29, player.y - 20); ctx.lineTo(player.x + 25, player.y + 1);
    } else {
        ctx.moveTo(player.x - 29, player.y - 3); ctx.quadraticCurveTo(player.x - 24, player.y - 28, player.x, player.y - 29); ctx.quadraticCurveTo(player.x + 24, player.y - 28, player.x + 29, player.y - 3); ctx.lineTo(player.x + 17, player.y - 8); ctx.lineTo(player.x + 11, player.y + 8); ctx.lineTo(player.x + 4, player.y - 7); ctx.lineTo(player.x - 3, player.y + 10); ctx.lineTo(player.x - 12, player.y - 7); ctx.lineTo(player.x - 21, player.y + 6);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
