import assert from 'node:assert/strict';
import test from 'node:test';

const configModule = await import('../src/config.js');
const time7Module = await import('../src/characters/time7/index.js');
const time8Module = await import('../src/characters/time8/index.js');

const { GAME_CONFIG } = configModule;
const { narutoData } = time7Module;
const { kibaData, hinataData, shinoData } = time8Module;

test('Time 7 and Time 8 characters are available and damage is reasonably balanced', () => {
  assert.ok(narutoData.name === 'Naruto');
  assert.ok(kibaData.name === 'Kiba');
  assert.ok(hinataData.name === 'Hinata');
  assert.ok(shinoData.name === 'Shino');

  const specialDamage = [
    GAME_CONFIG.NARUTO_SPECIAL_DAMAGE,
    GAME_CONFIG.SASUKE_SPECIAL_DAMAGE,
    GAME_CONFIG.KIBA_SPECIAL_DAMAGE,
    GAME_CONFIG.HINATA_SPECIAL_DAMAGE,
    GAME_CONFIG.SHINO_SPECIAL_DAMAGE,
    GAME_CONFIG.SHIKAMARU_SPECIAL_DAMAGE,
    GAME_CONFIG.CHOJI_SPECIAL_DAMAGE ?? GAME_CONFIG.CONTACT_DAMAGE * 2
  ];

  const min = Math.min(...specialDamage);
  const max = Math.max(...specialDamage);
  assert.ok(max - min <= 6, `Faixa de dano excessiva: ${JSON.stringify(specialDamage)}`);
});
