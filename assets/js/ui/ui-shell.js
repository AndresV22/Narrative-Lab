/**
 * Shell, barra lateral y panel derecho — Narrative Lab
 */

import { shellMarkup } from '../../../components/shell.js';
import { escapeHtml } from '../core/utils.js';
import {
  EXPORT_REMINDER_DAYS,
  daysSinceLastExport,
  exportReminderSummaryLine,
  getSidebarCollapsed,
  setSidebarCollapsed,
  shouldShowExportReminder,
  setLastExportNow,
  setEditorCommentsPanelOpen,
} from '../domain/prefs.js';
import { createSnapshot } from '../domain/models.js';
import { computeWordStats } from '../narrative/export.js';
import { listRelationships } from '../narrative/relations.js';
import { countWarningIssues, getBookStats } from '../narrative/analysis.js';
import { formatDateTimeShort } from '../core/date-format.js';

/**
 * @param {HTMLElement} sidebar
 * @param {boolean} collapsed
 */
function applySidebarCollapseLayout(sidebar, collapsed) {
  sidebar.classList.toggle('nl-sidebar-collapsed', collapsed);
  sidebar.classList.remove('w-64', 'w-[4.5rem]');
  sidebar.classList.add(collapsed ? 'w-[4.5rem]' : 'w-64');
}

const RIGHT_PANEL_BASE_CLASS =
  'nl-right-panel shrink-0 flex flex-col bg-nl-surface nl-scroll transition-[width] duration-200 ease-out';

/**
 * Ancho del panel derecho (progreso / comentarios): animación tipo sidebar.
 * @param {import('./app.js').App} app
 */
export function applyRightPanelLayout(app) {
  const right = app.els?.right;
  if (!right) return;
  const disabled = !app.state.bookId || app.state.view === 'appSettings';
  if (disabled) {
    app.state.rightOpen = false;
    right.className = `${RIGHT_PANEL_BASE_CLASS} w-0 min-w-0 overflow-hidden border-l-0`;
    return;
  }
  if (app.state.rightOpen) {
    right.className = `${RIGHT_PANEL_BASE_CLASS} w-80 min-w-[20rem] border-l border-nl-border overflow-y-auto`;
  } else {
    right.className = `${RIGHT_PANEL_BASE_CLASS} w-0 min-w-0 overflow-hidden border-l-0`;
  }
}

/**
 * Snapshot y panel de progreso solo con libro abierto y fuera de Ajustes globales.
 * @param {import('./app.js').App} app
 */
export function updateHeaderBookToolsVisibility(app) {
  const wrap = document.querySelector('[data-header-book-only]');
  if (!wrap) return;
  const show = !!app.state.bookId && app.state.view !== 'appSettings';
  wrap.classList.toggle('hidden', !show);
  wrap.classList.toggle('lg:flex', show);
}

/**
 * @param {HTMLElement} right
 * @param {import('./app.js').App} app
 */
function bindRightPanelCollapse(right, app) {
  right.querySelector('[data-right-panel-collapse]')?.addEventListener('click', () => {
    app.state.rightOpen = false;
    applyRightPanelLayout(app);
  });
}

/**
 * @param {HTMLElement} sidebar
 * @param {import('./app.js').App} app
 */
function bindSidebarCollapseToggle(sidebar, app) {
  sidebar.querySelector('[data-sidebar-collapse]')?.addEventListener('click', () => {
    setSidebarCollapsed(true);
    app.refreshSidebar();
  });
  sidebar.querySelector('[data-sidebar-expand]')?.addEventListener('click', () => {
    setSidebarCollapsed(false);
    app.refreshSidebar();
  });
}

function exportReminderBanner() {
  if (!shouldShowExportReminder()) return '';
  const d = daysSinceLastExport();
  const lead =
    d === null
      ? 'Es aconsejable exportar el workspace JSON desde la barra lateral de vez en cuando.'
      : `Llevas ${d} días sin registrar una exportación (aviso tras ${EXPORT_REMINDER_DAYS} días).`;
  return `
    <div class="px-3 py-2 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-100/90" role="status">
      <strong class="block text-amber-200 mb-1">Copia de seguridad</strong>
      <p class="mb-1">${lead}</p>
      <p class="text-nl-muted">${exportReminderSummaryLine()}</p>
      <button type="button" data-dismiss-export-reminder class="mt-2 block text-indigo-300 hover:text-indigo-200 underline">He exportado ahora</button>
    </div>
  `;
}

