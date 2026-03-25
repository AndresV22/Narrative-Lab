/**
 * Utilidades reutilizables — Narrative Lab
 */

/** @returns {string} */
export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function & { cancel: () => void }}
 */
export function debounce(fn, wait) {
  let t = null;
  const debounced = (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, wait);
  };
  debounced.cancel = () => {
    if (t) clearTimeout(t);
    t = null;
  };
  return debounced;
}

/**
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

/**
 * Cuenta palabras en texto plano (separadores espacio/puntuación).
 * @param {string} text
 * @returns {number}
 */
export function wordCountFromText(text) {
  if (!text || !String(text).trim()) return 0;
  return String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * @param {string} html
 * @returns {number}
 */
export function wordCountFromHtml(html) {
  return wordCountFromText(stripHtml(html));
}

/**
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Normaliza para búsqueda.
 * @param {string} s
 * @returns {string}
 */
export function normalizeSearch(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function snippet(text, max = 120) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max) + '…';
}

/**
 * Ordena por campo `order` numérico.
 * @template T
 * @param {T[]} items
 * @param {keyof T} key
 * @returns {T[]}
 */
export function sortByOrder(items, key = 'order') {
  return [...items].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
}

/**
 * @param {File} file
 * @param {string} [acceptPrefix]
 * @returns {Promise<string>}
 */
export function readFileAsDataUrl(file, acceptPrefix = 'image/') {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith(acceptPrefix)) {
      reject(new Error('Tipo de archivo no válido'));
      return;
    }
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
