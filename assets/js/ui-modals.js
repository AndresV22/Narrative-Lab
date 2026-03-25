/**
 * Modales (búsqueda, plantillas, import) — Narrative Lab
 */

import { escapeHtml } from './utils.js';
import { searchWorkspace } from './search.js';

export function renderSearchModal(app) {
  const host = app.els.modalHost;
  host.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm" data-close-modal>
      <div class="w-full max-w-lg rounded-xl border border-nl-border bg-nl-surface shadow-xl p-4" data-stop>
        <input type="search" data-q class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm mb-3" placeholder="Buscar en sinopsis, prólogo, capítulos, escenas, notas, eventos, extras…" autofocus />
        <ul data-results class="max-h-64 overflow-y-auto nl-scroll text-sm space-y-2"></ul>
      </div>
    </div>
  `;
  const overlay = host.querySelector('[data-close-modal]');
  const inp = /** @type {HTMLInputElement|null} */ (host.querySelector('[data-q]'));
  const results = /** @type {HTMLElement|null} */ (host.querySelector('[data-results]'));

  function run() {
    const q = inp?.value || '';
    const hits = searchWorkspace(app.workspace, q);
    if (!results) return;
    results.innerHTML = hits.map((h) => `
      <li>
        <button type="button" class="w-full text-left p-2 rounded hover:bg-nl-raised" data-hit="${escapeHtml(h.bookId)}" data-kind="${h.kind}" data-id="${escapeHtml(h.id)}" data-ch="${h.chapterId || ''}">
          <div class="text-indigo-300 text-xs">${escapeHtml(h.bookName)} · ${escapeHtml(h.label)}</div>
          <div class="text-nl-muted text-xs">${escapeHtml(h.excerpt)}</div>
        </button>
      </li>
    `).join('') || '<li class="text-nl-muted text-sm px-2">Sin resultados.</li>';

    results.querySelectorAll('button[data-hit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bookId = btn.getAttribute('data-hit');
        const kind = btn.getAttribute('data-kind');
        const id = btn.getAttribute('data-id');
        const chId = btn.getAttribute('data-ch') || '';
        if (!bookId) return;
        host.innerHTML = '';
        app.state.bookId = bookId;
        if (kind === 'synopsis') app.setView('synopsis');
        else if (kind === 'prologue') app.setView('prologue');
        else if (kind === 'event') app.setView('timeline');
        else if (kind === 'extra' && id) app.openExtraEditor(id);
        else if (kind === 'note') {
          app.state.noteId = id;
          app.setView('note');
        } else if (kind === 'chapter') {
          app.state.chapterId = id;
          app.setView('chapter');
        } else if (kind === 'scene') {
          app.state.chapterId = chId;
          app.state.sceneId = id;
          app.setView('scene');
        } else app.refresh();
      });
    });
  }

  inp?.addEventListener('input', run);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) host.innerHTML = '';
  });
  run();
}

/**
 * Plantilla modal: elegir novela / cuento / guion
 * @param {import('./app.js').App} app
 */
export function renderTemplateModal(app, templates) {
  const host = app.els.modalHost;
  host.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-8 sm:py-12" data-backdrop>
      <div class="max-w-md w-full h-[min(90vh,calc(100vh-4rem))] flex flex-col rounded-xl border border-nl-border bg-nl-surface shadow-xl overflow-hidden my-auto">
        <div class="px-6 pt-6 pb-3 shrink-0">
          <h3 class="text-lg font-semibold text-white">Nuevo libro desde plantilla</h3>
          <p class="text-xs text-nl-muted mt-1">Desplázate para ver todas las opciones.</p>
        </div>
        <ul class="flex-1 min-h-0 overflow-y-auto nl-scroll overscroll-contain px-6 space-y-2 pb-2 touch-pan-y">
          ${templates.map((t) => `
            <li>
              <button type="button" data-tpl="${escapeHtml(t.id)}" class="w-full text-left p-3 rounded-lg border border-nl-border hover:border-indigo-500/50">
                <div class="font-medium text-white">${escapeHtml(t.name)}</div>
                <div class="text-xs text-nl-muted">${escapeHtml(t.description)}</div>
              </button>
            </li>
          `).join('')}
        </ul>
        <div class="shrink-0 px-6 py-4 border-t border-nl-border bg-nl-surface">
          <button type="button" data-cancel class="text-sm text-nl-muted hover:text-white">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  host.querySelector('[data-backdrop]')?.addEventListener('click', (e) => {
    if (e.target === host.querySelector('[data-backdrop]')) host.innerHTML = '';
  });
  host.querySelector('[data-cancel]')?.addEventListener('click', () => {
    host.innerHTML = '';
  });
  host.querySelectorAll('[data-tpl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-tpl');
      host.innerHTML = '';
      if (id) app.createFromTemplateId(id);
    });
  });
}

/**
 * Import workspace modal
 */
export function renderImportModal(app) {
  const host = app.els.modalHost;
  host.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="max-w-md w-full rounded-xl border border-nl-border bg-nl-surface p-6">
        <h3 class="text-lg font-semibold text-white mb-2">Importar workspace</h3>
        <p class="text-sm text-nl-muted mb-4">Elige si reemplazar todo o fusionar con los datos actuales.</p>
        <div class="flex flex-col gap-2">
          <button type="button" data-imp="replace" class="py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm">Reemplazar todo</button>
          <button type="button" data-imp="merge" class="py-2 rounded-lg bg-indigo-600 text-white text-sm">Fusionar (por id)</button>
          <button type="button" data-imp="merge-new" class="py-2 rounded-lg border border-nl-border text-sm">Fusionar (nuevos ids si hay conflicto)</button>
          <button type="button" data-cancel class="text-sm text-nl-muted mt-2">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  host.querySelector('[data-cancel]')?.addEventListener('click', () => {
    host.innerHTML = '';
    app.pendingImport = null;
  });
  host.querySelector('[data-imp="replace"]')?.addEventListener('click', () => {
    app.applyImport('replace');
  });
  host.querySelector('[data-imp="merge"]')?.addEventListener('click', () => {
    app.applyImport('merge');
  });
  host.querySelector('[data-imp="merge-new"]')?.addEventListener('click', () => {
    app.applyImport('merge-new');
  });
}
