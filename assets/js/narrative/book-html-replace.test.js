import { describe, it, expect } from 'vitest';
import { replaceInHtmlFragment, applyReplacementsToBook } from './book-html-replace.js';

describe('replaceInHtmlFragment', () => {
  it('reemplaza solo en texto, no en etiquetas', () => {
    const html = '<p>Hola <strong class="x">Ana</strong> fin</p>';
    const out = replaceInHtmlFragment(html, 'Ana', 'Eva');
    expect(out).toContain('Eva');
    expect(out).toContain('class="x"');
    expect(out).not.toMatch(/class="[^"]*Eva/);
  });

  it('reemplaza cada palabra completa (límite \\b; acentos pueden interactuar con \\w)', () => {
    const html = '<p>Ana y Ana</p>';
    const out = replaceInHtmlFragment(html, 'Ana', 'Eva');
    expect(out).toBe('<p>Eva y Eva</p>');
  });
});

describe('applyReplacementsToBook', () => {
  it('actualiza capítulo y sinopsis', () => {
    const book = {
      synopsis: '<p>Jason va</p>',
      prologue: '',
      epilogue: '',
      historicalContext: '',
      worldRules: '',
      extras: '',
      rules: [],
      extraBlocks: [],
      events: [],
      notes: [],
      chapters: [
        {
          id: 'ch1',
          title: 'Cap',
          order: 1,
          content: '<p>Jason dice</p>',
          scenes: [],
        },
      ],
      editorComments: [],
      highlights: [],
      relationships: [],
      acts: [],
      kanbanBoards: [],
    };
    applyReplacementsToBook(book, [{ old: 'Jason', new: 'Bryan' }]);
    expect(book.synopsis).toContain('Bryan');
    expect(book.chapters[0].content).toContain('Bryan');
  });
});
