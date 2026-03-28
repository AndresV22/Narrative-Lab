import { describe, it, expect } from 'vitest';
import { searchInBook, searchWorkspace } from './search.js';

describe('searchInBook', () => {
  const book = {
    id: 'b1',
    name: 'Mi libro',
    synopsis: '<p>Resumen oculto</p>',
    prologue: '<p>Texto del prólogo con palabra clave</p>',
    epilogue: '',
    historicalContext: '',
    worldRules: '',
    rules: [],
    extraBlocks: [],
    events: [],
    notes: [],
    chapters: [
      {
        id: 'c1',
        title: 'Capítulo uno',
        order: 1,
        content: '<p>Contenido capítulo</p>',
        scenes: [
          {
            id: 's1',
            title: 'Escena A',
            order: 1,
            content: '<p>palabra clave en escena</p>',
          },
        ],
      },
    ],
  };

  it('devuelve resultados para una cadena presente en prólogo y escena', () => {
    const hits = searchInBook(book, 'palabra clave');
    const kinds = hits.map((h) => h.kind);
    expect(kinds).toContain('prologue');
    expect(kinds).toContain('scene');
    expect(hits.some((h) => h.bookId === 'b1')).toBe(true);
  });

  it('devuelve vacío para consulta vacía', () => {
    expect(searchInBook(book, '   ')).toEqual([]);
  });
});

describe('searchWorkspace', () => {
  it('agrupa hits de todos los libros', () => {
    const ws = {
      books: [
        {
          id: 'b1',
          name: 'A',
          synopsis: '',
          prologue: '<p>foo único</p>',
          epilogue: '',
          historicalContext: '',
          worldRules: '',
          rules: [],
          extraBlocks: [],
          events: [],
          notes: [],
          chapters: [],
        },
        {
          id: 'b2',
          name: 'B',
          synopsis: '',
          prologue: '<p>foo único</p>',
          epilogue: '',
          historicalContext: '',
          worldRules: '',
          rules: [],
          extraBlocks: [],
          events: [],
          notes: [],
          chapters: [],
        },
      ],
    };
    const hits = searchWorkspace(ws, 'único');
    expect(hits.length).toBe(2);
    expect(new Set(hits.map((h) => h.bookId)).size).toBe(2);
  });
});
