/**
 * Editor enriquecido (contenteditable) — Narrative Lab
 */

import { debounce, stripHtml } from './utils.js';
import {
  clampZoom,
  getBlockLineHeightPreset,
  getCurrentBlock,
  nextZoomStepDown,
  nextZoomStepUp,
  setBlockLineHeightPreset,
} from './editor-helpers.js';
import { attachListKeyboard, execInsertList } from './editor-list-behavior.js';
import { EDITOR_PAGE_SIZE_PRESETS } from './editor-page-sizes.js';
import {
  getEditorPageMode,
  getEditorPageSize,
  getEditorZoomPercent,
  setEditorPageMode,
  setEditorPageSize,
  setEditorZoomPercent,
} from './prefs.js';

/**
 * @typedef {Object} EditorRealtimeMetrics
 * @property {true} [skipped]
 * @property {{ word: string, count: number }[]} [topRepeats]
 * @property {number} [avgParagraphWords]
 * @property {number} [maxParagraphWords]
 * @property {number} [paragraphCount]
 * @property {number} [dialogueRatio] 0–1 estimado
 */

const REALTIME_DEBOUNCE_MS = 500;
const MAX_METRICS_TEXT_CHARS = 10000;

/** Stopwords mínimas (es) para repetición */
const STOP = new Set([
  'que', 'con', 'por', 'para', 'una', 'uno', 'los', 'las', 'del', 'al', 'como', 'más', 'pero', 'sus', 'fue', 'ser', 'sin', 'sobre', 'este', 'esta', 'estos', 'estas', 'había', 'hay', 'han', 'the',
]);

/**
 * @param {string} html
 * @returns {EditorRealtimeMetrics}
 */
