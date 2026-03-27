/**
 * Estadísticas de libro — Narrative Lab (funciones puras sobre Book)
 */

import { computeWordStats } from './export.js';
import { listRelationships } from './relations.js';

/** Palabras por minuto para tiempo de lectura estimado */
export const READING_WPM = 200;

/**
 * @param {import('../core/types.js').Book} book
 * @returns {import('../core/types.js').BookStats}
 */
export function getBookStats(book) {
  const ws = computeWordStats(book);
  let sceneCount = 0;
  for (const ch of book.chapters || []) {
    sceneCount += (ch.scenes || []).length;
  }
  const rels = listRelationships(book);
  const linkedChars = new Set();
  for (const r of rels) {
    if (r.type === 'character_chapter' || r.type === 'character_scene') {
      if (r.from.kind === 'character') linkedChars.add(r.from.id);
    }
  }
  const chars = book.characters || [];
  return {
    totalWords: ws.total,
    wordGoal: ws.goal,
    chapterCount: (book.chapters || []).length,
    sceneCount,
    characterCount: chars.length,
    eventCount: (book.events || []).length,
    activeCharacters: linkedChars.size,
    readingMinutes: ws.total > 0 ? Math.max(1, Math.round(ws.total / READING_WPM)) : 0,
  };
}

/**
 * @param {import('../core/types.js').Book} book
 * @returns {Map<string, import('../core/types.js').CharacterUsageEntry>}
 */
export function getCharacterUsage(book) {
  /** @type {Map<string, import('../core/types.js').CharacterUsageEntry>} */
  const map = new Map();
  for (const c of book.characters || []) {
    map.set(c.id, {
      characterId: c.id,
      name: c.name || 'Sin nombre',
      chapterIds: [],
      sceneIds: [],
    });
  }
  for (const r of listRelationships(book)) {
    if (r.type === 'character_chapter' && r.from.kind === 'character' && r.to.kind === 'chapter') {
      const e = map.get(r.from.id);
      if (e && !e.chapterIds.includes(r.to.id)) e.chapterIds.push(r.to.id);
    }
    if (r.type === 'character_scene' && r.from.kind === 'character' && r.to.kind === 'scene') {
      const e = map.get(r.from.id);
      if (e && !e.sceneIds.includes(r.to.id)) e.sceneIds.push(r.to.id);
    }
  }
  return map;
}
