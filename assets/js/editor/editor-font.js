/**
 * Fuente y tamaño (px) en el editor contenteditable.
 */

import { blockContainerForNode, setBlockLineHeightPreset } from './editor-helpers.js';

/** @typedef {{ value: string, label: string }} EditorFontOption */

/** @type {readonly EditorFontOption[]} */
export const EDITOR_FONT_OPTIONS = [
  { value: 'Crimson Pro, Georgia, serif', label: 'Crimson Pro' },
  { value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: 'Inter' },
  { value: 'Georgia, Times New Roman, serif', label: 'Georgia' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
  { value: 'ui-monospace, SFMono-Regular, Menlo, monospace', label: 'Monoespaciado' },
  { value: 'system-ui, sans-serif', label: 'Sistema (sans)' },
];

/** Valores sugeridos para el datalist de tamaño (px) */
export const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

/** Primera opción de la barra (Crimson Pro); coincide con el estilo por defecto del editor. */
export const EDITOR_DEFAULT_FONT_STACK = EDITOR_FONT_OPTIONS[0].value;
/** Tamaño por defecto del control de la barra (px). */
export const EDITOR_DEFAULT_FONT_SIZE_PX = 17;
/** Color de texto por defecto del cuerpo del editor (slate-200). */
export const EDITOR_DEFAULT_FORE_COLOR = '#e2e8f0';

/**
 * @param {HTMLElement} host
 * @returns {HTMLElement|null}
 */
function anchorElementInHost(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let n = sel.anchorNode;
  if (n.nodeType === Node.TEXT_NODE) n = n.parentElement;
  return n && host.contains(n) ? /** @type {HTMLElement} */ (n) : null;
}

/**
 * @param {string} name
 * @returns {string}
 */
function normalizeFontToken(name) {
  return String(name || '')
    .replace(/^["']|["']$/g, '')
    .trim()
    .toLowerCase();
}

/**
 * @param {HTMLElement} host
 * @returns {string}
 */
/**
 * Color de primer plano efectivo para la barra (hex, rgb o rgba).
 * @param {HTMLElement} host
 * @returns {string}
 */
export function getForeColorCssForToolbar(host) {
  let q = '';
  try {
    q = document.queryCommandValue('foreColor') || '';
  } catch {
    q = '';
  }
  if (q && String(q).trim() !== '') {
    const s = String(q).trim();
    if (s.startsWith('#')) return s;
    if (s.startsWith('rgb')) return s;
  }
  const el = anchorElementInHost(host);
  if (el) {
    const c = getComputedStyle(el).color;
    if (c) return c;
  }
  return EDITOR_DEFAULT_FORE_COLOR;
}

export function getFontFamilyValueForToolbar(host) {
  let q = '';
  try {
    q = normalizeFontToken(document.queryCommandValue('fontName') || '');
  } catch {
    q = '';
  }
  if (q) {
    const hit = EDITOR_FONT_OPTIONS.find((o) => {
      const first = normalizeFontToken(o.value.split(',')[0]);
      return first === q || o.label.toLowerCase() === q || o.value.toLowerCase().includes(q);
    });
    if (hit) return hit.value;
  }
  const el = anchorElementInHost(host);
  if (el) {
    const ff = getComputedStyle(el).fontFamily || '';
    const first = normalizeFontToken(ff.split(',')[0] || '');
    if (first) {
      const hit = EDITOR_FONT_OPTIONS.find((o) => normalizeFontToken(o.value.split(',')[0]) === first);
      if (hit) return hit.value;
    }
  }
  return EDITOR_FONT_OPTIONS[0].value;
}

/**
 * Tamaño de fuente efectivo (px redondeados) del nodo de texto.
 * @param {Text} textNode
 * @returns {number}
 */
function fontSizePxForTextNode(textNode) {
  const p = textNode.parentElement;
  if (!p) return NaN;
  const px = parseFloat(getComputedStyle(p).fontSize);
  return Number.isFinite(px) ? Math.round(px) : NaN;
}

/**
 * Textos que intersectan el rango (no colapsado), limitado al subárbol del ancestro común.
 * @param {Range} range
 * @param {HTMLElement} host
 * @returns {Text[]}
 */
function getTextNodesIntersectingRange(range, host) {
  /** @type {Text[]} */
  const out = [];
  if (range.collapsed) return out;
  const ca = range.commonAncestorContainer;
  const root =
    ca.nodeType === Node.ELEMENT_NODE
      ? /** @type {HTMLElement} */ (ca)
      : ca.parentElement;
  if (!root || !host.contains(root)) return out;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    if (!(n instanceof Text)) continue;
    if (!n.nodeValue || n.nodeValue.length === 0) continue;
    try {
      if (!range.intersectsNode(n)) continue;
    } catch {
      continue;
    }
    out.push(n);
  }
  return out;
}

/**
 * Tamaño en px para el control de la barra: cursor o selección uniforme.
 * Si la selección abarca varios tamaños distintos, devuelve `null` (barra vacía).
 * @param {HTMLElement} host
 * @returns {number | null}
 */
export function getFontSizePxForToolbar(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!host.contains(r.commonAncestorContainer)) return null;

  if (r.collapsed) {
    const el = anchorElementInHost(host);
    if (!el) return 17;
    const px = parseFloat(getComputedStyle(el).fontSize);
    return Number.isFinite(px) ? Math.round(px) : 17;
  }

  const texts = getTextNodesIntersectingRange(r, host);
  if (texts.length === 0) return null;

  /** @type {Set<number>} */
  const sizes = new Set();
  for (const n of texts) {
    const px = fontSizePxForTextNode(n);
    if (Number.isFinite(px)) sizes.add(px);
  }
  if (sizes.size === 0) return null;
  if (sizes.size > 1) return null;
  return [...sizes][0];
}

/**
 * @param {string} fontStack
 * @param {Range} [rangeOpt] Si viene de la barra (selección guardada), se restaura antes del comando.
 */
export function applyFontFamilyToSelection(fontStack, rangeOpt) {
  if (rangeOpt) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rangeOpt);
  }
  try {
    document.execCommand('styleWithCSS', false, 'true');
  } catch {
    /* ignore */
  }
  try {
    document.execCommand('fontName', false, fontStack);
  } catch {
    /* ignore */
  }
}