export function computeEditorRealtimeMetrics(html) {
  const text = stripHtml(html || '');
  if (text.length > MAX_METRICS_TEXT_CHARS) {
    return { skipped: true };
  }
  const norm = text
    .toLowerCase()
    .replace(/[«»""''`´]/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!norm) {
    return {
      paragraphCount: 0,
      avgParagraphWords: 0,
      maxParagraphWords: 0,
      dialogueRatio: 0,
      topRepeats: [],
    };
  }

  const paragraphs = text
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const paraWords = paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length);
  const maxParagraphWords = paraWords.length ? Math.max(...paraWords) : 0;
  const avgParagraphWords = paraWords.length ? Math.round(paraWords.reduce((a, b) => a + b, 0) / paraWords.length) : 0;

  const words = norm.split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
  const freq = new Map();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  /** @type {{ word: string, count: number }[]} */
  const topRepeats = [];
  for (const [word, count] of freq) {
    if (count >= 3) topRepeats.push({ word, count });
  }
  topRepeats.sort((a, b) => b.count - a.count);
  const top5 = topRepeats.slice(0, 5);

  const rawLines = text.split(/\n/).filter((l) => l.trim());
  let dialogueish = 0;
  for (const line of rawLines) {
    const t = line.trim();
    if (/^[—\-–]\s*\S/.test(t) || /^[«"]/.test(t) || /[»"]\s*$/.test(t) || /^(\u2014|\u2013)\s/.test(t)) {
      dialogueish++;
    }
  }
  const dialogueRatio = rawLines.length ? dialogueish / rawLines.length : 0;

  return {
    topRepeats: top5,
    avgParagraphWords,
    maxParagraphWords,
    paragraphCount: paragraphs.length || (norm ? 1 : 0),
    dialogueRatio,
  };
}

/**
 * @typedef {Object} EditorOptions
 * @property {(html: string) => void} [onChange]
 * @property {string} [placeholder]
 * @property {'boundary'|'debounce'} [progressMode]
 * @property {() => void} [onProgressRefresh]
 * @property {(metrics: EditorRealtimeMetrics) => void} [onRealtimeMetrics]
 * @property {boolean} [spellcheck] Corrector nativo del navegador (por defecto true)
 */

export class RichEditor {
  /**
   * @param {HTMLElement} host
   * @param {EditorOptions} [options]
   */
  constructor(host, options = {}) {
    this.host = host;
    this.options = options;
    /** @type {((e: KeyboardEvent) => void) | null} */
    this._keyHandler = null;
    this._onChange = options.onChange || (() => {});
    /** @type {(() => void)|null} */
    this._toolbarHandler = null;
    /** @type {(() => void) | null} */
    this._listKeyboardCleanup = null;
    this._debounced = debounce((html) => this._onChange(html), 500);
    this._debouncedProgress = debounce(() => {
      if (this.options.progressMode === 'debounce' && this.options.onProgressRefresh) {
        this.options.onProgressRefresh();
      }
    }, 320);
    this._debouncedRealtime = debounce((html) => {
      if (this.options.onRealtimeMetrics) {
        const m = computeEditorRealtimeMetrics(html);
        this.options.onRealtimeMetrics(m);
      }
    }, REALTIME_DEBOUNCE_MS);
  }

  mount(initialHtml = '') {
    const inSheet = this.host.closest('[data-nl-sheet]');
    this.host.classList.add('nl-editor', 'font-serif', 'text-lg', 'text-slate-200', 'w-full', 'outline-none', 'min-h-[200px]');
    if (inSheet) {
      this.host.classList.add('flex-1', 'p-6', 'md:px-10', 'md:py-8', 'border-0', 'rounded-none', 'bg-transparent');
    } else {
      this.host.classList.add('p-4', 'rounded-md', 'border', 'border-nl-border', 'bg-nl-raised', 'nl-scroll', 'min-h-[200px]');
    }
    this.host.contentEditable = 'true';
    this.host.spellcheck = this.options.spellcheck !== false;
    this.host.setAttribute('lang', 'es');
    this.host.setAttribute('role', 'textbox');
    this.host.setAttribute('aria-multiline', 'true');
    if (this.options.placeholder) {
      this.host.dataset.placeholder = this.options.placeholder;
    }
    this.host.innerHTML = initialHtml || '';
    this.host.addEventListener('input', () => {
      const html = this.getHtml();
      this._debounced(html);
      if (this.options.progressMode === 'debounce') {
        this._debouncedProgress();
      }
      if (this.options.onRealtimeMetrics) {
        this._debouncedRealtime(html);
      }
    });
    this.host.addEventListener('paste', (e) => this._onPaste(e));
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      /* ignore */
    }
    this._listKeyboardCleanup = attachListKeyboard(this.host);
    this._bindShortcuts();
  }

  destroy() {
    this._debounced.cancel();
    this._debouncedProgress.cancel();
    this._debouncedRealtime.cancel();
    this._listKeyboardCleanup?.();
    this._listKeyboardCleanup = null;
    if (this._keyHandler) {
      this.host.removeEventListener('keydown', this._keyHandler, true);
    }
    this.host.contentEditable = 'false';
  }

  /**
   * @param {ClipboardEvent} e
   */
  _onPaste(e) {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  _bindShortcuts() {
    this._keyHandler = (/** @type {KeyboardEvent} */ e) => {
      const mod = e.metaKey || e.ctrlKey;
      const host = this.host;

      if (e.key === 'Tab' && !e.altKey) {
        let node = /** @type {Node|null} */ (e.target instanceof Node ? e.target : null);
        if (!host.contains(node)) node = null;
        if (!node) {
          const sel = window.getSelection();
          node = sel?.anchorNode || null;
        }
        let el = node;
        if (el && el.nodeType === Node.TEXT_NODE) el = el.parentElement;
        const inList = el && host.contains(el) && /** @type {Element} */ (el).closest?.('li');
        if (inList) {
          e.preventDefault();
          document.execCommand(e.shiftKey ? 'outdent' : 'indent', false);
          this._afterInsert();
          return;
        }
      }

      if (mod && (e.key === '+' || e.key === '=' || e.code === 'Equal')) {
        e.preventDefault();
        host.dispatchEvent(new CustomEvent('nl-editor-zoom-in', { bubbles: true }));
        return;
      }
      if (mod && (e.key === '-' || e.code === 'Minus')) {
        e.preventDefault();
        host.dispatchEvent(new CustomEvent('nl-editor-zoom-out', { bubbles: true }));
        return;
      }
      if (mod && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault();
        host.dispatchEvent(new CustomEvent('nl-editor-zoom-reset', { bubbles: true }));
        return;
      }

      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.execCommand('bold', false);
        return;
      }
      if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        document.execCommand('italic', false);
        return;
      }
      if (mod && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        document.execCommand('underline', false);
        return;
      }
      if (mod && e.shiftKey && this._isEmDashKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand('insertText', false, '—');
        this._afterInsert();
        return;
      }
      if (e.altKey && !mod && e.code === 'KeyM') {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand('insertText', false, '—');
        this._afterInsert();
        return;
      }
      if (this.options.progressMode === 'boundary' && this.options.onProgressRefresh) {
        if (e.key === ' ' || e.key === '.') {
          queueMicrotask(() => this.options.onProgressRefresh?.());
        }
      }
    };
    this.host.addEventListener('keydown', this._keyHandler, true);
  }

  /**
   * @param {KeyboardEvent} e
   */
  _isEmDashKey(e) {
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') return true;
    const k = e.key;
    if (k === '-' || k === '_') return true;
    if (k === 'Minus') return true;
    return false;
  }

  _afterInsert() {
    this.host.dispatchEvent(new Event('input'));
  }

  getHtml() {
    return this.host.innerHTML;
  }

  /**
   * @param {string} html
   */
  setHtml(html) {
    this.host.innerHTML = html || '';
  }

  focus() {
    this.host.focus();
  }

  /**
   * Texto seleccionado (plano).
   * @returns {string}
   */
  getSelectedText() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return '';
    return sel.toString().trim();
  }
}

/** Iconos SVG minimalistas (16px) */
const iconBold =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h8a4 4 0 0 1 3.2 6.4A4 4 0 0 1 18 18H6V4zm4 8h4a2 2 0 1 0 0-4h-4v4zm0 2v4h5a2 2 0 1 0 0-4h-5z"/></svg>';
const iconItalic =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 4h7v2h-2.5l-3.5 12H15v2H8v-2h2.5l3.5-12H10V4z"/></svg>';
const iconUnderline =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 19h14v2H5v-2zm7-16c3.31 0 6 2.24 6 5s-2.69 5-6 5-6-2.24-6-5 2.69-5 6-5zm0 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>';
const iconListUl =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zM8 7h12v2H8V7zm0 5h12v2H8v-2zm0 5h12v2H8v-2z"/></svg>';
const iconListOl =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 7h12v2H7V7zm0 5h12v2H7v-2zm0 5h12v2H7v-2zM4 5h2v4H4V5zm0 10v2h1v1H4v-3h2v-2H4zm1-5H4v4h2v1H3v-6h2v1z"/></svg>';
const iconAlignLeft =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z"/></svg>';
const iconAlignCenter =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18v2H3V5zm3 4h12v2H6V9zm-3 4h18v2H3v-2zm3 4h12v2H6v-2z"/></svg>';
const iconAlignRight =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18v2H3V5zm6 4h12v2H9V9zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z"/></svg>';
const iconAlignJustify =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/></svg>';
const iconIndent =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18v2H3V5zm0 12h18v2H3v-2zm6-8v8l-4-4 4-4zm-6 4h12v2H5v-2z"/></svg>';
const iconOutdent =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18v2H3V5zm0 12h18v2H3v-2zm2-8l4 4-4 4V9zm2 4h12v2H7v-2z"/></svg>';
const iconPage =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>';
const iconComment =
  '<svg class="nl-toolbar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16v12H7l-3 3V4zm2 2v8h12V6H6z"/></svg>';

/** @param {HTMLElement} toolbarEl @param {RichEditor} editor */
function syncToolbarToSelection(toolbarEl, editor) {
  const host = editor.host;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const an = sel.anchorNode;
  if (!an || !host.contains(an)) return;

  try {
    const fs = toolbarEl.querySelector('[data-font-size]');
    if (fs && 'value' in fs) {
      const v = document.queryCommandValue('fontSize');
      if (v) {
        const map = ['1', '2', '3', '4', '5', '6', '7'];
        const idx = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large'].indexOf(String(v).toLowerCase());
        if (idx >= 0 && map[idx]) /** @type {HTMLSelectElement} */ (fs).value = map[idx];
        else if (['1', '2', '3', '4', '5', '6', '7'].includes(String(v))) /** @type {HTMLSelectElement} */ (fs).value = String(v);
      }
    }
  } catch {
    /* ignore */
  }

  const bs = toolbarEl.querySelector('[data-block-style]');
  if (bs && 'value' in bs) {
    const block = getCurrentBlock(host);
    let val = 'p';
    if (block) {
      const t = block.tagName.toLowerCase();
      if (t === 'h2') val = 'h2';
      else if (t === 'h3') val = 'h3';
      else if (t === 'blockquote') val = 'blockquote';
      else val = 'p';
    }
    /** @type {HTMLSelectElement} */ (bs).value = val;
  }

  const lh = toolbarEl.querySelector('[data-line-height]');
  if (lh && 'value' in lh) {
    const block = getCurrentBlock(host);
    const preset = block ? getBlockLineHeightPreset(block) : '';
    /** @type {HTMLSelectElement} */ (lh).value = preset || '';
  }

  const alignBtns = toolbarEl.querySelectorAll('[data-cmd^="justify"]');
  alignBtns.forEach((btn) => {
    const cmd = btn.getAttribute('data-cmd');
    if (!cmd) return;
    try {
      const on = document.queryCommandState(cmd);
      btn.classList.toggle('bg-indigo-500/25', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    } catch {
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * @param {HTMLElement} desk
 * @param {HTMLElement} zoomWrap
 * @param {HTMLElement | null} zoomLabel
 * @param {number} pct
 */
function applyZoomVisual(desk, zoomWrap, zoomLabel, pct) {
  const z = clampZoom(pct) / 100;
  zoomWrap.style.transform = `scale(${z})`;
  if (zoomLabel) zoomLabel.textContent = `${clampZoom(pct)}%`;
}

/**
 * Crea barra de herramientas y la vincula al editor.
 * @param {HTMLElement} toolbarEl
 * @param {RichEditor} editor
 * @param {{ onHighlight?: () => void, onNewComment?: () => void, onToggleCommentsPanel?: () => void }} [hooks]
 * @returns {() => void}
 */
export function bindToolbar(toolbarEl, editor, hooks = {}) {
  try {
    document.execCommand('styleWithCSS', false, 'true');
  } catch {
    /* ignore */
  }

  const run = (cmd, value = '') => {
    editor.focus();
    document.execCommand(cmd, false, value);
    editor.host.dispatchEvent(new Event('input'));
  };

  const card = toolbarEl.closest('.nl-editor-card');
  const desk = card?.querySelector('[data-nl-editor-desk]');
  const zoomWrap = card?.querySelector('[data-nl-zoom-wrap]');
  const sheet = card?.querySelector('[data-nl-sheet]');
  const zoomLabel = card?.querySelector('[data-nl-zoom-label]');

  const applyPageSizeToSheet = () => {
    if (!sheet) return;
    for (const p of EDITOR_PAGE_SIZE_PRESETS) {
      sheet.classList.remove(`nl-editor-sheet--${p.id}`);
    }
    sheet.classList.add(`nl-editor-sheet--${getEditorPageSize()}`);
  };

  let zoomPct = getEditorZoomPercent();
  if (desk && zoomWrap) {
    applyZoomVisual(desk, zoomWrap, zoomLabel, zoomPct);
    if (getEditorPageMode()) {
      desk.classList.add('nl-editor-page-mode');
      sheet?.classList.add('nl-editor-sheet--page');
      applyPageSizeToSheet();
    }
  }

  const pageSizeSel = toolbarEl.querySelector('[data-page-size]');
  if (pageSizeSel && 'value' in pageSizeSel) {
    /** @type {HTMLSelectElement} */ (pageSizeSel).value = getEditorPageSize();
    pageSizeSel.addEventListener('change', () => {
      const v = /** @type {HTMLSelectElement} */ (pageSizeSel).value;
      setEditorPageSize(v);
      if (getEditorPageMode()) applyPageSizeToSheet();
    });
  }

  const setZoom = (pct) => {
    zoomPct = clampZoom(pct);
    setEditorZoomPercent(zoomPct);
    if (desk && zoomWrap) applyZoomVisual(desk, zoomWrap, zoomLabel, zoomPct);
  };

  const onZoomIn = () => setZoom(nextZoomStepUp(zoomPct));
  const onZoomOut = () => setZoom(nextZoomStepDown(zoomPct));
  const onZoomReset = () => setZoom(100);

  const pageToggle = toolbarEl.querySelector('[data-page-mode-toggle]');
  const syncPageToggle = () => {
    const on = getEditorPageMode();
    pageToggle?.setAttribute('aria-pressed', on ? 'true' : 'false');
    pageToggle?.classList.toggle('bg-indigo-500/20', on);
  };
  syncPageToggle();

  if (pageToggle) {
    pageToggle.addEventListener('click', () => {
      const next = !getEditorPageMode();
      setEditorPageMode(next);
      desk?.classList.toggle('nl-editor-page-mode', next);
      sheet?.classList.toggle('nl-editor-sheet--page', next);
      if (next) {
        applyPageSizeToSheet();
      } else if (sheet) {
        for (const p of EDITOR_PAGE_SIZE_PRESETS) {
          sheet.classList.remove(`nl-editor-sheet--${p.id}`);
        }
      }
      syncPageToggle();
    });
  }

  toolbarEl.querySelector('[data-zoom-out]')?.addEventListener('click', () => onZoomOut());
  toolbarEl.querySelector('[data-zoom-in]')?.addEventListener('click', () => onZoomIn());

  editor.host.addEventListener('nl-editor-zoom-in', onZoomIn);
  editor.host.addEventListener('nl-editor-zoom-out', onZoomOut);
  editor.host.addEventListener('nl-editor-zoom-reset', onZoomReset);

  toolbarEl.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      const val = btn.getAttribute('data-value') || '';
      if (cmd === 'fontSize') {
        const size = toolbarEl.querySelector('[data-font-size]');
        const v = size && 'value' in size ? String(/** @type {HTMLSelectElement} */(size).value) : '3';
        run('fontSize', v);
        return;
      }
      if (cmd === 'formatBlock') {
        const sel = toolbarEl.querySelector('[data-block-style]');
        const v = sel && 'value' in sel ? String(/** @type {HTMLSelectElement} */(sel).value) : 'p';
        run('formatBlock', v);
        return;
      }
      if (cmd === 'foreColor' && val) {
        run('foreColor', val);
        return;
      }
      if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
        execInsertList(editor.host, cmd);
        return;
      }
      if (cmd) run(cmd, val);
    });
  });

  const fs = toolbarEl.querySelector('[data-font-size]');
  if (fs) {
    fs.addEventListener('change', () => {
      editor.focus();
      run('fontSize', /** @type {HTMLSelectElement} */(fs).value);
    });
  }
  const bs = toolbarEl.querySelector('[data-block-style]');
  if (bs) {
    bs.addEventListener('change', () => {
      editor.focus();
      const v = /** @type {HTMLSelectElement} */(bs).value;
      document.execCommand('formatBlock', false, v);
      editor.host.dispatchEvent(new Event('input'));
    });
  }

  const lh = toolbarEl.querySelector('[data-line-height]');
  if (lh) {
    lh.addEventListener('change', () => {
      editor.focus();
      const v = /** @type {HTMLSelectElement} */(lh).value;
      const block = getCurrentBlock(editor.host);
      if (block) {
        setBlockLineHeightPreset(block, /** @type {'compact'|'comfort'|'relaxed'|''} */ (v));
        editor.host.dispatchEvent(new Event('input'));
      }
    });
  }

  const hl = toolbarEl.querySelector('[data-highlight-btn]');
  if (hl && hooks.onHighlight) {
    hl.addEventListener('click', (e) => {
      e.preventDefault();
      hooks.onHighlight();
    });
  }

  const newCommentBtn = toolbarEl.querySelector('[data-new-comment-btn]');
  if (newCommentBtn && hooks.onNewComment) {
    newCommentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hooks.onNewComment();
    });
  }

  const commentsToggle = toolbarEl.querySelector('[data-comments-panel-toggle]');
  if (commentsToggle && hooks.onToggleCommentsPanel) {
    commentsToggle.addEventListener('click', (e) => {
      e.preventDefault();
      hooks.onToggleCommentsPanel();
    });
  }

  const onSel = () => {
    queueMicrotask(() => syncToolbarToSelection(toolbarEl, editor));
  };
  document.addEventListener('selectionchange', onSel);
  editor.host.addEventListener('mouseup', onSel);
  editor.host.addEventListener('keyup', onSel);

  const cleanup = () => {
    document.removeEventListener('selectionchange', onSel);
    editor.host.removeEventListener('mouseup', onSel);
    editor.host.removeEventListener('keyup', onSel);
    editor.host.removeEventListener('nl-editor-zoom-in', onZoomIn);
    editor.host.removeEventListener('nl-editor-zoom-out', onZoomOut);
    editor.host.removeEventListener('nl-editor-zoom-reset', onZoomReset);
  };

  queueMicrotask(onSel);
  return cleanup;
}

/**
 * Panel lateral de comentarios (HTML vacío, se rellena desde App).
 * @returns {string}
 */
export function editorCommentsAsideHtml() {
  return `
    <aside data-nl-comments-aside class="nl-comments-aside hidden flex-col w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-nl-border bg-nl-bg/95 max-h-[min(40vh,320px)] lg:max-h-none">
      <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-nl-border">
        <span class="text-xs font-medium text-slate-300">Comentarios</span>
        <button type="button" data-nl-comments-close class="lg:hidden text-xs text-nl-muted hover:text-slate-300 px-2 py-1 rounded">Cerrar</button>
      </div>
      <ul data-nl-comments-list class="flex-1 overflow-y-auto nl-scroll p-2 space-y-2 min-h-0 text-sm"></ul>
    </aside>
  `;
}

/**
 * Marco del área editable (scroll en escritorio, zoom, hoja).
 * @param {string} hostAttrs atributos del div contenteditable, p. ej. 'data-ed class="nl-editor flex-1"'
 * @returns {string}
 */
export function editorFrameHtml(hostAttrs) {
  return `
    <div class="nl-editor-frame flex flex-col flex-1 min-h-0 overflow-hidden rounded-b-lg">
      <div class="nl-editor-desk flex-1 min-h-0 overflow-y-auto overflow-x-auto nl-scroll" data-nl-editor-desk>
        <div class="nl-editor-zoom-wrap flex justify-center py-2 px-2 transition-transform duration-150 ease-out origin-top will-change-transform" data-nl-zoom-wrap style="transform: scale(1)">
          <div class="nl-editor-sheet nl-editor-sheet-fluid mx-auto transition-[box-shadow] duration-200" data-nl-sheet>
            <div ${hostAttrs}></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tarjeta completa: toolbar + marco + panel comentarios.
 * @param {string} hostAttrs
 * @returns {string}
 */
export function editorCardWithHost(hostAttrs) {
  return `
    <div class="nl-editor-card rounded-xl border border-nl-border overflow-hidden bg-nl-surface flex flex-col flex-1 min-h-0">
      ${toolbarHtml()}
      <div class="flex flex-1 min-h-0 flex-col lg:flex-row min-w-0">
        <div class="flex flex-col flex-1 min-h-0 min-w-0">
          ${editorFrameHtml(hostAttrs)}
        </div>
        ${editorCommentsAsideHtml()}
      </div>
    </div>
  `;
}

/**
 * HTML de toolbar por defecto (insertar en contenedor).
 * @returns {string}
 */
export function toolbarHtml() {
  const pageSizeOptions = EDITOR_PAGE_SIZE_PRESETS.map(
    (p) => `<option value="${p.id}">${p.label}</option>`
  ).join('');
  const sep = '<span class="nl-toolbar-sep w-px h-6 bg-nl-border shrink-0" aria-hidden="true"></span>';
  const palette = [
    { v: '#e2e8f0', t: 'Gris claro' },
    { v: '#94a3b8', t: 'Gris' },
    { v: '#64748b', t: 'Gris oscuro' },
    { v: '#a5b4fc', t: 'Índigo' },
    { v: '#fcd34d', t: 'Ámbar' },
    { v: '#f87171', t: 'Rojo suave' },
    { v: '#6ee7b7', t: 'Verde menta' },
    { v: '#f8fafc', t: 'Blanco hielo' },
  ]
    .map(
      (p) =>
        `<button type="button" data-cmd="foreColor" data-value="${p.v}" class="nl-color-swatch w-6 h-6 rounded border border-nl-border shrink-0" style="background:${p.v}" title="Color: ${p.t}" aria-label="Color ${p.t}"></button>`
    )
    .join('');

  return `
    <div data-nl-toolbar class="nl-toolbar flex flex-wrap items-center gap-1.5 p-2 border-b border-nl-border bg-nl-surface rounded-t-lg">
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden sm:inline">Texto</span>
      <button type="button" data-cmd="bold" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Negrita (Ctrl/Cmd+B)" aria-label="Negrita">${iconBold}</button>
      <button type="button" data-cmd="italic" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Cursiva (Ctrl/Cmd+I)" aria-label="Cursiva">${iconItalic}</button>
      <button type="button" data-cmd="underline" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Subrayado (Ctrl/Cmd+U)" aria-label="Subrayado">${iconUnderline}</button>
      <label class="sr-only" for="nl-font-size">Tamaño</label>
      <select data-font-size id="nl-font-size" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 max-w-[7rem]">
        <option value="1">Pequeño</option>
        <option value="3" selected>Normal</option>
        <option value="5">Grande</option>
        <option value="7">Muy grande</option>
      </select>
      <div class="flex flex-wrap items-center gap-0.5 max-w-[200px]" title="Color de texto">${palette}</div>
      ${sep}
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden md:inline">Estructura</span>
      <label class="sr-only" for="nl-block">Estilo de párrafo</label>
      <select data-block-style id="nl-block" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 max-w-[8rem]">
        <option value="p">Párrafo</option>
        <option value="h2">Título</option>
        <option value="h3">Subtítulo</option>
        <option value="blockquote">Cita</option>
      </select>
      <button type="button" data-cmd="insertUnorderedList" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Lista con viñetas" aria-label="Lista con viñetas">${iconListUl}</button>
      <button type="button" data-cmd="insertOrderedList" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Lista numerada" aria-label="Lista numerada">${iconListOl}</button>
      <button type="button" data-cmd="insertText" data-value="—" class="px-2 py-1 rounded text-sm text-slate-400 hover:bg-nl-raised hover:text-slate-200" title="Guión largo —">—</button>
      ${sep}
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden lg:inline">Formato</span>
      <label class="sr-only" for="nl-line-height">Interlineado</label>
      <select data-line-height id="nl-line-height" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 max-w-[9rem]">
        <option value="">Interlineado</option>
        <option value="compact">Compacto</option>
        <option value="comfort">Cómodo</option>
        <option value="relaxed">Amplio</option>
      </select>
      <button type="button" data-cmd="justifyLeft" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Alinear a la izquierda" aria-label="Alinear a la izquierda">${iconAlignLeft}</button>
      <button type="button" data-cmd="justifyCenter" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Centrar" aria-label="Centrar">${iconAlignCenter}</button>
      <button type="button" data-cmd="justifyRight" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Alinear a la derecha" aria-label="Alinear a la derecha">${iconAlignRight}</button>
      <button type="button" data-cmd="justifyFull" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Justificar" aria-label="Justificar">${iconAlignJustify}</button>
      <button type="button" data-cmd="indent" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Aumentar sangría" aria-label="Aumentar sangría">${iconIndent}</button>
      <button type="button" data-cmd="outdent" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Reducir sangría" aria-label="Reducir sangría">${iconOutdent}</button>
      ${sep}
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden sm:inline">Comentarios</span>
      <button type="button" data-new-comment-btn class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised flex items-center gap-1" title="Nuevo comentario sobre el texto seleccionado" aria-label="Nuevo comentario">${iconComment}<span class="text-xs hidden xl:inline">Comentar</span></button>
      <button type="button" data-comments-panel-toggle class="nl-tool-btn px-2 py-1 rounded text-xs text-slate-300 border border-nl-border hover:bg-nl-raised" title="Mostrar u ocultar panel de comentarios" aria-label="Panel de comentarios">Panel</button>
      ${sep}
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden sm:inline">Vista</span>
      <button type="button" data-page-mode-toggle class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Modo página (hoja de documento)" aria-label="Modo página">${iconPage}</button>
      <label class="sr-only" for="nl-page-size-sel">Tamaño de página</label>
      <select data-page-size id="nl-page-size-sel" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 max-w-[10rem]" title="Tamaño de hoja (Carta, A4, Legal, A5)">${pageSizeOptions}</select>
      <div class="flex items-center gap-0.5 ml-auto sm:ml-0 border border-nl-border rounded-md bg-nl-raised/80 px-1 py-0.5" title="Zoom solo visual (Ctrl/Cmd +/−/0)">
        <button type="button" data-zoom-out class="nl-tool-btn w-7 h-7 rounded text-slate-300 hover:bg-nl-bg text-lg leading-none" aria-label="Alejar">−</button>
        <span data-nl-zoom-label class="text-xs text-slate-400 tabular-nums min-w-[2.75rem] text-center">100%</span>
        <button type="button" data-zoom-in class="nl-tool-btn w-7 h-7 rounded text-slate-300 hover:bg-nl-bg text-lg leading-none" aria-label="Acercar">+</button>
      </div>
      ${sep}
      <button type="button" data-highlight-btn class="px-2 py-1.5 rounded text-xs border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 shrink-0" title="Añadir a frases destacadas">Destacar</button>
    </div>
  `;
}
