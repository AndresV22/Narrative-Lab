/**
 * Exportación de libro y formatos — Narrative Lab
 */

import { characterRoleLabel } from '../domain/character-roles.js';
import { formatCharacterDisplayName } from '../domain/character-display.js';
import {
  EDITOR_DEFAULT_FONT_SIZE_PX,
  EDITOR_DEFAULT_FONT_STACK,
  EDITOR_DEFAULT_FORE_COLOR,
} from '../editor/editor-font.js';
import { EDITOR_PAGE_SIZE_PRESETS } from '../editor/editor-page-sizes.js';
import {
  getEditorMarginHorizontalCm,
  getEditorMarginVerticalCm,
  getEditorPageSize,
} from '../domain/prefs.js';
import { stripNlCommentMarks, stripNlHighlightMarks } from '../editor/editor-helpers.js';
import { sortByOrder, stripHtml, wordCountFromHtml } from '../core/utils.js';
import {
  cssFontStackForExport,
  cmToPageTwip,
  cssFontSizeToHalfPoints,
  editorPageSizeToDocxTwips,
  firstFontFromStack,
  parseColorForDocx,
} from './export-helpers.js';

/** @returns {string} */
function buildExportPrintStylesheet() {
  const pageId = getEditorPageSize();
  const preset = EDITOR_PAGE_SIZE_PRESETS.find((p) => p.id === pageId) || EDITOR_PAGE_SIZE_PRESETS[0];
  const mx = getEditorMarginHorizontalCm();
  const my = getEditorMarginVerticalCm();
  const pageSize = `${preset.width} ${preset.minHeight}`;
  const baseFont = cssFontStackForExport(EDITOR_DEFAULT_FONT_STACK);
  const baseSizePt = (EDITOR_DEFAULT_FONT_SIZE_PX * 72) / 96;
  const bodyColor = EDITOR_DEFAULT_FORE_COLOR;

  return `
@page {
  size: ${pageSize};
  margin: ${my}cm ${mx}cm;
}
.nl-print-export {
  box-sizing: border-box;
  background: #fff;
  color: ${bodyColor};
  font-family: ${baseFont};
  font-size: ${baseSizePt}pt;
  line-height: 1.65;
  max-width: none !important;
  margin: 0;
  padding: 0;
}
.nl-print-export .nl-book-export h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5em;
}
.nl-print-export .nl-book-export h2 {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 1.1em 0 0.4em;
}
.nl-print-export .nl-book-export h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0.9em 0 0.35em;
}
.nl-print-export .nl-book-export h4 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.75em 0 0.3em;
}
.nl-print-export .nl-book-export p {
  margin: 0 0 0.65em;
}
.nl-print-export .nl-book-export .meta {
  opacity: 0.85;
  font-size: 0.95em;
}
.nl-print-export .nl-book-export blockquote {
  margin: 0.75em 0;
  padding: 0.65em 0.85em 0.65em 1rem;
  border-left: 4px solid rgb(99 102 241 / 0.55);
  background: rgb(241 245 249 / 0.35);
  font-style: italic;
}
.nl-print-export .nl-book-export ul,
.nl-print-export .nl-book-export ol {
  margin: 0.5em 0;
  padding-left: 1.35rem;
}
@media print {
  .nl-print-export {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
.nl-print-export .nl-lh-compact { line-height: 1.35; }
.nl-print-export .nl-lh-comfort { line-height: 1.75; }
.nl-print-export .nl-lh-relaxed { line-height: 2.15; }
  `.trim();
}

/**
 * @returns {Record<string, unknown>}
 */
function docxDefaultRunStyleProps() {
  const c = parseColorForDocx(EDITOR_DEFAULT_FORE_COLOR);
  return {
    font: firstFontFromStack(EDITOR_DEFAULT_FONT_STACK),
    size: Math.round(((EDITOR_DEFAULT_FONT_SIZE_PX * 72) / 96) * 2),
    ...(c ? { color: c } : {}),
  };
}

