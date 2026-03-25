/**
 * Preferencias locales (localStorage) — Narrative Lab
 */

const KEY_AUTOSAVE = 'nl_autosave_ms';
const KEY_PROGRESS = 'nl_progress_mode';

/** @typedef {'boundary'|'debounce'} ProgressMode */

/**
 * Intervalo de guardado automático (IndexedDB), en ms.
 * @returns {number}
 */
export function getAutosaveMs() {
  const v = localStorage.getItem(KEY_AUTOSAVE);
  const n = v ? parseInt(v, 10) : 4000;
  if (Number.isNaN(n)) return 4000;
  return Math.min(60000, Math.max(1500, n));
}

/**
 * @param {number} ms
 */
export function setAutosaveMs(ms) {
  localStorage.setItem(KEY_AUTOSAVE, String(ms));
}

/**
 * boundary: actualizar panel de progreso al espacio o punto.
 * debounce: actualizar progreso mientras escribes (ligero debounce).
 * @returns {ProgressMode}
 */
export function getProgressMode() {
  return localStorage.getItem(KEY_PROGRESS) === 'debounce' ? 'debounce' : 'boundary';
}

/**
 * @param {ProgressMode} mode
 */
export function setProgressMode(mode) {
  localStorage.setItem(KEY_PROGRESS, mode);
}
