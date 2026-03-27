/**
 * Relaciones entre entidades — Narrative Lab
 */

import { createRelationship } from '../domain/models.js';

/**
 * @param {import('../core/types.js').Book} book
 * @returns {import('../core/types.js').Relationship[]}
 */
export function listRelationships(book) {
  return book.relationships || [];
}

/**
 * @param {import('../core/types.js').Book} book
 * @param {import('../core/types.js').Relationship} rel
 */
export function addRelationship(book, rel) {
  if (!book.relationships) book.relationships = [];
  book.relationships.push(rel);
}

/**
 * @param {import('../core/types.js').Book} book
 * @param {string} id
 */
export function removeRelationship(book, id) {
  book.relationships = (book.relationships || []).filter((r) => r.id !== id);
}

/**
 * Relacionar personaje con capítulo.
 * @param {import('../core/types.js').Book} book
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
 * @param {import('../core/types.js').Book} book
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
 * @param {import('../core/types.js').Book} book
 * @param {string} eventA
 * @param {string} eventB
 */
/**
 * Opciones de vínculo personaje–personaje (`meta.role`).
 *
 * Convención: el rol describe al **from** respecto al **to** al guardar la relación
 * (`linkCharacterToCharacter(book, fromId, toId, { role })` → «from es [rol] de to»).
 * Para mostrar la ficha de cualquiera de los dos, usar `characterLinkPhraseForViewer`.
 */
export const CHARACTER_LINK_ROLE_OPTIONS = [
  { value: 'padre', label: 'Soy padre de la otra persona', legendLabel: 'Padre' },
  { value: 'madre', label: 'Soy madre de la otra persona', legendLabel: 'Madre' },
  { value: 'hijo', label: 'Soy hijo de la otra persona', legendLabel: 'Hijo' },
  { value: 'hija', label: 'Soy hija de la otra persona', legendLabel: 'Hija' },
  { value: 'hermano', label: 'Somos hermanos o hermanas (yo y la otra persona)', legendLabel: 'Hermano/a' },
  { value: 'casados', label: 'Casados o matrimonio con la otra persona', legendLabel: 'Casados' },
  { value: 'mejores_amigos', label: 'Mejores amigos con la otra persona', legendLabel: 'Mejores amigos' },
  { value: 'amantes', label: 'Amantes con la otra persona', legendLabel: 'Amantes' },
  { value: 'novios', label: 'Novios con la otra persona', legendLabel: 'Novios' },
  { value: 'otro', label: 'Otro (usar descripción)', legendLabel: 'Otro' },
];

/**
 * Roles de filiación hijo/a (equivalentes para layout y color).
 * @param {string} [role]
 * @returns {boolean}
 */
export function isChildRole(role) {
  return role === 'hijo' || role === 'hija';
}

/**
 * Frase legible del vínculo desde la perspectiva de un personaje.
 * @param {string} viewerId id del personaje cuya ficha se mira
 * @param {import('../core/types.js').Relationship} rel
 * @param {{ viewerName: string, otherName: string }} names nombres del visitante y del otro extremo
 * @returns {string}
 */
export function characterLinkPhraseForViewer(viewerId, rel, { viewerName, otherName }) {
  if (rel.type !== 'character_character') {
    return `${viewerName} — ${otherName}`;
  }
  const role = rel.meta && typeof rel.meta.role === 'string' ? rel.meta.role : '';
  const desc = typeof rel.description === 'string' ? rel.description.trim() : '';
  const v = viewerName || '—';
  const o = otherName || '—';

  const fromId = rel.from.kind === 'character' ? rel.from.id : '';
  const toId = rel.to.kind === 'character' ? rel.to.id : '';

  if (viewerId === fromId) {
    if (role === 'padre') return `${v} es padre de ${o}`;
    if (role === 'madre') return `${v} es madre de ${o}`;
    if (role === 'hijo') return `${v} es hijo de ${o}`;
    if (role === 'hija') return `${v} es hija de ${o}`;
    if (role === 'hermano') return `${v} es hermano o hermana de ${o}`;
    if (role === 'casados') return `${v} está casado o casada con ${o}`;
    if (role === 'mejores_amigos') return `${v} es mejor amigo o amiga de ${o}`;
    if (role === 'amantes') return `${v} es amante de ${o}`;
    if (role === 'novios') return `${v} es novio o novia de ${o}`;
    if (role === 'otro' && desc) return `${v}: ${desc} (${o})`;
    if (role === 'otro') return `${v} tiene un vínculo con ${o}`;
    return `${v} — ${o}`;
  }

  if (viewerId === toId) {
    if (role === 'padre') return `${v} es hijo o hija de ${o}`;
    if (role === 'madre') return `${v} es hijo o hija de ${o}`;
    if (isChildRole(role)) return `${v} es padre o madre de ${o}`;
    if (role === 'hermano') return `${v} es hermano o hermana de ${o}`;
    if (role === 'casados') return `${v} está casado o casada con ${o}`;
    if (role === 'mejores_amigos') return `${v} es mejor amigo o amiga de ${o}`;
    if (role === 'amantes') return `${v} es amante de ${o}`;
    if (role === 'novios') return `${v} es novio o novia de ${o}`;
    if (role === 'otro' && desc) return `${v}: ${desc} (${o})`;
    if (role === 'otro') return `${v} tiene un vínculo con ${o}`;
    return `${v} — ${o}`;
  }

  return `${v} — ${o}`;
}

/**
 * Frase canónica desde **from** (primera persona del vínculo guardado).
 * @param {import('../core/types.js').Relationship} rel
 * @param {string} fromName
 * @param {string} toName
 * @returns {string}
 */
export function characterLinkCanonicalPhrase(rel, fromName, toName) {
  if (rel.type !== 'character_character' || rel.from.kind !== 'character' || rel.to.kind !== 'character') {
    return `${fromName} → ${toName}`;
  }
  return characterLinkPhraseForViewer(rel.from.id, rel, { viewerName: fromName, otherName: toName });
}

/**
 * @param {import('../core/types.js').Book} book
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
 * @param {import('../core/types.js').Book} book
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
 * @param {import('../core/types.js').Book} book
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
 * @param {import('../core/types.js').Book} book
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
