/**
 * Resalta la primera coincidencia de búsqueda en un host contenteditable (misma normalización que search.js).
 */

import { normalizeSearch } from '../core/utils.js';

/** Evita bloquear la UI en documentos enormes (un solo cálculo O(n²) de prefijos). */
const MAX_HIGHLIGHT_CHARS = 200000;

/**
 * @param {HTMLElement} hostEl
 */
function unwrapSearchMarks(hostEl) {
  hostEl.querySelectorAll('mark.nl-search-hit').forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  });
}

/**
 * @param {HTMLElement} root
 * @returns {Text[]}
 */
function collectTextNodes(root) {
  /** @type {Text[]} */
  const out = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = w.nextNode())) {
    const t = /** @type {Text} */ (n);
    const p = t.parentElement;
    if (p?.closest('script, style')) continue;
    out.push(t);
  }
  return out;
}

/**
 * @param {string} full
 * @returns {number[]}
 */
function prefixNormLengths(full) {
  const arr = new Array(full.length + 1);
  arr[0] = 0;
  for (let i = 0; i < full.length; i++) {
    arr[i + 1] = normalizeSearch(full.slice(0, i + 1)).length;
  }
  return arr;
}

/**
 * @param {number[]} prefix
 * @param {number} target
 */
function lowerBoundNorm(prefix, target) {
  let lo = 0;
  let hi = prefix.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (prefix[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * @param {HTMLElement} hostEl
 * @param {string} query
 * @returns {boolean}
 */
export function applySearchHighlightToEditorHost(hostEl, query) {
  if (!hostEl || !query) return false;
  const q = String(query).trim();
  if (!q) return false;

  unwrapSearchMarks(hostEl);

  const textNodes = collectTextNodes(hostEl);
  let full = '';
  /** @type {{ node: Text, start: number, end: number }[]} */
  const spans = [];
  for (const node of textNodes) {
    const t = node.textContent || '';
    spans.push({ node, start: full.length, end: full.length + t.length });
    full += t;
  }

  if (full.length > MAX_HIGHLIGHT_CHARS) return false;

  const nFull = normalizeSearch(full);
  const nQ = normalizeSearch(q).trim();
  if (!nQ) return false;
  const pos = nFull.indexOf(nQ);
  if (pos === -1) return false;

  const prefix = prefixNormLengths(full);
  const rawStart = lowerBoundNorm(prefix, pos);
  const rawEnd = lowerBoundNorm(prefix, pos + nQ.length);
  if (rawStart >= rawEnd || rawEnd > full.length) return false;

  let startNode = null;
  let startOff = 0;
  let endNode = null;
  let endOff = 0;
  for (const sp of spans) {
    if (startNode === null && rawStart >= sp.start && rawStart < sp.end) {
      startNode = sp.node;
      startOff = rawStart - sp.start;
    }
    if (rawEnd > sp.start && rawEnd <= sp.end) {
      endNode = sp.node;
      endOff = rawEnd - sp.start;
      break;
    }
  }
  if (!startNode || !endNode) return false;

  const range = document.createRange();
  range.setStart(startNode, startOff);
  range.setEnd(endNode, endOff);

  const mark = document.createElement('mark');
  mark.className = 'nl-search-hit';
  mark.appendChild(range.extractContents());
  range.insertNode(mark);
  if (typeof mark.scrollIntoView === 'function') {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return true;
}