/**
 * @param {HTMLElement} el
 * @param {{ AlignmentType?: Record<string, string> }} docxMod
 * @returns {string|undefined}
 */
function alignmentFromElement(el, docxMod) {
  const AlignmentType = docxMod.AlignmentType;
  if (!AlignmentType) return undefined;
  const a = el.style.textAlign;
  if (a === 'center') return AlignmentType.CENTER;
  if (a === 'right' || a === 'end') return AlignmentType.END;
  if (a === 'justify') return AlignmentType.BOTH;
  return undefined;
}

/**
 * @param {HTMLElement} el
 * @param {Record<string, unknown>} styles
 * @returns {Record<string, unknown>}
 */
function mergeInlineStylesFromElement(el, styles) {
  const next = { ...styles };
  const st = el.style;
  if (st.color) {
    const c = parseColorForDocx(st.color);
    if (c) next.color = c;
  }
  const sz = cssFontSizeToHalfPoints(st.fontSize);
  if (sz != null) next.size = sz;
  if (st.fontFamily) {
    const f = firstFontFromStack(st.fontFamily);
    if (f) next.font = f;
  }
  return next;
}

/**
 * HTML de fragmento listo para export (sin marcas de comentario del editor).
 * @param {string} [html]
 */
function cleanExportHtml(html) {
  return stripNlHighlightMarks(stripNlCommentMarks(html || ''));
}

/**
 * Ensambla HTML del libro para «Exportar libro»: solo obra narrativa
 * (prólogo, capítulos y escenas, epílogo). Sin sinopsis, extras, notas ni frases destacadas.
 * @param {import('../core/types.js').Book} book
 * @returns {string}
 */
export function assembleBookHtml(book) {
  const parts = [];
  parts.push(`<h1>${escape(book.name)}</h1>`);
  if (book.author) parts.push(`<p class="meta"><em>${escape(book.author)}</em></p>`);

  if (book.prologue && stripHtml(book.prologue)) {
    parts.push('<h2>Prólogo</h2>', book.prologue);
  }

  const chapters = sortByOrder(book.chapters || [], 'order');
  for (const ch of chapters) {
    parts.push(`<h2>${escape(ch.title)}</h2>`);
    if (ch.chapterGoal) {
      parts.push(`<p><strong>Objetivo del capítulo:</strong> ${escape(ch.chapterGoal)}</p>`);
    }
    if (ch.content && stripHtml(ch.content)) {
      parts.push(cleanExportHtml(ch.content));
    }
    const scenes = sortByOrder(ch.scenes || [], 'order');
    for (const sc of scenes) {
      parts.push(`<h3>${escape(sc.title)}</h3>`);
      if (sc.content) parts.push(cleanExportHtml(sc.content));
    }
  }

  if (book.epilogue && stripHtml(book.epilogue)) {
    parts.push('<h2>Epílogo</h2>', cleanExportHtml(book.epilogue));
  }

  return `<article class="nl-book-export">${parts.join('\n')}</article>`;
}

/**
 * @param {string} s
 */
