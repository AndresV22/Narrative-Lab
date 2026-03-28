import { describe, it, expect } from 'vitest';
import {
  cmToPageTwip,
  cssFontSizeToHalfPoints,
  cssFontStackForExport,
  editorPageSizeToDocxTwips,
  firstFontFromStack,
  parseColorForDocx,
} from './export-helpers.js';
import {
  assembleBookHtml,
  assembleReferenceBundleHtml,
  computeProgressWordStats,
  computeWordStats,
  htmlToMarkdown,
} from './export.js';

describe('export-helpers', () => {
  it('cssFontStackForExport escapa nombres con espacios', () => {
    expect(cssFontStackForExport('Crimson Pro, Georgia, serif')).toBe(
      '"Crimson Pro", Georgia, serif'
    );
  });

  it('cmToPageTwip convierte cm a twips', () => {
    expect(cmToPageTwip(2.54)).toBe(1440);
  });

  it('editorPageSizeToDocxTwips devuelve twips A4 por defecto', () => {
    expect(editorPageSizeToDocxTwips('a4')).toEqual({ width: 11906, height: 16838 });
    expect(editorPageSizeToDocxTwips('letter')).toEqual({ width: 12240, height: 15840 });
    expect(editorPageSizeToDocxTwips('legal')).toEqual({ width: 12240, height: 20160 });
    expect(editorPageSizeToDocxTwips('a5')).toEqual({ width: 8391, height: 11906 });
  });

  it('parseColorForDocx acepta hex y rgb', () => {
    expect(parseColorForDocx('#abc')).toBe('AABBCC');
    expect(parseColorForDocx('#112233')).toBe('112233');
    expect(parseColorForDocx('rgb(255, 0, 0)')).toBe('FF0000');
    expect(parseColorForDocx('')).toBeUndefined();
  });

  it('cssFontSizeToHalfPoints interpreta px y pt', () => {
    expect(cssFontSizeToHalfPoints('16px')).toBe(24);
    expect(cssFontSizeToHalfPoints('12pt')).toBe(24);
  });

  it('firstFontFromStack toma la primera fuente', () => {
    expect(firstFontFromStack('"Times New Roman", serif')).toBe('Times New Roman');
  });
});

describe('assembleBookHtml', () => {
  it('ordena capítulos y escenas, incluye prólogo y epílogo', () => {
    const html = assembleBookHtml({
      id: 'b1',
      name: 'Libro <X>',
      author: 'Autor & Co',
      prologue: '<p>Texto prólogo</p>',
      epilogue: '<p>Fin</p>',
      chapters: [
        {
          id: 'c2',
          title: 'Cap B',
          order: 2,
          content: '<p>Contenido B</p>',
          scenes: [{ id: 's1', title: 'Escena', order: 1, content: '<p>Esc</p>' }],
        },
        {
          id: 'c1',
          title: 'Cap A',
          order: 1,
          content: '',
          scenes: [],
        },
      ],
    });
    expect(html).toContain('article class="nl-book-export"');
    expect(html.indexOf('Cap A')).toBeLessThan(html.indexOf('Cap B'));
    expect(html).toContain('Prólogo');
    expect(html).toContain('Epílogo');
    expect(html).toContain('Libro &lt;X&gt;');
    expect(html).toContain('Autor &amp; Co');
  });

  it('limpia marcas de comentario y destacados del HTML exportado', () => {
    const html = assembleBookHtml({
      id: 'b1',
      name: 'T',
      chapters: [
        {
          id: 'c1',
          title: 'C',
          order: 1,
          content:
            '<p>Hola <span class="nl-comment-mark" data-nl-comment-id="1">mundo</span> y ' +
            '<span class="nl-highlight-mark" data-nl-highlight-id="h1">texto</span>.</p>',
          scenes: [],
        },
      ],
    });
    expect(html).toContain('Hola mundo y texto.');
    expect(html).not.toContain('nl-comment-mark');
    expect(html).not.toContain('nl-highlight-mark');
  });
});

describe('assembleReferenceBundleHtml', () => {
  it('incluye sinopsis y reglas ordenadas', () => {
    const html = assembleReferenceBundleHtml({
      id: 'b1',
      name: 'Plan',
      synopsis: '<p>Resumen</p>',
      rules: [
        { id: 'r2', title: 'R2', content: '<p>b</p>', order: 2 },
        { id: 'r1', title: 'R1', content: '<p>a</p>', order: 1 },
      ],
    });
    expect(html).toContain('Material de planificación');
    expect(html.indexOf('R1')).toBeLessThan(html.indexOf('R2'));
  });
});

describe('htmlToMarkdown', () => {
  it('convierte párrafos, negrita y encabezados', () => {
    const md = htmlToMarkdown('<p>Uno <strong>dos</strong>.</p><h2>T</h2>');
    expect(md).toContain('Uno **dos**.');
    expect(md).toContain('## T');
  });
});

describe('computeWordStats', () => {
  it('suma capítulos, escenas y metadatos', () => {
    const stats = computeWordStats({
      id: 'b1',
      synopsis: '<p>una dos</p>',
      prologue: '',
      epilogue: '',
      rules: [],
      worldRules: '',
      extraBlocks: [],
      extras: '',
      events: [],
      notes: [],
      wordGoal: 1000,
      chapters: [
        {
          id: 'c1',
          title: 'C1',
          order: 1,
          content: '<p>tres cuatro</p>',
          scenes: [{ id: 's1', title: 'S', order: 1, content: '<p>cinco</p>' }],
        },
      ],
    });
    expect(stats.goal).toBe(1000);
    expect(stats.chapters).toHaveLength(1);
    expect(stats.chapters[0].words).toBeGreaterThan(0);
    expect(stats.total).toBe(stats.chapters[0].words + 2);
  });
});

describe('computeProgressWordStats', () => {
  it('solo cuenta prólogo, capítulos, escenas y epílogo', () => {
    const book = {
      id: 'b1',
      synopsis: '<p>diez palabras aquí repetidas</p>',
      prologue: '<p>uno</p>',
      epilogue: '<p>dos</p>',
      historicalContext: '<p>contexto largo</p>',
      rules: [{ id: 'r1', title: 'R', content: '<p>regla</p>', order: 1 }],
      worldRules: '<p>legacy</p>',
      extraBlocks: [{ id: 'e1', title: 'E', content: '<p>extra</p>' }],
      notes: [{ id: 'n1', title: 'N', content: '<p>nota</p>' }],
      events: [{ id: 'ev1', title: 'Ev', dateLabel: '', content: '<p>evento</p>' }],
      wordGoal: 5000,
      chapters: [
        {
          id: 'c1',
          title: 'C',
          order: 1,
          content: '<p>tres cuatro</p>',
          scenes: [{ id: 's1', title: 'S', order: 1, content: '<p>cinco</p>' }],
        },
      ],
    };
    const full = computeWordStats(book);
    const prog = computeProgressWordStats(book);
    expect(prog.total).toBe(full.chapters[0].words + 2);
    expect(prog.total).toBeLessThan(full.total);
    expect(prog.chapters[0].words).toBe(full.chapters[0].words);
  });
});
