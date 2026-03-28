/**
 * Editor enriquecido (contenteditable) — Narrative Lab
 */

import { debounce, stripHtml } from '../core/utils.js';
import {
  clampZoom,
  getBlockLineHeightPreset,
  getCurrentBlock,
  nextZoomStepDown,
  nextZoomStepUp,
  setBlockLineHeightPreset,
} from './editor-helpers.js';
import {
  EDITOR_FONT_OPTIONS,
  FONT_SIZE_PRESETS,
  applyFontFamilyToSelection,
  applyFontSizePxToSelection,
  clearSelectionFormattingToDefaults,
  getFontFamilyValueForToolbar,
  getFontSizePxForToolbar,
  getForeColorCssForToolbar,
} from './editor-font.js';
import { flattenPageLayout, layoutEditorPages, wrapContentInFirstPage } from './editor-paginate.js';
import { attachListKeyboard, execInsertList } from './editor-list-behavior.js';
import {
  clearToolbarPinnedHighlight,
  setToolbarPinnedHighlight,
} from './editor-toolbar-pinned-selection.js';
import { EDITOR_PAGE_SIZE_PRESETS } from './editor-page-sizes.js';
import {
  getEditorMarginHorizontalCm,
  getEditorMarginVerticalCm,
  getEditorPageMode,
  getEditorPageSize,
  getEditorZoomPercent,
  setEditorMarginHorizontalCm,
  setEditorMarginVerticalCm,
  setEditorPageMode,
  setEditorPageSize,
  setEditorZoomPercent,
} from '../domain/prefs.js';
import { showToast } from '../ui/toast.js';

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
/** Máximo de estados guardados para Deshacer (cada cambio de HTML cuenta como uno). */
const MAX_UNDO_HISTORY = 120;

/** Stopwords mínimas (es) para repetición */
const STOP = new Set([
  'que', 'con', 'por', 'para', 'una', 'uno', 'los', 'las', 'del', 'al', 'como', 'más', 'pero', 'sus', 'fue', 'ser', 'sin', 'sobre', 'este', 'esta', 'estos', 'estas', 'había', 'hay', 'han', 'the',
]);

/**
 * Texto por bloque a partir del HTML del editor. `stripHtml` junta &lt;p&gt; sin saltos, así que no sirve para contar párrafos.
 * @param {string} html
 * @returns {string[]}
 */