export function mountShell(root, app) {
  root.className = 'h-full flex flex-col min-h-0';
  root.innerHTML = shellMarkup();
  const sidebar = /** @type {HTMLElement} */ (root.querySelector('[data-sidebar]'));
  const main = /** @type {HTMLElement} */ (root.querySelector('[data-main]'));
  const right = /** @type {HTMLElement} */ (root.querySelector('[data-right]'));
  const modalHost = /** @type {HTMLElement} */ (root.querySelector('[data-modal-host]'));
  const saveStatus = /** @type {HTMLElement} */ (root.querySelector('[data-save-status]'));

  root.querySelector('[data-action="search"]')?.addEventListener('click', () => app.openSearch());
  root.querySelector('[data-action="app-settings"]')?.addEventListener('click', () => app.setView('appSettings'));
  root.querySelector('[data-action="author-profile"]')?.addEventListener('click', () => app.openAuthorProfile());
  const saveSnapshotBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-action="save-snapshot"]'));
  saveSnapshotBtn?.addEventListener('click', () => {
    saveSnapshotFromHeader(app);
  });
  root.querySelector('[data-action="toggle-right"]')?.addEventListener('click', () => {
    if (!app.state.bookId || app.state.view === 'appSettings') return;
    app.state.rightOpen = !app.state.rightOpen;
    applyRightPanelLayout(app);
  });

  return { sidebar, main, right, modalHost, saveStatus, saveSnapshotBtn };
}

/**
 * Crea un snapshot con etiqueta automática (barra superior o flujos sin campo de texto).
 * @param {import('./app.js').App} app
 */
export function saveSnapshotFromHeader(app) {
  const book = app.getCurrentBook();
  if (!book) return;
  const label = `Snapshot ${formatDateTimeShort(new Date().toISOString())}`;
  const snap = createSnapshot(label, book);
  book.snapshots.unshift(snap);
  app.persist();
  app.refresh();
}

/**
 * Habilita o deshabilita el botón de snapshot en el header según haya libro abierto.
 * @param {import('./app.js').App} app
 */
export function updateHeaderSnapshotButton(app) {
  const btn = app.els?.saveSnapshotBtn;
  if (!btn) return;
  const ok = !!app.getCurrentBook();
  btn.disabled = !ok;
}

/**
 * @param {HTMLElement} el
 * @param {'idle'|'saving'|'saved'|'error'} status
 */
export function setSaveBadge(el, status) {
  if (!el) return;
  const map = {
    idle: '',
    saving: 'Guardando…',
    saved: 'Guardado ✔️',
    error: 'Error al guardar',
  };
  el.textContent = map[status] || '';
}

/**
 * @param {import('./app.js').App} app
 */
