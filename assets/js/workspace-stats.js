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
export function aggregateWorkspaceStats(workspace) {
  const books = workspace.books || [];
  let totalWords = 0;
  let chapterCount = 0;
  let sceneCount = 0;
  let characterCount = 0;
  let eventCount = 0;
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
  }
  perBook.sort((a, b) => b.words - a.words);
  return {
    bookCount: books.length,
    totalWords,
    chapterCount,
    sceneCount,
    characterCount,
    eventCount,
    perBook,
  };
}