function blockTextsFromEditorHtml(html) {
  if (!html || typeof html !== 'string') return [];
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  /** @type {string[]} */
  const out = [];
  wrap.querySelectorAll('p').forEach((el) => {
    const t = el.textContent?.replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  });
  wrap.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const t = el.textContent?.replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  });
  wrap.querySelectorAll('li').forEach((li) => {
    if (li.querySelector('p')) return;
    const t = li.textContent?.replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  });
  if (out.length === 0) {
    const t = stripHtml(html).replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  }
  return out;
}

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

  const paragraphs = blockTextsFromEditorHtml(html || '');
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
    paragraphCount: paragraphs.length,
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
    /** @type {string[]} */
    this._undoStack = [];
    /** @type {string[]} */
    this._redoStack = [];
    this._lastKnownHtml = '';
    /** Evita registrar un paso extra al aplicar deshacer/rehacer. */
    this._ignoreHistoryForUndoRedo = false;
  }

  mount(initialHtml = '') {
    const inSheet = this.host.closest('[data-nl-sheet]');
    this.host.classList.add('nl-editor', 'font-serif', 'text-lg', 'text-slate-200', 'w-full', 'outline-none', 'min-h-[200px]');
    if (inSheet) {
      this.host.classList.add(
        'flex-1',
        'px-6',
        'pt-3',
        'pb-6',
        'md:px-10',
        'md:pt-4',
        'md:pb-8',
        'border-0',
        'rounded-none',
        'bg-transparent'
      );
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
    this._undoStack = [];
    this._redoStack = [];
    this._lastKnownHtml = this.getHtml();
    this.host.addEventListener('input', () => {
      const html = this.getHtml();
      if (!this._ignoreHistoryForUndoRedo) {
        this._recordHtmlHistoryIfChanged(html);
      }
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
    this._undoStack = [];
    this._redoStack = [];
    this.host.contentEditable = 'false';
  }

  /**
   * @param {string} html
   */
  _recordHtmlHistoryIfChanged(html) {
    if (html === this._lastKnownHtml) return;
    this._undoStack.push(this._lastKnownHtml);
    this._lastKnownHtml = html;
    this._redoStack = [];
    while (this._undoStack.length > MAX_UNDO_HISTORY) {
      this._undoStack.shift();
    }
  }

  _collapseSelectionToEnd() {
    this.host.focus();
    const sel = window.getSelection();
    if (!sel) return;
    try {
      const r = document.createRange();
      r.selectNodeContents(this.host);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    } catch {
      /* ignore */
    }
  }

  _editorUndo() {
    if (this._undoStack.length === 0) return;
    const prev = this._undoStack.pop();
    this._redoStack.push(this.getHtml());
    this._ignoreHistoryForUndoRedo = true;
    this.host.innerHTML = prev;
    this._lastKnownHtml = prev;
    this._ignoreHistoryForUndoRedo = false;
    this._collapseSelectionToEnd();
    this.host.dispatchEvent(new Event('input'));
  }

  _editorRedo() {
    if (this._redoStack.length === 0) return;
    const next = this._redoStack.pop();
    this._undoStack.push(this.getHtml());
    this._ignoreHistoryForUndoRedo = true;
    this.host.innerHTML = next;
    this._lastKnownHtml = next;
    this._ignoreHistoryForUndoRedo = false;
    this._collapseSelectionToEnd();
    this.host.dispatchEvent(new Event('input'));
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

      if (e.isComposing) return;

      if (mod && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        this._editorRedo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this._editorUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y' && !e.shiftKey) {
        e.preventDefault();
        this._editorRedo();
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

/** Iconos Font Awesome (solid free) */
const iconBold = '<i class="fa-solid fa-bold nl-toolbar-icon" aria-hidden="true"></i>';
const iconItalic = '<i class="fa-solid fa-italic nl-toolbar-icon" aria-hidden="true"></i>';
const iconUnderline = '<i class="fa-solid fa-underline nl-toolbar-icon" aria-hidden="true"></i>';
const iconListUl = '<i class="fa-solid fa-list-ul nl-toolbar-icon" aria-hidden="true"></i>';
const iconListOl = '<i class="fa-solid fa-list-ol nl-toolbar-icon" aria-hidden="true"></i>';
const iconAlignLeft = '<i class="fa-solid fa-align-left nl-toolbar-icon" aria-hidden="true"></i>';
const iconAlignCenter = '<i class="fa-solid fa-align-center nl-toolbar-icon" aria-hidden="true"></i>';
const iconAlignRight = '<i class="fa-solid fa-align-right nl-toolbar-icon" aria-hidden="true"></i>';
const iconAlignJustify = '<i class="fa-solid fa-align-justify nl-toolbar-icon" aria-hidden="true"></i>';
const iconIndent = '<i class="fa-solid fa-indent nl-toolbar-icon" aria-hidden="true"></i>';
const iconOutdent = '<i class="fa-solid fa-outdent nl-toolbar-icon" aria-hidden="true"></i>';
const iconPage = '<i class="fa-solid fa-file-lines nl-toolbar-icon" aria-hidden="true"></i>';
const iconComment = '<i class="fa-solid fa-comment nl-toolbar-icon" aria-hidden="true"></i>';
const iconMaximize = '<i class="fa-solid fa-maximize nl-toolbar-icon" aria-hidden="true"></i>';
const iconMinimize = '<i class="fa-solid fa-minimize nl-toolbar-icon" aria-hidden="true"></i>';

/** @param {HTMLElement} toolbarEl @param {RichEditor} editor */
function syncToolbarToSelection(toolbarEl, editor) {
  const host = editor.host;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const an = sel.anchorNode;
  if (!an || !host.contains(an)) return;

  try {
    const ff = toolbarEl.querySelector('[data-font-family]');
    if (ff && 'value' in ff) {
      /** @type {HTMLSelectElement} */ (ff).value = getFontFamilyValueForToolbar(host);
    }
    const fspx = toolbarEl.querySelector('[data-font-size-px]');
    if (fspx && 'value' in fspx) {
      const px = getFontSizePxForToolbar(host);
      /** @type {HTMLInputElement} */ (fspx).value = px === null ? '' : String(px);
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

  const colorLine = toolbarEl.querySelector('[data-text-color-line]');
  if (colorLine instanceof HTMLElement) {
    try {
      colorLine.style.backgroundColor = getForeColorCssForToolbar(host);
    } catch {
      /* ignore */
    }
  }
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

  const card = toolbarEl.closest('.nl-editor-card');
  /** Selección clonada antes de interactuar con la barra (evita perder el rango al cambiar foco). */
  let savedToolbarRange = /** @type {Range | null} */ (null);

  const clearSavedToolbarRange = () => {
    savedToolbarRange = null;
    clearToolbarPinnedHighlight();
  };

  const refreshPinnedHighlight = () => {
    if (savedToolbarRange) {
      try {
        setToolbarPinnedHighlight(savedToolbarRange.cloneRange());
      } catch {
        clearToolbarPinnedHighlight();
      }
    } else {
      clearToolbarPinnedHighlight();
    }
  };

  const restoreSelectionFromSaved = () => {
    if (!savedToolbarRange) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedToolbarRange.cloneRange());
  };

  const selectionNonCollapsedInHost = (r) =>
    !r.collapsed && (r.commonAncestorContainer === editor.host || editor.host.contains(r.commonAncestorContainer));

  const syncSavedRangeAfterCommand = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const nr = sel.getRangeAt(0);
      if (selectionNonCollapsedInHost(nr)) {
        savedToolbarRange = nr.cloneRange();
      }
    }
    refreshPinnedHighlight();
  };

  const run = (cmd, value = '') => {
    restoreSelectionFromSaved();
    editor.focus();
    document.execCommand(cmd, false, value);
    editor.host.dispatchEvent(new Event('input'));
    syncSavedRangeAfterCommand();
  };

  /** Mousedown en la barra: guardar rango no colapsado dentro del editor; evitar que el foco salga del contenteditable salvo en inputs/select. */
  const onToolbarMouseDownCapture = (e) => {
    const t = /** @type {HTMLElement | null} */ (e.target instanceof HTMLElement ? e.target : null);
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (selectionNonCollapsedInHost(r)) {
        savedToolbarRange = r.cloneRange();
      }
    }
    refreshPinnedHighlight();
    if (!t) return;
    if (t.closest('input, select, textarea, option, label')) return;
    e.preventDefault();
  };

  toolbarEl.addEventListener('mousedown', onToolbarMouseDownCapture, true);
  editor.host.addEventListener('mousedown', clearSavedToolbarRange, true);

  const desk = card?.querySelector('[data-nl-editor-desk]');
  const zoomWrap = card?.querySelector('[data-nl-zoom-wrap]');
  const sheet = card?.querySelector('[data-nl-sheet]');
  const zoomLabel = card?.querySelector('[data-nl-zoom-label]');

  /** Márgenes extra dentro de la hoja (modo página): variables en el host, ver .nl-page en app.css */
  const applyEditorMargins = () => {
    const mx = getEditorMarginHorizontalCm();
    const my = getEditorMarginVerticalCm();
    editor.host.style.setProperty('--nl-editor-margin-x', `${mx}cm`);
    editor.host.style.setProperty('--nl-editor-margin-y', `${my}cm`);
    if (sheet) {
      sheet.style.removeProperty('padding-left');
      sheet.style.removeProperty('padding-right');
      sheet.style.removeProperty('padding-top');
      sheet.style.removeProperty('padding-bottom');
    }
  };
  applyEditorMargins();

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
      editor.host.classList.add('nl-editor-page-layout');
      wrapContentInFirstPage(editor.host);
      queueMicrotask(() => layoutEditorPages(editor.host));
    }
  }

  const pageSizeSel = toolbarEl.querySelector('[data-page-size]');
  if (pageSizeSel && 'value' in pageSizeSel) {
    /** @type {HTMLSelectElement} */ (pageSizeSel).value = getEditorPageSize();
    pageSizeSel.addEventListener('change', () => {
      const v = /** @type {HTMLSelectElement} */ (pageSizeSel).value;
      setEditorPageSize(v);
      if (getEditorPageMode()) {
        applyPageSizeToSheet();
        queueMicrotask(() => layoutEditorPages(editor.host));
      }
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
        editor.host.classList.add('nl-editor-page-layout');
        wrapContentInFirstPage(editor.host);
        queueMicrotask(() => layoutEditorPages(editor.host));
      } else {
        editor.host.classList.remove('nl-editor-page-layout');
        flattenPageLayout(editor.host);
        if (sheet) {
          for (const p of EDITOR_PAGE_SIZE_PRESETS) {
            sheet.classList.remove(`nl-editor-sheet--${p.id}`);
          }
        }
      }
      syncPageToggle();
      applyEditorMargins();
    });
  }

  const debouncedPageLayout = debounce(() => {
    if (getEditorPageMode() && editor.host.classList.contains('nl-editor-page-layout')) {
      layoutEditorPages(editor.host);
    }
  }, 450);
  editor.host.addEventListener('input', debouncedPageLayout);

  toolbarEl.querySelector('[data-zoom-out]')?.addEventListener('click', () => onZoomOut());
  toolbarEl.querySelector('[data-zoom-in]')?.addEventListener('click', () => onZoomIn());

  const mxIn = toolbarEl.querySelector('[data-editor-margin-x]');
  const myIn = toolbarEl.querySelector('[data-editor-margin-y]');
  const applyMarginsFromInputs = () => {
    const parseCm = (raw) => {
      const n = parseFloat(String(raw).trim().replace(',', '.'));
      return Number.isFinite(n) ? n : NaN;
    };
    let ok = false;
    if (mxIn && 'value' in mxIn) {
      const n = parseCm(/** @type {HTMLInputElement} */ (mxIn).value);
      if (Number.isFinite(n)) {
        setEditorMarginHorizontalCm(n);
        ok = true;
      }
    }
    if (myIn && 'value' in myIn) {
      const n = parseCm(/** @type {HTMLInputElement} */ (myIn).value);
      if (Number.isFinite(n)) {
        setEditorMarginVerticalCm(n);
        ok = true;
      }
    }
    if (!ok) return;
    applyEditorMargins();
    if (getEditorPageMode() && editor.host.classList.contains('nl-editor-page-layout')) {
      queueMicrotask(() => layoutEditorPages(editor.host));
    }
  };
  if (mxIn && 'value' in mxIn) {
    /** @type {HTMLInputElement} */ (mxIn).value = String(getEditorMarginHorizontalCm());
    mxIn.addEventListener('change', applyMarginsFromInputs);
    mxIn.addEventListener('input', applyMarginsFromInputs);
  }
  if (myIn && 'value' in myIn) {
    /** @type {HTMLInputElement} */ (myIn).value = String(getEditorMarginVerticalCm());
    myIn.addEventListener('change', applyMarginsFromInputs);
    myIn.addEventListener('input', applyMarginsFromInputs);
  }

  editor.host.addEventListener('nl-editor-zoom-in', onZoomIn);
  editor.host.addEventListener('nl-editor-zoom-out', onZoomOut);
  editor.host.addEventListener('nl-editor-zoom-reset', onZoomReset);

  toolbarEl.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      const val = btn.getAttribute('data-value') || '';
      if (cmd === 'formatBlock') {
        const sel = toolbarEl.querySelector('[data-block-style]');
        const v = sel && 'value' in sel ? String(/** @type {HTMLSelectElement} */(sel).value) : 'p';
        restoreSelectionFromSaved();
        editor.focus();
        const tag = v === 'blockquote' ? 'blockquote' : v;
        const arg = tag === 'p' ? '<p>' : `<${tag}>`;
        try {
          document.execCommand('formatBlock', false, arg);
        } catch {
          document.execCommand('formatBlock', false, tag);
        }
        editor.host.dispatchEvent(new Event('input'));
        syncSavedRangeAfterCommand();
        return;
      }
      if (cmd === 'foreColor' && val) {
        run('foreColor', val);
        return;
      }
      if (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') {
        restoreSelectionFromSaved();
        execInsertList(editor.host, cmd);
        syncSavedRangeAfterCommand();
        return;
      }
      if (cmd) run(cmd, val);
    });
  });

  /** @type {(() => void)[]} */
  const toolbarExtraCleanups = [];
  const colorToggle = toolbarEl.querySelector('[data-text-color-toggle]');
  const colorPop = toolbarEl.querySelector('[data-text-color-popover]');
  const colorWrap = toolbarEl.querySelector('[data-text-color-wrap]');
  if (colorToggle && colorPop && colorWrap) {
    const positionColorPopover = () => {
      const r = colorToggle.getBoundingClientRect();
      const w = colorPop.offsetWidth || 184;
      let left = r.left;
      if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
      colorPop.style.left = `${left}px`;
      colorPop.style.top = `${r.bottom + 4}px`;
    };
    const closeColorPopover = () => {
      colorPop.classList.add('hidden');
      colorToggle.setAttribute('aria-expanded', 'false');
    };
    const openColorPopover = () => {
      colorPop.classList.remove('hidden');
      colorToggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => positionColorPopover());
    };
    colorToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (colorPop.classList.contains('hidden')) openColorPopover();
      else closeColorPopover();
    });
    const onDocClickCloseColor = (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (colorWrap.contains(t)) return;
      closeColorPopover();
    };
    const onEscCloseColor = (e) => {
      if (e.key === 'Escape') closeColorPopover();
    };
    const onScrollOrResizeColor = () => {
      if (!colorPop.classList.contains('hidden')) positionColorPopover();
    };
    document.addEventListener('click', onDocClickCloseColor, true);
    document.addEventListener('keydown', onEscCloseColor, true);
    window.addEventListener('scroll', onScrollOrResizeColor, true);
    window.addEventListener('resize', onScrollOrResizeColor);
    colorPop.querySelectorAll('[data-cmd="foreColor"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        queueMicrotask(() => closeColorPopover());
      });
    });
    toolbarExtraCleanups.push(() => document.removeEventListener('click', onDocClickCloseColor, true));
    toolbarExtraCleanups.push(() => document.removeEventListener('keydown', onEscCloseColor, true));
    toolbarExtraCleanups.push(() => window.removeEventListener('scroll', onScrollOrResizeColor, true));
    toolbarExtraCleanups.push(() => window.removeEventListener('resize', onScrollOrResizeColor));
  }

  const ff = toolbarEl.querySelector('[data-font-family]');
  if (ff) {
    ff.addEventListener('change', () => {
      const r = savedToolbarRange ? savedToolbarRange.cloneRange() : undefined;
      editor.focus();
      const v = /** @type {HTMLSelectElement} */ (ff).value;
      applyFontFamilyToSelection(v, r);
      editor.host.dispatchEvent(new Event('input'));
      syncSavedRangeAfterCommand();
    });
  }
  const fspx = toolbarEl.querySelector('[data-font-size-px]');
  if (fspx) {
    let lastApplyTs = 0;
    const onFontSizePxFocus = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        if (selectionNonCollapsedInHost(r)) {
          savedToolbarRange = r.cloneRange();
        }
      }
      refreshPinnedHighlight();
    };
    const applyPx = () => {
      const raw = /** @type {HTMLInputElement} */ (fspx).value;
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) return;
      const now = Date.now();
      if (now - lastApplyTs < 40) return;
      lastApplyTs = now;
      const r = savedToolbarRange ? savedToolbarRange.cloneRange() : null;
      editor.focus();
      applyFontSizePxToSelection(n, r || undefined);
      editor.host.dispatchEvent(new Event('input'));
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const nr = sel.getRangeAt(0);
        if (selectionNonCollapsedInHost(nr)) {
          savedToolbarRange = nr.cloneRange();
        }
      }
      refreshPinnedHighlight();
    };
    fspx.addEventListener('focusin', onFontSizePxFocus);
    fspx.addEventListener('focus', onFontSizePxFocus);
    fspx.addEventListener('input', applyPx);
    fspx.addEventListener('change', applyPx);
    fspx.addEventListener('blur', applyPx);
    fspx.addEventListener('keydown', (e) => {
      if (/** @type {KeyboardEvent} */ (e).key === 'Enter') {
        e.preventDefault();
        applyPx();
      }
    });
  }
  const bs = toolbarEl.querySelector('[data-block-style]');
  if (bs) {
    bs.addEventListener('change', () => {
      restoreSelectionFromSaved();
      editor.focus();
      const v = /** @type {HTMLSelectElement} */(bs).value;
      const tag = v === 'blockquote' ? 'blockquote' : v;
      const arg = tag === 'p' ? '<p>' : `<${tag}>`;
      try {
        document.execCommand('formatBlock', false, arg);
      } catch {
        document.execCommand('formatBlock', false, tag);
      }
      editor.host.dispatchEvent(new Event('input'));
      syncSavedRangeAfterCommand();
    });
  }

  const lh = toolbarEl.querySelector('[data-line-height]');
  if (lh) {
    lh.addEventListener('change', () => {
      restoreSelectionFromSaved();
      editor.focus();
      const v = /** @type {HTMLSelectElement} */(lh).value;
      const block = getCurrentBlock(editor.host);
      if (block) {
        setBlockLineHeightPreset(block, /** @type {'compact'|'comfort'|'relaxed'|''} */ (v));
        editor.host.dispatchEvent(new Event('input'));
      }
      syncSavedRangeAfterCommand();
    });
  }

  const clearFmtBtn = toolbarEl.querySelector('[data-clear-format]');
  if (clearFmtBtn) {
    clearFmtBtn.addEventListener('click', () => {
      restoreSelectionFromSaved();
      editor.focus();
      const r = savedToolbarRange ? savedToolbarRange.cloneRange() : null;
      if (clearSelectionFormattingToDefaults(editor.host, r || undefined)) {
        editor.host.dispatchEvent(new Event('input'));
        syncSavedRangeAfterCommand();
      }
    });
  }

  const hl = toolbarEl.querySelector('[data-highlight-btn]');
  if (hl && hooks.onHighlight) {
    hl.addEventListener('click', (e) => {
      e.preventDefault();
      restoreSelectionFromSaved();
      editor.focus();
      hooks.onHighlight();
      syncSavedRangeAfterCommand();
    });
  }

  const newCommentBtn = toolbarEl.querySelector('[data-new-comment-btn]');
  if (newCommentBtn && hooks.onNewComment) {
    newCommentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      restoreSelectionFromSaved();
      editor.focus();
      hooks.onNewComment();
      syncSavedRangeAfterCommand();
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

  const fsRoot =
    /** @type {HTMLElement | null} */ (card?.closest('[data-nl-editor-fullscreen-root]')) ||
    /** @type {HTMLElement | null} */ (card);
  const fsBtn = toolbarEl.querySelector('[data-editor-fullscreen]');
  const fsExit = toolbarEl.querySelector('[data-editor-fullscreen-exit]');
  const onFullscreenChange = () => {
    const active = fsRoot && document.fullscreenElement === fsRoot;
    fsExit?.classList.toggle('hidden', !active);
    fsBtn?.classList.toggle('hidden', !!active);
    if (active) {
      showToast('Presiona ESC para salir del modo pantalla completa', 'success');
    }
  };
  if (fsBtn && fsRoot) {
    fsBtn.addEventListener('click', async () => {
      if (!document.fullscreenEnabled) {
        showToast('Tu navegador no permite pantalla completa aquí.', 'warning');
        return;
      }
      try {
        await fsRoot.requestFullscreen();
      } catch {
        showToast('No se pudo entrar en pantalla completa.', 'error');
      }
    });
  }
  if (fsExit) {
    fsExit.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
    });
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  queueMicrotask(() => onFullscreenChange());

  const cleanup = () => {
    debouncedPageLayout.cancel();
    toolbarEl.removeEventListener('mousedown', onToolbarMouseDownCapture, true);
    editor.host.removeEventListener('mousedown', clearSavedToolbarRange, true);
    editor.host.removeEventListener('input', debouncedPageLayout);
    document.removeEventListener('selectionchange', onSel);
    editor.host.removeEventListener('mouseup', onSel);
    editor.host.removeEventListener('keyup', onSel);
    editor.host.removeEventListener('nl-editor-zoom-in', onZoomIn);
    editor.host.removeEventListener('nl-editor-zoom-out', onZoomOut);
    editor.host.removeEventListener('nl-editor-zoom-reset', onZoomReset);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    for (const fn of toolbarExtraCleanups) fn();
    clearToolbarPinnedHighlight();
  };

  queueMicrotask(onSel);
  return cleanup;
}

