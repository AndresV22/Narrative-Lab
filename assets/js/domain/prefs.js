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
/** Antes se guardaban en px; se migran a cm al leer. */
const KEY_EDITOR_MARGIN_X_LEGACY_PX = 'nl_editor_margin_x_px';
const KEY_EDITOR_MARGIN_Y_LEGACY_PX = 'nl_editor_margin_y_px';
const KEY_EDITOR_MARGIN_X_CM = 'nl_editor_margin_x_cm';
const KEY_EDITOR_MARGIN_Y_CM = 'nl_editor_margin_y_cm';

/** 1 CSS px = 1/96 in ≈ 0.264583 mm — valor por defecto equivalente a ~50 px en pantalla. */
const PX_TO_CM = 2.54 / 96;

/** Por defecto ~1,32 cm (equivalente a 50 px). */
const EDITOR_MARGIN_DEFAULT_CM = Math.round(50 * PX_TO_CM * 100) / 100;

/** Márgenes en cm (modo página): 0–5. */
const EDITOR_MARGIN_MIN_CM = 0;
const EDITOR_MARGIN_MAX_CM = 5;

/** @type {boolean} */
let legacyEditorMarginsMigrated = false;

/**
 * Solo para pruebas: reinicia la migración px→cm (Vitest no siempre recarga el módulo tras `vi.resetModules()`).
 */
export function resetLegacyEditorMarginsMigrationForTests() {
  legacyEditorMarginsMigrated = false;
}
const KEY_SIDEBAR_COLLAPSED = 'nl_sidebar_collapsed';
const KEY_DASHBOARD_BOOKS_MODE = 'nl_dashboard_books_mode';
const KEY_DASHBOARD_BOOK_IDS = 'nl_dashboard_book_ids';

/** @typedef {'boundary'|'debounce'} ProgressMode */
/** @typedef {'all'|'subset'} DashboardBooksMode */

/**
 * Filtro del resumen del dashboard (todos los libros o subconjunto).
 * @returns {{ mode: DashboardBooksMode, bookIds: string[] }}
 */
export function getDashboardBookFilter() {
  const mode = localStorage.getItem(KEY_DASHBOARD_BOOKS_MODE) === 'subset' ? 'subset' : 'all';
  /** @type {string[]} */
  let ids = [];
  try {
    const raw = localStorage.getItem(KEY_DASHBOARD_BOOK_IDS);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) ids = p.filter((x) => typeof x === 'string');
    }
  } catch {
    /* ignore */
  }
  return { mode, bookIds: ids };
}

/**
 * @param {DashboardBooksMode} mode
 * @param {string[]} bookIds ids cuando mode es subset
 */
export function setDashboardBookFilter(mode, bookIds = []) {
  localStorage.setItem(KEY_DASHBOARD_BOOKS_MODE, mode === 'subset' ? 'subset' : 'all');
  if (mode === 'subset') {
    localStorage.setItem(KEY_DASHBOARD_BOOK_IDS, JSON.stringify(bookIds.filter((x) => typeof x === 'string')));
  } else {
    try {
      localStorage.removeItem(KEY_DASHBOARD_BOOK_IDS);
    } catch {
      /* ignore */
    }
  }
}

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

function migrateLegacyEditorMarginsToCm() {
  if (legacyEditorMarginsMigrated) return;
  legacyEditorMarginsMigrated = true;
  for (const axis of ['x', 'y']) {
    const cmKey = axis === 'x' ? KEY_EDITOR_MARGIN_X_CM : KEY_EDITOR_MARGIN_Y_CM;
    const legKey = axis === 'x' ? KEY_EDITOR_MARGIN_X_LEGACY_PX : KEY_EDITOR_MARGIN_Y_LEGACY_PX;
    const existingCm = localStorage.getItem(cmKey);
    if (existingCm !== null && existingCm !== '') {
      try {
        localStorage.removeItem(legKey);
      } catch {
        /* ignore */
      }
      continue;
    }
    const lx = localStorage.getItem(legKey);
    if (lx === null || lx === '') continue;
    const px = parseInt(lx, 10);
    if (Number.isNaN(px)) {
      try {
        localStorage.removeItem(legKey);
      } catch {
        /* ignore */
      }
      continue;
    }
    const cm = Math.round(Math.min(120, Math.max(0, px)) * PX_TO_CM * 100) / 100;
    localStorage.setItem(cmKey, String(cm));
    try {
      localStorage.removeItem(legKey);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Margen izquierdo/derecho dentro de la hoja en modo página (cm).
 * @returns {number}
 */
export function getEditorMarginHorizontalCm() {
  migrateLegacyEditorMarginsToCm();
  const v = localStorage.getItem(KEY_EDITOR_MARGIN_X_CM);
  if (v === null || v === '') return EDITOR_MARGIN_DEFAULT_CM;
  const n = parseFloat(v.replace(',', '.'));
  if (Number.isNaN(n)) return EDITOR_MARGIN_DEFAULT_CM;
  return Math.min(EDITOR_MARGIN_MAX_CM, Math.max(EDITOR_MARGIN_MIN_CM, Math.round(n * 100) / 100));
}

/** @param {number} cm */
export function setEditorMarginHorizontalCm(cm) {
  const x = Math.min(
    EDITOR_MARGIN_MAX_CM,
    Math.max(EDITOR_MARGIN_MIN_CM, Math.round((Number(cm) || 0) * 100) / 100)
  );
  localStorage.setItem(KEY_EDITOR_MARGIN_X_CM, String(x));
}

/**
 * Margen arriba/abajo dentro de la hoja en modo página (cm).
 * @returns {number}
 */
export function getEditorMarginVerticalCm() {
  migrateLegacyEditorMarginsToCm();
  const v = localStorage.getItem(KEY_EDITOR_MARGIN_Y_CM);
  if (v === null || v === '') return EDITOR_MARGIN_DEFAULT_CM;
  const n = parseFloat(v.replace(',', '.'));
  if (Number.isNaN(n)) return EDITOR_MARGIN_DEFAULT_CM;
  return Math.min(EDITOR_MARGIN_MAX_CM, Math.max(EDITOR_MARGIN_MIN_CM, Math.round(n * 100) / 100));
}

/** @param {number} cm */
export function setEditorMarginVerticalCm(cm) {
  const x = Math.min(
    EDITOR_MARGIN_MAX_CM,
    Math.max(EDITOR_MARGIN_MIN_CM, Math.round((Number(cm) || 0) * 100) / 100)
  );
  localStorage.setItem(KEY_EDITOR_MARGIN_Y_CM, String(x));
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
    KEY_EDITOR_MARGIN_X_CM,
    KEY_EDITOR_MARGIN_Y_CM,
    KEY_EDITOR_MARGIN_X_LEGACY_PX,
    KEY_EDITOR_MARGIN_Y_LEGACY_PX,
    KEY_SIDEBAR_COLLAPSED,
    KEY_DASHBOARD_BOOKS_MODE,
    KEY_DASHBOARD_BOOK_IDS,
  ];
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}
