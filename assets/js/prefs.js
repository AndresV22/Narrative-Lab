/**
 * Preferencias locales (localStorage) — Narrative Lab
 */

const KEY_AUTOSAVE = 'nl_autosave_ms';
const KEY_PROGRESS = 'nl_progress_mode';
const KEY_LAST_EXPORT = 'nl_last_export_iso';
const KEY_SPELLCHECK = 'nl_spellcheck';
const KEY_SNAPSHOT_INTERVAL = 'nl_snapshot_interval_min';

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

/** Días sin exportar antes de mostrar recordatorio (solo UI). */
export const EXPORT_REMINDER_DAYS = 14;

/**
 * ISO de la última vez que el usuario marcó una exportación manual (localStorage).
 * @returns {string|null}
 */
export function getLastExportIso() {
  return localStorage.getItem(KEY_LAST_EXPORT);
}

export function setLastExportNow() {
  localStorage.setItem(KEY_LAST_EXPORT, new Date().toISOString());
}

/**
 * @returns {number|null} Días desde última exportación, o null si nunca.
 */
export function daysSinceLastExport() {
  const iso = getLastExportIso();
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
}

/**
 * @returns {boolean}
 */
export function shouldShowExportReminder() {
  const d = daysSinceLastExport();
  if (d === null) return true;
  return d >= EXPORT_REMINDER_DAYS;
}

/** Texto para UI (recordatorio de export). */
export function exportReminderSummaryLine() {
  const iso = getLastExportIso();
  if (!iso) return 'No hay registro de exportación en este dispositivo.';
  return `Última copia registrada: ${new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}.`;
}

/**
 * Corrector ortográfico nativo del navegador (subrayado) en editores contenteditable.
 * Por defecto activado.
 * @returns {boolean}
 */
export function getSpellcheckEnabled() {
  return localStorage.getItem(KEY_SPELLCHECK) !== '0';
}

/**
 * @param {boolean} enabled
 */
export function setSpellcheckEnabled(enabled) {
  localStorage.setItem(KEY_SPELLCHECK, enabled ? '1' : '0');
}

/**
 * Minutos entre snapshots automáticos (0 = desactivado).
 * @returns {number}
 */
export function getSnapshotIntervalMinutes() {
  const v = localStorage.getItem(KEY_SNAPSHOT_INTERVAL);
  const n = v ? parseInt(v, 10) : 0;
  if (Number.isNaN(n)) return 0;
  return Math.min(24 * 60, Math.max(0, n));
}

/**
 * @param {number} minutes
 */
export function setSnapshotIntervalMinutes(minutes) {
  localStorage.setItem(KEY_SNAPSHOT_INTERVAL, String(minutes));
}
