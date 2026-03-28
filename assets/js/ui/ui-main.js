/**
 * Enrutado principal, bindings y panel central — Narrative Lab
 */

import {
  createChapter,
  createScene,
  createCharacter,
  createEvent,
  createNote,
  createSnapshot,
  createAct,
  createExtraBlock,
  createWorldRule,
  createEmptyAuthorProfile,
} from '../domain/models.js';
import { configureAutosaveDelay } from '../domain/storage.js';
import {
  exportReminderSummaryLine,
  getAutosaveMs,
  setAutosaveMs,
  setDashboardBookFilter,
  setProgressMode,
  setSpellcheckEnabled,
  setSnapshotIntervalMinutes,
} from '../domain/prefs.js';
import { escapeHtml, sortByOrder } from '../core/utils.js';
import {
  linkCharacterToChapter,
  linkCharacterToScene,
  linkEventToEvent,
  linkCharacterToCharacter,
  removeRelationship,
} from '../narrative/relations.js';
import { showToast } from './toast.js';
import { renderClearWorkspaceModal, showCharacterRenameModal } from './ui-modals.js';
import {
  renderSidebar,
  renderRightPanel,
  applyRightPanelLayout,
  updateHeaderBookToolsVisibility,
} from './ui-shell.js';
import {
  wrapEditorSection,
  renderBookSettings,
  renderChaptersList,
  renderChapterEditor,
  renderSceneEditor,
  renderCharacterList,
  renderCharacterForm,
  renderTimelineMerged,
  renderExtrasList,
  renderExtraEditor,
  renderActsList,
  renderActEditor,
  renderAppSettingsPanel,
  renderNotesList,
  renderNoteEditor,
  renderHighlightsList,
  renderHighlightEditor,
  renderAnalysisPanel,
  renderGraphHost,
  renderSnapshots,
  renderRelations,
  renderExportPanel,
  renderWritingGuide,
  renderKanbanList,
  renderKanbanBoardView,
} from './ui-views.js';
import { bindKanbanBoard, bindKanbanList } from './views/kanban.js';
import { renderLibraryDashboard } from './views/library-dashboard.js';
import { renderAuthorProfileForm } from './views/author-profile.js';
import { renderWorldRulesList, renderWorldRuleEditor } from './views/world-rules.js';
import { NOVEL_CATEGORY_OTHER } from '../domain/book-categories.js';
import { parseCommaSeparatedTokens, computeCharacterRenamePairs } from '../domain/character-rename-pairs.js';
import { applyReplacementsToBook } from '../narrative/book-html-replace.js';
import { formatCharacterDisplayName } from '../domain/character-display.js';
import { isoDateToDisplay, displayDateToIso } from '../core/date-format.js';

/**
 * @param {HTMLElement} main
 * @param {string} field
 */
function gv(main, field) {
  const el = main.querySelector(`[data-f="${field}"]`);
  return el && 'value' in el ? String(/** @type {HTMLInputElement} */ (el).value) : '';
}

/**
 * Repinta el panel derecho y sincroniza ancho / visibilidad del header con el libro y la vista.
 * @param {import('../app.js').App} app
 */
function rerenderRightPanelChrome(app) {
  renderRightPanel(app);
  applyRightPanelLayout(app);
  updateHeaderBookToolsVisibility(app);
}

/**
 * Aplica al acto el título, descripción y asignación de capítulos desde el formulario.
 * @param {import('../core/types.js').Book} book
 * @param {import('../core/types.js').Act} act
 * @param {HTMLElement} main
 */
function syncActFromForm(book, act, main) {
  const titleEl = main.querySelector(`[data-act-title="${act.id}"]`);
  const descEl = main.querySelector(`[data-act-desc="${act.id}"]`);
  if (titleEl && 'value' in titleEl) act.title = String(/** @type {HTMLInputElement} */ (titleEl).value);
  if (descEl && 'value' in descEl) act.description = String(/** @type {HTMLTextAreaElement} */ (descEl).value);
  for (const ch of sortByOrder(book.chapters || [], 'order')) {
    const cb = main.querySelector(`input[data-act-ch="${act.id}"][data-ch-id="${ch.id}"]`);
    const checked = !!(cb && /** @type {HTMLInputElement} */ (cb).checked);
    for (const other of book.acts || []) {
      if (other.id === act.id) continue;
      other.chapterIds = (other.chapterIds || []).filter((id) => id !== ch.id);
    }
    if (!act.chapterIds) act.chapterIds = [];
    if (checked) {
      if (!act.chapterIds.includes(ch.id)) act.chapterIds.push(ch.id);
    } else {
      act.chapterIds = act.chapterIds.filter((id) => id !== ch.id);
    }
  }
}

/**
 * @param {HTMLElement} main
 * @returns {import('../domain/character-rename-pairs.js').CharacterIdentitySlice & Record<string, string>}
 */
function readCharacterFormValues(main) {
  const nickRaw = gv(main, 'nicknames');
  const nick = parseCommaSeparatedTokens(nickRaw).join(', ');
  return {
    name: gv(main, 'name').trim(),
    paternalSurname: gv(main, 'paternalSurname').trim(),
    maternalSurname: gv(main, 'maternalSurname').trim(),
    nicknames: nick,
    likes: gv(main, 'likes'),
    dislikes: gv(main, 'dislikes'),
    birthPlace: gv(main, 'birthPlace').trim(),
    birthDate: gv(main, 'birthDate').trim(),
    deathDate: gv(main, 'deathDate').trim(),
    role: gv(main, 'role'),
    age: gv(main, 'age'),
    description: gv(main, 'description'),
    personality: gv(main, 'personality'),
    goals: gv(main, 'goals'),
    conflicts: gv(main, 'conflicts'),
    narrativeArc: gv(main, 'narrativeArc'),
  };
}

/**
 * @param {import('../core/types.js').Character} ch
 * @param {ReturnType<typeof readCharacterFormValues>} v
 */
function applyCharacterFormValues(ch, v) {
  ch.name = v.name;
  ch.paternalSurname = v.paternalSurname;
  ch.maternalSurname = v.maternalSurname;
  ch.nicknames = v.nicknames;
  ch.likes = v.likes;
  ch.dislikes = v.dislikes;
  ch.birthPlace = v.birthPlace;
  ch.birthDate = v.birthDate;
  ch.deathDate = v.deathDate;
  ch.role = /** @type {import('../core/types.js').Character['role']} */ (v.role);
  ch.age = v.age;
  ch.description = v.description;
  ch.personality = v.personality;
  ch.goals = v.goals;
  ch.conflicts = v.conflicts;
  ch.narrativeArc = v.narrativeArc;
}

/**
 * Aplica al modelo los campos del formulario de personaje (evita perder texto al subir imagen o re-renderizar).
 * @param {HTMLElement} main
 * @param {import('../core/types.js').Character} ch
 */
function syncCharacterFormToModel(main, ch) {
  applyCharacterFormValues(ch, readCharacterFormValues(main));
}