function escape(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/**
 * Sinopsis, contexto, reglas, personajes, extras y notas en un solo HTML.
 * @param {import('../core/types.js').Book} book
 * @returns {string}
 */
export function assembleReferenceBundleHtml(book) {
  const parts = [];
  parts.push(`<h1>${escape(book.name)} — Material de planificación</h1>`);
  if (book.author) parts.push(`<p class="meta"><em>${escape(book.author)}</em></p>`);

  if (book.synopsis && stripHtml(book.synopsis)) {
    parts.push('<h2>Sinopsis</h2>', cleanExportHtml(book.synopsis));
  }

  if (book.historicalContext && stripHtml(book.historicalContext)) {
    parts.push('<h2>Contexto</h2>', cleanExportHtml(book.historicalContext));
  }

  const rules = sortByOrder(book.rules || [], 'order');
  if (rules.length) {
    parts.push('<h2>Reglas del mundo</h2>');
    for (const r of rules) {
      parts.push(`<h3>${escape(r.title || 'Regla')}</h3>`, cleanExportHtml(r.content || ''));
    }
  }
  if (stripHtml(book.worldRules || '')) {
    parts.push('<h2>Reglas (texto heredado)</h2>', cleanExportHtml(book.worldRules || ''));
  }

  const chars = book.characters || [];
  if (chars.length) {
    parts.push('<h2>Personajes</h2>');
    for (const c of chars) {
      parts.push(
        `<h3>${escape(formatCharacterDisplayName(c))}</h3>`,
        characterPlanningFieldsHtml(c)
      );
    }
  }

  const blocks = book.extraBlocks || [];
  if (blocks.length) {
    parts.push('<h2>Extras</h2>');
    for (const eb of blocks) {
      parts.push(`<h3>${escape(eb.title)}</h3>`, cleanExportHtml(eb.content || ''));
    }
  } else if (book.extras && stripHtml(book.extras)) {
    parts.push('<h2>Extras</h2>', cleanExportHtml(book.extras));
  }

  if (book.notes && book.notes.length) {
    parts.push('<h2>Notas</h2>');
    for (const n of book.notes) {
      parts.push(`<h3>${escape(n.title)}</h3>`, cleanExportHtml(n.content || ''));
    }
  }

  return `<article class="nl-book-export nl-reference-bundle">${parts.join('\n')}</article>`;
}

/**
 * @param {import('../core/types.js').Character} ch
 */
function characterPlanningFieldsHtml(ch) {
  let html = `<p><strong>Papel:</strong> ${escape(characterRoleLabel(ch.role))}</p>`;
  if (ch.nicknames && String(ch.nicknames).trim()) {
    html += `<p><strong>Apodos:</strong> ${escape(String(ch.nicknames))}</p>`;
  }
  if (ch.age) html += `<p><strong>Edad:</strong> ${escape(ch.age)}</p>`;
  if (ch.birthPlace && stripHtml(ch.birthPlace)) {
    html += `<p><strong>Lugar de nacimiento:</strong> ${escape(ch.birthPlace)}</p>`;
  }
  if (ch.birthDate && stripHtml(ch.birthDate)) {
    html += `<p><strong>Fecha de nacimiento:</strong> ${escape(ch.birthDate)}</p>`;
  }
  if (ch.deathDate && stripHtml(ch.deathDate)) {
    html += `<p><strong>Fecha de defunción:</strong> ${escape(ch.deathDate)}</p>`;
  }
  if (ch.imageDataUrl) {
    html += `<p><img src="${ch.imageDataUrl}" alt="" style="max-width:12rem;height:auto;"/></p>`;
  }
  const blocks = [
    ['Cosas que le gustan', ch.likes],
    ['Cosas que no le gustan', ch.dislikes],
    ['Descripción', ch.description],
    ['Personalidad', ch.personality],
    ['Objetivos', ch.goals],
    ['Conflictos', ch.conflicts],
    ['Arco narrativo', ch.narrativeArc],
  ];
  for (const [label, val] of blocks) {
    if (val && stripHtml(val)) {
      html += `<h4>${escape(label)}</h4>${cleanExportHtml(val)}`;
    }
  }
  return html;
}

/**
 * @param {import('../core/types.js').Character} ch
 */
function characterPrintFieldsHtml(ch) {
  return characterPlanningFieldsHtml(ch);
}

/**
 * HTML imprimible: una ficha de personaje (título + libro).
 * @param {import('../core/types.js').Book} book
 * @param {import('../core/types.js').Character} ch
 */
export function characterToPrintableHtml(book, ch) {
  return `<article class="nl-book-export nl-char-print"><h1>${escape(formatCharacterDisplayName(ch))}</h1><p class="meta"><em>${escape(
    book.name
  )}</em></p>${characterPrintFieldsHtml(ch)}</article>`;
}

/**
 * HTML imprimible: todas las fichas.
 * @param {import('../core/types.js').Book} book
 */
export function allCharactersPrintableHtml(book) {
  const parts = [`<h1>${escape(book.name)}</h1><h2>Personajes</h2>`];
  for (const ch of book.characters || []) {
    parts.push(`<h2>${escape(formatCharacterDisplayName(ch))}</h2>`, characterPrintFieldsHtml(ch));
  }
  return `<article class="nl-book-export nl-char-print-all">${parts.join('\n')}</article>`;
}

function injectPrintRoot(innerArticleHtml) {
  let root = document.getElementById('nl-print-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'nl-print-root';
    document.body.appendChild(root);
  }
  const css = buildExportPrintStylesheet();
  root.innerHTML = `<style>${css}</style><div class="nl-print-export">${innerArticleHtml}</div>`;
  window.print();
  setTimeout(() => {
    root.innerHTML = '';
  }, 500);
}

/**
 * PDF vía impresión: material de planificación.
 * @param {import('../core/types.js').Book} book
 */
export function exportReferenceBundlePdf(book) {
  injectPrintRoot(assembleReferenceBundleHtml(book));
}

/**
 * @param {import('../core/types.js').Book} book
 */
export function exportReferenceBundleTxt(book) {
  const html = assembleReferenceBundleHtml(book);
  const text = stripHtml(html).replace(/\s+\n/g, '\n').trim();
  downloadText(`${sanitizeFilename(book.name)}-planificacion.txt`, text, 'text/plain;charset=utf-8');
}

/**
 * @param {import('../core/types.js').Book} book
 */
export function exportCharacterPdfPrint(book, characterId) {
  const ch = book.characters?.find((c) => c.id === characterId);
  if (!ch) return;
  injectPrintRoot(characterToPrintableHtml(book, ch));
}

/**
 * @param {import('../core/types.js').Book} book
 */
export function exportAllCharactersPdfPrint(book) {
  injectPrintRoot(allCharactersPrintableHtml(book));
}

/**
 * HTML muy simple a Markdown (énfasis básico).
 * @param {string} html
 * @returns {string}
 */
export function htmlToMarkdown(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = /** @type {Element} */ (node);
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join('');
    if (tag === 'strong' || tag === 'b') return `**${inner}**`;
    if (tag === 'em' || tag === 'i') return `*${inner}*`;
    if (tag === 'u') return inner;
    if (tag === 'br') return '\n';
    if (tag === 'p') return inner + '\n\n';
    if (tag === 'h1') return `# ${inner}\n\n`;
    if (tag === 'h2') return `## ${inner}\n\n`;
    if (tag === 'h3') return `### ${inner}\n\n`;
    if (tag === 'blockquote') return `> ${inner.replace(/\n/g, '\n> ')}\n\n`;
    if (tag === 'li') return `- ${inner}\n`;
    if (tag === 'ul' || tag === 'ol') return inner + '\n';
    return inner;
  }
  return walk(d).replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * @param {import('../core/types.js').Book} book
 */
export function exportMarkdown(book) {
  const html = assembleBookHtml(book);
  const md = htmlToMarkdown(html);
  downloadText(`${sanitizeFilename(book.name)}.md`, md, 'text/markdown;charset=utf-8');
}

/**
 * @param {import('../core/types.js').Book} book
 */
export function exportTxt(book) {
  const html = assembleBookHtml(book);
  const text = stripHtml(html).replace(/\s+\n/g, '\n').trim();
  downloadText(`${sanitizeFilename(book.name)}.txt`, text, 'text/plain;charset=utf-8');
}

/**
 * Abre diálogo de impresión (PDF vía “Guardar como PDF”).
 * @param {import('../core/types.js').Book} book
 */
export function exportPdfPrint(book) {
  injectPrintRoot(assembleBookHtml(book));
}

/**
 * Convierte runs inline (negrita, cursiva, color, tamaño, fuente) para docx.
 * @param {HTMLElement} el
 * @param {any} docx — módulo docx (TextRun, UnderlineType)
 * @param {Record<string, unknown>} [baseStyles]
 */
function inlineRunsFromElement(el, docx, baseStyles = {}) {
  const { TextRun, UnderlineType } = docx;
  const base = { ...docxDefaultRunStyleProps(), ...baseStyles };
  const runs = [];
  /** @param {Record<string, unknown>} s */
  function textRunOpts(s) {
    /** @type {Record<string, unknown>} */
    const o = {};
    if (s.text != null) o.text = s.text;
    if (s.bold) o.bold = true;
    if (s.italics) o.italics = true;
    if (s.underline) o.underline = s.underline;
    if (s.break) o.break = s.break;
    if (s.color) o.color = s.color;
    if (s.size != null) o.size = s.size;
    if (s.font) o.font = s.font;
    return o;
  }
  function walk(n, styles) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n.textContent || '';
      if (t) runs.push(new TextRun(textRunOpts({ ...styles, text: t })));
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const el2 = /** @type {HTMLElement} */ (n);
      const tag = el2.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push(new TextRun({ break: 1 }));
        return;
      }
      let next = { ...styles };
      if (tag === 'strong' || tag === 'b') next = { ...next, bold: true };
      if (tag === 'em' || tag === 'i') next = { ...next, italics: true };
      if (tag === 'u' && UnderlineType) next = { ...next, underline: { type: UnderlineType.SINGLE } };
      next = mergeInlineStylesFromElement(el2, next);
      el2.childNodes.forEach((c) => walk(c, next));
    }
  }
  el.childNodes.forEach((c) => walk(c, base));
  return runs.length ? runs : [new TextRun(textRunOpts({ ...base, text: '' }))];
}

