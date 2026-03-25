/**
 * Utilidades del editor enriquecido (DOM, exportación) — Narrative Lab
 */

/** @type {readonly number[]} */
export const ZOOM_LEVELS = [80, 90, 100, 110, 120];

/** Clases mutuamente excluyentes de interlineado en bloques */
export const LINE_HEIGHT_CLASSES = ['nl-lh-compact', 'nl-lh-comfort', 'nl-lh-relaxed'];

/**
 * @param {number} z
 * @returns {number}
 */
export function clampZoom(z) {
  const n = Math.round(z);
  return Math.min(160, Math.max(60, n));
}

/**
 * @param {number} current
 * @returns {number}
 */
export function nextZoomStepUp(current) {
  const c = clampZoom(current);
  for (const z of ZOOM_LEVELS) {
    if (z > c) return z;
  }
  return clampZoom(c + 10);
}

/**
 * @param {number} current
 * @returns {number}
 */
export function nextZoomStepDown(current) {
  const c = clampZoom(current);
  const rev = [...ZOOM_LEVELS].reverse();
  for (const z of rev) {
    if (z < c) return z;
  }
  return clampZoom(c - 10);
}

/**
 * @param {string} kind
 * @param {string|null|undefined} id
 * @returns {string}
 */
export function editorSourceId(kind, id) {
  if (id != null && id !== '') return String(id);
  return kind;
}

/**
 * Quita marcas de comentario del HTML (exportación limpia).
 * @param {string} html
 * @returns {string}
 */
export function stripNlCommentMarks(html) {
  if (!html || typeof html !== 'string') return html;
  if (typeof DOMParser === 'undefined') return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div class="nl-strip-root">${html}</div>`, 'text/html');
  const root = doc.querySelector('.nl-strip-root');
  if (!root) return html;
  root.querySelectorAll('span[data-nl-comment-id].nl-comment-mark').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });
  return root.innerHTML;
}

/**
 * Quita marcas de frase destacada del HTML (exportación limpia).
 * @param {string} html
 * @returns {string}
 */
export function stripNlHighlightMarks(html) {
  if (!html || typeof html !== 'string') return html;
  if (typeof DOMParser === 'undefined') return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div class="nl-strip-root">${html}</div>`, 'text/html');
  const root = doc.querySelector('.nl-strip-root');
  if (!root) return html;
  root.querySelectorAll('span[data-nl-highlight-id].nl-highlight-mark').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });
  return root.innerHTML;
}

/**
 * Bloque semántico que contiene el cursor (respecto a `host`).
 * @param {Node|null} node
 * @param {HTMLElement} host
 * @returns {HTMLElement|null}
 */
export function blockContainerForNode(node, host) {
  let n = node;
  if (n && n.nodeType === Node.TEXT_NODE) n = n.parentNode;
  const blockTags = new Set([
    'p',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'li',
    'pre',
  ]);
  let el = /** @type {HTMLElement|null} */ (n && n.nodeType === Node.ELEMENT_NODE ? n : null);
  if (!el && n) el = n.parentElement;
  while (el && host.contains(el)) {
    if (blockTags.has(el.tagName.toLowerCase())) return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * @param {HTMLElement} host
 * @returns {HTMLElement|null}
 */
export function getCurrentBlock(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return blockContainerForNode(sel.anchorNode, host);
}

/**
 * @param {HTMLElement} block
 * @param {'compact'|'comfort'|'relaxed'|''} preset
 */
export function setBlockLineHeightPreset(block, preset) {
  for (const c of LINE_HEIGHT_CLASSES) block.classList.remove(c);
  if (preset === 'compact') block.classList.add('nl-lh-compact');
  else if (preset === 'comfort') block.classList.add('nl-lh-comfort');
  else if (preset === 'relaxed') block.classList.add('nl-lh-relaxed');
}

/**
 * @param {HTMLElement} block
 * @returns {'compact'|'comfort'|'relaxed'|''}
 */
export function getBlockLineHeightPreset(block) {
  if (block.classList.contains('nl-lh-compact')) return 'compact';
  if (block.classList.contains('nl-lh-comfort')) return 'comfort';
  if (block.classList.contains('nl-lh-relaxed')) return 'relaxed';
  return '';
}

/**
 * Envuelve la selección en un span de comentario o devuelve false.
 * @param {string} commentId
 * @returns {boolean}
 */
/**
 * Envuelve la selección en un span de frase destacada o devuelve false.
 * @param {HTMLElement} host
 * @param {string} highlightId
 * @returns {boolean}
 */
export function surroundSelectionWithHighlightMark(host, highlightId) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;
  if (!host.contains(range.commonAncestorContainer)) return false;
  const span = document.createElement('span');
  span.className = 'nl-highlight-mark';
  span.setAttribute('data-nl-highlight-id', highlightId);
  try {
    range.surroundContents(span);
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    r.collapse(false);
    sel.addRange(r);
    return true;
  } catch {
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
      sel.removeAllRanges();
      const r = document.createRange();
      r.setStartAfter(span);
      r.collapse(true);
      sel.addRange(r);
      return true;
    } catch {
      return false;
    }
  }
}

export function surroundSelectionWithCommentMark(commentId) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;
  const span = document.createElement('span');
  span.className = 'nl-comment-mark';
  span.setAttribute('data-nl-comment-id', commentId);
  try {
    range.surroundContents(span);
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    r.collapse(false);
    sel.addRange(r);
    return true;
  } catch {
    try {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
      sel.removeAllRanges();
      const r = document.createRange();
      r.setStartAfter(span);
      r.collapse(true);
      sel.addRange(r);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Elimina el span de comentario del DOM manteniendo el texto.
 * @param {HTMLElement} host
 * @param {string} commentId
 * @returns {boolean}
 */
export function unwrapCommentMarkInHost(host, commentId) {
  const el = host.querySelector(`span.nl-comment-mark[data-nl-comment-id="${commentId}"]`);
  if (!el || !el.parentNode) return false;
  const parent = el.parentNode;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
  return true;
}

/**
 * @param {HTMLElement} host
 * @param {string} commentId
 * @returns {HTMLElement|null}
 */
export function findCommentMarkEl(host, commentId) {
  return host.querySelector(`span.nl-comment-mark[data-nl-comment-id="${commentId}"]`);
}
