/**
 * Preferencias locales (localStorage) — Narrative Lab
 */

import { formatDateTimeShort } from '../core/date-format.js';

const KEY_AUTOSAVE = 'nl_autosave_ms';
const KEY_PROGRESS = 'nl_progress_mode';
const KEY_LAST_EXPORT = 'nl_last_export_iso';
const KEY_SPELLCHECK = 'nl_spellcheck';
const KEY_SNAPSHOT_INTERVAL = 'nl_snapshot_interval_min';
const KEY_EDITOR_ZOOM = 'nl_editor_zoom_pct';
const KEY_EDITOR_PAGE_MODE = 'nl_editor_page_mode';
const KEY_EDITOR_PAGE_SIZE = 'nl_editor_page_size';
const KEY_EDITOR_COMMENTS_OPEN = 'nl_editor_comments_panel_open';
const KEY_EDITOR_MARGIN_X = 'nl_editor_margin_x_px';
const KEY_EDITOR_MARGIN_Y = 'nl_editor_margin_y_px';

/** Valor por defecto (px) si el usuario no ha guardado márgenes. */
const EDITOR_MARGIN_DEFAULT_PX = 50;
const KEY_SIDEBAR_COLLAPSED = 'nl_sidebar_collapsed';
/** Panel derecho (progreso) visible al cargar la app si el valor es "1". Por defecto minimizado. */
const KEY_RIGHT_PANEL_DEFAULT_OPEN = 'nl_right_panel_default_open';

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
  return `Última copia registrada: ${formatDateTimeShort(iso)}.`;
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

/** Zoom visual del documento (solo pantalla), porcentaje 60–160. */
export function getEditorZoomPercent() {
  const v = localStorage.getItem(KEY_EDITOR_ZOOM);
  const n = v ? parseInt(v, 10) : 100;
  if (Number.isNaN(n)) return 100;
  return Math.min(160, Math.max(60, n));
}

/** @param {number} pct */
export function setEditorZoomPercent(pct) {
  localStorage.setItem(KEY_EDITOR_ZOOM, String(Math.min(160, Math.max(60, Math.round(pct)))));
}

/** Modo página (hoja centrada). */
export function getEditorPageMode() {
  return localStorage.getItem(KEY_EDITOR_PAGE_MODE) === '1';
}

/** @param {boolean} on */
export function setEditorPageMode(on) {
  localStorage.setItem(KEY_EDITOR_PAGE_MODE, on ? '1' : '0');
}

/** Tamaño de hoja en modo página: letter | a4 | legal | a5 */
export function getEditorPageSize() {
  const v = localStorage.getItem(KEY_EDITOR_PAGE_SIZE);
  if (v === 'a4' || v === 'legal' || v === 'a5' || v === 'letter') return v;
  return 'letter';
}

/** @param {string} size */
export function setEditorPageSize(size) {
  if (size === 'a4' || size === 'legal' || size === 'a5' || size === 'letter') {
    localStorage.setItem(KEY_EDITOR_PAGE_SIZE, size);
  }
}

/** Panel de comentarios visible (el usuario lo activa con «Panel»). */
export function getEditorCommentsPanelOpen() {
  return localStorage.getItem(KEY_EDITOR_COMMENTS_OPEN) === '1';
}

/** @param {boolean} open */
export function setEditorCommentsPanelOpen(open) {
  localStorage.setItem(KEY_EDITOR_COMMENTS_OPEN, open ? '1' : '0');
}

/** Margen izquierdo/derecho dentro de la hoja en modo página (px), 0–120. Sin clave guardada: 50. */
export function getEditorMarginHorizontalPx() {
  const v = localStorage.getItem(KEY_EDITOR_MARGIN_X);
  if (v === null || v === '') return EDITOR_MARGIN_DEFAULT_PX;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return EDITOR_MARGIN_DEFAULT_PX;
  return Math.min(120, Math.max(0, n));
}

/** @param {number} px */
export function setEditorMarginHorizontalPx(px) {
  localStorage.setItem(KEY_EDITOR_MARGIN_X, String(Math.min(120, Math.max(0, Math.round(Number(px)) || 0))));
}

/** Margen arriba/abajo dentro de la hoja en modo página (px), 0–120. Sin clave guardada: 50. */
export function getEditorMarginVerticalPx() {
  const v = localStorage.getItem(KEY_EDITOR_MARGIN_Y);
  if (v === null || v === '') return EDITOR_MARGIN_DEFAULT_PX;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return EDITOR_MARGIN_DEFAULT_PX;
  return Math.min(120, Math.max(0, n));
}

/** @param {number} px */
export function setEditorMarginVerticalPx(px) {
  localStorage.setItem(KEY_EDITOR_MARGIN_Y, String(Math.min(120, Math.max(0, Math.round(Number(px)) || 0))));
}

/**
 * Barra lateral izquierda contraída (solo íconos + títulos de sección).
 * @returns {boolean}
 */
export function getSidebarCollapsed() {
  return localStorage.getItem(KEY_SIDEBAR_COLLAPSED) === '1';
}

/** @param {boolean} collapsed */
export function setSidebarCollapsed(collapsed) {
  localStorage.setItem(KEY_SIDEBAR_COLLAPSED, collapsed ? '1' : '0');
}

/**
 * Si es true, el panel derecho (progreso / estadísticas) se muestra al abrir la app o un libro.
 * El usuario puede seguir ocultándolo con el botón del encabezado.
 * @returns {boolean}
 */
export function getRightPanelDefaultExpanded() {
  return localStorage.getItem(KEY_RIGHT_PANEL_DEFAULT_OPEN) === '1';
}

/**
 * @param {boolean} expanded
 */
export function setRightPanelDefaultExpanded(expanded) {
  localStorage.setItem(KEY_RIGHT_PANEL_DEFAULT_OPEN, expanded ? '1' : '0');
}

/**
 * Elimina todas las preferencias locales de la app (localStorage).
 * No afecta a IndexedDB; usar junto con `deleteWorkspaceDatabase` para un borrado completo en el navegador.
 */
export function clearAllAppLocalPreferences() {
  const keys = [
    KEY_AUTOSAVE,
    KEY_PROGRESS,
    KEY_LAST_EXPORT,
    KEY_SPELLCHECK,
    KEY_SNAPSHOT_INTERVAL,
    KEY_EDITOR_ZOOM,
    KEY_EDITOR_PAGE_MODE,
    KEY_EDITOR_PAGE_SIZE,
    KEY_EDITOR_COMMENTS_OPEN,
    KEY_EDITOR_MARGIN_X,
    KEY_EDITOR_MARGIN_Y,
    KEY_SIDEBAR_COLLAPSED,
    KEY_RIGHT_PANEL_DEFAULT_OPEN,
  ];
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}
