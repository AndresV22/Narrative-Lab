/**
 * Análisis narrativo — Narrative Lab (funciones puras sobre Book)
 */

import { computeWordStats } from './export.js';
import { displayDateToIso, normalizeDateLabelIfNumeric } from '../core/date-format.js';
import { listRelationships } from './relations.js';
import { sortByOrder, wordCountFromHtml } from '../core/utils.js';

/**
 * Convierte etiqueta de evento a ISO comparable (solo DD/MM/AAAA válidos).
 * @param {string} [label]
 * @returns {string|null}
 */
function parseComparableEventDateLabel(label) {
  const s = String(label || '').trim();
  if (!s) return null;
  const normalized = normalizeDateLabelIfNumeric(s);
  return displayDateToIso(normalized);
}

/** Palabras por minuto para tiempo de lectura estimado */
const READING_WPM = 200;

/**
 * @typedef {'warning'|'info'} IssueSeverity
 */

/**
 * @typedef {Object} NarrativeIssue
 * @property {IssueSeverity} severity
 * @property {string} code
 * @property {string} message
 * @property {string} [chapterId]
 * @property {string} [sceneId]
 * @property {string} [characterId]
 * @property {string} [eventId]
 */

/**
 * @typedef {Object} BookStats
 * @property {number} totalWords
 * @property {number} wordGoal
 * @property {number} chapterCount
 * @property {number} sceneCount
 * @property {number} characterCount
 * @property {number} eventCount
 * @property {number} activeCharacters
 * @property {number} readingMinutes
 */

/**
 * @typedef {Object} CharacterUsageEntry
 * @property {string} characterId
 * @property {string} name
 * @property {string[]} chapterIds
 * @property {string[]} sceneIds
 */

/**
 * @typedef {Object} TimelineConflict
 * @property {'warning'|'info'} severity
 * @property {string} code
 * @property {string} message
 * @property {string} [eventId]
 */

/**
 * @typedef {Object} BookHealth
 * @property {number} score
 * @property {NarrativeIssue[]} issues
 * @property {string[]} strengths
 */

/**
 * @param {import('../core/types.js').Book} book
 * @returns {BookStats}
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
 * @returns {NarrativeIssue[]}
 */
export function detectNarrativeIssues(book) {
  /** @type {NarrativeIssue[]} */
  const out = [];
  const rels = listRelationships(book);

  const charLinked = new Set();
  for (const r of rels) {
    if (r.type === 'character_character') {
      if (r.from.kind === 'character') charLinked.add(r.from.id);
      if (r.to.kind === 'character') charLinked.add(r.to.id);
      continue;
    }
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
 * @param {import('../core/types.js').Book} book
 * @returns {Map<string, CharacterUsageEntry>}
 */
export function getCharacterUsage(book) {
  /** @type {Map<string, CharacterUsageEntry>} */
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

/**
 * @param {import('../core/types.js').Book} book
 * @returns {TimelineConflict[]}
 */
export function getTimelineConflicts(book) {
  /** @type {TimelineConflict[]} */
  const out = [];
  const events = book.events || [];
  const byKey = new Map();
  for (const ev of events) {
    const k = ev.sortKey;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(ev);
  }
  for (const [, group] of byKey) {
    if (group.length > 1) {
      for (const ev of group) {
        out.push({
          severity: 'warning',
          code: 'event_duplicate_sortkey',
          message: `Varios eventos comparten el mismo orden (${ev.sortKey})`,
          eventId: ev.id,
        });
      }
    }
  }
  for (const ev of events) {
    if (!String(ev.dateLabel || '').trim() && ev.sortKey === 0 && events.length > 1) {
      out.push({
        severity: 'info',
        code: 'event_weak_position',
        message: `Evento «${ev.title || 'Sin título'}» sin etiqueta de fecha y orden 0`,
        eventId: ev.id,
      });
    }
  }

  const sortedByLine = sortByOrder(events.slice(), 'sortKey');
  for (let i = 0; i < sortedByLine.length - 1; i++) {
    const prevEv = sortedByLine[i];
    const nextEv = sortedByLine[i + 1];
    const isoPrev = parseComparableEventDateLabel(prevEv.dateLabel);
    const isoNext = parseComparableEventDateLabel(nextEv.dateLabel);
    if (!isoPrev || !isoNext) continue;
    if (isoNext < isoPrev) {
      const tPrev = prevEv.title || 'Sin título';
      const tNext = nextEv.title || 'Sin título';
      const dPrev = prevEv.dateLabel?.trim() || isoPrev;
      const dNext = nextEv.dateLabel?.trim() || isoNext;
      out.push({
        severity: 'warning',
        code: 'event_date_order_mismatch',
        message: `Orden vs fecha: «${tNext}» va después de «${tPrev}» en la línea, pero su fecha (${dNext}) es anterior a la de «${tPrev}» (${dPrev}).`,
        eventId: nextEv.id,
      });
    }
  }

  return out;
}

/**
 * @param {NarrativeIssue[]} issues
 * @param {TimelineConflict[]} timeline
 * @returns {number}
 */
function computeScoreFromIssues(issues, timeline) {
  let penalty = 0;
  for (const i of issues) {
    penalty += i.severity === 'warning' ? 8 : 2;
  }
  for (const t of timeline) {
    penalty += t.severity === 'warning' ? 5 : 1;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

/**
 * @param {import('../core/types.js').Book} book
 * @returns {BookHealth}
 */
export function getBookHealth(book) {
  const narrativeIssues = detectNarrativeIssues(book);
  const timeline = getTimelineConflicts(book);

  /** @type {NarrativeIssue[]} */
  const issues = [...narrativeIssues];
  for (const t of timeline) {
    issues.push({
      severity: t.severity,
      code: t.code,
      message: t.message,
      eventId: t.eventId,
    });
  }

  const stats = getBookStats(book);
  /** @type {string[]} */
  const strengths = [];
  if (stats.totalWords >= stats.wordGoal * 0.5 && stats.wordGoal > 0) {
    strengths.push('Buen avance respecto a la meta de palabras');
  }
  const goalsOk = (book.chapters || []).filter((ch) => String(ch.chapterGoal || '').trim()).length;
  if ((book.chapters || []).length && goalsOk === (book.chapters || []).length) {
    strengths.push('Todos los capítulos tienen objetivo definido');
  }
  if (stats.activeCharacters > 0 && stats.characterCount > 0) {
    strengths.push('Hay personajes vinculados a capítulos o escenas');
  }

  const score = computeScoreFromIssues(narrativeIssues, timeline);

  return { score, issues, strengths };
}

/**
 * Solo issues con severity warning (para badge UI).
 * @param {import('../core/types.js').Book} book
 * @returns {number}
 */
export function countWarningIssues(book) {
  const n = detectNarrativeIssues(book).filter((i) => i.severity === 'warning').length;
  const t = getTimelineConflicts(book).filter((x) => x.severity === 'warning').length;
  return n + t;
}
