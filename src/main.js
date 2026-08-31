const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
import { GAME_CONFIG } from './config.js';
import { narutoData, drawRasengan } from './characters/naruto/naruto.js';
import { sasukeData, drawChidori } from './characters/sasuke/sasuke.js';
import { sakuraData } from './characters/sakura/sakura.js';
import { shikamaruData, drawShadow, getShadowPathLength } from './characters/shikamaru/shikamaru.js';
import { kibaData, drawKibaRush } from './characters/kiba/kiba.js';
import { hinataData, drawHinataRotation } from './characters/hinata/hinata.js';
import { shinoData, drawShinoBeetles } from './characters/shino/shino.js';
import { inoData, drawPoisonRose } from './characters/ino/ino.js';
import { chojiData, drawChojiCharge } from './characters/choji/choji.js';

const characterData = {
    naruto: narutoData,
    sasuke: sasukeData,
    sakura: sakuraData,
    shikamaru: shikamaruData,
    kiba: kibaData,
    hinata: hinataData,
    shino: shinoData,
    ino: inoData,
    choji: chojiData
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
let projectiles = [];
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
            const availableCharacters = characters.filter(item => item !== p1Selection);
            p2Selection = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
            updateCharacterSelection(2, p2Selection);
        }
        if (gameMode !== 'pvp') {
            startButton.disabled = false;
        } else {
            startButton.disabled = !(p1Selection && p2Selection);
        }
        updatePortraits();
    });
});

function updatePortraits() {
    updatePortrait(1, p1Selection);
    updatePortrait(2, p2Selection);
}

function updatePortrait(player, character) {
    const bubble = document.getElementById(`p${player}-portrait-bubble`);
    const name = document.getElementById(`p${player}-portrait-name`);
    const special = document.getElementById(`p${player}-portrait-special`);
    bubble.className = `portrait-bubble ${character ? `portrait-bubble-${character}` : 'portrait-bubble-empty'}`;
    bubble.textContent = character ? '' : '?';
    name.textContent = character ? characterData[character].name : 'Escolha';
    special.textContent = character ? characterData[character].special : '-';
}

