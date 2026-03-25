/**
 * Detección de problemas narrativos — Narrative Lab (funciones puras sobre Book)
 */

import { listRelationships } from './relations.js';
import { sortByOrder, wordCountFromHtml } from './utils.js';

/**
 * @param {import('./types.js').Book} book
 * @returns {import('./types.js').NarrativeIssue[]}
 */
export function detectNarrativeIssues(book) {
  /** @type {import('./types.js').NarrativeIssue[]} */
  const out = [];
  const rels = listRelationships(book);

  const charLinked = new Set();
  for (const r of rels) {
    if ((r.type === 'character_chapter' || r.type === 'character_scene') && r.from.kind === 'character') {
      charLinked.add(r.from.id);
    }
  }

  for (const ch of sortByOrder(book.chapters || [], 'order')) {
    if (!String(ch.chapterGoal || '').trim()) {
      out.push({
        severity: 'warning',
        code: 'chapter_no_goal',
        message: `Capítulo «${ch.title}» sin objetivo definido`,
        chapterId: ch.id,
      });
    }
    for (const sc of sortByOrder(ch.scenes || [], 'order')) {
      const w = wordCountFromHtml(sc.content || '');
      if (w < 1) {
        out.push({
          severity: 'warning',
          code: 'scene_empty',
          message: `Escena «${sc.title}» sin contenido (${ch.title})`,
          chapterId: ch.id,
          sceneId: sc.id,
        });
      }
    }
  }

  for (const c of book.characters || []) {
    if (!charLinked.has(c.id)) {
      out.push({
        severity: 'info',
        code: 'character_no_links',
        message: `Personaje «${c.name || 'Sin nombre'}» sin vínculos en Relaciones`,
        characterId: c.id,
      });
    }
  }

  const eventIds = new Set((book.events || []).map((e) => e.id));
  const eventConnected = new Set();
  for (const r of rels) {
    if (r.type === 'event_event') {
      if (r.from.kind === 'event') eventConnected.add(r.from.id);
      if (r.to.kind === 'event') eventConnected.add(r.to.id);
    }
  }
  for (const id of eventIds) {
    if (!eventConnected.has(id)) {
      const ev = book.events.find((e) => e.id === id);
      out.push({
        severity: 'info',
        code: 'event_isolated',
        message: `Evento «${ev?.title || 'Sin título'}» sin conexiones con otros eventos`,
        eventId: id,
      });
    }
  }

  return out;
}

/**
 * Solo issues con severity warning (para badge UI).
 * @param {import('./types.js').Book} book
 * @returns {number}
 */
export function countWarningIssues(book) {
  return detectNarrativeIssues(book).filter((i) => i.severity === 'warning').length;
}
