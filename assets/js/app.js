/**
 * Orquestación principal — Narrative Lab
 */

import '../css/app.css';
import {
  loadWorkspace,
  scheduleSave,
  flushSave,
  setSaveStatusCallback,
  configureAutosaveDelay,
  deleteWorkspaceDatabase,
} from './domain/storage.js';
import {
  getAutosaveMs,
  getProgressMode,
  getSpellcheckEnabled,
  setLastExportNow,
  getSnapshotIntervalMinutes,
  clearAllAppLocalPreferences,
} from './domain/prefs.js';
import {
  createEmptyBook,
  createHighlight,
  createEditorComment,
  createEmptyAuthorProfile,
  createEmptyWorkspace,
  migrateWorkspace,
} from './domain/models.js';
import { debounce, escapeHtml, uuid } from './core/utils.js';
import {
  mountShell,
  renderSidebar,
  renderMain,
  renderRightPanel,
  applyRightPanelLayout,
  updateHeaderBookToolsVisibility,
  setSaveBadge,
  bindMainInteractions,
  renderSearchModal,
  renderTemplateModal,
  renderImportModal,
  updateHeaderSnapshotButton,
  saveSnapshotFromHeader,
  showEditorCommentBodyModal,
  showConfirmModal,
} from './ui/ui.js';
import { showToast } from './ui/toast.js';
import { RichEditor, bindToolbar, computeEditorRealtimeMetrics } from './editor/editor.js';
import {
  editorSourceId,
  findCommentMarkEl,
  surroundSelectionWithCommentMark,
  surroundSelectionWithHighlightMark,
  unwrapCommentMarkInHost,
} from './editor/editor-helpers.js';
import { getEditorCommentsPanelOpen, setEditorCommentsPanelOpen } from './domain/prefs.js';
import {
  downloadWorkspaceJson,
  readJsonFile,
  parseAndValidate,
  mergeWorkspaces,
  mergeWorkspacesKeepBoth,
} from './domain/import-export-workspace.js';
import { inferChapterIdForSceneHighlight } from './editor/highlight-source.js';
import { clearKanbanTaskModal } from './ui/views/kanban.js';

/**
 * @typedef {Object} NavState
 * @property {string|null} bookId
 * @property {string} view
 * @property {string|null} [chapterId]
 * @property {string|null} [sceneId]
 * @property {string|null} [characterId]
 * @property {string|null} [noteId]
 * @property {string|null} [extraId]
 * @property {string|null} [worldRuleId]
 * @property {boolean} afterNewBookMeta
 * @property {boolean} rightOpen
 * @property {'characters'|'chars_chapters'|'all'} [graphMode]
 * @property {string|null} [graphRootCharacterId] Personaje raíz para la red ortogonal (modo «Solo personajes»)
 * @property {string|null} [guideArticleId]
 * @property {string|null} [timelineEventId]
 * @property {string|null} [highlightId]
 * @property {string|null} [actId]
 * @property {string|null} [kanbanBoardId]
 * @property {string|null} [kanbanTaskId]
 * @property {'stats'|'comments'} [rightPanelMode] Contenido del panel derecho global
 */

