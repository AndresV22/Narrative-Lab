/**
 * Plantillas HTML de las vistas principales — Narrative Lab
 */

import { escapeHtml, sortByOrder } from './utils.js';
import { toolbarHtml } from './editor.js';
import { getAutosaveMs, getProgressMode } from './prefs.js';
import { listRelationships } from './relations.js';
import {
  detectNarrativeIssues,
  getBookHealth,
  getBookStats,
  getTimelineConflicts,
} from './analysis.js';

export function wrapEditorSection(title, field) {
  return `
    <div class="max-w-3xl mx-auto w-full p-6 flex flex-col min-h-0 flex-1">
      <h2 class="text-lg font-semibold text-white mb-4">${escapeHtml(title)}</h2>
      <div class="rounded-xl border border-nl-border overflow-hidden bg-nl-surface flex flex-col flex-1 min-h-0">
        ${toolbarHtml()}
        <div data-ed class="nl-editor flex-1 nl-scroll overflow-y-auto"></div>
      </div>
    </div>
  `;
}

/**
 * @param {Book} book
 */
export function renderBookSettings(book) {
  return `
    <div class="max-w-xl mx-auto p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white">Metadatos</h2>
      <label class="block text-xs text-nl-muted">Nombre</label>
      <input data-f="name" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.name)}" />
      <label class="block text-xs text-nl-muted">Autor</label>
      <input data-f="author" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.author)}" />
      <label class="block text-xs text-nl-muted">Fecha</label>
      <input data-f="date" type="date" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.date)}" />
      <label class="block text-xs text-nl-muted">Categoría</label>
      <input data-f="category" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.category)}" />
      <label class="block text-xs text-nl-muted">Tipo de narrador</label>
      <input data-f="narratorType" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.narratorType)}" />
      <label class="block text-xs text-nl-muted">Estado</label>
      <select data-f="status" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm">
        ${['Borrador', 'En revisión', 'Publicado'].map((s) => `<option ${book.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <label class="block text-xs text-nl-muted">Meta de palabras</label>
      <input data-f="wordGoal" type="number" min="0" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${book.wordGoal}" />
      <button type="button" data-save-meta class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Guardar cambios</button>
    </div>
  `;
}



/**
 * @param {Book} book
 * @param {import('./app.js').App} app
 */
export function renderChaptersList(book, app) {
  const chapters = sortByOrder(book.chapters, 'order');
  return `
    <div class="max-w-3xl mx-auto p-6">
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
 * @param {import('./types.js').Chapter} ch
 */
export function renderChapterEditor(ch) {
  const scenes = sortByOrder(ch.scenes, 'order');
  return `
    <div class="max-w-3xl mx-auto w-full p-6 flex flex-col gap-4">
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
 * @param {import('./types.js').Chapter} ch
 * @param {import('./types.js').Scene} sc
 */
export function renderSceneEditor(ch, sc) {
  return `
    <div class="max-w-3xl mx-auto w-full p-6 flex flex-col gap-4">
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
 * @param {Book} book
 */
export function renderCharacterList(book, app) {
  return `
    <div class="max-w-3xl mx-auto p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Personajes</h2>
        <button type="button" data-add-char class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Personaje</button>
      </div>
      <ul class="space-y-2">
        ${book.characters.map((c) => `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-char="${c.id}" class="flex-1 text-left p-3 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40 flex gap-3 min-w-0">
              <div class="w-12 h-12 rounded-full bg-nl-raised border border-nl-border overflow-hidden shrink-0">
                ${c.imageDataUrl ? `<img src="${c.imageDataUrl}" alt="" class="w-full h-full object-cover"/>` : ''}
              </div>
              <div class="min-w-0">
                <div class="font-medium text-white truncate">${escapeHtml(c.name || 'Sin nombre')}</div>
                <div class="text-xs text-nl-muted truncate">${escapeHtml(c.description).slice(0, 120)}</div>
              </div>
            </button>
            <button type="button" data-del-char="${c.id}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>
        `).join('') || '<li class="text-sm text-nl-muted">No hay personajes.</li>'}
      </ul>
    </div>
  `;
}

export function renderCharacterForm(book, ch, app) {
  return `
    <div class="max-w-2xl mx-auto p-6 space-y-3">
      <button type="button" data-back-char class="text-sm text-indigo-400">← Personajes</button>
      <div class="flex gap-4">
        <div class="shrink-0">
          <div class="w-24 h-24 rounded-xl border border-nl-border bg-nl-raised overflow-hidden">
            ${ch.imageDataUrl ? `<img src="${ch.imageDataUrl}" alt="" class="w-full h-full object-cover" data-char-img/>` : '<div class="w-full h-full flex items-center justify-center text-xs text-nl-muted">Sin imagen</div>'}
          </div>
          <input type="file" accept="image/*" data-char-file class="mt-2 text-xs text-nl-muted" />
        </div>
        <div class="flex-1 space-y-2">
          <label class="text-xs text-nl-muted">Nombre</label>
          <input data-f="name" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.name)}" />
          <label class="text-xs text-nl-muted">Edad</label>
          <input data-f="age" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.age)}" />
        </div>
      </div>
      <label class="text-xs text-nl-muted">Descripción</label>
      <textarea data-f="description" rows="3" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm">${escapeHtml(ch.description)}</textarea>
      <label class="text-xs text-nl-muted">Personalidad</label>
      <textarea data-f="personality" rows="2" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm">${escapeHtml(ch.personality)}</textarea>
      <label class="text-xs text-nl-muted">Objetivos</label>
      <textarea data-f="goals" rows="2" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm">${escapeHtml(ch.goals)}</textarea>
      <label class="text-xs text-nl-muted">Conflictos</label>
      <textarea data-f="conflicts" rows="2" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm">${escapeHtml(ch.conflicts)}</textarea>
      <label class="text-xs text-nl-muted">Arco narrativo</label>
      <textarea data-f="narrativeArc" rows="3" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm">${escapeHtml(ch.narrativeArc)}</textarea>
      <button type="button" data-save-char class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Guardar</button>
    </div>
  `;
}

/**
 * Línea de tiempo + edición de eventos en la misma vista.
 */
export function renderTimelineMerged(book, app) {
  const evs = sortByOrder((book.events || []).slice(), 'sortKey');
  return `
    <div class="max-w-3xl mx-auto p-6 space-y-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Línea de tiempo</h2>
          <p class="text-xs text-nl-muted mt-2 max-w-xl">Crea y edita eventos aquí. «Orden» controla la secuencia (número menor = antes en la línea).</p>
        </div>
        <button type="button" data-add-ev class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">+ Evento</button>
      </div>
      <ul class="space-y-3">
        ${evs.map((ev) => `
          <li class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-2">
            <div class="flex flex-wrap gap-2 items-center justify-between">
              <div class="flex flex-wrap gap-2 flex-1 min-w-0">
                <input data-ev-title="${ev.id}" class="flex-1 min-w-[140px] bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-white font-medium" value="${escapeHtml(ev.title)}" placeholder="Título" />
                <input data-ev-date="${ev.id}" class="w-36 md:w-44 bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-xs" placeholder="Fecha / etiqueta" value="${escapeHtml(ev.dateLabel)}" />
                <label class="flex items-center gap-1 text-xs text-nl-muted"><span>Orden</span>
                  <input data-ev-sort="${ev.id}" type="number" class="w-16 bg-nl-raised border border-nl-border rounded px-1 py-1" value="${ev.sortKey}" />
                </label>
              </div>
              <button type="button" data-del-ev="${ev.id}" class="text-xs text-red-400 hover:text-red-300 px-2 shrink-0">Eliminar</button>
            </div>
            <textarea data-ev-body="${ev.id}" rows="3" class="w-full text-sm bg-nl-bg border border-nl-border rounded px-2 py-2 text-slate-200">${escapeHtml(ev.content)}</textarea>
          </li>
        `).join('') || '<li class="text-nl-muted text-sm">Sin eventos. Pulsa «+ Evento».</li>'}
      </ul>
      <div>
        <h3 class="text-sm font-medium text-slate-300 mb-4">Vista cronológica</h3>
        <div class="relative pl-8">
          <div class="absolute left-3 top-0 bottom-0 w-px nl-timeline-line"></div>
          ${evs.map((ev) => `
            <div class="relative mb-8">
              <div class="absolute -left-5 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-nl-bg"></div>
              <div class="text-xs text-indigo-300 mb-1">${escapeHtml(ev.dateLabel || '—')}</div>
              <div class="font-medium text-white">${escapeHtml(ev.title || 'Evento')}</div>
              <div class="text-sm text-nl-muted mt-1">${escapeHtml((ev.content || '').slice(0, 280))}</div>
            </div>
          `).join('') || '<p class="text-nl-muted text-sm">Añade eventos arriba.</p>'}
        </div>
      </div>
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
 * @param {import('./types.js').Book} book
 * @param {import('./types.js').ExtraBlock} eb
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

/**
 * @param {import('./types.js').Book} book
 */
export function renderActsView(book, app) {
  const acts = sortByOrder(book.acts || [], 'order');
  const chapters = sortByOrder(book.chapters, 'order');
  return `
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Actos</h2>
          <p class="text-xs text-nl-muted mt-2">Vincula capítulos a cada acto. Un capítulo solo puede estar en un acto a la vez.</p>
        </div>
        <button type="button" data-add-act class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white">+ Acto</button>
      </div>
      ${acts.map((act) => `
        <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
          <div class="flex flex-wrap justify-between gap-2 items-center">
            <input data-act-title="${act.id}" class="flex-1 min-w-[160px] bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm text-white font-medium" value="${escapeHtml(act.title)}" />
            <button type="button" data-del-act="${act.id}" class="text-xs text-red-400 hover:text-red-300 px-2">Eliminar acto</button>
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
        </section>
      `).join('') || '<p class="text-nl-muted text-sm">Sin actos. Pulsa «+ Acto».</p>'}
    </div>
  `;
}

export function renderAppSettingsPanel() {
  const rawMs = getAutosaveMs();
  const opts = [2000, 4000, 8000, 12000];
  const ms = opts.reduce((a, b) => (Math.abs(b - rawMs) < Math.abs(a - rawMs) ? b : a), 4000);
  const pm = getProgressMode();
  return `
    <div class="max-w-xl mx-auto p-6 space-y-6">
      <h2 class="text-lg font-semibold text-white">Ajustes</h2>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Guardado automático</h3>
        <p class="text-xs text-nl-muted">Frecuencia con la que se guarda el workspace en el navegador (IndexedDB).</p>
        <select data-app-autosave class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-slate-200">
          ${opts.map((v) => `<option value="${v}" ${ms === v ? 'selected' : ''}>Cada ${v / 1000} s</option>`).join('')}
        </select>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Panel de progreso (conteo de palabras)</h3>
        <label class="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
          <input type="radio" name="nl-prog" value="boundary" class="mt-1" ${pm === 'boundary' ? 'checked' : ''} data-prog-mode />
          <span>Actualizar al pulsar <strong class="text-slate-200 font-medium">espacio</strong> o <strong class="text-slate-200 font-medium">punto</strong></span>
        </label>
        <label class="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
          <input type="radio" name="nl-prog" value="debounce" class="mt-1" ${pm === 'debounce' ? 'checked' : ''} data-prog-mode />
          <span>Actualizar mientras escribes (ligero retraso)</span>
        </label>
        <p class="text-xs text-nl-muted">El modo de progreso se aplica al abrir o cambiar de editor.</p>
      </section>
      <button type="button" data-save-app-settings class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500">Guardar ajustes</button>
    </div>
  `;
}


export function renderNotesList(book, app) {
  return `
    <div class="max-w-3xl mx-auto p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Notas</h2>
        <button type="button" data-add-note class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Nota</button>
      </div>
      <ul class="space-y-2">
        ${book.notes.map((n) => `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-note="${n.id}" class="flex-1 text-left p-3 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40">
              <div class="font-medium text-white">${escapeHtml(n.title)}</div>
            </button>
            <button type="button" data-del-note="${n.id}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>
        `).join('') || '<li class="text-sm text-nl-muted">Sin notas.</li>'}
      </ul>
    </div>
  `;
}

export function renderNoteEditor(note, app) {
  return `
    <div class="max-w-3xl mx-auto w-full p-6 space-y-4">
      <button type="button" data-back-notes class="text-sm text-indigo-400 hover:text-indigo-300">← Notas</button>
      <input data-note-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white" value="${escapeHtml(note.title)}" />
      <div class="rounded-xl border border-nl-border overflow-hidden bg-nl-surface">
        ${toolbarHtml()}
        <div data-ed-note class="nl-editor min-h-[200px]"></div>
      </div>
      <button type="button" data-save-note class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500">Guardar nota</button>
    </div>
  `;
}

export function renderHighlights(book, app) {
  return `
    <div class="max-w-3xl mx-auto p-6">
      <h2 class="text-lg font-semibold text-white mb-6">Frases destacadas</h2>
      <ul class="space-y-3">
        ${book.highlights.map((h) => `
          <li class="p-3 rounded-lg border border-nl-border bg-nl-surface flex justify-between gap-3">
            <blockquote class="text-slate-200 text-sm flex-1">${escapeHtml(h.excerpt)}</blockquote>
            <button type="button" data-del-hl="${h.id}" class="text-xs text-red-400 hover:text-red-300">Eliminar</button>
          </li>
        `).join('') || '<li class="text-nl-muted text-sm">Selecciona texto en el editor y usa «Destacar selección».</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {string} iso
 */
function formatSnapshotDate(iso) {
  try {
    return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(iso || '');
  }
}

/**
 * @param {Book} book
 */
export function renderAnalysisPanel(book) {
  const health = getBookHealth(book);
  const stats = getBookStats(book);
  const narrativeOnly = detectNarrativeIssues(book);
  const timelineIssues = getTimelineConflicts(book);

  const issueRow = (/** @type {import('./types.js').NarrativeIssue} */ i) => {
    const icon = i.severity === 'warning' ? '❗' : 'ℹ️';
    const cls = i.severity === 'warning' ? 'text-amber-200/90' : 'text-slate-400';
    return `<li class="text-sm ${cls} pl-1 border-l-2 ${i.severity === 'warning' ? 'border-amber-500/60' : 'border-nl-border'}">${icon} ${escapeHtml(i.message)}</li>`;
  };

  return `
    <div class="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h2 class="text-lg font-semibold text-white mb-1">Análisis del libro</h2>
        <p class="text-sm text-nl-muted">Avisos importantes y sugerencias informativas. El contador del menú solo cuenta avisos (❗).</p>
      </div>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Salud narrativa</h3>
        <div class="flex items-baseline gap-3">
          <span class="text-4xl font-semibold text-white tabular-nums">${health.score}</span>
          <span class="text-sm text-nl-muted">/ 100</span>
        </div>
        <ul class="text-sm space-y-1 text-emerald-400/90">
          ${health.strengths.length ? health.strengths.map((s) => `<li>✓ ${escapeHtml(s)}</li>`).join('') : '<li class="text-nl-muted">Aún no hay fortalezas destacadas.</li>'}
        </ul>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Resumen</h3>
        <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div><dt class="text-nl-muted">Palabras</dt><dd class="text-white tabular-nums">${stats.totalWords.toLocaleString()}</dd></div>
          <div><dt class="text-nl-muted">Capítulos</dt><dd class="text-white tabular-nums">${stats.chapterCount}</dd></div>
          <div><dt class="text-nl-muted">Escenas</dt><dd class="text-white tabular-nums">${stats.sceneCount}</dd></div>
          <div><dt class="text-nl-muted">Personajes</dt><dd class="text-white tabular-nums">${stats.characterCount}</dd></div>
          <div><dt class="text-nl-muted">Con vínculos</dt><dd class="text-white tabular-nums">${stats.activeCharacters}</dd></div>
          <div><dt class="text-nl-muted">Lectura (~${200} pal/min)</dt><dd class="text-white tabular-nums">~${stats.readingMinutes} min</dd></div>
        </dl>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Detalle (${narrativeOnly.length} ítems)</h3>
        <ul class="space-y-2">
          ${narrativeOnly.length ? narrativeOnly.map(issueRow).join('') : '<li class="text-sm text-nl-muted">No se detectaron problemas en capítulos, escenas o vínculos obligatorios.</li>'}
        </ul>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-2">
        <h3 class="text-sm font-medium text-slate-200">Línea de tiempo</h3>
        <ul class="space-y-2 text-sm">
          ${
            timelineIssues.length
              ? timelineIssues
                  .map((t) => {
                    const icon = t.severity === 'warning' ? '❗' : 'ℹ️';
                    return `<li class="${t.severity === 'warning' ? 'text-amber-200/90' : 'text-slate-400'}">${icon} ${escapeHtml(t.message)}</li>`;
                  })
                  .join('')
              : '<li class="text-nl-muted">Sin conflictos detectados en orden o fechas.</li>'
          }
        </ul>
      </section>
    </div>
  `;
}

/**
 * @param {Book} book
 * @param {import('./app.js').App} app
 */
export function renderGraphHost(book, app) {
  const mode = app.state.graphMode || 'chars_chapters';
  const btn = (m, label) =>
    `<button type="button" data-graph-mode="${m}" class="px-3 py-1.5 rounded-lg text-xs border ${
      mode === m ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-nl-border text-slate-300 hover:bg-nl-raised'
    }">${label}</button>`;
  return `
    <div class="max-w-5xl mx-auto p-6 space-y-4 flex flex-col min-h-0 flex-1">
      <div>
        <h2 class="text-lg font-semibold text-white mb-1">Mapa de relaciones</h2>
        <p class="text-sm text-nl-muted">Visualización según el alcance elegido. La vista «Relaciones» sigue siendo donde se editan los vínculos.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        ${btn('characters', 'Solo personajes')}
        ${btn('chars_chapters', 'Personajes + capítulos')}
        ${btn('all', 'Todo')}
      </div>
      <div data-graph-host class="min-h-[420px] flex-1 rounded-xl border border-nl-border bg-nl-bg overflow-hidden"></div>
    </div>
  `;
}

export function renderSnapshots(book, app) {
  const snapOpts =
    book.snapshots.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)} (${escapeHtml(formatSnapshotDate(s.createdAt))})</option>`).join('') ||
    '<option value="">Sin snapshots</option>';
  return `
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <h2 class="text-lg font-semibold text-white">Historial de versiones</h2>
      <div class="flex flex-wrap gap-2">
        <input data-snap-label placeholder="Etiqueta del snapshot" class="flex-1 bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" />
        <button type="button" data-save-snap class="px-3 py-2 rounded-lg bg-indigo-600 text-sm text-white">Guardar snapshot</button>
      </div>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Comparar snapshots</h3>
        <p class="text-xs text-nl-muted">Elige dos versiones y revisa diferencias de palabras, estructura y capítulos cambiados (por id).</p>
        <div class="flex flex-col sm:flex-row sm:items-end gap-2">
          <label class="flex-1 text-xs text-nl-muted">Versión A
            <select data-snap-diff-a class="mt-1 w-full bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-sm text-white">${snapOpts}</select>
          </label>
          <label class="flex-1 text-xs text-nl-muted">Versión B
            <select data-snap-diff-b class="mt-1 w-full bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-sm text-white">${snapOpts}</select>
          </label>
          <button type="button" data-snap-compare class="px-3 py-2 rounded-lg bg-indigo-600 text-sm text-white shrink-0">Comparar</button>
        </div>
        <div data-snap-diff-result class="hidden text-xs space-y-2 text-slate-300 border-t border-nl-border pt-3"></div>
      </section>
      <ul class="space-y-2">
        ${book.snapshots.map((s) => `
          <li class="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border border-nl-border bg-nl-surface">
            <div class="flex-1 min-w-0 space-y-1">
              <label class="sr-only" for="snap-label-${s.id}">Nombre del snapshot</label>
              <input type="text" id="snap-label-${s.id}" data-snap-label-edit="${s.id}" value="${escapeHtml(s.label)}" class="w-full bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-sm text-white" />
              <div class="text-xs text-nl-muted">${escapeHtml(formatSnapshotDate(s.createdAt))}</div>
            </div>
            <div class="flex shrink-0 items-center gap-3 sm:pt-0.5">
              <button type="button" data-restore="${s.id}" class="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap">Restaurar…</button>
              <button type="button" data-del-snap="${s.id}" class="text-xs text-red-400 hover:text-red-300 whitespace-nowrap">Eliminar</button>
            </div>
          </li>
        `).join('') || '<li class="text-sm text-nl-muted">No hay snapshots.</li>'}
      </ul>
    </div>
  `;
}

export function renderRelations(book, app) {
  const chars = book.characters || [];
  const chapters = sortByOrder(book.chapters || [], 'order');
  const events = book.events || [];
  return `
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <h2 class="text-lg font-semibold text-white">Relaciones</h2>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Personaje → Capítulo</h3>
        <div class="flex flex-wrap gap-2">
          <select data-rel-pc-char class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Personaje</option>
            ${chars.map((c) => `<option value="${c.id}">${escapeHtml(c.name || 'Sin nombre')}</option>`).join('')}
          </select>
          <select data-rel-pc-ch class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Capítulo</option>
            ${chapters.map((c) => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('')}
          </select>
          <button type="button" data-rel-pc-add class="px-3 py-1 rounded bg-indigo-600 text-sm text-white">Vincular</button>
        </div>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Personaje → Escena</h3>
        <div class="flex flex-wrap gap-2">
          <select data-rel-ps-char class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Personaje</option>
            ${chars.map((c) => `<option value="${c.id}">${escapeHtml(c.name || 'Sin nombre')}</option>`).join('')}
          </select>
          <select data-rel-ps-ch class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Capítulo</option>
            ${chapters.map((c) => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('')}
          </select>
          <select data-rel-ps-sc class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Escena</option>
          </select>
          <button type="button" data-rel-ps-add class="px-3 py-1 rounded bg-indigo-600 text-sm text-white">Vincular</button>
        </div>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Evento ↔ Evento</h3>
        <div class="flex flex-wrap gap-2">
          <select data-rel-ee-a class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Evento A</option>
            ${events.map((e) => `<option value="${e.id}">${escapeHtml(e.title || 'Evento')}</option>`).join('')}
          </select>
          <select data-rel-ee-b class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Evento B</option>
            ${events.map((e) => `<option value="${e.id}">${escapeHtml(e.title || 'Evento')}</option>`).join('')}
          </select>
          <button type="button" data-rel-ee-add class="px-3 py-1 rounded bg-indigo-600 text-sm text-white">Vincular</button>
        </div>
      </section>
      <ul class="text-xs space-y-1 text-slate-400">
        ${listRelationships(book).map((r) => `
          <li class="flex justify-between gap-2">
            <span>${escapeHtml(r.type)} · ${escapeHtml(r.from.id)} → ${escapeHtml(r.to.id)}</span>
            <button type="button" data-rel-del="${r.id}" class="text-red-400">✕</button>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

export function renderExportPanel(book, app) {
  return `
    <div class="max-w-xl mx-auto p-6 space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-white mb-2">Exportar libro</h2>
        <p class="text-sm text-nl-muted">Incluye prólogo, capítulos, escenas, epílogo, extras y frases destacadas.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button type="button" data-exp="md" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Markdown (.md)</button>
        <button type="button" data-exp="txt" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Texto (.txt)</button>
        <button type="button" data-exp="pdf" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">PDF (imprimir)</button>
        <button type="button" data-exp="docx" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Word (.docx)</button>
        <button type="button" data-exp="epub" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">EPUB</button>
      </div>
    </div>
  `;
}