/**
 * @param {ChildNode} node
 * @param {unknown[]} out
 * @param {any} docx
 */
function processBlockForDocx(node, out, docx) {
  const { Paragraph, TextRun, HeadingLevel } = docx;
  const runsFor = (/** @type {HTMLElement} */ elem) => inlineRunsFromElement(elem, docx);
  const def = docxDefaultRunStyleProps();
  if (node.nodeType === Node.TEXT_NODE) {
    const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) out.push(new Paragraph({ children: [new TextRun({ text: t, ...def })] }));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = /** @type {HTMLElement} */ (node);
  const tag = el.tagName.toLowerCase();
  if (tag === 'h1') {
    const t = el.textContent.trim();
    if (!t) return;
    out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runsFor(el) }));
    return;
  }
  if (tag === 'h2') {
    const t = el.textContent.trim();
    if (!t) return;
    out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runsFor(el) }));
    return;
  }
  if (tag === 'h3') {
    const t = el.textContent.trim();
    if (!t) return;
    out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runsFor(el) }));
    return;
  }
  if (tag === 'h4' || tag === 'h5' || tag === 'h6') {
    const t = el.textContent.trim();
    if (!t) return;
    out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runsFor(el) }));
    return;
  }
  if (tag === 'p') {
    const plain = el.textContent?.trim();
    if (!plain) return;
    /** @type {Record<string, unknown>} */
    const paraOpts = { children: runsFor(el) };
    const al = alignmentFromElement(el, docx);
    if (al) paraOpts.alignment = al;
    out.push(new Paragraph(paraOpts));
    return;
  }
  if (tag === 'blockquote') {
    const plain = el.textContent?.trim();
    if (!plain) return;
    /** @type {Record<string, unknown>} */
    const bqOpts = {
      children: runsFor(el),
      indent: { left: 720 },
    };
    const al = alignmentFromElement(el, docx);
    if (al) bqOpts.alignment = al;
    out.push(new Paragraph(bqOpts));
    return;
  }
  if (tag === 'ul') {
    el.querySelectorAll(':scope > li').forEach((li) => {
      const h = /** @type {HTMLElement} */ (li);
      if (!h.textContent?.trim()) return;
      out.push(
        new Paragraph({
          children: [new TextRun({ text: '• ', ...def }), ...runsFor(h)],
        })
      );
    });
    return;
  }
  if (tag === 'ol') {
    let i = 1;
    el.querySelectorAll(':scope > li').forEach((li) => {
      const h = /** @type {HTMLElement} */ (li);
      if (!h.textContent?.trim()) return;
      out.push(
        new Paragraph({
          children: [new TextRun({ text: `${i}. `, ...def }), ...runsFor(h)],
        })
      );
      i += 1;
    });
    return;
  }
  if (tag === 'article' || tag === 'div') {
    el.childNodes.forEach((c) => processBlockForDocx(c, out, docx));
    return;
  }
  if (tag === 'li') return;
  const plain = el.textContent?.trim();
  if (!plain) return;
  out.push(new Paragraph({ children: [new TextRun({ text: plain, ...def })] }));
}

