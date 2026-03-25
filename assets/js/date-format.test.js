import { describe, it, expect } from 'vitest';
import { isoDateToDisplay, displayDateToIso, normalizeDateLabelIfNumeric } from './date-format.js';

describe('date-format', () => {
  it('isoDateToDisplay', () => {
    expect(isoDateToDisplay('2024-03-15')).toBe('15/03/2024');
    expect(isoDateToDisplay('')).toBe('');
  });

  it('displayDateToIso', () => {
    expect(displayDateToIso('15/03/2024')).toBe('2024-03-15');
    expect(displayDateToIso('5/3/2024')).toBe('2024-03-05');
    expect(displayDateToIso('texto')).toBe(null);
  });

  it('normalizeDateLabelIfNumeric', () => {
    expect(normalizeDateLabelIfNumeric('5/3/2024')).toBe('05/03/2024');
    expect(normalizeDateLabelIfNumeric('305 d.C.')).toBe('305 d.C.');
  });
});
