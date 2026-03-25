/**
 * Exportación de libro y formatos — Narrative Lab
 */

import { characterRoleLabel } from './character-roles.js';
import { stripNlCommentMarks, stripNlHighlightMarks } from './editor-helpers.js';
import { sortByOrder, stripHtml, wordCountFromHtml } from './utils.js';

/**
 * HTML de fragmento listo para export (sin marcas de comentario del editor).
 * @param {string} [html]
 */
function cleanExportHtml(html) {
  return stripNlHighlightMarks(stripNlCommentMarks(html || ''));
}

/**
 * Ensambla HTML completo del libro (prólogo → capítulos/escenas → epílogo).
 * @param {import('./types.js').Book} book
 * @param {boolean} [includeNotes]
 * @returns {string}
 */
export function assembleBookHtml(book, includeNotes = true) {
  const parts = [];
  parts.push(`<h1>${escape(book.name)}</h1>`);
  if (book.author) parts.push(`<p class="meta"><em>${escape(book.author)}</em></p>`);

  if (book.synopsis && stripHtml(book.synopsis)) {
    parts.push('<h2>Sinopsis</h2>', book.synopsis);
  }

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

  const blocks = book.extraBlocks || [];
  if (blocks.length) {
    parts.push('<h2>Extras</h2>');
    for (const eb of blocks) {
      parts.push(`<h3>${escape(eb.title)}</h3>`, cleanExportHtml(eb.content || ''));
    }
  } else if (book.extras && stripHtml(book.extras)) {
    parts.push('<h2>Extras</h2>', cleanExportHtml(book.extras));
  }

  if (includeNotes && book.notes && book.notes.length) {
    parts.push('<h2>Notas</h2>');
    for (const n of book.notes) {
      parts.push(`<h3>${escape(n.title)}</h3>`, cleanExportHtml(n.content || ''));
    }
  }

  if (book.highlights && book.highlights.length) {
    parts.push('<h2>Frases destacadas</h2><ul>');
    for (const h of book.highlights) {
      parts.push(`<li>${escape(h.excerpt)}</li>`);
    }
    parts.push('</ul>');
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
 * @param {import('./types.js').Book} book
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
        `<h3>${escape(c.name || 'Sin nombre')}</h3>`,
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
 * @param {import('./types.js').Character} ch
 */
function characterPlanningFieldsHtml(ch) {
  let html = `<p><strong>Papel:</strong> ${escape(characterRoleLabel(ch.role))}</p>`;
  if (ch.age) html += `<p><strong>Edad:</strong> ${escape(ch.age)}</p>`;
  if (ch.imageDataUrl) {
    html += `<p><img src="${ch.imageDataUrl}" alt="" style="max-width:12rem;height:auto;"/></p>`;
  }
  const blocks = [
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
 * @param {import('./types.js').Character} ch
 */
function characterPrintFieldsHtml(ch) {
  return characterPlanningFieldsHtml(ch);
}

/**
 * HTML imprimible: una ficha de personaje (título + libro).
 * @param {import('./types.js').Book} book
 * @param {import('./types.js').Character} ch
 */
export function characterToPrintableHtml(book, ch) {
  return `<article class="nl-book-export nl-char-print"><h1>${escape(ch.name || 'Personaje')}</h1><p class="meta"><em>${escape(
    book.name
  )}</em></p>${characterPrintFieldsHtml(ch)}</article>`;
}

/**
 * HTML imprimible: todas las fichas.
 * @param {import('./types.js').Book} book
 */
export function allCharactersPrintableHtml(book) {
  const parts = [`<h1>${escape(book.name)}</h1><h2>Personajes</h2>`];
  for (const ch of book.characters || []) {
    parts.push(`<h2>${escape(ch.name || 'Sin nombre')}</h2>`, characterPrintFieldsHtml(ch));
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
  root.innerHTML = `
    <div class="nl-print-export" style="padding: 2rem; max-width: 40rem; margin: 0 auto;">
      ${innerArticleHtml}
    </div>
  `;
  window.print();
  setTimeout(() => {
    root.innerHTML = '';
  }, 500);
}

/**
 * PDF vía impresión: material de planificación.
 * @param {import('./types.js').Book} book
 */
export function exportReferenceBundlePdf(book) {
  injectPrintRoot(assembleReferenceBundleHtml(book));
}

/**
 * @param {import('./types.js').Book} book
 */
export function exportReferenceBundleTxt(book) {
  const html = assembleReferenceBundleHtml(book);
  const text = stripHtml(html).replace(/\s+\n/g, '\n').trim();
  downloadText(`${sanitizeFilename(book.name)}-planificacion.txt`, text, 'text/plain;charset=utf-8');
}

/**
 * @param {import('./types.js').Book} book
 */
export function exportCharacterPdfPrint(book, characterId) {
  const ch = book.characters?.find((c) => c.id === characterId);
  if (!ch) return;
  injectPrintRoot(characterToPrintableHtml(book, ch));
}

/**
 * @param {import('./types.js').Book} book
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
 * @param {import('./types.js').Book} book
 */
export function exportMarkdown(book) {
  const html = assembleBookHtml(book, true);
  const md = htmlToMarkdown(html);
  downloadText(`${sanitizeFilename(book.name)}.md`, md, 'text/markdown;charset=utf-8');
}

/**
 * @param {import('./types.js').Book} book
 */
export function exportTxt(book) {
  const html = assembleBookHtml(book, true);
  const text = stripHtml(html).replace(/\s+\n/g, '\n').trim();
  downloadText(`${sanitizeFilename(book.name)}.txt`, text, 'text/plain;charset=utf-8');
}

/**
 * Abre diálogo de impresión (PDF vía “Guardar como PDF”).
 * @param {import('./types.js').Book} book
 */
export function exportPdfPrint(book) {
  injectPrintRoot(assembleBookHtml(book, true));
}

/**
 * Convierte runs inline (negrita, cursiva, etc.) para docx.
 * @param {HTMLElement} el
 * @param {any} docx — módulo docx (TextRun, UnderlineType)
 */
function inlineRunsFromElement(el, docx) {
  const { TextRun, UnderlineType } = docx;
  const runs = [];
  function walk(n, styles) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n.textContent || '';
      if (t) runs.push(new TextRun({ text: t, ...styles }));
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      const tag = n.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push(new TextRun({ break: 1 }));
        return;
      }
      const next = { ...styles };
      if (tag === 'strong' || tag === 'b') next.bold = true;
      if (tag === 'em' || tag === 'i') next.italics = true;
      if (tag === 'u' && UnderlineType) next.underline = { type: UnderlineType.SINGLE };
      n.childNodes.forEach((c) => walk(c, next));
    }
  }
  el.childNodes.forEach((c) => walk(c, {}));
  return runs.length ? runs : [new TextRun({ text: '' })];
}

/**
 * @param {ChildNode} node
 * @param {unknown[]} out
 * @param {any} docx
 */
function processBlockForDocx(node, out, docx) {
  const { Paragraph, TextRun, HeadingLevel } = docx;
  const runsFor = (/** @type {HTMLElement} */ el) => inlineRunsFromElement(el, docx);
  if (node.nodeType === Node.TEXT_NODE) {
    const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) out.push(new Paragraph({ children: [new TextRun({ text: t })] }));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = /** @type {HTMLElement} */ (node);
  const tag = el.tagName.toLowerCase();
  if (tag === 'h1') {
    out.push(new Paragraph({ text: el.textContent.trim(), heading: HeadingLevel.HEADING_1 }));
    return;
  }
  if (tag === 'h2') {
    out.push(new Paragraph({ text: el.textContent.trim(), heading: HeadingLevel.HEADING_2 }));
    return;
  }
  if (tag === 'h3') {
    out.push(new Paragraph({ text: el.textContent.trim(), heading: HeadingLevel.HEADING_3 }));
    return;
  }
  if (tag === 'h4' || tag === 'h5' || tag === 'h6') {
    out.push(new Paragraph({ text: el.textContent.trim(), heading: HeadingLevel.HEADING_3 }));
    return;
  }
  if (tag === 'p') {
    const plain = el.textContent?.trim();
    if (!plain) return;
    out.push(new Paragraph({ children: runsFor(el) }));
    return;
  }
  if (tag === 'blockquote') {
    const plain = el.textContent?.trim();
    if (!plain) return;
    out.push(
      new Paragraph({
        children: runsFor(el),
        indent: { left: 720 },
      })
    );
    return;
  }
  if (tag === 'ul') {
    el.querySelectorAll(':scope > li').forEach((li) => {
      const h = /** @type {HTMLElement} */ (li);
      if (!h.textContent?.trim()) return;
      out.push(
        new Paragraph({
          children: [new TextRun({ text: '• ' }), ...runsFor(h)],
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
          children: [new TextRun({ text: `${i}. ` }), ...runsFor(h)],
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
  out.push(new Paragraph({ children: [new TextRun({ text: plain })] }));
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
  const { Document, Packer, Paragraph, TextRun } = docx;
  if (!Document || !Packer || !Paragraph || !TextRun) {
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
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: /** @type {any} */ (children),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(`${sanitizeFilename(filenameStem)}.docx`, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/**
 * Exporta DOCX con OOXML real (docx vía esm.sh). Evita html-docx-js (altChunk), que Word suele abrir vacío.
 * @param {import('./types.js').Book} book
 */
export async function exportDocx(book) {
  await exportDocxFromHtml(assembleBookHtml(book, true), book.name);
}

/**
 * @param {import('./types.js').Book} book
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

  const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapedTitle}</title></head>
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
 * @param {import('./types.js').Book} book
 */
export async function exportEpub(book) {
  const title = book.name || 'Libro';
  const htmlContent = assembleBookHtml(book, true);
  await exportEpubFromHtml(htmlContent, title, book.id, `${sanitizeFilename(book.name)}.epub`);
}

/**
 * @param {import('./types.js').Book} book
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
 * Estadísticas de palabras para panel.
 * @param {import('./types.js').Book} book
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
