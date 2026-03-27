/**
 * Salud narrativa y conflictos de línea de tiempo — Narrative Lab
 */

import { detectNarrativeIssues } from './issues.js';
import { getBookStats } from './stats.js';

/**
 * @param {import('../core/types.js').Book} book
 * @returns {import('../core/types.js').TimelineConflict[]}
 */
export function getTimelineConflicts(book) {
  /** @type {import('../core/types.js').TimelineConflict[]} */
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
  return out;
}

/**
 * @param {import('../core/types.js').NarrativeIssue[]} issues
 * @param {import('../core/types.js').TimelineConflict[]} timeline
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
 * @returns {import('../core/types.js').BookHealth}
 */
export function getBookHealth(book) {
  const narrativeIssues = detectNarrativeIssues(book);
  const timeline = getTimelineConflicts(book);

  /** @type {import('../core/types.js').NarrativeIssue[]} */
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
