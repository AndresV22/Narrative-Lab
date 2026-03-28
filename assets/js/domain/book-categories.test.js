import { describe, it, expect } from 'vitest';
import { NOVEL_CATEGORY_OPTIONS, NOVEL_CATEGORY_OTHER } from './book-categories.js';

describe('book-categories', () => {
  it('NOVEL_CATEGORY_OTHER es la opción de texto libre', () => {
    expect(NOVEL_CATEGORY_OTHER).toBe('Otra');
    expect(NOVEL_CATEGORY_OPTIONS).toContain('Otra');
    expect(NOVEL_CATEGORY_OPTIONS[NOVEL_CATEGORY_OPTIONS.length - 1]).toBe('Otra');
  });

  it('incluye categorías fijas', () => {
    expect(NOVEL_CATEGORY_OPTIONS).toContain('Fantasía');
    expect(NOVEL_CATEGORY_OPTIONS).toContain('Ciencia ficción');
  });
});