export class App {
  constructor() {
    /** @type {import('./core/types.js').Workspace|null} */
    this.workspace = null;
    /** @type {NavState} */
    this.state = {
      bookId: null,
      view: 'library',
      chapterId: null,
      sceneId: null,
      characterId: null,
      noteId: null,
      extraId: null,
      worldRuleId: null,
      afterNewBookMeta: false,
      rightOpen: false,
      graphMode: 'characters',
      graphRootCharacterId: null,
      guideArticleId: null,
      timelineEventId: null,
      highlightId: null,
      actId: null,
      kanbanBoardId: null,
      kanbanTaskId: null,
      rightPanelMode: 'stats',
    };
    /** @type {ReturnType<typeof setInterval> | null} */
    this.autoSnapshotTimer = null;
    /** @type {import('./editor/editor.js').EditorRealtimeMetrics | null} */
    this.editorMetrics = null;
    /** @type {{ destroy: () => void } | null} */
    this.graphHandle = null;
    /** @type {{ sidebar: HTMLElement, main: HTMLElement, right: HTMLElement, modalHost: HTMLElement, saveStatus: HTMLElement, saveSnapshotBtn?: HTMLButtonElement }|null} */
    this.els = null;
    /** @type {RichEditor|null} */
    this.editor = null;
    /** @type {(() => void) | null} */
    this._editorToolbarCleanup = null;
    /** @type {{ kind: string, id: string | null, chapterId: string | null } | null} */
    this._editorContext = null;
    /** @type {unknown} */
    this.pendingImport = null;
    /** @type {any} */
    this.templateData = null;
    this.debouncedRight = debounce(() => {
      if (!this.els || !this.workspace || !this.getCurrentBook()) return;
      renderRightPanel(this);
      applyRightPanelLayout(this);
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
    applyRightPanelLayout(this);
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
   * @returns {import('./core/types.js').Book|null}
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
    this._editorToolbarCleanup?.();
    this._editorToolbarCleanup = null;
    this._editorContext = null;
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
    else if (kind === 'historicalContext') initial = book.historicalContext || '';
    else if (kind === 'worldRules') initial = book.worldRules || '';
    else if (kind === 'worldRule' && id) {
      const r = book.rules?.find((x) => x.id === id);
      initial = r?.content || '';
    }
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
      spellcheck: getSpellcheckEnabled(),
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

    this._editorContext = { kind, id, chapterId };
    if (getEditorCommentsPanelOpen()) {
      this.state.rightPanelMode = 'comments';
      this.state.rightOpen = true;
    } else {
      this.state.rightPanelMode = 'stats';
    }
    const toolbar =
      el.closest('.nl-editor-card')?.querySelector('[data-nl-toolbar]') || el.previousElementSibling;
    this._editorToolbarCleanup?.();
    if (toolbar && toolbar instanceof HTMLElement) {
      this._editorToolbarCleanup = bindToolbar(toolbar, this.editor, {
        onHighlight: () => this.tryHighlight(kind, id, chapterId),
        onNewComment: () => this.tryAddEditorComment(kind, id, chapterId),
        onToggleCommentsPanel: () => this.toggleEditorCommentsPanel(el),
      });
    }
    if (this.els) {
      renderRightPanel(this);
      applyRightPanelLayout(this);
    }
  }

  /**
   * @param {HTMLElement} _hostEl
   */
  toggleEditorCommentsPanel(_hostEl) {
    const next = !getEditorCommentsPanelOpen();
    setEditorCommentsPanelOpen(next);
    if (!this.els) return;
    if (next) {
      this.state.rightPanelMode = 'comments';
      this.state.rightOpen = true;
    } else {
      this.state.rightPanelMode = 'stats';
      this.state.rightOpen = false;
    }
    renderRightPanel(this);
    applyRightPanelLayout(this);
  }

  /**
   * @param {HTMLElement} hostEl
   */
  syncEditorCommentsPanel(hostEl) {
    if (this.state.rightPanelMode !== 'comments' || !this.els) return;
    const list = this.els.right.querySelector('[data-nl-comments-list]');
    if (!list) return;

    const book = this.getCurrentBook();
    const ctx = this._editorContext;
    if (!book || !ctx) {
      list.innerHTML = '';
      return;
    }
    const { kind, id, chapterId } = ctx;
    const sid = editorSourceId(kind, id);
    const comments = (book.editorComments || []).filter((c) => {
      if (c.bookId !== book.id || c.sourceKind !== kind || c.sourceId !== sid) return false;
      if (kind === 'scene' && chapterId && c.chapterId && c.chapterId !== chapterId) return false;
      return true;
    });

    list.innerHTML =
      comments.length === 0
        ? '<li class="text-xs text-nl-muted p-2">Sin comentarios en este fragmento.</li>'
        : comments
            .map((c) => {
              return `<li class="rounded-lg border border-nl-border p-2 bg-nl-raised/80" data-comment-id="${escapeHtml(c.id)}">
      <p class="text-slate-300 text-xs whitespace-pre-wrap">${escapeHtml(c.body || '(vacío)')}</p>
      <div class="flex flex-wrap gap-2 mt-2">
        <button type="button" class="text-xs text-indigo-400 hover:text-indigo-300" data-comment-goto="${escapeHtml(c.id)}">Ir al texto</button>
        <button type="button" class="text-xs text-slate-400 hover:text-slate-200" data-comment-edit="${escapeHtml(c.id)}">Editar</button>
        <button type="button" class="text-xs text-red-400 hover:text-red-300" data-comment-del="${escapeHtml(c.id)}">Eliminar</button>
      </div>
    </li>`;
            })
            .join('');

    list.querySelectorAll('[data-comment-goto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-comment-goto');
        if (cid) this.scrollToEditorComment(cid);
      });
    });
    list.querySelectorAll('[data-comment-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-comment-edit');
        if (cid) this.editEditorComment(cid, hostEl);
      });
    });
    list.querySelectorAll('[data-comment-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-comment-del');
        if (cid) this.deleteEditorComment(cid, hostEl);
      });
    });
  }

  /**
   * @param {string} commentId
   */
  scrollToEditorComment(commentId) {
    if (!this.editor) return;
    const mark = findCommentMarkEl(this.editor.host, commentId);
    mark?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /**
   * @param {string} commentId
   * @param {HTMLElement} hostEl
   */
  async editEditorComment(commentId, hostEl) {
    const book = this.getCurrentBook();
    if (!book || !this.els) return;
    const c = book.editorComments?.find((x) => x.id === commentId);
    if (!c) return;
    const next = await showEditorCommentBodyModal(this, {
      title: 'Editar comentario',
      initialValue: c.body || '',
      okLabel: 'Guardar',
    });
    if (next == null) return;
    c.body = String(next).trim();
    if (!c.body) return;
    c.updatedAt = new Date().toISOString();
    this.persist();
    this.syncEditorCommentsPanel(hostEl);
  }

  /**
   * @param {string} commentId
   * @param {HTMLElement} hostEl
   */
  async deleteEditorComment(commentId, hostEl) {
    const book = this.getCurrentBook();
    if (!book || !this.editor || !this.els) return;
    const ok = await showConfirmModal(this, {
      title: 'Eliminar comentario',
      message: '¿Eliminar este comentario? El marcado en el texto se quitará.',
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    unwrapCommentMarkInHost(this.editor.host, commentId);
    book.editorComments = (book.editorComments || []).filter((c) => c.id !== commentId);
    const ctx = this._editorContext;
    if (ctx) {
      this.applyEditorHtml(ctx.kind, ctx.id, ctx.chapterId, this.editor.getHtml());
    }
    this.persist();
    this.syncEditorCommentsPanel(hostEl);
  }

  /**
   * @param {string} kind
   * @param {string|null} id
   * @param {string|null} chapterId
   */
  async tryAddEditorComment(kind, id, chapterId) {
    const book = this.getCurrentBook();
    if (!book || !this.editor || !this.els) return;
    const sel0 = window.getSelection();
    if (!sel0?.rangeCount) {
      showToast('Selecciona un fragmento de texto para comentar.', 'warning');
      return;
    }
    const r0 = sel0.getRangeAt(0);
    if (r0.collapsed || !this.editor.host.contains(r0.commonAncestorContainer)) {
      showToast('Selecciona un fragmento de texto para comentar.', 'warning');
      return;
    }
    const savedRange = r0.cloneRange();
    const text = savedRange.toString().trim();
    if (!text) {
      showToast('Selecciona un fragmento de texto para comentar.', 'warning');
      return;
    }
    const body = await showEditorCommentBodyModal(this, {
      title: 'Nuevo comentario',
      hint: 'El comentario quedará asociado al texto seleccionado.',
      okLabel: 'Añadir',
    });
    if (body == null || !String(body).trim()) return;
    const cid = uuid();
    this.editor.focus();
    const sel1 = window.getSelection();
    sel1.removeAllRanges();
    try {
      sel1.addRange(savedRange);
    } catch {
      showToast('No se pudo restaurar la selección. Vuelve a seleccionar el texto.', 'error');
      return;
    }
    if (!surroundSelectionWithCommentMark(cid)) {
      showToast('No se pudo aplicar el comentario a esta selección.', 'error');
      return;
    }
    const sid = editorSourceId(kind, id);
    const row = createEditorComment(book.id, kind, sid, String(body).trim(), {
      id: cid,
      chapterId: kind === 'scene' && chapterId ? chapterId : '',
    });
    if (!book.editorComments) book.editorComments = [];
    book.editorComments.push(row);
    this.applyEditorHtml(kind, id, chapterId, this.editor.getHtml());
    this.persist();
    this.syncEditorCommentsPanel(this.editor.host);
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
    else if (kind === 'historicalContext') book.historicalContext = html;
    else if (kind === 'worldRules') book.worldRules = html;
    else if (kind === 'worldRule' && id) {
      const r = book.rules?.find((x) => x.id === id);
      if (r) r.content = html;
    }
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
    /** @type {Record<string, string>} */
    const extra = { description: '', characterId: '', chapterId: '' };
    if (kind === 'scene' && chapterId) extra.chapterId = chapterId;
    if (kind === 'worldRule' && !id) return;
    const h = createHighlight(book.id, kind, String(sid), text, extra);
    this.editor.focus();
    if (!surroundSelectionWithHighlightMark(this.editor.host, h.id)) {
      alert('No se pudo resaltar esta selección (prueba un fragmento más corto o sin saltos).');
      return;
    }
    book.highlights.push(h);
    this.applyEditorHtml(kind, id, chapterId, this.editor.getHtml());
    this.persist();
  }

  /**
   * Navega al origen de una frase destacada.
   * @param {import('./core/types.js').Highlight} h
   */
  openHighlightSource(h) {
    const book = this.getCurrentBook();
    if (!book || h.bookId !== book.id) return;
    const kind = h.sourceKind;
    this.state.timelineEventId = null;
    if (kind === 'synopsis') {
      this.setView('synopsis');
      return;
    }
    if (kind === 'historicalContext') {
      this.setView('historicalContext');
      return;
    }
    if (kind === 'worldRule' && h.sourceId) {
      this.state.worldRuleId = h.sourceId;
      this.state.view = 'worldRules';
      this.refresh();
      return;
    }
    if (kind === 'worldRules') {
      this.setView('worldRules');
      return;
    }
    if (kind === 'prologue') {
      this.setView('prologue');
      return;
    }
    if (kind === 'epilogue') {
      this.setView('epilogue');
      return;
    }
    if (kind === 'extras') {
      this.setView('extras');
      return;
    }
    if (kind === 'chapter' && h.sourceId) {
      this.state.chapterId = h.sourceId;
      this.setView('chapter');
      return;
    }
    if (kind === 'scene' && h.sourceId) {
      const chId = inferChapterIdForSceneHighlight(book, h);
      this.state.chapterId = chId || null;
      this.state.sceneId = h.sourceId;
      if (chId) this.setView('scene');
      return;
    }
    if (kind === 'note' && h.sourceId) {
      this.state.noteId = h.sourceId;
      this.setView('note');
      return;
    }
    if (kind === 'extra' && h.sourceId) {
      this.openExtraEditor(h.sourceId);
    }
  }

  /** Vista de biblioteca (dashboard). */
  goLibraryHome() {
    this.state.worldRuleId = null;
    this.state.highlightId = null;
    this.state.actId = null;
    this.state.kanbanBoardId = null;
    this.state.kanbanTaskId = null;
    clearKanbanTaskModal(this);
    this.state.view = 'library';
    this.refresh();
  }

  /** Perfil de autor (workspace); no cierra el libro abierto. */
  openAuthorProfile() {
    this.state.extraId = null;
    this.state.worldRuleId = null;
    this.state.highlightId = null;
    this.state.actId = null;
    this.state.guideArticleId = null;
    this.state.timelineEventId = null;
    this.state.kanbanBoardId = null;
    this.state.kanbanTaskId = null;
    clearKanbanTaskModal(this);
    this.state.view = 'authorProfile';
    this.refresh();
  }

  /**
   * @param {string} view
   */
  setView(view) {
    if (view === 'authorProfile') {
      this.openAuthorProfile();
      return;
    }
    this.state.extraId = null;
    this.state.worldRuleId = null;
    this.state.highlightId = null;
    this.state.actId = null;
    if (view !== 'writingGuide') {
      this.state.guideArticleId = null;
    }
    this.state.view = view;
    if (view !== 'timeline') this.state.timelineEventId = null;
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
    if (view !== 'kanbanBoard') {
      this.state.kanbanBoardId = null;
      this.state.kanbanTaskId = null;
      clearKanbanTaskModal(this);
    }
    this.refresh();
  }

  /**
   * Guía de escritura: índice (articleId null) o artículo concreto.
   * @param {string|null} [articleId]
   */
  openWritingGuide(articleId = null) {
    this.state.extraId = null;
    this.state.worldRuleId = null;
    this.state.highlightId = null;
    this.state.actId = null;
    this.state.guideArticleId = articleId;
    this.state.view = 'writingGuide';
    this.state.characterId = null;
    this.state.noteId = null;
    this.state.timelineEventId = null;
    this.state.chapterId = null;
    this.state.sceneId = null;
    this.state.kanbanBoardId = null;
    this.state.kanbanTaskId = null;
    clearKanbanTaskModal(this);
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

  /**
   * @param {string} id
   */
  openWorldRuleEditor(id) {
    this.state.view = 'worldRules';
    this.state.worldRuleId = id;
    this.refresh();
  }

  /**
   * @param {string} id
   */
  openHighlightEditor(id) {
    this.state.view = 'highlights';
    this.state.highlightId = id;
    this.refresh();
  }

  /**
   * @param {string} id
   */
  openActEditor(id) {
    this.state.view = 'acts';
    this.state.actId = id;
    this.refresh();
  }

  refresh() {
    if (!this.els || !this.workspace) return;
    renderSidebar(this);
    renderMain(this);
    renderRightPanel(this);
    applyRightPanelLayout(this);
    updateHeaderBookToolsVisibility(this);
    bindMainInteractions(this);
    updateHeaderSnapshotButton(this);
    this.syncAutoSnapshotTimer();
  }

  /** Intervalo de snapshot automático (solo con libro abierto). */
  syncAutoSnapshotTimer() {
    if (this.autoSnapshotTimer) {
      clearInterval(this.autoSnapshotTimer);
      this.autoSnapshotTimer = null;
    }
    const book = this.getCurrentBook();
    const mins = getSnapshotIntervalMinutes();
    if (!book || mins <= 0) return;
    this.autoSnapshotTimer = setInterval(() => {
      saveSnapshotFromHeader(this);
    }, mins * 60 * 1000);
  }

  createBook() {
    if (!this.workspace) return;
    const ap = this.workspace.authorProfile || createEmptyAuthorProfile();
    const authorName = String(ap.name || '').trim();
    const b = createEmptyBook({
      name: 'Nuevo libro',
      ...(authorName ? { author: authorName } : {}),
    });
    this.workspace.books.push(b);
    this.state.bookId = b.id;
    this.state.afterNewBookMeta = true;
    this.state.view = 'settings';
    this.state.guideArticleId = null;
    this.state.kanbanBoardId = null;
    this.state.kanbanTaskId = null;
    clearKanbanTaskModal(this);
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
    this.state.worldRuleId = null;
    this.state.highlightId = null;
    this.state.actId = null;
    this.state.timelineEventId = null;
    this.state.guideArticleId = null;
    this.state.kanbanBoardId = null;
    this.state.kanbanTaskId = null;
    clearKanbanTaskModal(this);
    this.refresh();
  }

  closeBook() {
    this.state.bookId = null;
    this.state.view = 'library';
    this.state.actId = null;
    this.state.kanbanBoardId = null;
    this.state.kanbanTaskId = null;
    clearKanbanTaskModal(this);
    this.disposeEditor();
    this.refresh();
  }

  async deleteCurrentBook() {
    const book = this.getCurrentBook();
    if (!book || !this.workspace) return;
    const ok = await showConfirmModal(this, {
      title: 'Eliminar libro',
      message: `¿Eliminar «${book.name}»? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      danger: true,
    });
    if (!ok) return;
    this.workspace.books = this.workspace.books.filter((b) => b.id !== book.id);
    this.state.bookId = null;
    this.state.view = 'library';
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
    book.relationships = (book.relationships || []).filter((r) => {
      if (r.from.kind === 'character' && r.from.id === characterId) return false;
      if (r.to.kind === 'character' && r.to.id === characterId) return false;
      return true;
    });
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
    if (this.state.timelineEventId === eventId) this.state.timelineEventId = null;
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
   * @param {string} ruleId
   */
  deleteWorldRuleById(ruleId) {
    const book = this.getCurrentBook();
    if (!book) return;
    if (!confirm('¿Eliminar esta regla?')) return;
    book.rules = (book.rules || []).filter((r) => r.id !== ruleId);
    if (this.state.worldRuleId === ruleId) this.state.worldRuleId = null;
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
    setLastExportNow();
    this.refreshSidebar();
  }

  /**
   * Borra el workspace en IndexedDB, las preferencias locales de la app y reinicia un workspace vacío.
   */
  async wipeAllLocalData() {
    if (!this.els || !this.workspace) return;
    this.disposeEditor();
    if (this.autoSnapshotTimer) {
      clearInterval(this.autoSnapshotTimer);
      this.autoSnapshotTimer = null;
    }
    this.graphHandle?.destroy();
    this.graphHandle = null;
    await deleteWorkspaceDatabase();
    clearAllAppLocalPreferences();
    configureAutosaveDelay(getAutosaveMs());
    this.workspace = migrateWorkspace(createEmptyWorkspace());
    if (!this.workspace.authorProfile) {
      this.workspace.authorProfile = createEmptyAuthorProfile();
    }
    await flushSave(this.workspace);
    this.pendingImport = null;
    this.state = {
      bookId: null,
      view: 'library',
      chapterId: null,
      sceneId: null,
      characterId: null,
      noteId: null,
      extraId: null,
      worldRuleId: null,
      afterNewBookMeta: false,
      rightOpen: this.state.rightOpen,
      graphMode: 'characters',
      graphRootCharacterId: null,
      guideArticleId: null,
      timelineEventId: null,
      highlightId: null,
      actId: null,
      kanbanBoardId: null,
      kanbanTaskId: null,
      rightPanelMode: 'stats',
    };
    this.els.modalHost.innerHTML = '';
    this.refresh();
    showToast('Se eliminaron los datos del navegador. Tienes un workspace vacío.', 'success');
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
    this.state.view = 'library';
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
    const { createChapter, createScene } = await import('./domain/models.js');
    const data = await this.loadTemplateData();
    const tpl = data.templates.find((/** @type {any} */ t) => t.id === templateId);
    if (!tpl) return;
    const ap = this.workspace.authorProfile || createEmptyAuthorProfile();
    const authorName = String(ap.name || '').trim();
    const book = createEmptyBook({
      name: `${tpl.name} — nuevo`,
      wordGoal: tpl.wordGoal || 50000,
      ...(authorName ? { author: authorName } : {}),
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
    if (!this.workspace.authorProfile) {
      this.workspace.authorProfile = createEmptyAuthorProfile();
    }
    configureAutosaveDelay(getAutosaveMs());
    this.els = mountShell(root, this);
    setSaveStatusCallback((status) => {
      if (this.els) setSaveBadge(this.els.saveStatus, status);
      if (status === 'error') showToast('Error al guardar los datos', 'error');
    });

    this.refresh();
  }
}

const app = new App();
app.init();
