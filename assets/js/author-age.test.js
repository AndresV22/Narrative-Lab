import { describe, it, expect } from 'vitest';
import { ageFromBirthDate } from './author-age.js';

describe('ageFromBirthDate', () => {
  it('calcula edad', () => {
    const ref = new Date('2025-06-15T12:00:00');
    expect(ageFromBirthDate('1990-01-10', ref)).toBe(35);
    expect(ageFromBirthDate('1990-01-10', new Date('2025-01-05'))).toBe(34);
  });

  it('devuelve null si no válido', () => {
    expect(ageFromBirthDate('', new Date())).toBe(null);
    expect(ageFromBirthDate('not-a-date', new Date())).toBe(null);
  });
});
