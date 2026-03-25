/**
 * Estadísticas agregadas del workspace — Narrative Lab
 */

import { getBookStats } from './analysis.js';

/**
 * @param {import('./types.js').Book} book
 */
export function statsForBook(book) {
  const bstats = getBookStats(book);
  return {
    ...bstats,
    bookId: book.id,
    bookName: book.name,
  };
}

/**
 * @param {import('./types.js').Workspace} workspace
 */
const STATUS_KEYS = ['Borrador', 'En revisión', 'Publicado'];

/**
 * @param {import('./types.js').Workspace} workspace
 */
export function aggregateWorkspaceStats(workspace) {
  const books = workspace.books || [];
  let totalWords = 0;
  let chapterCount = 0;
  let sceneCount = 0;
  let characterCount = 0;
  let eventCount = 0;
  /** @type {Record<string, number>} */
  const byStatus = { Borrador: 0, 'En revisión': 0, Publicado: 0 };
  /** @type {Record<string, number>} */
  const byCategory = {};
  /** @type {{ bookId: string, bookName: string, words: number }[]} */
  const perBook = [];
  for (const b of books) {
    const s = statsForBook(b);
    totalWords += s.totalWords;
    chapterCount += s.chapterCount;
    sceneCount += s.sceneCount;
    characterCount += s.characterCount;
    eventCount += s.eventCount;
    perBook.push({ bookId: b.id, bookName: b.name, words: s.totalWords });
    const st = typeof b.status === 'string' && b.status in byStatus ? b.status : 'Borrador';
    byStatus[st] = (byStatus[st] || 0) + 1;
    const cat = (b.category || '').trim() || 'Sin categoría';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  perBook.sort((a, b) => b.words - a.words);
  const bookCount = books.length;
  const totalPagesEstimate = totalWords > 0 ? Math.max(1, Math.ceil(totalWords / 300)) : 0;
  const avgWordsPerBook = bookCount > 0 ? Math.round(totalWords / bookCount) : 0;
  return {
    bookCount,
    totalWords,
    totalPagesEstimate,
    avgWordsPerBook,
    chapterCount,
    sceneCount,
    characterCount,
    eventCount,
    perBook,
    byStatus,
    byCategory,
    statusKeys: STATUS_KEYS,
  };
}
