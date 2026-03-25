/**
 * Shell, barra lateral y panel derecho — Narrative Lab
 */

import { shellMarkup } from '../../components/shell.js';
import { escapeHtml } from './utils.js';
import { createSnapshot } from './models.js';
import { computeWordStats } from './export.js';
import { listRelationships } from './relations.js';
import { countWarningIssues, getBookStats } from './analysis.js';

export function mountShell(root, app) {
  root.className = 'h-full flex flex-col min-h-0';
  root.innerHTML = shellMarkup();
  const sidebar = /** @type {HTMLElement} */ (root.querySelector('[data-sidebar]'));
  const main = /** @type {HTMLElement} */ (root.querySelector('[data-main]'));
  const right = /** @type {HTMLElement} */ (root.querySelector('[data-right]'));
  const modalHost = /** @type {HTMLElement} */ (root.querySelector('[data-modal-host]'));
  const saveStatus = /** @type {HTMLElement} */ (root.querySelector('[data-save-status]'));

  root.querySelector('[data-action="search"]')?.addEventListener('click', () => app.openSearch());
  const saveSnapshotBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-action="save-snapshot"]'));
  saveSnapshotBtn?.addEventListener('click', () => {
    saveSnapshotFromHeader(app);
  });
  root.querySelector('[data-action="toggle-right"]')?.addEventListener('click', () => {
    app.state.rightOpen = !app.state.rightOpen;
    right.classList.toggle('hidden', !app.state.rightOpen);
    right.classList.toggle('lg:flex', app.state.rightOpen);
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
  const label = `Snapshot ${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`;
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

  if (!app.state.bookId) {
    sidebar.innerHTML = `
      <div class="p-4 border-b border-nl-border">
        <p class="text-xs font-medium uppercase tracking-wider text-nl-muted mb-3">Biblioteca</p>
        <button type="button" data-act="new-book" class="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">+ Nuevo libro</button>
        <button type="button" data-act="template" class="mt-2 w-full py-2 px-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm text-slate-200">Desde plantilla…</button>
      </div>
      <div class="p-2 flex-1 min-h-0 nl-scroll overflow-y-auto" data-sidebar-nav>
        <ul class="space-y-1">
          ${ws.books.map((b) => `
            <li>
              <button type="button" data-open-book="${escapeHtml(b.id)}" class="w-full text-left px-3 py-2 rounded-lg hover:bg-nl-raised text-sm text-slate-200 truncate">
                ${escapeHtml(b.name)}
              </button>
            </li>
          `).join('') || '<li class="px-3 py-4 text-sm text-nl-muted">Aún no hay libros.</li>'}
        </ul>
      </div>
      <div class="p-4 border-t border-nl-border space-y-2">
        <button type="button" data-act="export-ws" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised">Exportar workspace (JSON)</button>
        <button type="button" data-act="import-ws" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised">Importar workspace…</button>
        <button type="button" data-act="app-settings" class="w-full py-2 px-3 rounded-lg border border-nl-border text-xs hover:bg-nl-raised ${
          app.state.view === 'appSettings' ? 'bg-nl-raised text-white' : 'text-slate-300'
        }">Ajustes</button>
      </div>
    `;
    sidebar.querySelector('[data-act="new-book"]')?.addEventListener('click', () => app.createBook());
    sidebar.querySelector('[data-act="template"]')?.addEventListener('click', () => app.openTemplateModal());
    sidebar.querySelector('[data-act="export-ws"]')?.addEventListener('click', () => app.exportWorkspace());
    sidebar.querySelector('[data-act="import-ws"]')?.addEventListener('click', () => app.triggerImportWorkspace());
    sidebar.querySelector('[data-act="app-settings"]')?.addEventListener('click', () => app.setView('appSettings'));
    sidebar.querySelectorAll('[data-open-book]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-book');
        if (id) app.openBook(id);
      });
    });
    restoreSidebarScroll();
    return;
  }

  const book = app.getCurrentBook();
  if (!book) {
    app.state.bookId = null;
    renderSidebar(app);
    return;
  }

  const nav = (id, label) =>
    `<button type="button" data-nav="${id}" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm ${
      app.state.view === id ? 'bg-nl-raised text-white' : 'text-slate-300 hover:bg-nl-raised/60'
    }">${label}</button>`;

  const warnCount = countWarningIssues(book);
  const analysisBadge =
    warnCount > 0
      ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 tabular-nums">${warnCount}</span>`
      : '';

  sidebar.innerHTML = `
    <div class="p-3 border-b border-nl-border">
      <button type="button" data-back class="text-xs text-indigo-400 hover:text-indigo-300 mb-2">← Biblioteca</button>
      <p class="font-medium text-white truncate text-sm">${escapeHtml(book.name)}</p>
      <p class="text-xs text-nl-muted truncate">${escapeHtml(book.author || 'Sin autor')}</p>
    </div>
    <div class="p-2 space-y-0.5 nl-scroll overflow-y-auto flex-1 min-h-0" data-sidebar-nav>
      <p class="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-nl-muted">Plan</p>
      ${nav('synopsis', 'Sinopsis')}
      ${nav('prologue', 'Prólogo')}
      ${nav('chapters', 'Capítulos y escenas')}
      ${nav('acts', 'Actos')}
      ${nav('characters', 'Personajes')}
      ${nav('timeline', 'Línea de tiempo')}
      ${nav('notes', 'Notas')}
      ${nav('extras', 'Extras')}
      ${nav('epilogue', 'Epílogo')}
      <p class="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-nl-muted">Herramientas</p>
      ${nav('highlights', 'Frases destacadas')}
      <button type="button" data-nav="analysis" class="nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
        app.state.view === 'analysis' ? 'bg-nl-raised text-white' : 'text-slate-300 hover:bg-nl-raised/60'
      }"><span>Análisis</span>${analysisBadge}</button>
      ${nav('graph', 'Mapa / grafo')}
      ${nav('snapshots', 'Historial / snapshots')}
      ${nav('relations', 'Relaciones')}
      ${nav('export', 'Exportar libro')}
      ${nav('settings', 'Metadatos del libro')}
    </div>
    <div class="p-3 border-t border-nl-border space-y-2">
      <button type="button" data-act="del-book" class="w-full py-2 px-3 rounded-lg border border-red-500/30 text-red-300 text-xs hover:bg-red-500/10">Eliminar libro…</button>
    </div>
  `;

  sidebar.querySelector('[data-back]')?.addEventListener('click', () => app.closeBook());
  sidebar.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-nav');
      if (v) app.setView(/** @type {any} */ (v));
    });
  });
  sidebar.querySelector('[data-act="del-book"]')?.addEventListener('click', () => app.deleteCurrentBook());
  restoreSidebarScroll();
}

/**
 * @param {import('./app.js').App} app
 */
function isBookEditorSurface(app) {
  const v = app.state.view;
  if (v === 'synopsis' || v === 'prologue' || v === 'epilogue') return true;
  if (v === 'extras' && app.state.extraId) return true;
  if (v === 'chapter' || v === 'scene' || v === 'note') return true;
  return false;
}

/**
 * @param {import('./app.js').App} app
 */
export function renderRightPanel(app) {
  const { right } = app.els;
  const book = app.getCurrentBook();
  if (!book) {
    right.innerHTML = `<div class="p-4 text-sm text-nl-muted">Abre un libro para ver progreso y relaciones.</div>`;
    return;
  }
  const stats = computeWordStats(book);
  const bstats = getBookStats(book);
  const pct = stats.goal > 0 ? Math.min(100, Math.round((stats.total / stats.goal) * 100)) : 0;

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
      <h3 class="text-xs font-semibold uppercase tracking-wider text-nl-muted mb-3">Progreso</h3>
      <div class="text-2xl font-semibold text-white tabular-nums">${stats.total.toLocaleString()}</div>
      <div class="text-xs text-nl-muted mt-1">palabras · meta ${stats.goal.toLocaleString()}</div>
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
}