function updateCharacterSelection(player, character) {
    document.querySelectorAll(`.character-btn[data-player="${player}"]`).forEach(button => {
        button.classList.toggle('selected', button.getAttribute('data-character') === character);
    });
    if (player === 1) p1Selection = character;
    else p2Selection = character;
    updatePortraits();
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
    projectiles = [];
    animationFrameCount = 0;
    gemSpawnTimer = 0;
    p1 = createPlayer(200, 300, p1Selection, 3, 2);
    p2 = createPlayer(600, 300, p2Selection, -3, -2);
    obstacles = createObstacles();
    obstacleCycleTimer = 300 + Math.floor(Math.random() * 121);
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
    return { x, y, radius: GAME_CONFIG.PLAYER_RADIUS, baseRadius: GAME_CONFIG.PLAYER_RADIUS, hp: GAME_CONFIG.INITIAL_HP, gems: 0, character, ...characterData[character], vx, vy, specialActive: false, specialTimer: 0, specialDashTimer: 0, shadowProgress: 0, movementSlowTimer: 0, attackCooldown: 0, kunaiCooldown: 0, poisonTimer: 0, poisonTickTimer: 0, aiDecisionTimer: 0, aiAttackTimer: 70, aiGemFocusTimer: 0, aiStrafeDirection: 1 };
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
    player.specialHit = false;
    player.shadowProgress = 0;
    player.specialTimer = player.character === 'sakura' ? GAME_CONFIG.SAKURA_SPECIAL_DURATION : player.character === 'choji' ? GAME_CONFIG.CHOJI_SPECIAL_DURATION : GAME_CONFIG.SPECIAL_DURATION;
    // Alteração AQUI: Removido o 'kiba' da lista para ele receber o impulso do dash (22 frames)
    player.specialDashTimer = ['sakura', 'shikamaru', 'ino', 'hinata', 'shino'].includes(player.character) ? 0 : 22;
    if (player.character === 'choji') player.radius = player.baseRadius * GAME_CONFIG.CHOJI_RADIUS_MULTIPLIER;
    if (player.character === 'ino') projectiles.push({ owner: player, type: player.character, x: player.x, y: player.y, speed: 8, life: 180 });
    if (player.character === 'shino') {
        const target = player === p1 ? p2 : p1;
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        for (let beetle = 0; beetle < 3; beetle++) {
            const lateralOffset = (beetle - 1) * 12;
            projectiles.push({
                owner: player,
                type: player.character,
                x: player.x + Math.cos(angle) * (player.radius + 9) - Math.sin(angle) * lateralOffset,
                y: player.y + Math.sin(angle) * (player.radius + 9) + Math.cos(angle) * lateralOffset,
                speed: GAME_CONFIG.SHINO_PROJECTILE_SPEED,
                life: GAME_CONFIG.SHINO_PROJECTILE_LIFE,
                direction: angle,
                radius: 8
            });
        }
    }
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
        obstacleCycleTimer = 300 + Math.floor(Math.random() * 121);
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
    updateProjectiles();
    p1.attackCooldown = Math.max(0, p1.attackCooldown - 1);
    p2.attackCooldown = Math.max(0, p2.attackCooldown - 1);
    p1.kunaiCooldown = Math.max(0, p1.kunaiCooldown - 1);
    p2.kunaiCooldown = Math.max(0, p2.kunaiCooldown - 1);
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
    const opponentSpecialRange = opponent.specialActive && opponent.character !== 'sakura' && distance < 250;
    const shouldCollect = player.gems < 3 && gems.length > 0;
    if (opponentSpecialRange) {
        const awayX = player.x - opponent.x;
        const awayY = player.y - opponent.y;
        const perpendicularX = -awayY * player.aiStrafeDirection;
        const perpendicularY = awayX * player.aiStrafeDirection;
        x = awayX * 0.82 + perpendicularX * 0.42;
        y = awayY * 0.82 + perpendicularY * 0.42;
    } else if (player.aiGemFocusTimer > 0 && shouldCollect) {
        const gem = gems.reduce((closest, item) => Math.hypot(player.x - item.x, player.y - item.y) < Math.hypot(player.x - closest.x, player.y - closest.y) ? item : closest);
        x = gem.x - player.x;
        y = gem.y - player.y;
    } else if (player.specialActive) {
        x = opponent.x - player.x;
        y = opponent.y - player.y;
    } else if (shouldCollect && (distance > 210 || player.gems < 2)) {
        const gem = gems.reduce((closest, item) => Math.hypot(player.x - item.x, player.y - item.y) < Math.hypot(player.x - closest.x, player.y - closest.y) ? item : closest);
        x = gem.x - player.x;
        y = gem.y - player.y;
    } else if (distance < 190) {
        player.aiAttackTimer--;
        if (player.aiAttackTimer <= 0) player.aiAttackTimer = 55 + Math.floor(Math.random() * 45);
        const isAttacking = player.aiAttackTimer > 25;
        const perpendicularX = -y * player.aiStrafeDirection;
        const perpendicularY = x * player.aiStrafeDirection;
        const approachWeight = isAttacking ? 0.78 : -0.55;
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
    if (player.specialActive) {
        player.specialTimer--;
        player.specialDashTimer = Math.max(0, player.specialDashTimer - 1);
    }
    if (player.specialActive && player.character === 'sakura' && player.specialTimer % 15 === 0) {
        player.hp = Math.min(GAME_CONFIG.INITIAL_HP, player.hp + GAME_CONFIG.SAKURA_HEAL_AMOUNT);
        createExplosion(player.x, player.y, player.accent, 3);
    }
    if (player.specialActive && player.character === 'shikamaru' && !player.specialHit) {
        const target = player === p1 ? p2 : p1;
        const pathLength = getShadowPathLength(player, target, obstacles);
        player.shadowProgress = Math.min(1, player.shadowProgress + GAME_CONFIG.SHADOW_TRAVEL_SPEED / pathLength);
        if (player.shadowProgress >= 1) {
            if (!isHinataDefending(target)) {
                target.hp -= GAME_CONFIG.SHIKAMARU_SPECIAL_DAMAGE;
                target.movementSlowTimer = GAME_CONFIG.SHIKAMARU_SLOW_DURATION;
            }
            player.specialHit = true;
            createExplosion(target.x, target.y, player.accent, 8);
        }
    }
    if (player.poisonTimer > 0) {
        player.poisonTimer--; player.poisonTickTimer--;
        if (player.poisonTickTimer <= 0) { player.hp -= GAME_CONFIG.INO_POISON_DAMAGE; player.poisonTickTimer = GAME_CONFIG.POISON_TICK_INTERVAL; createExplosion(player.x, player.y, '#9b59b6', 3); }
    }
    if (player.movementSlowTimer > 0) {
        player.movementSlowTimer--;
    }
    if (player.specialActive && player.specialTimer <= 0) {
        player.specialActive = false;
        restoreChojiState(player);
    }
}
function restoreChojiState(player) {
    if (player.character !== 'choji') return;
    player.radius = player.baseRadius;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > player.speed) {
        player.vx = player.vx / speed * player.speed;
        player.vy = player.vy / speed * player.speed;
    }
}
function isHinataDefending(player) {
    return player.character === 'hinata' && player.specialActive;
}
function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        const target = projectile.owner === p1 ? p2 : p1;
        const angle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
        projectile.life = Math.max(0, (projectile.life ?? 0) - 1);
        if (projectile.type === 'shino') {
            let turn = angle - projectile.direction;
            if (turn > Math.PI) turn -= Math.PI * 2;
            if (turn < -Math.PI) turn += Math.PI * 2;
            projectile.direction += Math.max(-GAME_CONFIG.SHINO_PROJECTILE_TURN_RATE, Math.min(GAME_CONFIG.SHINO_PROJECTILE_TURN_RATE, turn));
            projectile.x += Math.cos(projectile.direction) * projectile.speed;
            projectile.y += Math.sin(projectile.direction) * projectile.speed;
        } else {
            projectile.x += Math.cos(angle) * projectile.speed; projectile.y += Math.sin(angle) * projectile.speed;
        }
        if (projectile.life <= 0) {
            projectiles.splice(index, 1);
            return;
        }
        if (Math.hypot(target.x - projectile.x, target.y - projectile.y) > target.radius + 12) return;
        if (isHinataDefending(target)) {
            projectile.owner.specialActive = false;
            projectiles.splice(index, 1);
            createExplosion(target.x, target.y, target.accent, 4);
            return;
        }
        if (projectile.type === 'shikamaru') { target.hp -= GAME_CONFIG.SHIKAMARU_SPECIAL_DAMAGE; }
        else if (projectile.type === 'shino') { target.hp -= GAME_CONFIG.SHINO_SPECIAL_DAMAGE / 3; }
        else { target.poisonTimer = GAME_CONFIG.POISON_DURATION; target.poisonTickTimer = GAME_CONFIG.POISON_TICK_INTERVAL; }
        projectile.owner.specialActive = false; createExplosion(target.x, target.y, projectile.owner.accent, 12); projectiles.splice(index, 1);
    });
}

