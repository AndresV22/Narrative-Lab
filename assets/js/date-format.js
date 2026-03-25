/**
 * Fechas DD/MM/AAAA y sincronización con input type="date" — Narrative Lab
 */

/**
 * @param {string} ymd YYYY-MM-DD
 * @returns {string} DD/MM/YYYY
 */
export function isoDateToDisplay(ymd) {
  if (!ymd || typeof ymd !== 'string') return '';
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * @param {string} display DD/MM/YYYY o variante
 * @returns {string|null} YYYY-MM-DD o null
 */
export function displayDateToIso(display) {
  const s = String(display || '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  const mm = String(mo).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Normaliza dateLabel si coincide con DD/MM/AAAA a formato fijo con ceros.
 * @param {string} label
 * @returns {string}
 */
export function normalizeDateLabelIfNumeric(label) {
  const iso = displayDateToIso(label);
  if (!iso) return label;
  return isoDateToDisplay(iso);
}