export function renderSidebar(app) {
  const { sidebar } = app.els;
  const ws = app.workspace;
  if (!ws) return;

  const prevAsideScroll = sidebar.scrollTop;
  const prevNavEl = sidebar.querySelector('[data-sidebar-nav]');
  const prevNavScroll = prevNavEl ? prevNavEl.scrollTop : 0;

  const restoreSidebarScroll = () => {
    requestAnimationFrame(() => {
      sidebar.scrollTop = prevAsideScroll;
      const nav = sidebar.querySelector('[data-sidebar-nav]');
      if (nav) nav.scrollTop = prevNavScroll;
    });
  };

  const collapsed = getSidebarCollapsed();
  applySidebarCollapseLayout(sidebar, collapsed);

  if (!app.state.bookId) {
    const libHeader = collapsed
      ? `
      <div class="p-2 border-b border-nl-border space-y-2">
        <div class="flex justify-end">
          <button type="button" data-sidebar-expand class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised" title="Expandir barra lateral" aria-label="Expandir barra lateral"><i class="fa-solid fa-angles-right" aria-hidden="true"></i></button>
        </div>
        <p class="sidebar-section-title text-[10px] uppercase tracking-wider text-nl-muted text-center px-1 leading-tight">Biblioteca</p>
        <button type="button" data-act="library-home" class="w-full flex justify-center py-2 rounded-lg border border-nl-border hover:bg-nl-raised text-slate-200 ${
          app.state.view === 'library' || app.state.view === 'authorProfile' ? 'bg-nl-raised text-white' : ''
        }" title="Inicio" aria-label="Inicio"><i class="fa-solid fa-house" aria-hidden="true"></i></button>
        <button type="button" data-act="new-book" class="w-full flex justify-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white" title="Nuevo libro" aria-label="Nuevo libro"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
        <button type="button" data-act="template" class="w-full flex justify-center py-2 rounded-lg border border-nl-border hover:bg-nl-raised text-slate-200" title="Desde plantilla" aria-label="Desde plantilla"><i class="fa-solid fa-file-lines" aria-hidden="true"></i></button>
      </div>`
      : `
      <div class="p-4 border-b border-nl-border">
        <div class="flex items-center justify-between gap-2 mb-3">
          <p class="text-xs font-medium uppercase tracking-wider text-nl-muted">Biblioteca</p>
          <button type="button" data-sidebar-collapse class="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised" title="Contraer barra lateral" aria-label="Contraer barra lateral"><i class="fa-solid fa-angles-left" aria-hidden="true"></i></button>
        </div>
        <button type="button" data-act="library-home" class="w-full py-2 px-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm text-slate-200 mb-2 ${
          app.state.view === 'library' || app.state.view === 'authorProfile' ? 'bg-nl-raised text-white' : ''
        }">Inicio</button>
        <button type="button" data-act="new-book" class="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">+ Nuevo libro</button>
        <button type="button" data-act="template" class="mt-2 w-full py-2 px-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm text-slate-200">Desde plantilla…</button>
      </div>`;

    const bookRows =
      ws.books.length === 0
        ? collapsed
          ? '<li class="py-2 flex justify-center" title="Sin libros"><i class="fa-solid fa-book text-nl-muted/40 text-lg" aria-hidden="true"></i></li>'
          : '<li class="px-3 py-4 text-sm text-nl-muted">Aún no hay libros.</li>'
        : ws.books
            .map((b) => {
              const cover = b.coverImageDataUrl
                ? `<span class="w-10 h-14 shrink-0 rounded border border-nl-border overflow-hidden bg-nl-raised"><img src="${b.coverImageDataUrl}" alt="" class="w-full h-full object-cover"/></span>`
                : '<span class="w-10 h-14 shrink-0 rounded border border-dashed border-nl-border bg-nl-raised/40"></span>';
              return `
            <li>
              <button type="button" data-open-book="${escapeHtml(b.id)}" title="${escapeHtml(b.name)}" class="w-full text-left px-3 py-2 rounded-lg hover:bg-nl-raised text-sm text-slate-200 flex items-center gap-2 min-w-0">
                ${cover}
                <span class="sidebar-nav-label truncate">${escapeHtml(b.name)}</span>
              </button>
            </li>`;
            })
            .join('');

    const libFooter = collapsed
      ? `
      <div class="p-2 border-t border-nl-border space-y-2">
        <p class="sidebar-section-title text-[10px] uppercase tracking-wider text-nl-muted text-center px-1 leading-tight">Workspace</p>
        <button type="button" data-act="export-ws" class="w-full flex justify-center py-2 rounded-lg border border-nl-border hover:bg-nl-raised" title="Exportar workspace (JSON)" aria-label="Exportar workspace"><i class="fa-solid fa-file-export" aria-hidden="true"></i></button>
        <button type="button" data-act="import-ws" class="w-full flex justify-center py-2 rounded-lg border border-nl-border hover:bg-nl-raised" title="Importar workspace" aria-label="Importar workspace"><i class="fa-solid fa-file-import" aria-hidden="true"></i></button>
        <button type="button" data-act="writing-guide" class="w-full flex justify-center py-2 rounded-lg border border-nl-border hover:bg-nl-raised ${
          app.state.view === 'writingGuide' ? 'bg-nl-raised text-white' : 'text-slate-300'
        }" title="Guía de escritura" aria-label="Guía de escritura"><i class="fa-solid fa-book-open-reader" aria-hidden="true"></i></button>
        <button type="button" data-act="app-settings" class="w-full flex justify-center py-2 rounded-lg border border-nl-border hover:bg-nl-raised ${
          app.state.view === 'appSettings' ? 'bg-nl-raised text-white' : 'text-slate-300'
        }" title="Ajustes" aria-label="Ajustes"><i class="fa-solid fa-gear" aria-hidden="true"></i></button>
      </div>`
      : `
      <div class="p-4 border-t border-nl-border space-y-2">
        <button type="button" data-act="export-ws" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised">Exportar workspace (JSON)</button>
        <button type="button" data-act="import-ws" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised">Importar workspace…</button>
        <button type="button" data-act="writing-guide" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised ${
          app.state.view === 'writingGuide' ? 'bg-nl-raised text-white' : 'text-slate-300'
        }">Guía de escritura</button>
        <button type="button" data-act="app-settings" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised ${
          app.state.view === 'appSettings' ? 'bg-nl-raised text-white' : 'text-slate-300'
        }">Ajustes</button>
      </div>`;

    sidebar.innerHTML = `
      ${libHeader}
      ${!collapsed ? exportReminderBanner() : ''}
      <div class="p-2 flex-1 min-h-0 nl-scroll overflow-y-auto" data-sidebar-nav>
        <ul class="space-y-1">
          ${bookRows}
        </ul>
      </div>
      ${libFooter}
    `;
    sidebar.querySelector('[data-act="library-home"]')?.addEventListener('click', () => {
      app.goLibraryHome();
    });
    sidebar.querySelector('[data-act="new-book"]')?.addEventListener('click', () => app.createBook());
    sidebar.querySelector('[data-act="template"]')?.addEventListener('click', () => app.openTemplateModal());
    sidebar.querySelector('[data-act="export-ws"]')?.addEventListener('click', () => app.exportWorkspace());
    sidebar.querySelector('[data-act="import-ws"]')?.addEventListener('click', () => app.triggerImportWorkspace());
    sidebar.querySelector('[data-act="writing-guide"]')?.addEventListener('click', () => app.openWritingGuide(null));
    sidebar.querySelector('[data-act="app-settings"]')?.addEventListener('click', () => app.setView('appSettings'));
    sidebar.querySelector('[data-dismiss-export-reminder]')?.addEventListener('click', () => {
      setLastExportNow();
      app.refreshSidebar();
    });
    sidebar.querySelectorAll('[data-open-book]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-book');
        if (id) app.openBook(id);
      });
    });
    bindSidebarCollapseToggle(sidebar, app);
    restoreSidebarScroll();
    return;
  }

  const book = app.getCurrentBook();
  if (!book) {
    app.state.bookId = null;
    renderSidebar(app);
    return;
  }

  const nav = (id, label, iconClass) =>
    `<button type="button" data-nav="${id}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" class="nav-item w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm ${
      app.state.view === id ? 'bg-nl-raised text-white' : 'text-slate-300 hover:bg-nl-raised/60'
    }"><i class="fa-solid ${iconClass} w-4 shrink-0 text-center text-nl-muted" aria-hidden="true"></i><span class="sidebar-nav-label min-w-0">${escapeHtml(
      label
    )}</span></button>`;

  const warnCount = countWarningIssues(book);
  const analysisBadge =
    warnCount > 0
      ? `<span class="sidebar-nav-extra ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 tabular-nums">${warnCount}</span>`
      : '';

  const bookHeader = collapsed
    ? `
    <div class="p-2 border-b border-nl-border flex items-center justify-between gap-1">
      <button type="button" data-back class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-nl-raised text-indigo-400" title="Volver a biblioteca" aria-label="Volver a biblioteca"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button>
      <button type="button" data-sidebar-expand class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised" title="Expandir barra lateral" aria-label="Expandir barra lateral"><i class="fa-solid fa-angles-right" aria-hidden="true"></i></button>
    </div>`
    : `
    <div class="p-3 border-b border-nl-border">
      <div class="flex items-start justify-between gap-2 mb-2">
        <button type="button" data-back class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 min-w-0 flex-1 text-left"><i class="fa-solid fa-arrow-left text-[10px] shrink-0" aria-hidden="true"></i><span class="truncate">Biblioteca</span></button>
        <button type="button" data-sidebar-collapse class="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised" title="Contraer barra lateral" aria-label="Contraer barra lateral"><i class="fa-solid fa-angles-left" aria-hidden="true"></i></button>
      </div>
      <p class="font-medium text-white truncate text-sm">${escapeHtml(book.name)}</p>
      <p class="text-xs text-nl-muted truncate">${escapeHtml(book.author || 'Sin autor')}</p>
    </div>`;

  const delBlock = collapsed
    ? `
    <div class="p-2 border-t border-nl-border">
      <button type="button" data-act="del-book" class="w-full flex justify-center py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10" title="Eliminar libro" aria-label="Eliminar libro"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
    </div>`
    : `
    <div class="p-3 border-t border-nl-border space-y-2">
      <button type="button" data-act="del-book" class="w-full py-2 px-3 rounded-lg border border-red-500/30 text-red-300 text-xs hover:bg-red-500/10">Eliminar libro…</button>
    </div>`;

  sidebar.innerHTML = `
    ${bookHeader}
    ${!collapsed ? exportReminderBanner() : ''}
    <div class="p-2 space-y-0.5 nl-scroll overflow-y-auto flex-1 min-h-0" data-sidebar-nav>
      <p class="sidebar-section-title px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-nl-muted">Plan</p>
      ${nav('prologue', 'Prólogo', 'fa-book-open')}
      ${nav('chapters', 'Capítulos y escenas', 'fa-list-ol')}
      ${nav('acts', 'Actos', 'fa-layer-group')}
      ${nav('epilogue', 'Epílogo', 'fa-book-bookmark')}
      <p class="sidebar-section-title px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-nl-muted">Notas del autor</p>
      ${nav('synopsis', 'Sinopsis', 'fa-file-lines')}
      ${nav('historicalContext', 'Contexto', 'fa-landmark')}
      ${nav('worldRules', 'Reglas', 'fa-gavel')}
      ${nav('characters', 'Personajes', 'fa-users')}
      ${nav('timeline', 'Línea de tiempo', 'fa-clock')}
      <button type="button" data-nav="kanban" title="Kanban" aria-label="Kanban" class="nav-item w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm ${
        app.state.view === 'kanban' || app.state.view === 'kanbanBoard' ? 'bg-nl-raised text-white' : 'text-slate-300 hover:bg-nl-raised/60'
      }"><i class="fa-solid fa-table-columns w-4 shrink-0 text-center text-nl-muted" aria-hidden="true"></i><span class="sidebar-nav-label min-w-0">Kanban</span></button>
      ${nav('extras', 'Extras', 'fa-puzzle-piece')}
      ${nav('notes', 'Notas', 'fa-note-sticky')}
      <p class="sidebar-section-title px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-nl-muted">Herramientas</p>
      ${nav('highlights', 'Frases destacadas', 'fa-star')}
      <button type="button" data-nav="analysis" title="Análisis" aria-label="Análisis" class="nav-item w-full flex items-center gap-2.5 justify-between px-3 py-2 rounded-lg text-sm ${
        app.state.view === 'analysis' ? 'bg-nl-raised text-white' : 'text-slate-300 hover:bg-nl-raised/60'
      }"><span class="flex items-center gap-2.5 min-w-0"><i class="fa-solid fa-chart-line w-4 shrink-0 text-center text-nl-muted" aria-hidden="true"></i><span class="sidebar-nav-label min-w-0">Análisis</span></span>${analysisBadge}</button>
      ${nav('graph', 'Mapa / grafo', 'fa-diagram-project')}
      ${nav('snapshots', 'Historial / snapshots', 'fa-clock-rotate-left')}
      ${nav('relations', 'Relaciones', 'fa-link')}
      ${nav('export', 'Exportar libro', 'fa-file-export')}
      ${nav('settings', 'Metadatos del libro', 'fa-sliders')}
      <p class="sidebar-section-title px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-nl-muted">Guía</p>
      <button type="button" data-act="writing-guide" class="nav-item w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm ${
        app.state.view === 'writingGuide' ? 'bg-nl-raised text-white' : 'text-slate-300 hover:bg-nl-raised/60'
      }" title="Guía de escritura" aria-label="Guía de escritura"><i class="fa-solid fa-book-open-reader w-4 shrink-0 text-center text-nl-muted" aria-hidden="true"></i><span class="sidebar-nav-label min-w-0">Guía de escritura</span></button>
    </div>
    ${delBlock}
  `;

  sidebar.querySelector('[data-back]')?.addEventListener('click', () => app.closeBook());
  sidebar.querySelector('[data-dismiss-export-reminder]')?.addEventListener('click', () => {
    setLastExportNow();
    app.refreshSidebar();
  });
  sidebar.querySelector('[data-act="writing-guide"]')?.addEventListener('click', () => app.openWritingGuide(null));
  sidebar.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-nav');
      if (v) app.setView(/** @type {any} */ (v));
    });
  });
  sidebar.querySelector('[data-act="del-book"]')?.addEventListener('click', () => app.deleteCurrentBook());
  bindSidebarCollapseToggle(sidebar, app);
  restoreSidebarScroll();
}