/**
 * @param {string} html
 * @param {string} filenameStem
 */
async function exportDocxFromHtml(html, filenameStem) {
  let docx;
  try {
    docx = await import('docx');
  } catch {
    throw new Error('No se pudo cargar el generador DOCX. Comprueba la conexión e inténtalo de nuevo.');
  }
  const { Document, Packer, Paragraph, TextRun, PageOrientation } = docx;
  if (!Document || !Packer || !Paragraph || !TextRun || !PageOrientation) {
    throw new Error('La librería DOCX no expone la API esperada.');
  }
  const parser = new DOMParser();
  const docHtml = parser.parseFromString(`<div class="nl-docx-wrap">${html}</div>`, 'text/html');
  const wrap = docHtml.querySelector('.nl-docx-wrap');
  const article = docHtml.querySelector('article.nl-book-export');
  const root = article || wrap;
  if (!root) {
    throw new Error('No se pudo interpretar el contenido del libro.');
  }
  /** @type {unknown[]} */
  const children = [];
  root.childNodes.forEach((c) => processBlockForDocx(c, children, docx));
  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: '', ...docxDefaultRunStyleProps() })] }));
  }
  const pageId = getEditorPageSize();
  const dims = editorPageSizeToDocxTwips(pageId);
  const mt = cmToPageTwip(getEditorMarginVerticalCm());
  const ms = cmToPageTwip(getEditorMarginHorizontalCm());
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: dims.width,
              height: dims.height,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: mt,
              right: ms,
              bottom: mt,
              left: ms,
            },
          },
        },
        children: /** @type {any} */ (children),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(`${sanitizeFilename(filenameStem)}.docx`, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/**
 * Exporta DOCX con OOXML real (docx vía esm.sh). Evita html-docx-js (altChunk), que Word suele abrir vacío.
 * @param {import('../core/types.js').Book} book
 */
export async function exportDocx(book) {
  await exportDocxFromHtml(assembleBookHtml(book), book.name);
}

/**
 * @param {import('../core/types.js').Book} book
 */
export async function exportReferenceBundleDocx(book) {
  await exportDocxFromHtml(assembleReferenceBundleHtml(book), `${book.name} - planificacion`);
}

/**
 * @param {string} htmlContent
 * @param {string} title
 * @param {string} bookId
 * @param {string} downloadFilename
 */
async function exportEpubFromHtml(htmlContent, title, bookId, downloadFilename) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const mimetype = 'application/epub+zip';
  zip.file('mimetype', mimetype, { compression: 'STORE' });

  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder('META-INF')?.file('container.xml', container);

  const escapedTitle = title.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c));
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapedTitle}</dc:title>
    <dc:language>es</dc:language>
    <dc:identifier id="bookid">urn:uuid:${bookId}</dc:identifier>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
  </spine>
