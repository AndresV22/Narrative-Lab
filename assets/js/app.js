/**
 * Orquestación principal — Narrative Lab
 */

import { loadWorkspace, scheduleSave, flushSave, setSaveStatusCallback, configureAutosaveDelay } from './storage.js';
import { getAutosaveMs, getProgressMode } from './prefs.js';
import {
  createEmptyBook,
  createHighlight,
} from './models.js';
import { debounce } from './utils.js';
import {
  mountShell,
  renderSidebar,
  renderMain,
  renderRightPanel,
  setSaveBadge,
  bindMainInteractions,
  renderSearchModal,
  renderTemplateModal,
  renderImportModal,
  updateHeaderSnapshotButton,
} from './ui.js';
import { RichEditor, bindToolbar, computeEditorRealtimeMetrics } from './editor.js';
import {
  downloadWorkspaceJson,
  readJsonFile,
  parseAndValidate,
  mergeWorkspaces,
  mergeWorkspacesKeepBoth,
} from './import-export-workspace.js';

/**
 * @typedef {Object} NavState
 * @property {string|null} bookId
 * @property {string} view
 * @property {string|null} [chapterId]
 * @property {string|null} [sceneId]
 * @property {string|null} [characterId]
 * @property {string|null} [noteId]
 * @property {string|null} [extraId]
 * @property {boolean} afterNewBookMeta
 * @property {boolean} rightOpen
 * @property {'characters'|'chars_chapters'|'all'} [graphMode]
 * @property {string|null} [guideArticleId]
 */

export class App {
  constructor() {
    /** @type {import('./types.js').Workspace|null} */
    this.workspace = null;
    /** @type {NavState} */
    this.state = {
      bookId: null,
      view: 'synopsis',
      chapterId: null,
      sceneId: null,
      characterId: null,
      noteId: null,
      extraId: null,
      afterNewBookMeta: false,
      rightOpen: true,
      graphMode: 'chars_chapters',
      guideArticleId: null,
    };
    /** @type {import('./editor.js').EditorRealtimeMetrics | null} */
    this.editorMetrics = null;
    /** @type {{ destroy: () => void } | null} */
    this.graphHandle = null;
    /** @type {{ sidebar: HTMLElement, main: HTMLElement, right: HTMLElement, modalHost: HTMLElement, saveStatus: HTMLElement, saveSnapshotBtn?: HTMLButtonElement }|null} */
    this.els = null;
    /** @type {RichEditor|null} */
    this.editor = null;
    /** @type {unknown} */
    this.pendingImport = null;
    /** @type {any} */
    this.templateData = null;
    this.debouncedRight = debounce(() => {
      if (!this.els || !this.workspace || !this.getCurrentBook()) return;
      renderRightPanel(this);
      renderSidebar(this);
      updateHeaderSnapshotButton(this);
    }, 600);
  }

  /**
   * Solo repinta el panel derecho (estadísticas, métricas del editor).
   */
  refreshRightPanel() {
    if (!this.els || !this.workspace) return;
    renderRightPanel(this);
    updateHeaderSnapshotButton(this);
  }

  /**
   * Solo repinta la barra lateral (p. ej. badge de análisis).
   */
  refreshSidebar() {
    if (!this.els || !this.workspace) return;
    renderSidebar(this);
    updateHeaderSnapshotButton(this);
  }

  /**
   * Repinta el área principal y re-enlaza interacciones. Destruye editor actual.
   */
  refreshMain() {
    if (!this.els || !this.workspace) return;
    renderMain(this);
    bindMainInteractions(this);
    updateHeaderSnapshotButton(this);
  }

  /**
   * @returns {import('./types.js').Book|null}
   */
  getCurrentBook() {
    if (!this.workspace || !this.state.bookId) return null;
    return this.workspace.books.find((b) => b.id === this.state.bookId) || null;
  }

  persist() {
    if (!this.workspace) return;
    scheduleSave(this.workspace);
    this.debouncedRight();
  }

  async persistImmediate() {
    if (!this.workspace) return;
    await flushSave(this.workspace);
  }