/**
 * @param {import('./app.js').App} app
 */
function isBookEditorSurface(app) {
  const v = app.state.view;
  if (v === 'writingGuide') return false;
  if (v === 'synopsis' || v === 'prologue' || v === 'epilogue') return true;
  if (v === 'extras' && app.state.extraId) return true;
  if (v === 'worldRules' && app.state.worldRuleId) return true;
  if (v === 'chapter' || v === 'scene' || v === 'note') return true;
  return false;
}

/**
 * @param {import('./app.js').App} app
 */
export function renderRightPanel(app) {
  const { right } = app.els;
  const book = app.getCurrentBook();
  if (!book || app.state.view === 'appSettings') {
    right.innerHTML = '';
    return;
  }

  if (app.state.rightPanelMode === 'comments' && isBookEditorSurface(app) && app.editor) {
    right.innerHTML = `
      <div class="flex flex-col h-full min-h-0">
        <div class="p-3 border-b border-nl-border flex items-center justify-between gap-2 shrink-0">
          <span class="text-xs font-medium text-slate-300">Comentarios (este fragmento)</span>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" data-nl-right-comments-back class="text-xs text-indigo-400 hover:text-indigo-300">Resumen del libro</button>
            <button type="button" data-right-panel-collapse class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised" title="Contraer panel" aria-label="Contraer panel"><i class="fa-solid fa-angles-right" aria-hidden="true"></i></button>
          </div>
        </div>
        <ul data-nl-comments-list class="flex-1 overflow-y-auto nl-scroll p-2 space-y-2 min-h-0 text-sm"></ul>
      </div>
    `;
    right.querySelector('[data-nl-right-comments-back]')?.addEventListener('click', () => {
      app.state.rightPanelMode = 'stats';
      setEditorCommentsPanelOpen(false);
      renderRightPanel(app);
    });
    bindRightPanelCollapse(right, app);
    app.syncEditorCommentsPanel(/** @type {HTMLElement} */ (app.editor.host));
    return;
  }

  const stats = computeWordStats(book);
  const bstats = getBookStats(book);
  const pct = stats.goal > 0 ? Math.min(100, Math.round((stats.total / stats.goal) * 100)) : 0;
  const pagesEst = stats.total > 0 ? Math.max(1, Math.ceil(stats.total / 300)) : 0;

  const rels = listRelationships(book).slice(0, 12);

  const warnN = countWarningIssues(book);
  const analysisLink = `
    <button type="button" data-go-analysis class="w-full mt-3 py-2 px-3 rounded-lg border border-nl-border text-xs text-left hover:bg-nl-raised text-slate-200 flex items-center justify-between gap-2">
      <span>Ver análisis del libro</span>
      ${
        warnN > 0
          ? `<span class="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">${warnN} avisos</span>`
          : '<span class="text-nl-muted text-[10px]">Salud y detalle</span>'
      }
    </button>
  `;

  const em = app.editorMetrics;
  let editorBlock = '';
  if (isBookEditorSurface(app)) {
    if (em && em.skipped) {
      editorBlock = `
        <div class="mt-4 pt-4 border-t border-nl-border">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-nl-muted mb-2">Esta sección</h3>
          <p class="text-xs text-nl-muted">Texto muy largo (&gt;10.000 caracteres): métricas del editor desactivadas para mantener la fluidez.</p>
        </div>
      `;
    } else if (em && !em.skipped) {
      const dr = typeof em.dialogueRatio === 'number' ? Math.round(em.dialogueRatio * 100) : 0;
      const repeats =
        em.topRepeats && em.topRepeats.length
          ? em.topRepeats.map((x) => `${escapeHtml(x.word)} (${x.count})`).join(', ')
          : '—';
      editorBlock = `
        <div class="mt-4 pt-4 border-t border-nl-border">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-nl-muted mb-2">Esta sección (tiempo real)</h3>
          <ul class="text-[11px] space-y-1.5 text-slate-400">
            <li>Párrafos: ${em.paragraphCount ?? '—'} · media ${em.avgParagraphWords ?? '—'} pal. · máx ${em.maxParagraphWords ?? '—'}</li>
            <li>Ritmo (diálogo est.): ~${dr}% de líneas con señal de réplica</li>
            <li class="break-words">Repeticiones (≥3×): ${repeats}</li>
          </ul>
        </div>
      `;
    }
  }

  right.innerHTML = `
    <div class="p-4 border-b border-nl-border">
      <div class="flex items-center justify-between gap-2 mb-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-nl-muted">Progreso</h3>
        <button type="button" data-right-panel-collapse class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised shrink-0" title="Contraer panel" aria-label="Contraer panel"><i class="fa-solid fa-angles-right" aria-hidden="true"></i></button>
      </div>
      <div class="text-2xl font-semibold text-white tabular-nums">${stats.total.toLocaleString()}</div>
      <div class="text-xs text-nl-muted mt-1">palabras · meta ${stats.goal.toLocaleString()}</div>
      ${
        pagesEst > 0
          ? `<div class="text-xs text-slate-400 mt-2">Estimación: ~${pagesEst.toLocaleString()} páginas (≈300 palabras/página)</div>`
          : `<div class="text-xs text-nl-muted mt-2">Estimación de páginas: — (añade texto al libro)</div>`
      }
      <div class="mt-3 h-2 rounded-full bg-nl-raised overflow-hidden">
        <div class="h-full bg-indigo-500 transition-all" style="width:${pct}%"></div>
      </div>
      <dl class="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div><dt class="text-nl-muted">Capítulos</dt><dd class="text-slate-200 tabular-nums">${bstats.chapterCount}</dd></div>
        <div><dt class="text-nl-muted">Escenas</dt><dd class="text-slate-200 tabular-nums">${bstats.sceneCount}</dd></div>
        <div><dt class="text-nl-muted">Personajes (activos)</dt><dd class="text-slate-200 tabular-nums">${bstats.activeCharacters}/${bstats.characterCount}</dd></div>
        <div><dt class="text-nl-muted">Lectura (~200 p/min)</dt><dd class="text-slate-200 tabular-nums">~${bstats.readingMinutes} min</dd></div>
      </dl>
      ${analysisLink}
      ${editorBlock}
      <div class="mt-4 space-y-2 max-h-40 overflow-y-auto nl-scroll text-xs">
        ${stats.chapters.map((c) => `
          <div class="flex justify-between gap-2 text-nl-muted">
            <span class="truncate">${escapeHtml(c.title)}</span>
            <span class="shrink-0 text-slate-400">${c.words}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-nl-muted mb-2">Relaciones recientes</h3>
      <ul class="text-xs space-y-2 text-slate-400">
        ${rels.length ? rels.map((r) => `<li>${escapeHtml(r.type)}: ${escapeHtml(r.from.kind)} → ${escapeHtml(r.to.kind)}</li>`).join('') : '<li class="text-nl-muted">Sin relaciones aún.</li>'}
      </ul>
      <p class="text-[10px] text-nl-muted mt-3">Gestiona vínculos en la vista «Relaciones».</p>
    </div>
  `;

  right.querySelector('[data-go-analysis]')?.addEventListener('click', () => {
    app.setView('analysis');
  });
  bindRightPanelCollapse(right, app);
}
