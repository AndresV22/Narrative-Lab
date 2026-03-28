import { describe, it, expect } from 'vitest';
import { CHARACTER_ROLES, characterRoleLabel, normalizeCharacterRole } from './character-roles.js';

describe('character-roles', () => {
  it('CHARACTER_ROLES lista roles conocidos', () => {
    expect(CHARACTER_ROLES).toContain('protagonista');
    expect(CHARACTER_ROLES).toContain('secundario');
  });

  it('normalizeCharacterRole corrige valores desconocidos', () => {
    expect(normalizeCharacterRole('protagonista')).toBe('protagonista');
    expect(normalizeCharacterRole('desconocido')).toBe('secundario');
  });

  it('characterRoleLabel devuelve etiqueta en español', () => {
    expect(characterRoleLabel('antagonista')).toBe('Antagonista');
    expect(characterRoleLabel(undefined)).toBe('Secundario');
  });
});