  disposeEditor() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
    this.editorMetrics = null;
  }

  /**
   * @param {HTMLElement|null} el
   * @param {string} kind
   * @param {string|null} [id]
   * @param {string|null} [chapterId]
   */
  attachEditor(el, kind, id = null, chapterId = null) {
    this.disposeEditor();
    if (!el) return;
    const book = this.getCurrentBook();
    if (!book) return;

    let initial = '';
    if (kind === 'synopsis') initial = book.synopsis || '';
    else if (kind === 'prologue') initial = book.prologue || '';
    else if (kind === 'epilogue') initial = book.epilogue || '';
    else if (kind === 'extras') initial = book.extras || '';
    else if (kind === 'chapter' && id) {
      const ch = book.chapters.find((c) => c.id === id);
      initial = ch?.content || '';
    } else if (kind === 'scene' && id && chapterId) {
      const ch = book.chapters.find((c) => c.id === chapterId);
      const sc = ch?.scenes.find((s) => s.id === id);
      initial = sc?.content || '';
    } else if (kind === 'note' && id) {
      const n = book.notes.find((x) => x.id === id);
      initial = n?.content || '';
    } else if (kind === 'extra' && id) {
      const ex = book.extraBlocks?.find((x) => x.id === id);
      initial = ex?.content || '';
    }

    this.editor = new RichEditor(el, {
      placeholder: 'Escribe aquí…',
      progressMode: getProgressMode(),
      onProgressRefresh: () => {
        if (this.els && this.getCurrentBook()) this.refreshRightPanel();
      },
      onChange: (html) => {
        this.applyEditorHtml(kind, id, chapterId, html);
      },
      onRealtimeMetrics: (metrics) => {
        this.editorMetrics = metrics;
        this.refreshRightPanel();
      },
    });
    this.editor.mount(initial);
    queueMicrotask(() => {
      if (this.editor) {
        this.editorMetrics = computeEditorRealtimeMetrics(this.editor.getHtml());
        this.refreshRightPanel();
      }
    });

    const toolbar = el.previousElementSibling;
    if (toolbar && toolbar instanceof HTMLElement) {
      bindToolbar(toolbar, this.editor, {
        onHighlight: () => this.tryHighlight(kind, id, chapterId),
      });
    }
  }

  /**
   * @param {string} kind
   * @param {string|null} id
   * @param {string|null} chapterId
   * @param {string} html
   */
  applyEditorHtml(kind, id, chapterId, html) {
    const book = this.getCurrentBook();
    if (!book) return;
    if (kind === 'synopsis') book.synopsis = html;
    else if (kind === 'prologue') book.prologue = html;
    else if (kind === 'epilogue') book.epilogue = html;
    else if (kind === 'extras') book.extras = html;
    else if (kind === 'extra' && id) {
      const ex = book.extraBlocks?.find((x) => x.id === id);
      if (ex) ex.content = html;
    } else if (kind === 'chapter' && id) {
      const ch = book.chapters.find((c) => c.id === id);
      if (ch) ch.content = html;
    } else if (kind === 'scene' && id && chapterId) {
      const ch = book.chapters.find((c) => c.id === chapterId);
      const sc = ch?.scenes.find((s) => s.id === id);
      if (sc) sc.content = html;
    } else if (kind === 'note' && id) {
      const n = book.notes.find((x) => x.id === id);
      if (n) n.content = html;
    }
    this.persist();
  }

  /**
   * @param {string} kind
   * @param {string|null} id
   * @param {string|null} chapterId
   */
  tryHighlight(kind, id, chapterId) {
    const book = this.getCurrentBook();
    if (!book || !this.editor) return;
    const text = this.editor.getSelectedText();
    if (!text) {
      alert('Selecciona un fragmento de texto.');
      return;
    }
    if (!confirm('¿Añadir esta frase a «Frases destacadas»?')) return;
    const sid = id || kind;
    book.highlights.push(createHighlight(book.id, kind, String(sid), text));
    this.persist();
  }

  /**
   * @param {string} view
   */
  setView(view) {
    this.state.extraId = null;
    if (view !== 'writingGuide') {
      this.state.guideArticleId = null;
    }
    this.state.view = view;
    if (view !== 'character') this.state.characterId = null;
    if (view !== 'note') this.state.noteId = null;
    if (view === 'chapters') {
      this.state.chapterId = null;
      this.state.sceneId = null;
    } else if (view === 'chapter') {
      this.state.sceneId = null;
    } else if (view !== 'scene') {
      this.state.chapterId = null;
      this.state.sceneId = null;
    }
    this.refresh();
  }

  /**
   * Guía de escritura: índice (articleId null) o artículo concreto.
   * @param {string|null} [articleId]
   */
  openWritingGuide(articleId = null) {
    this.state.extraId = null;
    this.state.guideArticleId = articleId;
    this.state.view = 'writingGuide';
    this.state.characterId = null;
    this.state.noteId = null;
    this.state.chapterId = null;
    this.state.sceneId = null;
    this.refresh();
  }

  /**
   * Abre el editor de un bloque extra (vista Extras).
   * @param {string} id
   */
  openExtraEditor(id) {
    this.state.view = 'extras';
    this.state.extraId = id;
    this.refresh();
  }

  refresh() {
    if (!this.els || !this.workspace) return;
    renderSidebar(this);
    renderMain(this);
    renderRightPanel(this);
    bindMainInteractions(this);
    updateHeaderSnapshotButton(this);
  }

  createBook() {
    if (!this.workspace) return;
    const b = createEmptyBook({ name: 'Nuevo libro' });
    this.workspace.books.push(b);
    this.state.bookId = b.id;
    this.state.afterNewBookMeta = true;
    this.state.view = 'settings';
    this.state.guideArticleId = null;
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} id
   */
  openBook(id) {
    this.state.bookId = id;
    this.state.view = 'synopsis';
    this.state.chapterId = null;
    this.state.sceneId = null;
    this.state.characterId = null;
    this.state.noteId = null;
    this.state.guideArticleId = null;
    this.refresh();
  }

  closeBook() {
    this.state.bookId = null;
    this.disposeEditor();
    this.refresh();
  }

  deleteCurrentBook() {
    const book = this.getCurrentBook();
    if (!book || !this.workspace) return;
    if (!confirm(`¿Eliminar «${book.name}»? Esta acción no se puede deshacer.`)) return;
    this.workspace.books = this.workspace.books.filter((b) => b.id !== book.id);
    this.state.bookId = null;
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} chapterId
   */
  deleteChapterById(chapterId) {
    const book = this.getCurrentBook();
    if (!book) return;
    const ch = book.chapters.find((c) => c.id === chapterId);
    if (!ch) return;
    if (!confirm(`¿Eliminar el capítulo «${ch.title}» y sus escenas?`)) return;
    const sceneIds = new Set((ch.scenes || []).map((s) => s.id));
    book.chapters = book.chapters.filter((c) => c.id !== chapterId);
    for (const act of book.acts || []) {
      act.chapterIds = (act.chapterIds || []).filter((id) => id !== chapterId);
    }
    book.relationships = (book.relationships || []).filter((r) => {
      if (r.to.kind === 'chapter' && r.to.id === chapterId) return false;
      if (r.from.kind === 'chapter' && r.from.id === chapterId) return false;
      if (r.type === 'character_scene' && r.to.kind === 'scene' && sceneIds.has(r.to.id)) return false;
      return true;
    });
    if (this.state.chapterId === chapterId) {
      this.state.chapterId = null;
      this.state.sceneId = null;
    }
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} characterId
   */
  deleteCharacterById(characterId) {
    const book = this.getCurrentBook();
    if (!book) return;
    const ch = book.characters.find((c) => c.id === characterId);
    if (!ch) return;
    if (!confirm(`¿Eliminar el personaje «${ch.name || 'Sin nombre'}»?`)) return;
    book.characters = book.characters.filter((c) => c.id !== characterId);
    book.relationships = (book.relationships || []).filter(
      (r) => !(r.from.kind === 'character' && r.from.id === characterId)
    );
    if (this.state.characterId === characterId) this.state.characterId = null;
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} eventId
   */
  deleteEventById(eventId) {
    const book = this.getCurrentBook();
    if (!book) return;
    book.events = (book.events || []).filter((e) => e.id !== eventId);
    book.relationships = (book.relationships || []).filter(
      (r) =>
        !(
          r.type === 'event_event' &&
          ((r.from.kind === 'event' && r.from.id === eventId) || (r.to.kind === 'event' && r.to.id === eventId))
        )
    );
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} noteId
   */
  deleteNoteById(noteId) {
    const book = this.getCurrentBook();
    if (!book) return;
    if (!confirm('¿Eliminar esta nota?')) return;
    book.notes = book.notes.filter((n) => n.id !== noteId);
    if (this.state.noteId === noteId) this.state.noteId = null;
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} extraId
   */
  deleteExtraBlockById(extraId) {
    const book = this.getCurrentBook();
    if (!book) return;
    if (!confirm('¿Eliminar este extra?')) return;
    book.extraBlocks = (book.extraBlocks || []).filter((e) => e.id !== extraId);
    if (this.state.extraId === extraId) this.state.extraId = null;
    this.persist();
    this.refresh();
  }

  /**
   * @param {string} chapterId
   * @param {string} sceneId
   */
  deleteSceneById(chapterId, sceneId) {
    const book = this.getCurrentBook();
    if (!book) return;
    const ch = book.chapters.find((c) => c.id === chapterId);
    if (!ch) return;
    if (!ch.scenes.some((s) => s.id === sceneId)) return;
    if (!confirm('¿Eliminar esta escena?')) return;
    ch.scenes = ch.scenes.filter((s) => s.id !== sceneId);
    book.relationships = (book.relationships || []).filter(
      (r) => !(r.type === 'character_scene' && r.to.kind === 'scene' && r.to.id === sceneId)
    );
    if (this.state.sceneId === sceneId) this.state.sceneId = null;
    this.persist();
    this.refresh();
  }

  openSearch() {
    renderSearchModal(this);
  }

  exportWorkspace() {
    if (!this.workspace) return;
    downloadWorkspaceJson(this.workspace);
  }

  triggerImportWorkspace() {
    const input = document.getElementById('workspace-import-input');
    if (!input || !('click' in input)) return;
    /** @type {HTMLInputElement} */ (input).value = '';
    input.onchange = async () => {
      const file = /** @type {HTMLInputElement} */ (input).files?.[0];
      if (!file) return;
      try {
        const raw = await readJsonFile(file);
        this.pendingImport = raw;
        renderImportModal(this);
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error al leer el archivo');
      }
    };
    /** @type {HTMLInputElement} */ (input).click();
  }

  /**
   * @param {'replace'|'merge'|'merge-new'} mode
   */
  async applyImport(mode) {
    const raw = this.pendingImport;
    this.pendingImport = null;
    this.els?.modalHost && (this.els.modalHost.innerHTML = '');
    if (raw === null || raw === undefined) return;
    const result = parseAndValidate(raw);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    const incoming = result.workspace;
    if (mode === 'replace') {
      if (!confirm('¿Reemplazar todos los datos del workspace actual?')) return;
      this.workspace = incoming;
    } else if (mode === 'merge') {
      this.workspace = mergeWorkspaces(/** @type {any} */(this.workspace), incoming);
    } else {
      this.workspace = mergeWorkspacesKeepBoth(/** @type {any} */(this.workspace), incoming);
    }
    await this.persistImmediate();
    this.state.bookId = null;
    this.refresh();
  }

  async openTemplateModal() {
    this.templateData = null;
    const data = await this.loadTemplateData();
    renderTemplateModal(this, data.templates);
  }

  async loadTemplateData() {
    if (this.templateData) return this.templateData;
    const res = await fetch('data/templates.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudieron cargar las plantillas');
    this.templateData = await res.json();
    return this.templateData;
  }

  /**
   * @param {string} templateId
   */
  async createFromTemplateId(templateId) {
    if (!this.workspace) return;
    const { createChapter, createScene } = await import('./models.js');
    const data = await this.loadTemplateData();
    const tpl = data.templates.find((/** @type {any} */ t) => t.id === templateId);
    if (!tpl) return;
    const book = createEmptyBook({
      name: `${tpl.name} — nuevo`,
      wordGoal: tpl.wordGoal || 50000,
      ...(typeof tpl.category === 'string' && tpl.category.trim() ? { category: tpl.category.trim() } : {}),
      ...(typeof tpl.synopsisHint === 'string' && tpl.synopsisHint.trim() ? { synopsis: tpl.synopsisHint.trim() } : {}),
    });
    (tpl.chapters || []).forEach((/** @type {any} */ tc, i) => {
      const scenes = (tc.scenes || []).map((/** @type {any} */ s, j) =>
        createScene({ title: s.title || 'Escena', order: j })
      );
      const ch = createChapter({
        title: tc.title || `Capítulo ${i + 1}`,
        order: i,
        chapterGoal: tc.chapterGoal || '',
        scenes,
      });
      book.chapters.push(ch);
    });
    this.workspace.books.push(book);
    this.state.bookId = book.id;
    this.state.afterNewBookMeta = true;
    this.state.view = 'settings';
    this.persist();
    this.refresh();
  }

  async init() {
    const root = document.getElementById('app-root');
    if (!root) return;

    this.workspace = await loadWorkspace();
    configureAutosaveDelay(getAutosaveMs());
    this.els = mountShell(root, this);
    setSaveStatusCallback((status) => {
      if (this.els) setSaveBadge(this.els.saveStatus, status);
    });

    this.refresh();
  }
}

const app = new App();
app.init();
