/**
 * Capítulos, escenas y actos — Narrative Lab
 */

import { escapeHtml, sortByOrder } from '../../utils.js';
import { toolbarHtml } from '../../editor.js';

/**
 * @param {import('../../types.js').Book} book
 * @param {import('../../app.js').App} app
 */
export function renderChaptersList(book, _app) {
  const chapters = sortByOrder(book.chapters, 'order');
  return `
    <div class="nl-view">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Capítulos</h2>
        <button type="button" data-add-ch class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">+ Capítulo</button>
      </div>
      <ul data-ch-list class="space-y-2">
        ${chapters.map((ch, idx) => `
          <li data-ch-id="${ch.id}" draggable="true" class="flex items-center gap-2 p-3 rounded-lg border border-nl-border bg-nl-surface cursor-grab active:cursor-grabbing">
            <span class="text-nl-muted text-xs w-6">${idx + 1}</span>
            <button type="button" data-open-ch="${ch.id}" class="flex-1 text-left text-sm text-white hover:text-indigo-300">${escapeHtml(ch.title)}</button>
            <span class="text-xs text-nl-muted hidden sm:inline max-w-[8rem] truncate">${escapeHtml(ch.chapterGoal || '').slice(0, 40)}${(ch.chapterGoal || '').length > 40 ? '…' : ''}</span>
            <button type="button" data-del-ch="${ch.id}" class="text-xs text-red-400 hover:text-red-300 shrink-0 px-2" title="Eliminar">✕</button>
          </li>
        `).join('')}
      </ul>
      <p class="text-xs text-nl-muted mt-4">Arrastra para reordenar. Abre un capítulo para editar escenas.</p>
    </div>
  `;
}

/**
 * @param {import('../../types.js').Chapter} ch
 */
export function renderChapterEditor(ch) {
  const scenes = sortByOrder(ch.scenes, 'order');
  return `
    <div class="nl-view flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <button type="button" data-back-ch class="text-sm text-indigo-400 hover:text-indigo-300 shrink-0">← Capítulos</button>
      </div>
      <input data-ch-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white focus:outline-none focus:border-indigo-500 pb-2" value="${escapeHtml(ch.title)}" />
      <div>
        <label class="text-xs text-nl-muted">Objetivo del capítulo</label>
        <textarea data-ch-goal rows="2" class="mt-1 w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm">${escapeHtml(ch.chapterGoal)}</textarea>
      </div>
      <div class="rounded-xl border border-nl-border overflow-hidden bg-nl-surface">
        ${toolbarHtml()}
        <div data-ed-chapter class="nl-editor min-h-[240px] nl-scroll overflow-y-auto"></div>
      </div>
      <div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h3 class="text-sm font-medium text-white">Escenas</h3>
          <button type="button" data-add-sc class="shrink-0 text-sm px-3 py-1.5 rounded-lg bg-nl-raised border border-nl-border hover:bg-nl-bg text-slate-200">+ Escena</button>
        </div>
        <ul data-sc-list class="space-y-2">
          ${scenes.map((sc, i) => `
            <li data-sc-id="${sc.id}" draggable="true" class="flex items-center gap-2 p-2 rounded-lg border border-nl-border bg-nl-bg">
              <span class="text-nl-muted text-xs w-5">${i + 1}</span>
              <button type="button" data-open-sc="${sc.id}" class="flex-1 text-left text-sm text-slate-200">${escapeHtml(sc.title)}</button>
              <button type="button" data-del-sc="${sc.id}" class="text-xs text-red-400 px-2 shrink-0" title="Eliminar escena">✕</button>
            </li>
          `).join('') || '<li class="text-sm text-nl-muted">Sin escenas.</li>'}
        </ul>
      </div>
    </div>
  `;
}

/**
 * @param {import('../../types.js').Chapter} ch
 * @param {import('../../types.js').Scene} sc
 */
export function renderSceneEditor(ch, sc) {
  return `
    <div class="nl-view flex flex-col gap-4">
      <button type="button" data-back-sc class="text-sm text-indigo-400 w-fit">← ${escapeHtml(ch.title)}</button>
      <input data-sc-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white focus:outline-none focus:border-indigo-500 pb-2" value="${escapeHtml(sc.title)}" />
      <div class="rounded-xl border border-nl-border overflow-hidden bg-nl-surface">
        ${toolbarHtml()}
        <div data-ed-scene class="nl-editor min-h-[280px] nl-scroll overflow-y-auto"></div>
      </div>
    </div>
  `;
}

/**
 * Lista de actos; el formulario completo está en {@link renderActEditor}.
 * @param {import('../../types.js').Book} book
 */
export function renderActsList(book) {
  const acts = sortByOrder(book.acts || [], 'order');
  return `
    <div class="nl-view space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Actos</h2>
          <p class="text-xs text-nl-muted mt-2">Vincula capítulos a cada acto. Un capítulo solo puede estar en un acto a la vez.</p>
        </div>
        <button type="button" data-add-act class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Acto</button>
      </div>
      <ul class="space-y-2">
        ${acts.length
          ? acts
              .map((act) => {
                const preview = (act.description || '').trim().slice(0, 120) + ((act.description || '').length > 120 ? '…' : '');
                return `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-act="${escapeHtml(act.id)}" class="flex-1 min-w-0 text-left p-3 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40 transition-colors">
              <div class="font-medium text-white text-sm">${escapeHtml(act.title) || 'Sin título'}</div>
              <div class="text-[11px] text-nl-muted mt-1 line-clamp-2">${preview ? escapeHtml(preview) : 'Sin descripción'}</div>
            </button>
            <button type="button" data-del-act="${escapeHtml(act.id)}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>`;
              })
              .join('')
          : '<li class="text-nl-muted text-sm">Sin actos. Pulsa «+ Acto».</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {import('../../types.js').Book} book
 * @param {import('../../types.js').Act} act
 */
export function renderActEditor(book, act) {
  const chapters = sortByOrder(book.chapters, 'order');
  return `
    <div class="nl-view space-y-4">
      <button type="button" data-back-acts class="text-sm text-indigo-400 hover:text-indigo-300">← Actos</button>
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <h2 class="text-lg font-semibold text-white">Editar acto</h2>
        <button type="button" data-save-act class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">Guardar</button>
      </div>
      <div class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <div class="flex flex-wrap justify-between gap-2 items-center">
          <input data-act-title="${act.id}" class="flex-1 min-w-[160px] bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm text-white font-medium" value="${escapeHtml(act.title)}" placeholder="Título del acto" />
          <button type="button" data-del-act-editor="${act.id}" class="text-xs text-red-400 hover:text-red-300 px-2">Eliminar acto</button>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] text-nl-muted uppercase tracking-wider">Descripción del acto</label>
          <textarea data-act-desc="${act.id}" rows="3" class="w-full text-sm bg-nl-bg border border-nl-border rounded px-3 py-2 text-slate-200" placeholder="Qué ocurre o qué quieres cubrir en este acto…">${escapeHtml(act.description || '')}</textarea>
        </div>
        <p class="text-xs text-nl-muted">Capítulos en este acto:</p>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          ${chapters.map((ch) => {
            const checked = (act.chapterIds || []).includes(ch.id);
            return `<label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input type="checkbox" data-act-ch="${act.id}" data-ch-id="${ch.id}" ${checked ? 'checked' : ''} class="rounded border-nl-border" />
              ${escapeHtml(ch.title)}
            </label>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
