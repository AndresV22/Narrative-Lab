import { describe, it, expect } from 'vitest';
import { formatCharacterDisplayName } from './character-display.js';

describe('formatCharacterDisplayName', () => {
  it('une nombre y apellidos', () => {
    expect(
      formatCharacterDisplayName({
        name: 'Ana',
        paternalSurname: 'García',
        maternalSurname: 'López',
      })
    ).toBe('Ana García López');
  });

  it('devuelve Sin nombre si todo vacío', () => {
    expect(formatCharacterDisplayName({ name: '', paternalSurname: '', maternalSurname: '' })).toBe(
      'Sin nombre'
    );
  });
});
