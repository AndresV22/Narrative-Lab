/**
 * Búsqueda global en capítulos, escenas, notas, prólogo, eventos y extras — Narrative Lab
 */

import { normalizeSearch, snippet, stripHtml } from './utils.js';

/**
 * @typedef {Object} SearchHit
 * @property {'chapter'|'scene'|'note'|'synopsis'|'prologue'|'event'|'extra'|'historicalContext'|'worldRules'|'worldRule'} kind
 * @property {string} bookId
 * @property {string} bookName
 * @property {string} id
 * @property {string} label
 * @property {string} excerpt
 * @property {string} [chapterId]
 */

/**
 * @param {import('./types.js').Book} book
 * @param {string} query
 * @returns {SearchHit[]}
 */
export function searchInBook(book, query) {
  const q = normalizeSearch(query).trim();
  if (!q) return [];
  /** @type {SearchHit[]} */
  const hits = [];

  const match = (text) => normalizeSearch(stripHtml(text)).includes(q);

  if (match(book.synopsis)) {
    hits.push({
      kind: 'synopsis',
      bookId: book.id,
      bookName: book.name,
      id: 'synopsis',
      label: 'Sinopsis',
      excerpt: snippet(stripHtml(book.synopsis)),
    });
  }

  if (match(book.prologue)) {
    hits.push({
      kind: 'prologue',
      bookId: book.id,
      bookName: book.name,
      id: 'prologue',
      label: 'Prólogo',
      excerpt: snippet(stripHtml(book.prologue)),
    });
  }

  if (match(book.historicalContext)) {
    hits.push({
      kind: 'historicalContext',
      bookId: book.id,
      bookName: book.name,
      id: 'historicalContext',
      label: 'Contexto',
      excerpt: snippet(stripHtml(book.historicalContext)),
    });
  }

  if (match(book.worldRules)) {
    hits.push({
      kind: 'worldRules',
      bookId: book.id,
      bookName: book.name,
      id: 'worldRules',
      label: 'Reglas del mundo (legacy)',
      excerpt: snippet(stripHtml(book.worldRules)),
    });
  }

  for (const wr of book.rules || []) {
    if (match(wr.title) || match(wr.content)) {
      hits.push({
        kind: 'worldRule',
        bookId: book.id,
        bookName: book.name,
        id: wr.id,
        label: `Regla: ${wr.title || '(sin título)'}`,
        excerpt: snippet(stripHtml(wr.title + ' ' + wr.content)),
      });
    }
  }

  for (const eb of book.extraBlocks || []) {
    if (match(eb.title) || match(eb.content)) {
      hits.push({
        kind: 'extra',
        bookId: book.id,
        bookName: book.name,
        id: eb.id,
        label: `Extra: ${eb.title}`,
        excerpt: snippet(stripHtml(eb.title + ' ' + eb.content)),
      });
    }
  }

  for (const ev of book.events || []) {
    if (match(ev.title) || match(ev.dateLabel) || match(ev.content)) {
      hits.push({
        kind: 'event',
        bookId: book.id,
        bookName: book.name,
        id: ev.id,
        label: `Evento: ${ev.title || '(sin título)'}`,
        excerpt: snippet(stripHtml(ev.title + ' ' + ev.content)),
      });
    }
  }

  for (const note of book.notes || []) {
    if (match(note.title) || match(note.content)) {
      hits.push({
        kind: 'note',
        bookId: book.id,
        bookName: book.name,
        id: note.id,
        label: `Nota: ${note.title}`,
        excerpt: snippet(stripHtml(note.title + ' ' + note.content)),
      });
    }
  }

  for (const ch of book.chapters || []) {
    if (match(ch.title) || match(ch.content)) {
      hits.push({
        kind: 'chapter',
        bookId: book.id,
        bookName: book.name,
        id: ch.id,
        label: `Capítulo: ${ch.title}`,
        chapterId: ch.id,
        excerpt: snippet(stripHtml(ch.title + ' ' + ch.content)),
      });
    }
    for (const sc of ch.scenes || []) {
      if (match(sc.title) || match(sc.content)) {
        hits.push({
          kind: 'scene',
          bookId: book.id,
          bookName: book.name,
          id: sc.id,
          label: `Escena: ${sc.title} (${ch.title})`,
          chapterId: ch.id,
          excerpt: snippet(stripHtml(sc.title + ' ' + sc.content)),
        });
      }
    }
  }

  return hits;
}

/**
 * @param {import('./types.js').Workspace} ws
 * @param {string} query
 * @returns {SearchHit[]}
 */
export function searchWorkspace(ws, query) {
  /** @type {SearchHit[]} */
  const all = [];
  for (const b of ws.books || []) {
    all.push(...searchInBook(b, query));
  }
  return all;
}