function applyMovementSlow(player, multiplier) {
    if (player.movementSlowTimer > 0 && !player.specialActive) {
        return multiplier * GAME_CONFIG.SHIKAMARU_SLOW_FACTOR;
    }
    return multiplier;
}
function movePlayer(player, ax, ay) {
    // Alteração AQUI: Adicionado 'kiba' na lista de perseguição de alvo
    if (['naruto', 'sasuke', 'kiba'].includes(player.character) && player.specialActive) {
        const target = player === p1 ? p2 : p1;
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const dashForce = player.specialDashTimer > 0 ? 2.1 : 0.9;
        ax += Math.cos(angle) * dashForce;
        ay += Math.sin(angle) * dashForce;
    }
    if (ax || ay) { player.vx *= 0.9; player.vy *= 0.9; }
    player.vx += ax;
    player.vy += ay;
    const speed = Math.hypot(player.vx, player.vy);
    let maxSpeed = player.speed * (player.specialActive && player.character === 'choji' ? GAME_CONFIG.CHOJI_SPEED_MULTIPLIER : player.specialActive && player.character !== 'sakura' ? 1.45 : 1);
    if (player.movementSlowTimer > 0) {
        maxSpeed *= GAME_CONFIG.SHIKAMARU_SLOW_FACTOR;
    }
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
    const deltaX = p2.x - p1.x;
    const deltaY = p2.y - p1.y;
    const distance = Math.hypot(deltaX, deltaY);
    const minimumDistance = p1.radius + p2.radius;
    const p1Defending = isHinataDefending(p1);
    const p2Defending = isHinataDefending(p2);
    if (p1Defending && distance < minimumDistance + 12 && p1.attackCooldown <= 0 && !p2Defending) {
        p2.hp -= GAME_CONFIG.HINATA_SPECIAL_DAMAGE;
        p1.attackCooldown = 20;
        createExplosion(p2.x, p2.y, p1.accent, 8);
    }
    if (p2Defending && distance < minimumDistance + 12 && p2.attackCooldown <= 0 && !p1Defending) {
        p1.hp -= GAME_CONFIG.HINATA_SPECIAL_DAMAGE;
        p2.attackCooldown = 20;
        createExplosion(p1.x, p1.y, p2.accent, 8);
    }
    if (distance >= minimumDistance) return;
    if (p1.kunaiCooldown <= 0 || p2.kunaiCooldown <= 0) {
        if (!p1Defending) p1.hp -= GAME_CONFIG.KUNAI_DAMAGE;
        if (!p2Defending) p2.hp -= GAME_CONFIG.KUNAI_DAMAGE;
        p1.kunaiCooldown = 34; p2.kunaiCooldown = 34;
        createKunaiBurst((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }
    const p1Offensive = p1.specialActive && ['naruto', 'sasuke', 'kiba', 'hinata', 'shino', 'choji'].includes(p1.character);
    const p2Offensive = p2.specialActive && ['naruto', 'sasuke', 'kiba', 'hinata', 'shino', 'choji'].includes(p2.character);
    const normalX = distance > 0.0001 ? deltaX / distance : 1;
    const normalY = distance > 0.0001 ? deltaY / distance : 0;
    const overlap = minimumDistance - distance;
    const separation = overlap * 0.5 + 0.75;
    p1.x -= normalX * separation; p1.y -= normalY * separation;
    p2.x += normalX * separation; p2.y += normalY * separation;
    p1.x = Math.max(p1.radius, Math.min(canvas.width - p1.radius, p1.x));
    p1.y = Math.max(p1.radius, Math.min(canvas.height - p1.radius, p1.y));
    p2.x = Math.max(p2.radius, Math.min(canvas.width - p2.radius, p2.x));
    p2.y = Math.max(p2.radius, Math.min(canvas.height - p2.radius, p2.y));
    const relativeVelocity = (p2.vx - p1.vx) * normalX + (p2.vy - p1.vy) * normalY;
    if (relativeVelocity < 0) {
        const restitution = 0.82;
        const impulse = -(1 + restitution) * relativeVelocity * 0.5;
        p1.vx -= normalX * impulse; p1.vy -= normalY * impulse;
        p2.vx += normalX * impulse; p2.vy += normalY * impulse;
    }
    const escapeImpulse = 0.55;
    p1.vx -= normalX * escapeImpulse; p1.vy -= normalY * escapeImpulse;
    p2.vx += normalX * escapeImpulse; p2.vy += normalY * escapeImpulse;
    p1.aiGemFocusTimer = 60;
    p2.aiGemFocusTimer = 60;
    p1.aiDecisionTimer = 0;
    p2.aiDecisionTimer = 0;
    if (p1Offensive && p2Offensive) {
        if (!p1Defending) p1.hp -= GAME_CONFIG.CONTACT_DAMAGE * 6;
        if (!p2Defending) p2.hp -= GAME_CONFIG.CONTACT_DAMAGE * 6;
        p1.specialActive = false;
        p2.specialActive = false;
        restoreChojiState(p1);
        restoreChojiState(p2);
        createExplosion((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, '#ffffff', 18);
        return;
    }
    if (p1Offensive) {
        const damageByCharacter = {
            naruto: GAME_CONFIG.NARUTO_SPECIAL_DAMAGE,
            sasuke: GAME_CONFIG.SASUKE_SPECIAL_DAMAGE,
            kiba: GAME_CONFIG.KIBA_SPECIAL_DAMAGE,
            hinata: GAME_CONFIG.HINATA_SPECIAL_DAMAGE,
            shino: GAME_CONFIG.SHINO_SPECIAL_DAMAGE,
            choji: GAME_CONFIG.CHOJI_SPECIAL_DAMAGE
        };
        if (!p2Defending) p2.hp -= damageByCharacter[p1.character] ?? GAME_CONFIG.CONTACT_DAMAGE * 2;
        p1.specialActive = false;
        restoreChojiState(p1);
        p1.attackCooldown = 20;
        createExplosion(p2.x, p2.y, p1.accent, 14);
        return;
    }
    if (p2Offensive) {
        const damageByCharacter = {
            naruto: GAME_CONFIG.NARUTO_SPECIAL_DAMAGE,
            sasuke: GAME_CONFIG.SASUKE_SPECIAL_DAMAGE,
            kiba: GAME_CONFIG.KIBA_SPECIAL_DAMAGE,
            hinata: GAME_CONFIG.HINATA_SPECIAL_DAMAGE,
            shino: GAME_CONFIG.SHINO_SPECIAL_DAMAGE,
            choji: GAME_CONFIG.CHOJI_SPECIAL_DAMAGE
        };
        if (!p1Defending) p1.hp -= damageByCharacter[p2.character] ?? GAME_CONFIG.CONTACT_DAMAGE * 2;
        p2.specialActive = false;
        restoreChojiState(p2);
        p2.attackCooldown = 20;
        createExplosion(p1.x, p1.y, p2.accent, 14);
        return;
    }
    if (p1.attackCooldown <= 0) {
            if (!p2Defending) p2.hp -= GAME_CONFIG.CONTACT_DAMAGE;
            p1.attackCooldown = 34;
            createExplosion(p2.x, p2.y, p1.accent, 5);
    }
    if (p2.attackCooldown <= 0) {
            if (!p1Defending) p1.hp -= GAME_CONFIG.CONTACT_DAMAGE;
            p2.attackCooldown = 34;
            createExplosion(p1.x, p1.y, p2.accent, 5);
    }
}
function createKunaiBurst(x, y) { particles.push({ x, y, vx: 0, vy: 0, radius: 0, color: '#d5dde7', alpha: 1, kunai: true, life: 1 }); }
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
    particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        if (particle.kunai) {
            ctx.save(); ctx.translate(particle.x, particle.y); ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 4;
            ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-23, 0); ctx.lineTo(23, 0); ctx.moveTo(0, -23); ctx.lineTo(0, 23); ctx.stroke();
            ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-17, -5); ctx.lineTo(-23, 0); ctx.lineTo(-17, 5); ctx.moveTo(17, -5); ctx.lineTo(23, 0); ctx.lineTo(17, 5); ctx.stroke(); ctx.restore();
        } else { ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2); ctx.fillStyle = particle.color; ctx.fill(); }
        ctx.globalAlpha = 1;
    });
    projectiles.forEach(projectile => {
        if (projectile.type === 'shino') return;
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(projectile.x, projectile.y, projectile.type === 'shino' ? 8 : 9, 0, Math.PI * 2);
        ctx.fillStyle = projectile.type === 'shikamaru' ? '#050505' : projectile.type === 'shino' ? '#7c3aed' : '#f5b7d2'; ctx.fill();
        ctx.strokeStyle = projectile.type === 'shikamaru' ? '#27ae60' : projectile.type === 'shino' ? '#4c1d95' : '#7d3c98'; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
    });
    drawShinoBeetles(ctx, projectiles);
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
    drawFaceDetails(player);
    if (player.specialActive && player.character === 'naruto') drawRasengan(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    if (player.specialActive && player.character === 'sasuke') drawChidori(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    if (player.specialActive && player.character === 'kiba') drawKibaRush(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    if (player.specialActive && player.character === 'hinata') drawHinataRotation(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    if (player.specialActive && player.character === 'shikamaru') drawShadow(ctx, player, player === p1 ? p2 : p1, animationFrameCount, obstacles);
    if (player.specialActive && player.character === 'ino') drawPoisonRose(ctx, player, player === p1 ? p2 : p1, animationFrameCount);
    if (player.specialActive && player.character === 'choji') drawChojiCharge(ctx, player, animationFrameCount);
    ctx.fillStyle = '#0c1117'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeText(player.name, player.x, player.y - 3); ctx.fillText(player.name, player.x, player.y - 3); ctx.font = 'bold 14px Arial'; ctx.strokeText(Math.max(0, Math.ceil(player.hp)), player.x, player.y + 13); ctx.fillText(Math.max(0, Math.ceil(player.hp)), player.x, player.y + 13);
    ctx.restore();
}
function drawHair(player) {
    ctx.save();
    ctx.fillStyle = player.character === 'naruto' ? '#f7b733' : player.character === 'sasuke' ? '#171b3d' : player.character === 'sakura' ? '#f28bb4' : player.character === 'shikamaru' ? '#145a32' : player.character === 'kiba' ? '#1d2126' : player.character === 'hinata' ? '#6e7f9d' : player.character === 'shino' ? '#1f2430' : player.character === 'ino' ? '#f7d358' : '#8e3b00';
    ctx.strokeStyle = player.character === 'naruto' ? '#d88716' : player.character === 'sasuke' ? '#080b20' : player.character === 'sakura' ? '#b94377' : player.character === 'shikamaru' ? '#0b3d21' : player.character === 'kiba' ? '#080b0d' : player.character === 'hinata' ? '#485c78' : player.character === 'shino' ? '#0d1117' : player.character === 'ino' ? '#c49a00' : '#5d2600';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (player.character === 'naruto') {
        ctx.moveTo(player.x - 29, player.y - 5); ctx.lineTo(player.x - 25, player.y - 26); ctx.lineTo(player.x - 15, player.y - 19); ctx.lineTo(player.x - 10, player.y - 34); ctx.lineTo(player.x - 1, player.y - 21); ctx.lineTo(player.x + 9, player.y - 35); ctx.lineTo(player.x + 13, player.y - 19); ctx.lineTo(player.x + 26, player.y - 28); ctx.lineTo(player.x + 24, player.y - 7);
    } else if (player.character === 'sasuke') {
        ctx.moveTo(player.x - 30, player.y - 1); ctx.lineTo(player.x - 26, player.y - 22); ctx.lineTo(player.x - 12, player.y - 17); ctx.lineTo(player.x - 7, player.y - 35); ctx.lineTo(player.x + 2, player.y - 20); ctx.lineTo(player.x + 14, player.y - 32); ctx.lineTo(player.x + 15, player.y - 17); ctx.lineTo(player.x + 29, player.y - 20); ctx.lineTo(player.x + 25, player.y + 1);
    } else if (player.character === 'kiba') {
        ctx.moveTo(player.x - 28, player.y - 4); ctx.lineTo(player.x - 23, player.y - 23); ctx.lineTo(player.x - 12, player.y - 20); ctx.lineTo(player.x - 5, player.y - 34); ctx.lineTo(player.x + 7, player.y - 21); ctx.lineTo(player.x + 20, player.y - 27); ctx.lineTo(player.x + 26, player.y - 4); ctx.lineTo(player.x + 15, player.y + 5); ctx.lineTo(player.x - 15, player.y + 6);
    } else if (player.character === 'hinata') {
        ctx.moveTo(player.x - 30, player.y - 2); ctx.quadraticCurveTo(player.x - 25, player.y - 31, player.x, player.y - 33); ctx.quadraticCurveTo(player.x + 25, player.y - 31, player.x + 29, player.y - 2); ctx.lineTo(player.x + 14, player.y - 5); ctx.lineTo(player.x + 8, player.y + 10); ctx.lineTo(player.x - 7, player.y + 8); ctx.lineTo(player.x - 15, player.y - 5);
    } else if (player.character === 'shino') {
        ctx.moveTo(player.x - 29, player.y - 5); ctx.lineTo(player.x - 26, player.y - 27); ctx.lineTo(player.x - 9, player.y - 22); ctx.lineTo(player.x - 2, player.y - 31); ctx.lineTo(player.x + 10, player.y - 22); ctx.lineTo(player.x + 22, player.y - 27); ctx.lineTo(player.x + 26, player.y - 2); ctx.lineTo(player.x + 15, player.y + 9); ctx.lineTo(player.x - 15, player.y + 7);
    } else {
        ctx.moveTo(player.x - 29, player.y - 3); ctx.quadraticCurveTo(player.x - 24, player.y - 28, player.x, player.y - 29); ctx.quadraticCurveTo(player.x + 24, player.y - 28, player.x + 29, player.y - 3); ctx.lineTo(player.x + 17, player.y - 8); ctx.lineTo(player.x + 11, player.y + 8); ctx.lineTo(player.x + 4, player.y - 7); ctx.lineTo(player.x - 3, player.y + 10); ctx.lineTo(player.x - 12, player.y - 7); ctx.lineTo(player.x - 21, player.y + 6);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}

function drawFaceDetails(player) {
    ctx.save();
    if (player.character === 'kiba') {
        ctx.fillStyle = '#d63031'; ctx.beginPath(); ctx.arc(player.x - 10, player.y - 5, 4, 0, Math.PI * 2); ctx.arc(player.x + 10, player.y - 5, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (player.character === 'hinata') {
        ctx.strokeStyle = '#1c3559'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x - 11, player.y - 2, 7, 0, Math.PI * 2); ctx.arc(player.x + 11, player.y - 2, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#dfefff'; ctx.beginPath(); ctx.arc(player.x - 11, player.y - 2, 2.5, 0, Math.PI * 2); ctx.arc(player.x + 11, player.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    if (player.character === 'shino') {
        ctx.strokeStyle = '#2b2d3c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(player.x - 17, player.y - 4); ctx.lineTo(player.x - 5, player.y - 4); ctx.moveTo(player.x + 5, player.y - 4); ctx.lineTo(player.x + 17, player.y - 4); ctx.stroke();
        ctx.fillStyle = '#212630'; ctx.fillRect(player.x - 18, player.y + 10, 36, 12);
    }
    ctx.restore();
}