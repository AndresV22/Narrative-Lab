/**
 * Origen legible y navegación de frases destacadas — Narrative Lab
 */

/**
 * @param {import('./types.js').Book} book
 * @param {import('./types.js').Highlight} h
 * @returns {string}
 */
export function inferChapterIdForSceneHighlight(book, h) {
  if (h.sourceKind !== 'scene' || !h.sourceId) return '';
  if (h.chapterId) return h.chapterId;
  for (const ch of book.chapters || []) {
    if ((ch.scenes || []).some((s) => s.id === h.sourceId)) return ch.id;
  }
  return '';
}

/**
 * @param {import('./types.js').Book} book
 * @param {import('./types.js').Highlight} h
 * @returns {string}
 */
export function formatHighlightSource(book, h) {
  const kind = h.sourceKind || '';
  const id = h.sourceId || '';
  if (kind === 'synopsis') return 'Sinopsis';
  if (kind === 'historicalContext') return 'Contexto histórico';
  if (kind === 'worldRules') return 'Reglas del mundo';
  if (kind === 'prologue') return 'Prólogo';
  if (kind === 'epilogue') return 'Epílogo';
  if (kind === 'extras') return 'Extras (legacy)';
  if (kind === 'chapter') {
    const ch = book.chapters?.find((c) => c.id === id);
    return ch ? `Capítulo: ${ch.title}` : 'Capítulo';
  }
  if (kind === 'scene') {
    const chId = inferChapterIdForSceneHighlight(book, h);
    const ch = chId ? book.chapters?.find((c) => c.id === chId) : null;
    const sc = ch?.scenes?.find((s) => s.id === id);
    if (ch && sc) return `Escena: ${sc.title} (${ch.title})`;
    if (sc) return `Escena: ${sc.title}`;
    return 'Escena';
  }
  if (kind === 'note') {
    const n = book.notes?.find((x) => x.id === id);
    return n ? `Nota: ${n.title}` : 'Nota';
  }
  if (kind === 'extra') {
    const ex = book.extraBlocks?.find((x) => x.id === id);
    return ex ? `Extra: ${ex.title}` : 'Extra';
  }
  return kind || '—';
}

/**
 * @param {import('./types.js').Book} book
 * @param {import('./types.js').Highlight} h
 * @returns {boolean}
 */
export function canNavigateHighlightSource(book, h) {
  const kind = h.sourceKind || '';
  if (kind === 'scene') return !!(h.sourceId && inferChapterIdForSceneHighlight(book, h));
  if (kind === 'chapter' || kind === 'note' || kind === 'extra') return !!h.sourceId;
  if (
    kind === 'synopsis' ||
    kind === 'historicalContext' ||
    kind === 'worldRules' ||
    kind === 'prologue' ||
    kind === 'epilogue' ||
    kind === 'extras'
  ) {
    return true;
  }
  return false;
}
