import { describe, it, expect } from 'vitest';
import { deepClone, debounce, stripHtml, escapeHtml, wordCountFromText } from './utils.js';

describe('deepClone', () => {
  it('clona objetos anidados', () => {
    const o = { a: 1, b: { c: 2 } };
    const c = deepClone(o);
    expect(c).toEqual(o);
    c.b.c = 99;
    expect(o.b.c).toBe(2);
  });
});

describe('debounce', () => {
  it('aplaza la ejecución', async () => {
    let n = 0;
    const d = debounce(() => {
      n += 1;
    }, 20);
    d();
    d();
    expect(n).toBe(0);
    await new Promise((r) => setTimeout(r, 40));
    expect(n).toBe(1);
  });
});

describe('stripHtml', () => {
  it('extrae texto plano', () => {
    expect(stripHtml('<p>Hola <b>mundo</b></p>')).toBe('Hola mundo');
  });
});

describe('escapeHtml', () => {
  it('escapa entidades', () => {
    expect(escapeHtml('<a>')).toBe('&lt;a&gt;');
  });
});

describe('wordCountFromText', () => {
  it('cuenta palabras', () => {
    expect(wordCountFromText('uno dos tres')).toBe(3);
    expect(wordCountFromText('')).toBe(0);
  });
});