</package>`;

  const mx = getEditorMarginHorizontalCm();
  const my = getEditorMarginVerticalCm();
  const baseSizePt = (EDITOR_DEFAULT_FONT_SIZE_PX * 72) / 96;
  const epubCss = `body{font-family:${cssFontStackForExport(
    EDITOR_DEFAULT_FONT_STACK
  )};font-size:${baseSizePt}pt;color:${EDITOR_DEFAULT_FORE_COLOR};line-height:1.65;margin:${my}cm ${mx}cm;}`;
  const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapedTitle}</title><style type="text/css">${epubCss}</style></head>
<body>${htmlContent}</body>
</html>`;

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Nav</title></head>
<body>
  <nav epub:type="toc"><ol><li><a href="chapter.xhtml">${escapedTitle}</a></li></ol></nav>
</body>
</html>`;

  const oebps = zip.folder('OEBPS');
  oebps?.file('content.opf', opf);
  oebps?.file('chapter.xhtml', chapterXhtml);
  oebps?.file('nav.xhtml', navXhtml);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: mimetype });
  downloadBlob(downloadFilename, blob, mimetype);
}

/**
 * EPUB mínimo con JSZip.
 * @param {import('../core/types.js').Book} book
 */
export async function exportEpub(book) {
  const title = book.name || 'Libro';
  const htmlContent = assembleBookHtml(book);
  await exportEpubFromHtml(htmlContent, title, book.id, `${sanitizeFilename(book.name)}.epub`);
}

/**
 * @param {import('../core/types.js').Book} book
 */
export async function exportReferenceBundleEpub(book) {
  const title = `${book.name || 'Libro'} — Planificación`;
  const htmlContent = assembleReferenceBundleHtml(book);
  await exportEpubFromHtml(htmlContent, title, book.id, `${sanitizeFilename(book.name)}-planificacion.epub`);
}

/**
 * @param {string} name
 * @param {string} text
 * @param {string} mime
 */
function downloadText(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  downloadBlob(name, blob, mime);
}

/**
 * @param {string} filename
 * @param {Blob} blob
 * @param {string} [mime]
 */
function downloadBlob(filename, blob, _mime) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * @param {string} name
 */
function sanitizeFilename(name) {
  return String(name || 'libro').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80);
}

/**
 * Estadísticas de palabras del libro completo (incluye planificación, notas, etc.).
 * @param {import('../core/types.js').Book} book
 */
export function computeWordStats(book) {
  let total = 0;
  total += wordCountFromHtml(book.synopsis || '');
  total += wordCountFromHtml(book.prologue || '');
  total += wordCountFromHtml(book.epilogue || '');
  for (const rule of book.rules || []) {
    total += wordCountFromHtml(rule.content || '');
  }
  if (!(book.rules || []).length) {
    total += wordCountFromHtml(book.worldRules || '');
  }
  for (const eb of book.extraBlocks || []) {
    total += wordCountFromHtml(eb.content || '');
  }
  if (!(book.extraBlocks || []).length) {
    total += wordCountFromHtml(book.extras || '');
  }
  for (const ev of book.events || []) {
    total += wordCountFromHtml(ev.content || '');
  }
  for (const n of book.notes || []) {
    total += wordCountFromHtml(n.content || '');
  }
  /** @type {{ id: string, title: string, words: number }[]} */
  const chapters = [];
  for (const ch of sortByOrder(book.chapters || [], 'order')) {
    let w = wordCountFromHtml(ch.content || '');
    for (const sc of sortByOrder(ch.scenes || [], 'order')) {
      w += wordCountFromHtml(sc.content || '');
    }
    chapters.push({ id: ch.id, title: ch.title, words: w });
    total += w;
  }
  return { total, chapters, goal: book.wordGoal || 0 };
}

/**
 * Palabras para el panel de progreso y la meta: solo manuscrito (prólogo, capítulos, escenas, epílogo).
 * No incluye sinopsis, contexto, reglas del mundo, extras, notas, eventos de línea temporal ni fichas de personajes.
 * @param {import('../core/types.js').Book} book
 */
export function computeProgressWordStats(book) {
  let total = 0;
  total += wordCountFromHtml(book.prologue || '');
  total += wordCountFromHtml(book.epilogue || '');
  /** @type {{ id: string, title: string, words: number }[]} */
  const chapters = [];
  for (const ch of sortByOrder(book.chapters || [], 'order')) {
    let w = wordCountFromHtml(ch.content || '');
    for (const sc of sortByOrder(ch.scenes || [], 'order')) {
      w += wordCountFromHtml(sc.content || '');
    }
    chapters.push({ id: ch.id, title: ch.title, words: w });
    total += w;
  }
  return { total, chapters, goal: book.wordGoal || 0 };
}
