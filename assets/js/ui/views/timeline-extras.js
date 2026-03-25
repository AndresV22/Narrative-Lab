/**
 * Línea de tiempo y extras — Narrative Lab
 */

import { escapeHtml, sortByOrder } from '../../utils.js';
import { toolbarHtml } from '../../editor.js';

/**
 * @param {import('../../types.js').Book} book
 * @param {import('../../app.js').App} app
 */
export function renderTimelineMerged(book, app) {
  const evs = sortByOrder((book.events || []).slice(), 'sortKey');
  const selId = app.state.timelineEventId;
  const selected = selId ? evs.find((e) => e.id === selId) : null;

  const timelineBlocks = evs.length
    ? evs
        .map((ev) => {
          const active = ev.id === selId;
          return `
            <div
              draggable="true"
              data-timeline-ev="${ev.id}"
              class="relative mb-8 rounded-lg border transition-colors cursor-pointer select-none ${
                active ? 'border-indigo-500 bg-nl-raised/40 ring-1 ring-indigo-500/30' : 'border-transparent hover:border-nl-border hover:bg-nl-raised/20'
              }"
            >
              <div class="absolute -left-5 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-nl-bg"></div>
              <div class="text-xs text-indigo-300 mb-1">${escapeHtml(ev.dateLabel || '—')}</div>
              <div class="font-medium text-white">${escapeHtml(ev.title || 'Evento')}</div>
              <div class="text-sm text-nl-muted mt-1">${escapeHtml((ev.content || '').slice(0, 280))}</div>
            </div>
          `;
        })
        .join('')
    : '<p class="text-nl-muted text-sm">Sin eventos. Pulsa «+ Evento».</p>';

  const editor =
    selected
      ? `
    <div class="mt-8 p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
      <h3 class="text-sm font-medium text-slate-200">Editar evento</h3>
      <div class="flex flex-wrap gap-2 items-center">
        <input data-ev-title="${selected.id}" class="flex-1 min-w-[140px] bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-white font-medium" value="${escapeHtml(selected.title)}" placeholder="Título" />
        <input data-ev-date="${selected.id}" class="w-36 md:w-44 bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-xs" placeholder="DD/MM/AAAA" value="${escapeHtml(selected.dateLabel)}" />
        <label class="flex items-center gap-1 text-xs text-nl-muted shrink-0"><span class="sr-only">Calendario</span>
          <input type="date" data-ev-date-cal="${selected.id}" class="bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-xs w-[140px]" title="Elegir fecha" />
        </label>
        <label class="flex items-center gap-1 text-xs text-nl-muted"><span>Orden</span>
          <input data-ev-sort="${selected.id}" type="number" class="w-16 bg-nl-raised border border-nl-border rounded px-1 py-1" value="${selected.sortKey}" />
        </label>
      </div>
      <textarea data-ev-body="${selected.id}" rows="5" class="w-full text-sm bg-nl-bg border border-nl-border rounded px-2 py-2 text-slate-200">${escapeHtml(selected.content)}</textarea>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-save-ev="${selected.id}" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Guardar evento</button>
        <button type="button" data-del-ev="${selected.id}" class="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10">Eliminar</button>
      </div>
    </div>
  `
      : `<p class="text-sm text-nl-muted mt-6">Selecciona un punto en la línea para editar.</p>`;

  return `
    <div class="max-w-3xl mx-auto p-6 space-y-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Línea de tiempo</h2>
          <p class="text-xs text-nl-muted mt-2 max-w-xl">Arrastra para reordenar. Pulsa un evento para seleccionarlo y editarlo abajo.</p>
        </div>
        <button type="button" data-add-ev class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">+ Evento</button>
      </div>
      <div class="relative pl-8">
        <div class="absolute left-3 top-0 bottom-0 w-px nl-timeline-line"></div>
        <div data-timeline-list>${timelineBlocks}</div>
      </div>
      ${editor}
    </div>
  `;
}

export function renderExtrasList(book) {
  const list = book.extraBlocks || [];
  return `
    <div class="max-w-3xl mx-auto p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Extras</h2>
        <button type="button" data-add-extra class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Nuevo extra</button>
      </div>
      <ul class="space-y-2">
        ${list.map((eb) => `
          <li class="flex items-center gap-2 p-3 rounded-lg border border-nl-border bg-nl-surface">
            <button type="button" data-open-extra="${eb.id}" class="flex-1 text-left text-white hover:text-indigo-300 text-sm">${escapeHtml(eb.title)}</button>
            <button type="button" data-del-extra="${eb.id}" class="text-xs text-red-400 hover:text-red-300 px-2 shrink-0">Eliminar</button>
          </li>
        `).join('') || '<li class="text-nl-muted text-sm">No hay extras. Crea uno con «+ Nuevo extra».</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {import('../../types.js').Book} book
 * @param {import('../../types.js').ExtraBlock} eb
 */
export function renderExtraEditor(book, eb) {
  return `
    <div class="max-w-3xl mx-auto w-full p-6 space-y-4">
      <button type="button" data-back-extras class="text-sm text-indigo-400 hover:text-indigo-300">← Lista de extras</button>
      <input data-extra-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white py-2 focus:outline-none focus:border-indigo-500" value="${escapeHtml(eb.title)}" />
      <div class="rounded-xl border border-nl-border overflow-hidden bg-nl-surface">
        ${toolbarHtml()}
        <div data-ed-extra class="nl-editor min-h-[240px] nl-scroll overflow-y-auto"></div>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" data-save-extra class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Guardar extra</button>
        <button type="button" data-del-extra-editor class="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10">Eliminar extra</button>
      </div>
    </div>
  `;
}