/**
 * @param {HTMLElement} main
 */
function bindCharacterTextareaAutosize(main) {
  main.querySelectorAll('textarea.nl-textarea-autosize').forEach((el) => {
    const ta = /** @type {HTMLTextAreaElement} */ (el);
    const resize = () => {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 384)}px`;
    };
    resize();
    ta.addEventListener('input', resize);
  });
}

/**
 * @param {HTMLElement} main
 * @param {import('../app.js').App} app
 */
function bindBookSettings(main, app) {
  main.querySelector('[data-cover-file]')?.addEventListener('change', async (e) => {
    const book = app.getCurrentBook();
    const f = /** @type {HTMLInputElement} */ (e.target).files?.[0];
    if (!book || !f) return;
    const { readFileAsDataUrl } = await import('../core/utils.js');
    try {
      book.coverImageDataUrl = await readFileAsDataUrl(f);
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
      renderSidebar(app);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  });
  main.querySelector('[data-cover-zoom]')?.addEventListener('click', () => {
    const book = app.getCurrentBook();
    if (!book?.coverImageDataUrl) return;
    import('./ui-modals.js').then(({ renderImageLightbox }) => {
      renderImageLightbox(app, book.coverImageDataUrl, 'Carátula');
    });
  });
  main.querySelector('[data-go-author-profile]')?.addEventListener('click', () => app.openAuthorProfile());
  main.querySelector('[data-f="category-sel"]')?.addEventListener('change', (e) => {
    const v = /** @type {HTMLSelectElement} */ (e.target).value;
    const customEl = main.querySelector('[data-f="category-custom"]');
    if (customEl) customEl.classList.toggle('hidden', v !== NOVEL_CATEGORY_OTHER);
  });
  main.querySelector('[data-save-meta]')?.addEventListener('click', () => {
    const book = app.getCurrentBook();
    if (!book || !app.workspace) return;
    const ap = app.workspace.authorProfile || createEmptyAuthorProfile();
    book.name = gv(main, 'name');
    book.author = String(ap.name || '').trim();
    if (book.createdAt) book.date = book.createdAt.slice(0, 10);
    const catSel = gv(main, 'category-sel');
    const catCustom = gv(main, 'category-custom').trim();
    book.category = catSel === NOVEL_CATEGORY_OTHER ? catCustom : catSel;
    book.narratorType = gv(main, 'narratorType');
    book.status = gv(main, 'status');
    book.wordGoal = parseInt(gv(main, 'wordGoal'), 10) || 0;
    app.persist();
    const goSynopsis = app.state.afterNewBookMeta;
    app.state.afterNewBookMeta = false;
    renderSidebar(app);
    rerenderRightPanelChrome(app);
    if (goSynopsis) app.setView('synopsis');
  });
}

/**
 * @param {HTMLElement} main
 * @param {import('../app.js').App} app
 */
function bindAuthorProfilePanel(main, app) {
  const ws = app.workspace;
  if (!ws) return;
  if (!ws.authorProfile) ws.authorProfile = createEmptyAuthorProfile();
  main.querySelector('[data-author-photo]')?.addEventListener('change', async (e) => {
    const f = /** @type {HTMLInputElement} */ (e.target).files?.[0];
    if (!f || !ws.authorProfile) return;
    const { readFileAsDataUrl } = await import('../core/utils.js');
    try {
      ws.authorProfile.imageDataUrl = await readFileAsDataUrl(f);
      app.persist();
      app.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  });
  main.querySelector('[data-save-author]')?.addEventListener('click', () => {
    if (!ws.authorProfile) return;
    ws.authorProfile.name = gv(main, 'author-name');
    ws.authorProfile.birthDate = gv(main, 'author-birth');
    ws.authorProfile.bio = gv(main, 'author-bio');
    app.persist();
    app.refresh();
  });
}


/**
 * @param {HTMLElement} main
 * @param {import('../core/types.js').Book} book
 * @param {import('../app.js').App} app
 */
function bindChaptersDnD(main, book, app) {
  main.querySelector('[data-add-ch]')?.addEventListener('click', () => {
    const ch = createChapter({ order: book.chapters.length });
    book.chapters.push(ch);
    app.persist();
    app.state.chapterId = ch.id;
    app.setView('chapter');
  });
  main.querySelectorAll('[data-open-ch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-ch');
      if (id) {
        app.state.chapterId = id;
        app.setView('chapter');
      }
    });
  });
  main.querySelectorAll('[data-del-ch]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-del-ch');
      if (id) app.deleteChapterById(id);
    });
  });

  const list = main.querySelector('[data-ch-list]');
  if (!list) return;
  let dragId = null;
  list.querySelectorAll('li[draggable]').forEach((li) => {
    li.addEventListener('dragstart', (e) => {
      dragId = li.getAttribute('data-ch-id');
      e.dataTransfer?.setData('text/plain', dragId || '');
    });
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetId = li.getAttribute('data-ch-id');
      if (!dragId || !targetId || dragId === targetId) return;
      const chapters = sortByOrder(book.chapters, 'order');
      const from = chapters.findIndex((c) => c.id === dragId);
      const to = chapters.findIndex((c) => c.id === targetId);
      if (from < 0 || to < 0) return;
      const [moved] = chapters.splice(from, 1);
      chapters.splice(to, 0, moved);
      chapters.forEach((c, i) => {
        c.order = i;
      });
      book.chapters = chapters;
      app.persist();
      renderMain(app);
      renderSidebar(app);
      bindMainInteractions(app);
    });
  });
}

/**
 * @param {HTMLElement} main
 * @param {import('../core/types.js').Book} book
 * @param {import('../core/types.js').Chapter} ch
 * @param {import('../app.js').App} app
 */
function bindChapterSceneDnD(main, book, ch, app) {
  main.querySelector('[data-back-ch]')?.addEventListener('click', () => app.setView('chapters'));
  const title = main.querySelector('[data-ch-title]');
  title?.addEventListener('change', () => {
    ch.title = /** @type {HTMLInputElement} */ (title).value;
    app.persist();
    renderSidebar(app);
  });
  const goal = main.querySelector('[data-ch-goal]');
  goal?.addEventListener('change', () => {
    ch.chapterGoal = /** @type {HTMLTextAreaElement} */ (goal).value;
    app.persist();
  });
  main.querySelector('[data-add-sc]')?.addEventListener('click', () => {
    const sc = createScene({ order: ch.scenes.length });
    ch.scenes.push(sc);
    app.persist();
    app.state.sceneId = sc.id;
    app.setView('scene');
  });
  main.querySelectorAll('[data-open-sc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-sc');
      if (id) {
        app.state.sceneId = id;
        app.setView('scene');
      }
    });
  });
  main.querySelectorAll('[data-del-sc]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sid = btn.getAttribute('data-del-sc');
      if (sid) app.deleteSceneById(ch.id, sid);
    });
  });

  const list = main.querySelector('[data-sc-list]');
  if (!list) return;
  let dragId = null;
  list.querySelectorAll('li[draggable]').forEach((li) => {
    li.addEventListener('dragstart', (e) => {
      dragId = li.getAttribute('data-sc-id');
      e.dataTransfer?.setData('text/plain', dragId || '');
    });
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetId = li.getAttribute('data-sc-id');
      if (!dragId || !targetId || dragId === targetId) return;
      const scenes = sortByOrder(ch.scenes, 'order');
      const from = scenes.findIndex((s) => s.id === dragId);
      const to = scenes.findIndex((s) => s.id === targetId);
      if (from < 0 || to < 0) return;
      const [moved] = scenes.splice(from, 1);
      scenes.splice(to, 0, moved);
      scenes.forEach((s, i) => {
        s.order = i;
      });
      ch.scenes = scenes;
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
    });
  });
}

/**
 * @param {HTMLElement} main
 * @param {import('../app.js').App} app
 */
function bindAppSettingsPanel(main, app) {
  const lastExportEl = main.querySelector('[data-last-export-label]');
  if (lastExportEl) lastExportEl.textContent = exportReminderSummaryLine();
  main.querySelector('[data-export-workspace-settings]')?.addEventListener('click', () => {
    app.exportWorkspace();
    if (lastExportEl) lastExportEl.textContent = exportReminderSummaryLine();
  });
  main.querySelector('[data-open-clear-workspace-modal]')?.addEventListener('click', () => {
    renderClearWorkspaceModal(app);
  });
  main.querySelector('[data-save-app-settings]')?.addEventListener('click', () => {
    const sel = /** @type {HTMLSelectElement|null} */ (main.querySelector('[data-app-autosave]'));
    const ms = sel ? parseInt(sel.value, 10) : 4000;
    setAutosaveMs(ms);
    configureAutosaveDelay(getAutosaveMs());
    const prog = main.querySelector('[data-prog-mode]:checked');
    const mode = prog && 'value' in prog ? String(/** @type {HTMLInputElement} */ (prog).value) : 'boundary';
    setProgressMode(mode === 'debounce' ? 'debounce' : 'boundary');
    const sc = /** @type {HTMLInputElement|null} */ (main.querySelector('[data-app-spellcheck]'));
    setSpellcheckEnabled(!!sc?.checked);
    const snapSel = /** @type {HTMLSelectElement|null} */ (main.querySelector('[data-app-snapshot-interval]'));
    if (snapSel) setSnapshotIntervalMinutes(parseInt(snapSel.value, 10) || 0);
    showToast('Ajustes guardados correctamente', 'success');
    app.refresh();
  });
}

export function renderMain(app) {
  const { main } = app.els;
  app.disposeEditor();

  if (app.state.view === 'writingGuide') {
    main.innerHTML = renderWritingGuide(app);
    return;
  }

  if (app.state.view === 'authorProfile') {
    const ws = app.workspace;
    if (!ws) return;
    const prof = ws.authorProfile || createEmptyAuthorProfile();
    main.innerHTML = renderAuthorProfileForm(prof);
    bindAuthorProfilePanel(main, app);
    return;
  }

  const book = app.getCurrentBook();
  if (!book) {
    if (app.state.view === 'appSettings') {
      main.innerHTML = renderAppSettingsPanel();
      bindAppSettingsPanel(main, app);
      return;
    }
    main.innerHTML = renderLibraryDashboard(app);
    return;
  }

  const v = app.state.view;
  if (v === 'settings') {
    main.innerHTML = renderBookSettings(book);
    bindBookSettings(main, app);
    return;
  }
  if (v === 'synopsis') {
    main.innerHTML = wrapEditorSection('Sinopsis', 'synopsis');
    app.attachEditor(main.querySelector('[data-ed]'), 'synopsis', null);
    return;
  }
  if (v === 'historicalContext') {
    main.innerHTML = wrapEditorSection('Contexto', 'historicalContext');
    app.attachEditor(main.querySelector('[data-ed]'), 'historicalContext', null);
    return;
  }
  if (v === 'worldRules') {
    if (app.state.worldRuleId) {
      const rule = book.rules?.find((x) => x.id === app.state.worldRuleId);
      if (!rule) {
        app.state.worldRuleId = null;
        app.refresh();
        return;
      }
      main.innerHTML = renderWorldRuleEditor(rule);
      app.attachEditor(main.querySelector('[data-ed-world-rule]'), 'worldRule', rule.id);
      return;
    }
    main.innerHTML = renderWorldRulesList(book);
    return;
  }
  if (v === 'prologue') {
    main.innerHTML = wrapEditorSection('Prólogo', 'prologue');
    app.attachEditor(main.querySelector('[data-ed]'), 'prologue', null);
    return;
  }
  if (v === 'epilogue') {
    main.innerHTML = wrapEditorSection('Epílogo', 'epilogue');
    app.attachEditor(main.querySelector('[data-ed]'), 'epilogue', null);
    return;
  }
  if (v === 'extras') {
    if (app.state.extraId) {
      const eb = book.extraBlocks?.find((x) => x.id === app.state.extraId);
      if (!eb) {
        app.state.extraId = null;
        app.refresh();
        return;
      }
      main.innerHTML = renderExtraEditor(book, eb);
      app.attachEditor(main.querySelector('[data-ed-extra]'), 'extra', eb.id);
      return;
    }
    main.innerHTML = renderExtrasList(book);
    return;
  }
  if (v === 'acts') {
    if (app.state.actId) {
      const act = book.acts?.find((a) => a.id === app.state.actId);
      if (!act) {
        app.state.actId = null;
        app.refresh();
        return;
      }
      main.innerHTML = renderActEditor(book, act);
      return;
    }
    main.innerHTML = renderActsList(book);
    return;
  }
  if (v === 'appSettings') {
    main.innerHTML = renderAppSettingsPanel();
    bindAppSettingsPanel(main, app);
    return;
  }
  if (v === 'chapters') {
    main.innerHTML = renderChaptersList(book, app);
    bindChaptersDnD(main, book, app);
    return;
  }
  if (v === 'chapter' && app.state.chapterId) {
    const ch = book.chapters.find((c) => c.id === app.state.chapterId);
    if (!ch) {
      app.setView('chapters');
      return;
    }
    main.innerHTML = renderChapterEditor(ch);
    app.attachEditor(main.querySelector('[data-ed-chapter]'), 'chapter', ch.id);
    bindChapterSceneDnD(main, book, ch, app);
    return;
  }
  if (v === 'scene' && app.state.chapterId && app.state.sceneId) {
    const ch = book.chapters.find((c) => c.id === app.state.chapterId);
    const sc = ch?.scenes.find((s) => s.id === app.state.sceneId);
    if (!ch || !sc) {
      app.setView('chapters');
      return;
    }
    main.innerHTML = renderSceneEditor(ch, sc);
    app.attachEditor(main.querySelector('[data-ed-scene]'), 'scene', sc.id, ch.id);
    return;
  }
  if (v === 'characters') {
    main.innerHTML = renderCharacterList(book, app);
    return;
  }
  if (v === 'character' && app.state.characterId) {
    const ch = book.characters.find((c) => c.id === app.state.characterId);
    if (!ch) {
      app.setView('characters');
      return;
    }
    main.innerHTML = renderCharacterForm(book, ch, app);
    return;
  }
  if (v === 'timeline') {
    main.innerHTML = renderTimelineMerged(book, app);
    return;
  }
  if (v === 'notes') {
    main.innerHTML = renderNotesList(book, app);
    return;
  }
  if (v === 'note' && app.state.noteId) {
    const note = book.notes.find((n) => n.id === app.state.noteId);
    if (!note) {
      app.setView('notes');
      return;
    }
    main.innerHTML = renderNoteEditor(note, app);
    app.attachEditor(main.querySelector('[data-ed-note]'), 'note', note.id);
    return;
  }
  if (v === 'highlights') {
    if (app.state.highlightId) {
      const hl = book.highlights?.find((x) => x.id === app.state.highlightId);
      if (!hl) {
        app.state.highlightId = null;
        app.refresh();
        return;
      }
      main.innerHTML = renderHighlightEditor(book, hl);
      return;
    }
    main.innerHTML = renderHighlightsList(book);
    return;
  }
  if (v === 'analysis') {
    main.innerHTML = renderAnalysisPanel(book);
    return;
  }
  if (v === 'graph') {
    main.innerHTML = renderGraphHost(book, app);
    return;
  }
  if (v === 'snapshots') {
    main.innerHTML = renderSnapshots(book, app);
    return;
  }
  if (v === 'relations') {
    main.innerHTML = renderRelations(book, app);
    return;
  }
  if (v === 'export') {
    main.innerHTML = renderExportPanel(book, app);
    return;
  }
  if (v === 'kanban') {
    if (!book.kanbanBoards) book.kanbanBoards = [];
    main.innerHTML = renderKanbanList(book, app);
    return;
  }
  if (v === 'kanbanBoard') {
    if (!app.state.kanbanBoardId) {
      app.setView('kanban');
      return;
    }
    const kb = book.kanbanBoards?.find((b) => b.id === app.state.kanbanBoardId);
    if (!kb) {
      app.state.kanbanBoardId = null;
      app.state.kanbanTaskId = null;
      app.setView('kanban');
      return;
    }
    main.innerHTML = renderKanbanBoardView(book, kb, app);
    return;
  }

  main.innerHTML = `<div class="p-8 text-nl-muted">Vista no disponible.</div>`;
}
export function bindMainInteractions(app) {
  const main = app.els.main;
  if (app.state.view === 'writingGuide') {
    main.querySelector('[data-guide-back]')?.addEventListener('click', () => app.openWritingGuide(null));
    main.querySelectorAll('[data-guide-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gid = btn.getAttribute('data-guide-open');
        if (gid) app.openWritingGuide(gid);
      });
    });
    return;
  }

  if (app.state.view === 'authorProfile') {
    bindAuthorProfilePanel(main, app);
    return;
  }

  const book = app.getCurrentBook();
  if (!book) {
    if (app.state.view === 'appSettings') {
      // Los bindings ya se aplican en renderMain (evita doble listener en el botón de exportar).
      return;
    }
    main.querySelectorAll('[data-lib-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-lib-open');
        if (id) app.openBook(id);
      });
    });
    main.querySelectorAll('[data-dash-mode]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        const mode = radio.getAttribute('data-dash-mode');
        const wrap = main.querySelector('[data-dash-subset-wrap]');
        if (wrap) wrap.classList.toggle('hidden', mode !== 'subset');
        if (mode === 'all') {
          setDashboardBookFilter('all');
        } else {
          const picked = [...main.querySelectorAll('[data-dash-book]:checked')]
            .map((el) => el.getAttribute('data-dash-book'))
            .filter(Boolean);
          const fallback = app.workspace?.books?.map((b) => b.id) ?? [];
          setDashboardBookFilter('subset', picked.length ? picked : fallback);
        }
        app.refresh();
      });
    });
    main.querySelectorAll('[data-dash-book]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const ids = [...main.querySelectorAll('[data-dash-book]:checked')]
          .map((el) => el.getAttribute('data-dash-book'))
          .filter(Boolean);
        setDashboardBookFilter('subset', ids);
        app.refresh();
      });
    });
    return;
  }

  if (app.state.view === 'characters') {
    main.querySelector('[data-add-char]')?.addEventListener('click', () => {
      const c = createCharacter({ name: 'Nuevo personaje' });
      book.characters.push(c);
      app.persist();
      app.state.characterId = c.id;
      app.setView('character');
    });
    main.querySelectorAll('[data-open-char]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-char');
        if (id) {
          app.state.characterId = id;
          app.setView('character');
        }
      });
    });
    main.querySelectorAll('[data-del-char]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-char');
        if (id) app.deleteCharacterById(id);
      });
    });
    main.querySelector('[data-all-chars-pdf]')?.addEventListener('click', async () => {
      const mod = await import('../narrative/export.js');
      mod.exportAllCharactersPdfPrint(book);
    });
  }

  if (app.state.view === 'character' && app.state.characterId) {
    const ch = book.characters.find((c) => c.id === app.state.characterId);
    if (!ch) return;
    app.state.characterIdentitySnapshot = {
      characterId: ch.id,
      name: ch.name || '',
      paternalSurname: ch.paternalSurname || '',
      maternalSurname: ch.maternalSurname || '',
      nicknames: ch.nicknames || '',
    };
    bindCharacterTextareaAutosize(main);
    const displayName = formatCharacterDisplayName(ch);
    main.querySelector('[data-char-img]')?.addEventListener('click', () => {
      if (!ch.imageDataUrl) return;
      import('./ui-modals.js').then(({ renderImageLightbox }) => {
        renderImageLightbox(app, ch.imageDataUrl, displayName);
      });
    });
    main.querySelector('[data-char-img-zoom]')?.addEventListener('click', () => {
      if (!ch.imageDataUrl) return;
      import('./ui-modals.js').then(({ renderImageLightbox }) => {
        renderImageLightbox(app, ch.imageDataUrl, displayName);
      });
    });
    main.querySelector('[data-cc-add]')?.addEventListener('click', () => {
      syncCharacterFormToModel(main, ch);
      const other = /** @type {HTMLSelectElement|null} */ (main.querySelector('[data-cc-other]'))?.value;
      const role = /** @type {HTMLSelectElement|null} */ (main.querySelector('[data-cc-role]'))?.value;
      const desc = /** @type {HTMLTextAreaElement|null} */ (main.querySelector('[data-cc-desc]'))?.value || '';
      if (!other || other === ch.id) return;
      if (!role) {
        showToast('Elige un tipo de vínculo', 'warning');
        return;
      }
      linkCharacterToCharacter(book, ch.id, other, { role, description: desc });
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
    });
    main.querySelectorAll('[data-cc-del-rel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rid = btn.getAttribute('data-cc-del-rel');
        if (rid) {
          removeRelationship(book, rid);
          app.persist();
          renderMain(app);
          bindMainInteractions(app);
        }
      });
    });
    main.querySelector('[data-back-char]')?.addEventListener('click', () => {
      app.setView('characters');
    });
    main.querySelector('[data-char-file]')?.addEventListener('change', async (e) => {
      const f = /** @type {HTMLInputElement} */ (e.target).files?.[0];
      if (!f) return;
      const { readFileAsDataUrl } = await import('../core/utils.js');
      try {
        syncCharacterFormToModel(main, ch);
        ch.imageDataUrl = await readFileAsDataUrl(f);
        app.persist();
        renderMain(app);
        bindMainInteractions(app);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error');
      }
    });
    main.querySelector('[data-save-char]')?.addEventListener('click', async () => {
      const pending = readCharacterFormValues(main);
      const snap = app.state.characterIdentitySnapshot;
      const identityPairs =
        snap && snap.characterId === ch.id
          ? computeCharacterRenamePairs(
              {
                name: snap.name,
                paternalSurname: snap.paternalSurname,
                maternalSurname: snap.maternalSurname,
                nicknames: snap.nicknames,
              },
              {
                name: pending.name,
                paternalSurname: pending.paternalSurname,
                maternalSurname: pending.maternalSurname,
                nicknames: pending.nicknames,
              }
            )
          : [];
      if (identityPairs.length > 0) {
        const res = await showCharacterRenameModal(app, identityPairs);
        if (res === 'cancel') return;
        if (typeof res === 'object' && res.applyPairs?.length) {
          applyReplacementsToBook(book, res.applyPairs);
        }
      }
      applyCharacterFormValues(ch, pending);
      app.persist();
      app.setView('characters');
    });
    main.querySelector('[data-char-pdf]')?.addEventListener('click', async () => {
      const mod = await import('../narrative/export.js');
      mod.exportCharacterPdfPrint(book, ch.id);
    });
  }

  if (app.state.view === 'timeline') {
    if (!book.events) book.events = [];
    main.querySelector('[data-add-ev]')?.addEventListener('click', () => {
      const ev = createEvent({ title: 'Nuevo evento', sortKey: book.events.length });
      book.events.push(ev);
      app.state.timelineEventId = ev.id;
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelectorAll('[data-timeline-ev]').forEach((el) => {
      const id = el.getAttribute('data-timeline-ev');
      if (!id) return;
      el.addEventListener('click', () => {
        app.state.timelineEventId = id;
        renderMain(app);
        bindMainInteractions(app);
      });
      el.addEventListener('dragstart', (e) => {
        const dt = /** @type {DataTransfer} */ (e.dataTransfer);
        if (dt) {
          dt.setData('text/plain', id);
          dt.effectAllowed = 'move';
        }
      });
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dt = /** @type {DataTransfer} */ (e.dataTransfer);
        if (dt) dt.dropEffect = 'move';
      });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer?.getData('text/plain');
        const toId = id;
        if (!fromId || fromId === toId) return;
        const evs = sortByOrder((book.events || []).slice(), 'sortKey');
        const fromIdx = evs.findIndex((x) => x.id === fromId);
        const toIdx = evs.findIndex((x) => x.id === toId);
        if (fromIdx < 0 || toIdx < 0) return;
        const [moved] = evs.splice(fromIdx, 1);
        evs.splice(toIdx, 0, moved);
        evs.forEach((ev, i) => {
          ev.sortKey = i;
        });
        book.events = evs;
        app.persist();
        renderMain(app);
        bindMainInteractions(app);
        rerenderRightPanelChrome(app);
      });
    });
    const selId = app.state.timelineEventId;
    if (selId) {
      const ev = book.events.find((e) => e.id === selId);
      if (ev) {
        const dateIn = /** @type {HTMLInputElement|null} */ (main.querySelector(`[data-ev-date="${ev.id}"]`));
        if (dateIn) {
          const iso = displayDateToIso(ev.dateLabel || '');
          dateIn.value = iso || '';
        }
        main.querySelector(`[data-save-ev="${ev.id}"]`)?.addEventListener('click', () => {
          ev.title = /** @type {HTMLInputElement} */ (main.querySelector(`[data-ev-title="${ev.id}"]`)).value;
          const dateEl = /** @type {HTMLInputElement} */ (main.querySelector(`[data-ev-date="${ev.id}"]`));
          const raw = dateEl?.value || '';
          ev.dateLabel = raw ? isoDateToDisplay(raw) : '';
          const sk = parseInt(
            String(/** @type {HTMLInputElement} */ (main.querySelector(`[data-ev-sort="${ev.id}"]`)).value),
            10
          );
          ev.sortKey = Number.isNaN(sk) ? ev.sortKey : sk;
          ev.content = /** @type {HTMLTextAreaElement} */ (main.querySelector(`[data-ev-body="${ev.id}"]`)).value;
          app.state.timelineEventId = null;
          app.persist();
          app.refresh();
        });
        main.querySelector(`[data-del-ev="${ev.id}"]`)?.addEventListener('click', () => {
          app.deleteEventById(ev.id);
        });
      }
    }
  }

  if (app.state.view === 'extras' && !app.state.extraId) {
    main.querySelector('[data-add-extra]')?.addEventListener('click', () => {
      const eb = createExtraBlock({ title: 'Nuevo extra' });
      if (!book.extraBlocks) book.extraBlocks = [];
      book.extraBlocks.push(eb);
      app.persist();
      app.openExtraEditor(eb.id);
    });
    main.querySelectorAll('[data-open-extra]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-extra');
        if (id) app.openExtraEditor(id);
      });
    });
    main.querySelectorAll('[data-del-extra]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-extra');
        if (id) app.deleteExtraBlockById(id);
      });
    });
  }

  if (app.state.view === 'extras' && app.state.extraId) {
    const eb = book.extraBlocks?.find((x) => x.id === app.state.extraId);
    if (eb) {
      main.querySelector('[data-back-extras]')?.addEventListener('click', () => {
        app.state.extraId = null;
        app.refresh();
      });
      main.querySelector('[data-extra-title]')?.addEventListener('change', (e) => {
        eb.title = /** @type {HTMLInputElement} */ (e.target).value;
        app.persist();
        renderSidebar(app);
      });
      main.querySelector('[data-save-extra]')?.addEventListener('click', () => {
        app.persist();
        app.state.extraId = null;
        app.refresh();
      });
      main.querySelector('[data-del-extra-editor]')?.addEventListener('click', () => {
        app.deleteExtraBlockById(eb.id);
      });
    }
  }

  if (app.state.view === 'worldRules' && !app.state.worldRuleId) {
    if (!book.rules) book.rules = [];
    main.querySelector('[data-add-world-rule]')?.addEventListener('click', () => {
      const r = createWorldRule({ title: 'Nueva regla' });
      book.rules.push(r);
      app.persist();
      app.openWorldRuleEditor(r.id);
    });
    main.querySelectorAll('[data-open-world-rule]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-world-rule');
        if (id) app.openWorldRuleEditor(id);
      });
    });
    main.querySelectorAll('[data-del-world-rule]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-world-rule');
        if (id) app.deleteWorldRuleById(id);
      });
    });
  }

  if (app.state.view === 'worldRules' && app.state.worldRuleId) {
    const rule = book.rules?.find((x) => x.id === app.state.worldRuleId);
    if (rule) {
      main.querySelector('[data-back-world-rules]')?.addEventListener('click', () => {
        app.state.worldRuleId = null;
        app.refresh();
      });
      main.querySelector('[data-world-rule-title]')?.addEventListener('change', (e) => {
        rule.title = /** @type {HTMLInputElement} */ (e.target).value;
        app.persist();
        renderSidebar(app);
      });
      main.querySelector('[data-save-world-rule]')?.addEventListener('click', () => {
        app.persist();
        app.state.worldRuleId = null;
        app.refresh();
      });
      main.querySelector('[data-del-world-rule-editor]')?.addEventListener('click', () => {
        app.deleteWorldRuleById(rule.id);
      });
    }
  }

  if (app.state.view === 'acts' && !app.state.actId) {
    main.querySelector('[data-add-act]')?.addEventListener('click', () => {
      const a = createAct({ order: (book.acts || []).length });
      if (!book.acts) book.acts = [];
      book.acts.push(a);
      app.persist();
      app.openActEditor(a.id);
    });
    main.querySelectorAll('[data-open-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-act');
        if (id) app.openActEditor(id);
      });
    });
    main.querySelectorAll('[data-del-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-act');
        if (!id) return;
        if (!confirm('¿Eliminar este acto? Los capítulos no se borran.')) return;
        book.acts = (book.acts || []).filter((a) => a.id !== id);
        if (app.state.actId === id) app.state.actId = null;
        app.persist();
        app.refresh();
      });
    });
  }

  if (app.state.view === 'acts' && app.state.actId) {
    const act = book.acts?.find((a) => a.id === app.state.actId);
    if (act) {
      main.querySelector('[data-back-acts]')?.addEventListener('click', () => {
        app.state.actId = null;
        app.refresh();
      });
      main.querySelector('[data-save-act]')?.addEventListener('click', () => {
        syncActFromForm(book, act, main);
        app.persist();
        app.state.actId = null;
        app.refresh();
      });
      main.querySelector(`[data-del-act-editor="${act.id}"]`)?.addEventListener('click', () => {
        if (!confirm('¿Eliminar este acto? Los capítulos no se borran.')) return;
        book.acts = (book.acts || []).filter((a) => a.id !== act.id);
        app.state.actId = null;
        app.persist();
        app.refresh();
      });
      main.querySelectorAll(`[data-act-ch="${act.id}"]`).forEach((cb) => {
        cb.addEventListener('change', () => {
          const chId = cb.getAttribute('data-ch-id');
          if (!chId) return;
          const checked = /** @type {HTMLInputElement} */ (cb).checked;
          for (const other of book.acts || []) {
            if (other.id === act.id) continue;
            other.chapterIds = (other.chapterIds || []).filter((id) => id !== chId);
          }
          if (!act.chapterIds) act.chapterIds = [];
          if (checked) {
            if (!act.chapterIds.includes(chId)) act.chapterIds.push(chId);
          } else {
            act.chapterIds = act.chapterIds.filter((id) => id !== chId);
          }
          app.persist();
        });
      });
    }
  }

  if (app.state.view === 'notes') {
    main.querySelector('[data-add-note]')?.addEventListener('click', () => {
      const n = createNote({ title: 'Nueva nota' });
      book.notes.push(n);
      app.persist();
      app.state.noteId = n.id;
      app.setView('note');
    });
    main.querySelectorAll('[data-open-note]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-note');
        if (id) {
          app.state.noteId = id;
          app.setView('note');
        }
      });
    });
    main.querySelectorAll('[data-del-note]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-note');
        if (id) app.deleteNoteById(id);
      });
    });
  }

  if (app.state.view === 'note' && app.state.noteId) {
    const note = book.notes.find((n) => n.id === app.state.noteId);
    if (note) {
      main.querySelector('[data-back-notes]')?.addEventListener('click', () => {
        app.state.noteId = null;
        app.setView('notes');
      });
      main.querySelector('[data-save-note]')?.addEventListener('click', () => {
        app.persist();
        app.state.noteId = null;
        app.setView('notes');
      });
      main.querySelector('[data-note-title]')?.addEventListener('change', (e) => {
        note.title = /** @type {HTMLInputElement} */ (e.target).value;
        app.persist();
      });
    }
  }

  if (app.state.view === 'highlights' && !app.state.highlightId) {
    main.querySelectorAll('[data-open-hl]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-hl');
        if (id) app.openHighlightEditor(id);
      });
    });
    main.querySelectorAll('[data-del-hl]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-hl');
        if (!id) return;
        if (!confirm('¿Eliminar esta frase destacada?')) return;
        book.highlights = book.highlights.filter((x) => x.id !== id);
        app.persist();
        renderMain(app);
        bindMainInteractions(app);
      });
    });
  }

  if (app.state.view === 'highlights' && app.state.highlightId) {
    const hl = book.highlights?.find((x) => x.id === app.state.highlightId);
    if (hl) {
      main.querySelector('[data-back-highlights]')?.addEventListener('click', () => {
        app.state.highlightId = null;
        app.refresh();
      });
      main.querySelector(`[data-save-hl="${hl.id}"]`)?.addEventListener('click', () => {
        const desc = main.querySelector(`[data-hl-desc="${hl.id}"]`);
        const sel = main.querySelector(`[data-hl-char="${hl.id}"]`);
        hl.description = desc && 'value' in desc ? String(/** @type {HTMLTextAreaElement} */ (desc).value) : '';
        hl.characterId = sel && 'value' in sel ? String(/** @type {HTMLSelectElement} */ (sel).value) : '';
        app.persist();
        app.state.highlightId = null;
        app.refresh();
      });
      main.querySelector(`[data-go-hl="${hl.id}"]`)?.addEventListener('click', () => {
        app.openHighlightSource(hl);
      });
      main.querySelector(`[data-del-hl="${hl.id}"]`)?.addEventListener('click', () => {
        if (!confirm('¿Eliminar esta frase destacada?')) return;
        book.highlights = book.highlights.filter((x) => x.id !== hl.id);
        app.state.highlightId = null;
        app.persist();
        app.refresh();
      });
    }
  }

  if (app.state.view === 'snapshots') {
    main.querySelector('[data-save-snap]')?.addEventListener('click', () => {
      const inp = main.querySelector('[data-snap-label]');
      const label = inp && 'value' in inp ? String(/** @type {HTMLInputElement} */(inp).value) : 'Snapshot';
      const snap = createSnapshot(label || 'Snapshot', book);
      book.snapshots.unshift(snap);
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
    });
    main.querySelectorAll('[data-snap-label-edit]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const id = el.getAttribute('data-snap-label-edit');
        const s = id ? book.snapshots.find((x) => x.id === id) : undefined;
        if (!s) return;
        const v = String(/** @type {HTMLInputElement} */(e.target).value).trim();
        s.label = v || 'Snapshot';
        app.persist();
      });
    });
    main.querySelectorAll('[data-del-snap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-snap');
        if (!id) return;
        if (!confirm('¿Eliminar este snapshot? Esta acción no se puede deshacer.')) return;
        book.snapshots = book.snapshots.filter((x) => x.id !== id);
        app.persist();
        renderMain(app);
        bindMainInteractions(app);
      });
    });
    main.querySelectorAll('[data-restore]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-restore');
        const s = book.snapshots.find((x) => x.id === id);
        if (!s) return;
        if (!confirm('¿Restaurar esta versión? Se sobrescribirá el libro actual.')) return;
        const idx = app.workspace.books.findIndex((b) => b.id === book.id);
        if (idx >= 0) {
          app.workspace.books[idx] = deepCloneBook(s.payload);
          app.persist();
          app.refresh();
        }
      });
    });
    main.querySelector('[data-snap-compare]')?.addEventListener('click', async () => {
      const idA = /** @type {HTMLSelectElement} */ (main.querySelector('[data-snap-diff-a]'))?.value;
      const idB = /** @type {HTMLSelectElement} */ (main.querySelector('[data-snap-diff-b]'))?.value;
      if (!idA || !idB || idA === idB) {
        alert('Elige dos snapshots distintos.');
        return;
      }
      const sa = book.snapshots.find((x) => x.id === idA);
      const sb = book.snapshots.find((x) => x.id === idB);
      if (!sa || !sb) return;
      const { diffBookPayloads } = await import('../narrative/snapshot-diff.js');
      const d = diffBookPayloads(sa.payload, sb.payload);
      const out = main.querySelector('[data-snap-diff-result]');
      if (!out) return;
      out.classList.remove('hidden');
      const titleForChapterId = (chid) => {
        const ch = book.chapters.find((c) => c.id === chid);
        return ch ? ch.title : chid;
      };
      const chapterLines = d.changedChapters
        .map((id) => `<li>${escapeHtml(titleForChapterId(id))} <span class="text-nl-muted">(${escapeHtml(id)})</span></li>`)
        .join('');
      const sign = (n) => (n >= 0 ? `+${n}` : String(n));
      out.innerHTML = `
        <p><strong class="text-slate-200">Δ palabras:</strong> ${sign(d.deltaWords)}</p>
        <p><strong class="text-slate-200">Estructura:</strong> capítulos ${sign(d.deltaChapters)}, escenas ${sign(d.deltaScenes)}, personajes ${sign(
        d.deltaCharacters
      )}, eventos ${sign(d.deltaEvents)}, relaciones ${sign(d.deltaRelationships)}</p>
        <p class="text-slate-200 font-medium mt-2">Capítulos cambiados (${d.changedChapters.length})</p>
        <ul class="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto nl-scroll">${chapterLines || '<li class="text-nl-muted">Ninguno</li>'}</ul>
      `;
    });
  }

  if (app.state.view === 'relations') {
    const modal = main.querySelector('[data-rel-modal]');
    const showWizardType = () => {
      main.querySelector('[data-rel-wiz-type]')?.classList.remove('hidden');
      main.querySelector('[data-rel-wiz-form]')?.classList.add('hidden');
    };
    const openModal = () => {
      if (modal instanceof HTMLElement) {
        modal.classList.remove('hidden');
        modal.classList.add('flex', 'items-center', 'justify-center');
        showWizardType();
      }
    };
    const closeModal = () => {
      if (modal instanceof HTMLElement) {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'items-center', 'justify-center');
      }
    };
    main.querySelector('[data-rel-open-wizard]')?.addEventListener('click', openModal);
    main.querySelector('[data-rel-modal-close]')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    main.querySelector('[data-rel-wiz-back]')?.addEventListener('click', showWizardType);
    const panels = ['pc', 'ps', 'ee', 'cc'];
    main.querySelectorAll('[data-rel-wiz-pick]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-rel-wiz-pick');
        main.querySelector('[data-rel-wiz-type]')?.classList.add('hidden');
        const form = main.querySelector('[data-rel-wiz-form]');
        form?.classList.remove('hidden');
        for (const p of panels) {
          main.querySelector(`[data-rel-wiz-panel-${p}]`)?.classList.toggle('hidden', p !== k);
        }
        if (k === 'ps') {
          const wzCh = main.querySelector('[data-wz-ps-ch]');
          const wzSc = main.querySelector('[data-wz-ps-sc]');
          if (wzCh && wzSc) {
            const chId = /** @type {HTMLSelectElement} */ (wzCh).value;
            const ch = book.chapters.find((c) => c.id === chId);
            wzSc.innerHTML =
              '<option value="">Escena</option>' +
              (ch ? sortByOrder(ch.scenes, 'order').map((s) => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('') : '');
          }
        }
      });
    });
    main.querySelector('[data-wz-ps-ch]')?.addEventListener('change', () => {
      const chId = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-ps-ch]')).value;
      const ch = book.chapters.find((c) => c.id === chId);
      const wzSc = main.querySelector('[data-wz-ps-sc]');
      if (!wzSc) return;
      wzSc.innerHTML =
        '<option value="">Escena</option>' +
        (ch ? sortByOrder(ch.scenes, 'order').map((s) => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('') : '');
    });
    main.querySelector('[data-wz-pc-add]')?.addEventListener('click', () => {
      const c = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-pc-char]'));
      const h = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-pc-ch]'));
      const d = /** @type {HTMLTextAreaElement} */ (main.querySelector('[data-wz-pc-desc]'));
      if (!c?.value || !h?.value) return;
      linkCharacterToChapter(book, c.value, h.value, { description: d?.value || '' });
      app.persist();
      closeModal();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelector('[data-wz-ps-add]')?.addEventListener('click', () => {
      const c = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-ps-char]'));
      const chId = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-ps-ch]')).value;
      const scId = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-ps-sc]')).value;
      const d = /** @type {HTMLTextAreaElement} */ (main.querySelector('[data-wz-ps-desc]'));
      if (!c?.value || !chId || !scId) return;
      linkCharacterToScene(book, c.value, chId, scId, { description: d?.value || '' });
      app.persist();
      closeModal();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelector('[data-wz-ee-add]')?.addEventListener('click', () => {
      const a = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-ee-a]')).value;
      const b = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-ee-b]')).value;
      const d = /** @type {HTMLTextAreaElement} */ (main.querySelector('[data-wz-ee-desc]'));
      if (!a || !b || a === b) return;
      linkEventToEvent(book, a, b, { description: d?.value || '' });
      app.persist();
      closeModal();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelector('[data-wz-cc-add]')?.addEventListener('click', () => {
      const a = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-cc-a]')).value;
      const b = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-cc-b]')).value;
      const role = /** @type {HTMLSelectElement} */ (main.querySelector('[data-wz-cc-role]')).value;
      const d = /** @type {HTMLTextAreaElement} */ (main.querySelector('[data-wz-cc-desc]'));
      if (!a || !b || a === b) return;
      if (!role) {
        showToast('Elige el tipo de vínculo entre personajes', 'warning');
        return;
      }
      linkCharacterToCharacter(book, a, b, { role, description: d?.value || '' });
      app.persist();
      closeModal();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });

    const chSel = main.querySelector('[data-rel-ps-ch]');
    const scSel = main.querySelector('[data-rel-ps-sc]');
    chSel?.addEventListener('change', () => {
      const chId = /** @type {HTMLSelectElement} */ (chSel).value;
      const ch = book.chapters.find((c) => c.id === chId);
      if (!scSel) return;
      scSel.innerHTML =
        '<option value="">Escena</option>' +
        (ch ? sortByOrder(ch.scenes, 'order').map((s) => `<option value="${s.id}">${escapeHtml(s.title)}</option>`).join('') : '');
    });
    main.querySelector('[data-rel-pc-add]')?.addEventListener('click', () => {
      const c = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-pc-char]'));
      const h = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-pc-ch]'));
      if (!c?.value || !h?.value) return;
      linkCharacterToChapter(book, c.value, h.value);
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelector('[data-rel-ps-add]')?.addEventListener('click', () => {
      const c = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-ps-char]'));
      const chId = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-ps-ch]')).value;
      const scId = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-ps-sc]')).value;
      if (!c?.value || !chId || !scId) return;
      linkCharacterToScene(book, c.value, chId, scId);
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelector('[data-rel-ee-add]')?.addEventListener('click', () => {
      const a = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-ee-a]')).value;
      const b = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-ee-b]')).value;
      if (!a || !b || a === b) return;
      linkEventToEvent(book, a, b);
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelector('[data-rel-cc-add]')?.addEventListener('click', () => {
      const a = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-cc-a]')).value;
      const b = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-cc-b]')).value;
      const role = /** @type {HTMLSelectElement} */ (main.querySelector('[data-rel-cc-role]')).value;
      if (!a || !b || a === b) return;
      if (!role) {
        showToast('Elige el tipo de vínculo', 'warning');
        return;
      }
      linkCharacterToCharacter(book, a, b, { role });
      app.persist();
      renderMain(app);
      bindMainInteractions(app);
      rerenderRightPanelChrome(app);
    });
    main.querySelectorAll('[data-rel-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-rel-del');
        if (id) {
          removeRelationship(book, id);
          app.persist();
          renderMain(app);
          bindMainInteractions(app);
        }
      });
    });
    book.relationships?.forEach((r) => {
      main.querySelector(`[data-rel-desc="${r.id}"]`)?.addEventListener('change', (e) => {
        r.description = /** @type {HTMLTextAreaElement} */ (e.target).value;
        app.persist();
      });
      main.querySelector(`[data-rel-visible="${r.id}"]`)?.addEventListener('change', (e) => {
        r.disabled = !/** @type {HTMLInputElement} */ (e.target).checked;
        app.persist();
      });
    });
  }

  if (app.state.view === 'graph') {
    app.graphHandle?.destroy();
    app.graphHandle = null;
    const host = main.querySelector('[data-graph-host]');
    if (host) {
      import('../narrative/graph.js').then(({ mountGraph }) => {
        app.graphHandle?.destroy();
        app.graphHandle = mountGraph(host, book, {
          mode: app.state.graphMode || 'characters',
          rootCharacterId: app.state.graphRootCharacterId ?? null,
        });
      });
    }
    main.querySelectorAll('[data-graph-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-graph-mode');
        if (!m || m === app.state.graphMode) return;
        app.state.graphMode = /** @type {'characters'|'chars_chapters'|'all'} */ (m);
        app.refreshMain();
      });
    });
    const graphRootSel = main.querySelector('[data-graph-root]');
    if (graphRootSel && 'value' in graphRootSel) {
      graphRootSel.addEventListener('change', () => {
        const v = String(/** @type {HTMLSelectElement} */ (graphRootSel).value).trim();
        app.state.graphRootCharacterId = v || null;
        app.refreshMain();
      });
    }
  }

  if (app.state.view === 'kanban') {
    bindKanbanList(main, book, app);
  }

  if (app.state.view === 'kanbanBoard' && app.state.kanbanBoardId) {
    const kb = book.kanbanBoards?.find((b) => b.id === app.state.kanbanBoardId);
    if (kb) bindKanbanBoard(main, book, kb, app);
  }

  if (app.state.view === 'export') {
    main.querySelectorAll('[data-exp]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const kind = btn.getAttribute('data-exp');
        const mod = await import('../narrative/export.js');
        try {
          if (kind === 'md') mod.exportMarkdown(book);
          else if (kind === 'txt') mod.exportTxt(book);
          else if (kind === 'pdf') mod.exportPdfPrint(book);
          else if (kind === 'docx') await mod.exportDocx(book);
          else if (kind === 'epub') await mod.exportEpub(book);
        } catch (e) {
          alert(e instanceof Error ? e.message : 'Error al exportar');
        }
      });
    });
    main.querySelectorAll('[data-exp-ref]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const kind = btn.getAttribute('data-exp-ref');
        const mod = await import('../narrative/export.js');
        try {
          if (kind === 'pdf') mod.exportReferenceBundlePdf(book);
          else if (kind === 'txt') mod.exportReferenceBundleTxt(book);
          else if (kind === 'docx') await mod.exportReferenceBundleDocx(book);
          else if (kind === 'epub') await mod.exportReferenceBundleEpub(book);
        } catch (e) {
          alert(e instanceof Error ? e.message : 'Error al exportar');
        }
      });
    });
  }

  if (app.state.view === 'scene') {
    const ch = book.chapters.find((c) => c.id === app.state.chapterId);
    const sc = ch?.scenes.find((s) => s.id === app.state.sceneId);
    main.querySelector('[data-back-sc]')?.addEventListener('click', () => {
      app.state.sceneId = null;
      app.setView('chapter');
    });
    main.querySelector('[data-sc-title]')?.addEventListener('change', (e) => {
      if (sc) sc.title = /** @type {HTMLInputElement} */ (e.target).value;
      app.persist();
    });
  }
}

function deepCloneBook(b) {
  return JSON.parse(JSON.stringify(b));
}
