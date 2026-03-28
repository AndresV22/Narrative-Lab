import { describe, it, expect } from 'vitest';
import { computeCharacterRenamePairs, parseCommaSeparatedTokens } from './character-rename-pairs.js';

describe('parseCommaSeparatedTokens', () => {
  it('separa y recorta', () => {
    expect(parseCommaSeparatedTokens('a, b , c')).toEqual(['a', 'b', 'c']);
  });
});

describe('computeCharacterRenamePairs', () => {
  it('detecta cambio de nombre y apellidos', () => {
    const pairs = computeCharacterRenamePairs(
      { name: 'Jason', paternalSurname: 'Sanders', maternalSurname: '', nicknames: '' },
      { name: 'Bryan', paternalSurname: 'Sanders', maternalSurname: '', nicknames: '' }
    );
    expect(pairs.some((p) => p.old === 'Jason' && p.new === 'Bryan')).toBe(true);
  });

  it('detecta cambio de apodo por posición', () => {
    const pairs = computeCharacterRenamePairs(
      { name: '', paternalSurname: '', maternalSurname: '', nicknames: 'Jay, J' },
      { name: '', paternalSurname: '', maternalSurname: '', nicknames: 'Jay, Jim' }
    );
    expect(pairs.some((p) => p.old === 'J' && p.new === 'Jim')).toBe(true);
  });
});
