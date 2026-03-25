/**
 * Editor enriquecido (contenteditable) — Narrative Lab
 */

import { debounce, stripHtml } from './utils.js';

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
    this.host.classList.add('nl-editor', 'font-serif', 'text-lg', 'text-slate-200', 'p-4', 'rounded-md', 'border', 'border-nl-border', 'bg-nl-raised', 'nl-scroll', 'min-h-[200px]');
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
    this._bindShortcuts();
  }

  destroy() {
    this._debounced.cancel();
    this._debouncedProgress.cancel();
    this._debouncedRealtime.cancel();
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

/**
 * Crea barra de herramientas y la vincula al editor.
 * @param {HTMLElement} toolbarEl
 * @param {RichEditor} editor
 * @param {{ onHighlight?: () => void }} [hooks]
 */
export function bindToolbar(toolbarEl, editor, hooks = {}) {
  const run = (cmd, value = '') => {
    editor.focus();
    document.execCommand(cmd, false, value);
    editor.host.dispatchEvent(new Event('input'));
  };

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

  const hl = toolbarEl.querySelector('[data-highlight-btn]');
  if (hl && hooks.onHighlight) {
    hl.addEventListener('click', (e) => {
      e.preventDefault();
      hooks.onHighlight();
    });
  }
}

/**
 * HTML de toolbar por defecto (insertar en contenedor).
 * @returns {string}
 */
export function toolbarHtml() {
  return `
    <div class="flex flex-wrap items-center gap-1 p-2 border-b border-nl-border bg-nl-surface rounded-t-lg">
      <button type="button" data-cmd="bold" class="nl-tool-btn px-2 py-1.5 rounded text-sm font-semibold hover:bg-nl-raised text-slate-200" title="Negrita (Ctrl/Cmd+B)">B</button>
      <button type="button" data-cmd="italic" class="nl-tool-btn px-2 py-1.5 rounded text-sm italic hover:bg-nl-raised text-slate-200" title="Cursiva (Ctrl/Cmd+I)">I</button>
      <button type="button" data-cmd="underline" class="nl-tool-btn px-2 py-1.5 rounded text-sm underline hover:bg-nl-raised text-slate-200" title="Subrayado (Ctrl/Cmd+U)">U</button>
      <span class="w-px h-6 bg-nl-border mx-1"></span>
      <label class="text-xs text-nl-muted sr-only" for="nl-font-size">Tamaño</label>
      <select data-font-size id="nl-font-size" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200">
        <option value="1">Pequeño</option>
        <option value="3" selected>Normal</option>
        <option value="5">Grande</option>
        <option value="7">Muy grande</option>
      </select>
      <label class="text-xs text-nl-muted sr-only" for="nl-block">Estilo</label>
      <select data-block-style id="nl-block" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200">
        <option value="p">Párrafo</option>
        <option value="h2">Título</option>
        <option value="h3">Subtítulo</option>
        <option value="blockquote">Cita</option>
      </select>
      <span class="w-px h-6 bg-nl-border mx-1"></span>
      <button type="button" data-cmd="insertText" data-value="—" class="px-2 py-1.5 rounded text-sm hover:bg-nl-raised text-slate-300" title="Guión largo — (Cmd/Ctrl+Shift+- u Opción/Alt+M)">—</button>
      <button type="button" data-highlight-btn class="ml-auto px-2 py-1.5 rounded text-xs border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10">Destacar selección</button>
    </div>
  `;
}