/**
 * Marco del área editable (scroll en escritorio, zoom, hoja).
 * @param {string} hostAttrs atributos del div contenteditable, p. ej. 'data-ed class="nl-editor flex-1"'
 * @returns {string}
 */
export function editorFrameHtml(hostAttrs) {
  return `
    <div class="nl-editor-frame flex flex-col flex-1 min-h-0 overflow-hidden">
      <div class="nl-editor-desk flex-1 min-h-0 overflow-y-auto overflow-x-auto nl-scroll" data-nl-editor-desk>
        <div class="nl-editor-zoom-wrap flex justify-center w-full pt-0 pb-2 px-1 sm:px-2 transition-transform duration-150 ease-out origin-top will-change-transform" data-nl-zoom-wrap style="transform: scale(1)">
          <div class="nl-editor-sheet nl-editor-sheet-fluid mx-auto transition-[box-shadow] duration-200" data-nl-sheet>
            <div ${hostAttrs}></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tarjeta completa: toolbar + marco del editor.
 * @param {string} hostAttrs
 * @returns {string}
 */
export function editorCardWithHost(hostAttrs) {
  return `
    <div class="nl-editor-fullscreen-root flex flex-col flex-1 min-h-0 min-w-0" data-nl-editor-fullscreen-root>
      <div class="nl-editor-card rounded-t-xl border-x border-t border-nl-border border-b-0 overflow-hidden bg-nl-surface flex flex-col flex-1 min-h-0 shadow-none">
        ${toolbarHtml()}
        <div class="flex flex-1 min-h-0 flex-col min-w-0">
          ${editorFrameHtml(hostAttrs)}
        </div>
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
  const fontFamilyOptions = EDITOR_FONT_OPTIONS.map((f) => {
    const v = f.value.replace(/"/g, '&quot;');
    return `<option value="${v}">${f.label}</option>`;
  }).join('');
  const sizeDatalist = FONT_SIZE_PRESETS.map((n) => `<option value="${n}"></option>`).join('');
  const sep = '<span class="nl-toolbar-sep w-px h-6 bg-nl-border shrink-0" aria-hidden="true"></span>';
  const paletteRows = [
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
        `<button type="button" data-cmd="foreColor" data-value="${p.v}" class="nl-color-swatch w-7 h-7 rounded border border-nl-border shrink-0" style="background:${p.v}" title="Color: ${p.t}" aria-label="Color ${p.t}" role="menuitem"></button>`
    )
    .join('');

  return `
    <div data-nl-toolbar class="nl-toolbar flex flex-wrap items-center gap-1.5 p-2 border-b border-nl-border bg-nl-surface rounded-t-xl">
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden sm:inline">Fuente</span>
      <label class="sr-only" for="nl-font-family">Fuente</label>
      <select data-font-family id="nl-font-family" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 max-w-[9.5rem] shrink-0" title="Fuente">${fontFamilyOptions}</select>
      <label class="sr-only" for="nl-font-size-px">Tamaño (px)</label>
      <input type="number" data-font-size-px id="nl-font-size-px" min="8" max="96" step="1" value="17" list="nl-font-size-datalist" inputmode="numeric" class="w-[4.25rem] shrink-0 bg-nl-raised border border-nl-border rounded px-1.5 py-1 text-xs text-slate-200 tabular-nums" title="Tamaño en píxeles (lista o número manual)" />
      <datalist id="nl-font-size-datalist">${sizeDatalist}</datalist>
      <button type="button" data-cmd="bold" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Negrita (Ctrl/Cmd+B)" aria-label="Negrita">${iconBold}</button>
      <button type="button" data-cmd="italic" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Cursiva (Ctrl/Cmd+I)" aria-label="Cursiva">${iconItalic}</button>
      <button type="button" data-cmd="underline" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Subrayado (Ctrl/Cmd+U)" aria-label="Subrayado">${iconUnderline}</button>
      <div class="relative shrink-0" data-text-color-wrap>
        <button type="button" data-text-color-toggle class="nl-tool-btn flex flex-col items-center justify-center px-1.5 py-0.5 rounded text-slate-200 hover:bg-nl-raised min-w-[2rem]" title="Color de texto" aria-label="Color de texto" aria-haspopup="menu" aria-expanded="false" id="nl-text-color-toggle">
          <span class="text-base font-semibold leading-none font-serif" aria-hidden="true">A</span>
          <span data-text-color-line class="block h-[3px] w-5 rounded-sm mt-0.5" style="background-color:#e2e8f0"></span>
        </button>
        <div data-text-color-popover class="hidden fixed z-[100] p-2 rounded-lg border border-nl-border bg-nl-surface shadow-xl flex flex-wrap gap-1.5 w-[11.5rem]" role="menu" aria-labelledby="nl-text-color-popover-label">
          <span id="nl-text-color-popover-label" class="sr-only">Elegir color de texto</span>
          ${paletteRows}
        </div>
      </div>
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
      <button type="button" data-clear-format class="nl-tool-btn px-2 py-1 rounded text-xs text-slate-200 hover:bg-nl-raised shrink-0" title="Quitar formato: fuente, tamaño, color, interlineado y alineación por defecto" aria-label="Borrar formato">Borrar formato</button>
      <button type="button" data-cmd="indent" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Aumentar sangría" aria-label="Aumentar sangría">${iconIndent}</button>
      <button type="button" data-cmd="outdent" class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Reducir sangría" aria-label="Reducir sangría">${iconOutdent}</button>
      ${sep}
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden sm:inline">Comentarios</span>
      <button type="button" data-new-comment-btn class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised flex items-center gap-1" title="Nuevo comentario sobre el texto seleccionado" aria-label="Nuevo comentario">${iconComment}<span class="text-xs hidden xl:inline">Comentar</span></button>
      <button type="button" data-comments-panel-toggle class="nl-tool-btn px-2 py-1 rounded text-xs text-slate-300 border border-nl-border hover:bg-nl-raised" title="Mostrar u ocultar panel de comentarios" aria-label="Mostrar comentarios">Mostrar comentarios</button>
      ${sep}
      <span class="nl-toolbar-label text-[10px] uppercase tracking-wide text-nl-muted hidden sm:inline">Vista</span>
      <button type="button" data-page-mode-toggle class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised" title="Modo página (hoja de documento)" aria-label="Modo página">${iconPage}</button>
      <label class="sr-only" for="nl-page-size-sel">Tamaño de página</label>
      <select data-page-size id="nl-page-size-sel" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 max-w-[10rem]" title="Tamaño de hoja (Carta, A4, Legal, A5)">${pageSizeOptions}</select>
      <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5 border border-nl-border/70 rounded-md bg-nl-raised/50 px-1.5 py-1 max-w-full" title="Márgenes interiores de la hoja en centímetros (dentro del rectángulo blanco). Solo tienen efecto en modo página.">
        <span class="text-[10px] text-nl-muted uppercase tracking-wide hidden sm:inline shrink-0">Márgenes (cm)</span>
        <span class="text-[10px] text-slate-400 shrink-0" aria-hidden="true">↔</span>
        <label class="sr-only" for="nl-editor-margin-x">Margen interior izquierdo y derecho en la página (centímetros)</label>
        <input type="number" data-editor-margin-x id="nl-editor-margin-x" min="0" max="5" step="0.05" inputmode="decimal" class="w-[3.75rem] shrink-0 bg-nl-raised border border-nl-border rounded px-1 py-1 text-xs text-slate-200 tabular-nums" title="Izquierda y derecha: espacio dentro del borde de la hoja (cm). Solo modo página." />
        <span class="text-[10px] text-slate-400 shrink-0" aria-hidden="true">↕</span>
        <label class="sr-only" for="nl-editor-margin-y">Margen interior arriba y abajo en la página (centímetros)</label>
        <input type="number" data-editor-margin-y id="nl-editor-margin-y" min="0" max="5" step="0.05" inputmode="decimal" class="w-[3.75rem] shrink-0 bg-nl-raised border border-nl-border rounded px-1 py-1 text-xs text-slate-200 tabular-nums" title="Arriba y abajo: espacio dentro del borde de la hoja (cm). Solo modo página." />
      </div>
      ${sep}
      <div class="flex flex-wrap items-center gap-1.5">
        <div class="flex items-center gap-0.5 border border-nl-border rounded-md bg-nl-raised/80 px-1 py-0.5" title="Zoom solo visual (Ctrl/Cmd +/−/0)">
          <button type="button" data-zoom-out class="nl-tool-btn w-7 h-7 rounded text-slate-300 hover:bg-nl-bg text-lg leading-none" aria-label="Alejar">−</button>
          <span data-nl-zoom-label class="text-xs text-slate-400 tabular-nums min-w-[2.75rem] text-center">100%</span>
          <button type="button" data-zoom-in class="nl-tool-btn w-7 h-7 rounded text-slate-300 hover:bg-nl-bg text-lg leading-none" aria-label="Acercar">+</button>
        </div>
        ${sep}
        <button type="button" data-highlight-btn class="px-2 py-1.5 rounded text-xs border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 shrink-0" title="Añadir a frases destacadas">Destacar</button>
        <button type="button" data-editor-fullscreen class="nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised border border-nl-border shrink-0" title="Pantalla completa del editor" aria-label="Pantalla completa del editor">${iconMaximize}</button>
        <button type="button" data-editor-fullscreen-exit class="hidden nl-tool-btn p-1.5 rounded text-slate-200 hover:bg-nl-raised border border-nl-border shrink-0" title="Salir de pantalla completa" aria-label="Salir de pantalla completa">${iconMinimize}</button>
      </div>
    </div>
  `;
}
