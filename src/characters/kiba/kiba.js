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
    
    // Mira no oponente
    let angleToTarget = 0;
    if (target && target.x !== undefined && target.y !== undefined) {
        angleToTarget = Math.atan2(target.y - player.y, target.x - player.x);
    }

    ctx.translate(player.x, player.y);
    ctx.rotate(angleToTarget); 

    // Oscilação reduzida para ficarem mais "presos" ao corpo do jogador
    const helixOffset1 = Math.sin(animationFrameCount * 0.5) * player.radius * 0.4;
    const helixOffset2 = Math.sin(animationFrameCount * 0.5 + Math.PI) * player.radius * 0.4;

    const drawFierceTornado = (yOffset, frameOffset) => {
        ctx.save();
        ctx.translate(0, yOffset);

        // Gradiente ajustado para o novo tamanho menor
        const gradient = ctx.createLinearGradient(0, -player.radius, 0, player.radius);
        gradient.addColorStop(0, 'rgba(10, 12, 15, 0)');     
        gradient.addColorStop(0.2, 'rgba(25, 30, 35, 0.95)'); 
        gradient.addColorStop(0.5, 'rgba(45, 52, 54, 1)');   
        gradient.addColorStop(0.8, 'rgba(25, 30, 35, 0.95)'); 
        gradient.addColorStop(1, 'rgba(10, 12, 15, 0)');

        // Formato da broca bem menor (pouco maior que a bolha)
        ctx.beginPath();
        ctx.moveTo(player.radius * 1.8, 0); // Ponta encurtada (antes era 4)
        ctx.lineTo(-player.radius * 0.8, player.radius * 0.9); // Base mais estreita
        ctx.lineTo(-player.radius * 0.8, -player.radius * 0.9); 
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Rastros de vento ajustados para não vazarem para fora da broca
        ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
            let windX = (Math.cos(animationFrameCount * 0.8 + i + frameOffset) * player.radius * 1.2) + player.radius * 0.5;
            let windY = Math.sin(animationFrameCount * 1.2 + i * 2 + frameOffset) * player.radius * 0.7;
            
            ctx.beginPath();
            ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 255, 255, ${0.9 - i*0.15})` : `rgba(200, 214, 229, ${0.7 - i*0.15})`;
            ctx.lineWidth = Math.random() * 2 + 1; // Linhas mais finas
            
            ctx.moveTo(windX - 15, windY);
            ctx.lineTo(windX + 25, windY * 0.2); 
            ctx.stroke();
        }
        ctx.restore();
    };

    // Poeira e impacto visual diminuídos proporcionalmente
    ctx.fillStyle = 'rgba(236, 240, 241, 0.2)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-player.radius * 0.5, 0, player.radius * 0.6, player.radius * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; 

    // Desenha Kiba e Akamaru
    drawFierceTornado(helixOffset1, 0);
    drawFierceTornado(helixOffset2, Math.PI);

    // Opcional: Descomente as linhas abaixo se quiser ver a hitbox original vermelha para testar o tamanho
    /*
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(214, 48, 49, 0.5)';
    ctx.lineWidth = 1;
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.stroke();
    */

    ctx.restore();
}