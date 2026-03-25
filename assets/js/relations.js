/**
 * Relaciones entre entidades — Narrative Lab
 */

import { createRelationship } from './models.js';

/**
 * @param {import('./types.js').Book} book
 * @returns {import('./types.js').Relationship[]}
 */
export function listRelationships(book) {
  return book.relationships || [];
}

/**
 * @param {import('./types.js').Book} book
 * @param {import('./types.js').Relationship} rel
 */
export function addRelationship(book, rel) {
  if (!book.relationships) book.relationships = [];
  book.relationships.push(rel);
}

/**
 * @param {import('./types.js').Book} book
 * @param {string} id
 */
export function removeRelationship(book, id) {
  book.relationships = (book.relationships || []).filter((r) => r.id !== id);
}

/**
 * Relacionar personaje con capítulo.
 * @param {import('./types.js').Book} book
 * @param {string} characterId
 * @param {string} chapterId
 */
/**
 * @param {{ description?: string }} [opts]
 */
export function linkCharacterToChapter(book, characterId, chapterId, opts = {}) {
  const exists = listRelationships(book).some(
    (r) =>
      r.type === 'character_chapter' &&
      r.from.kind === 'character' &&
      r.from.id === characterId &&
      r.to.kind === 'chapter' &&
      r.to.id === chapterId
  );
  if (exists) return;
  addRelationship(
    book,
    createRelationship(
      'character_chapter',
      { kind: 'character', id: characterId },
      { kind: 'chapter', id: chapterId },
      { description: typeof opts.description === 'string' ? opts.description : '' }
    )
  );
}

/**
 * @param {import('./types.js').Book} book
 * @param {string} characterId
 * @param {string} chapterId
 * @param {string} sceneId
 */
/**
 * @param {{ description?: string }} [opts]
 */
export function linkCharacterToScene(book, characterId, chapterId, sceneId, opts = {}) {
  const key = `${characterId}|${chapterId}|${sceneId}`;
  const exists = listRelationships(book).some((r) => {
    if (r.type !== 'character_scene') return false;
    return r.from.id === characterId && r.to.id === sceneId && r.to.kind === 'scene';
  });
  if (exists) return;
  addRelationship(
    book,
    createRelationship(
      'character_scene',
      { kind: 'character', id: characterId },
      { kind: 'scene', id: sceneId },
      {
        description: typeof opts.description === 'string' ? opts.description : '',
        meta: { chapterId, key },
      }
    )
  );
}

/**
 * @param {import('./types.js').Book} book
 * @param {string} eventA
 * @param {string} eventB
 */
/**
 * Etiquetas para vínculos entre personajes (valor en meta.role).
 */
export const CHARACTER_LINK_ROLE_OPTIONS = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hijo', label: 'Hijo / hija' },
  { value: 'hermano', label: 'Hermano / hermana' },
  { value: 'mejores_amigos', label: 'Mejores amigos' },
  { value: 'amantes', label: 'Amantes' },
  { value: 'novios', label: 'Novios' },
  { value: 'otro', label: 'Otro (usar descripción)' },
];

/**
 * @param {import('./types.js').Book} book
 * @param {string} fromCharacterId
 * @param {string} toCharacterId
 * @param {{ role?: string, description?: string, disabled?: boolean }} [opts]
 */
export function linkCharacterToCharacter(book, fromCharacterId, toCharacterId, opts = {}) {
  if (fromCharacterId === toCharacterId) return;
  const exists = listRelationships(book).some(
    (r) =>
      r.type === 'character_character' &&
      r.from.kind === 'character' &&
      r.to.kind === 'character' &&
      ((r.from.id === fromCharacterId && r.to.id === toCharacterId) ||
        (r.from.id === toCharacterId && r.to.id === fromCharacterId))
  );
  if (exists) return;
  addRelationship(
    book,
    createRelationship(
      'character_character',
      { kind: 'character', id: fromCharacterId },
      { kind: 'character', id: toCharacterId },
      {
        description: typeof opts.description === 'string' ? opts.description : '',
        disabled: opts.disabled === true,
        meta: { role: typeof opts.role === 'string' ? opts.role : '' },
      }
    )
  );
}

/**
 * @param {import('./types.js').Book} book
 * @param {string} eventA
 * @param {string} eventB
 * @param {{ description?: string }} [opts]
 */
export function linkEventToEvent(book, eventA, eventB, opts = {}) {
  const exists = listRelationships(book).some(
    (r) =>
      r.type === 'event_event' &&
      ((r.from.id === eventA && r.to.id === eventB) || (r.from.id === eventB && r.to.id === eventA))
  );
  if (exists) return;
  addRelationship(
    book,
    createRelationship(
      'event_event',
      { kind: 'event', id: eventA },
      { kind: 'event', id: eventB },
      {
        description: typeof opts?.description === 'string' ? opts.description : '',
      }
    )
  );
}

/**
 * @param {import('./types.js').Book} book
 * @param {string} characterId
 * @returns {{ chapterId: string, title: string }[]}
 */
export function chaptersForCharacter(book, characterId) {
  const out = [];
  for (const r of listRelationships(book)) {
    if (r.type === 'character_chapter' && r.from.id === characterId && r.to.kind === 'chapter') {
      const ch = book.chapters.find((c) => c.id === r.to.id);
      if (ch) out.push({ chapterId: ch.id, title: ch.title });
    }
  }
  return out;
}

/**
 * @param {import('./types.js').Book} book
 * @param {string} characterId
 * @returns {{ sceneId: string, title: string, chapterTitle: string }[]}
 */
export function scenesForCharacter(book, characterId) {
  const out = [];
  for (const r of listRelationships(book)) {
    if (r.type === 'character_scene' && r.from.id === characterId && r.to.kind === 'scene') {
      const sceneId = r.to.id;
      for (const ch of book.chapters) {
        const sc = ch.scenes.find((s) => s.id === sceneId);
        if (sc) {
          out.push({ sceneId: sc.id, title: sc.title, chapterTitle: ch.title });
          break;
        }
      }
    }
  }
  return out;
}