/**
 * @param {Node} node
 * @returns {boolean}
 */
function isBlockTopLevel(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const tag = /** @type {Element} */ (node).tagName.toLowerCase();
  return tag === 'p' || tag === 'h2' || tag === 'h3' || tag === 'blockquote' || tag === 'li' || tag === 'div';
}

/**
 * @param {number} px
 * @param {Range} [rangeOpt] Selección explícita (p. ej. guardada al mousedown en la barra).
 */
export function applyFontSizePxToSelection(px, rangeOpt) {
  const n = Math.min(96, Math.max(8, Math.round(Number(px)) || 17));
  const sel = window.getSelection();
  if (!sel) return;

  const base = rangeOpt ? rangeOpt.cloneRange() : sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  if (!base) return;

  if (rangeOpt) {
    sel.removeAllRanges();
    sel.addRange(rangeOpt);
  }

  if (base.collapsed) {
    const span = document.createElement('span');
    span.style.fontSize = `${n}px`;
    const z = document.createTextNode('\u200b');
    span.appendChild(z);
    try {
      base.insertNode(span);
      const nr = document.createRange();
      nr.setStart(z, 1);
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
    } catch {
      /* ignore */
    }
    return;
  }

  const work = base.cloneRange();
  let frag;
  try {
    frag = work.extractContents();
  } catch {
    return;
  }

  const children = Array.from(frag.childNodes);
  const hasBlockTop = children.some((node) => isBlockTopLevel(node));

  const out = document.createDocumentFragment();

  if (!hasBlockTop) {
    const span = document.createElement('span');
    span.style.fontSize = `${n}px`;
    while (frag.firstChild) span.appendChild(frag.firstChild);
    out.appendChild(span);
  } else {
    children.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && isBlockTopLevel(node)) {
        const el = /** @type {HTMLElement} */ (node);
        el.style.fontSize = `${n}px`;
        out.appendChild(el);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const span = document.createElement('span');
        span.style.fontSize = `${n}px`;
        span.appendChild(node);
        out.appendChild(span);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const span = document.createElement('span');
        span.style.fontSize = `${n}px`;
        while (node.firstChild) span.appendChild(node.firstChild);
        node.appendChild(span);
        out.appendChild(node);
      } else {
        out.appendChild(node);
      }
    });
  }

  const first = out.firstChild;
  const last = out.lastChild;
  try {
    work.insertNode(out);
  } catch {
    if (!out.childNodes.length) return;
    try {
      for (const node of Array.from(out.childNodes)) {
        work.insertNode(node);
      }
    } catch {
      return;
    }
  }

  if (first && last) {
    const nr = document.createRange();
    nr.setStartBefore(first);
    nr.setEndAfter(last);
    sel.removeAllRanges();
    sel.addRange(nr);
  }
}

/**
 * Quita clases de interlineado y alineación en los bloques que intersectan el rango.
 * @param {Range} range
 * @param {HTMLElement} host
 */
function resetBlockFormattingForRange(range, host) {
  const texts = getTextNodesIntersectingRange(range, host);
  const blocks = new Set();
  for (const t of texts) {
    const b = blockContainerForNode(t, host);
    if (b) blocks.add(b);
  }
  for (const b of blocks) {
    setBlockLineHeightPreset(b, '');
    b.style.textAlign = '';
  }
}

/**
 * Borra formato inline (negrita, subrayado, etc.) y deja fuente, tamaño, color, interlineado y alineación como los valores por defecto del editor.
 * @param {HTMLElement} host
 * @param {Range} [rangeOpt] Selección explícita (p. ej. guardada al usar la barra).
 * @returns {boolean}
 */
export function clearSelectionFormattingToDefaults(host, rangeOpt) {
  const sel = window.getSelection();
  if (!sel) return false;
  if (rangeOpt) {
    sel.removeAllRanges();
    sel.addRange(rangeOpt);
  }
  if (!sel.rangeCount) return false;
  let range = sel.getRangeAt(0).cloneRange();
  if (range.collapsed) return false;
  if (!(range.commonAncestorContainer === host || host.contains(range.commonAncestorContainer))) return false;

  try {
    document.execCommand('styleWithCSS', false, 'true');
  } catch {
    /* ignore */
  }

  try {
    document.execCommand('removeFormat', false);
  } catch {
    /* ignore */
  }

  if (!sel.rangeCount) return false;
  range = sel.getRangeAt(0).cloneRange();
  if (range.collapsed) return false;

  applyFontFamilyToSelection(EDITOR_DEFAULT_FONT_STACK, range.cloneRange());
  if (!sel.rangeCount) return false;
  range = sel.getRangeAt(0).cloneRange();
  if (range.collapsed) return false;

  applyFontSizePxToSelection(EDITOR_DEFAULT_FONT_SIZE_PX, range.cloneRange());
  if (!sel.rangeCount) return false;
  range = sel.getRangeAt(0).cloneRange();
  if (range.collapsed) return false;

  try {
    document.execCommand('foreColor', false, EDITOR_DEFAULT_FORE_COLOR);
  } catch {
    /* ignore */
  }

  if (!sel.rangeCount) return false;
  range = sel.getRangeAt(0).cloneRange();
  resetBlockFormattingForRange(range, host);

  return true;
}
