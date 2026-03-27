/**
 * Comparación de snapshots / payloads de libro — Narrative Lab
 */

import { computeWordStats } from './export.js';
import { sortByOrder } from '../core/utils.js';

/**
 * @typedef {Object} SnapshotDiffResult
 * @property {number} deltaWords
 * @property {number} deltaChapters
 * @property {number} deltaScenes
 * @property {number} deltaCharacters
 * @property {number} deltaEvents
 * @property {number} deltaRelationships
 * @property {string[]} changedChapters
 */

/**
 * Contenido agregado de capítulo (capítulo + escenas) para comparar cambios.
 * @param {import('../core/types.js').Chapter} ch
 */
function chapterFingerprint(ch) {
  const parts = [ch.title || '', ch.chapterGoal || '', ch.content || ''];
  for (const sc of sortByOrder(ch.scenes || [], 'order')) {
    parts.push(sc.title || '', sc.content || '');
  }
  return parts.join('\x1e');
}

/**
 * @param {import('../core/types.js').Book} a
 * @param {import('../core/types.js').Book} b
 * @returns {SnapshotDiffResult}
 */
export function diffBookPayloads(a, b) {
  const wa = computeWordStats(a).total;
  const wb = computeWordStats(b).total;

  const chA = sortByOrder(a.chapters || [], 'order');
  const chB = sortByOrder(b.chapters || [], 'order');
  const mapB = new Map(chB.map((c) => [c.id, c]));

  /** @type {string[]} */
  const changedChapters = [];

  for (const ca of chA) {
    const cb = mapB.get(ca.id);
    if (!cb) {
      changedChapters.push(ca.id);
      continue;
    }
    if (chapterFingerprint(ca) !== chapterFingerprint(cb)) {
      changedChapters.push(ca.id);
    }
  }
  for (const cb of chB) {
    if (!chA.some((c) => c.id === cb.id)) {
      changedChapters.push(cb.id);
    }
  }

  const sceneCount = (ch) => ch.reduce((s, c) => s + (c.scenes || []).length, 0);
  const deltaChapters = (b.chapters || []).length - (a.chapters || []).length;
  const deltaScenes = sceneCount(chB) - sceneCount(chA);
  const deltaCharacters = (b.characters || []).length - (a.characters || []).length;
  const deltaEvents = (b.events || []).length - (a.events || []).length;
  const deltaRelationships = (b.relationships || []).length - (a.relationships || []).length;

  return {
    deltaWords: wb - wa,
    deltaChapters,
    deltaScenes,
    deltaCharacters,
    deltaEvents,
    deltaRelationships,
    changedChapters: [...new Set(changedChapters)],
  };
}
