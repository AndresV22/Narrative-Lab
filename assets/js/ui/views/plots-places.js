/**
 * Tramas y lugares — Narrative Lab
 */

import { escapeHtml, sortByOrder } from '../../core/utils.js';
import { editorCardWithHost } from '../../editor/editor.js';
import { listRelationships } from '../../narrative/relations.js';
import { formatCharacterDisplayName } from '../../domain/character-display.js';

/**
 * @param {string} k
 */
function plotKindUiLabel(k) {
  if (k === 'principal') return 'Principal';
  if (k === 'secundaria') return 'Secundaria';
  if (k === 'subtrama') return 'Subtrama';
  return k;
}

/**
 * @param {string} s
 */
function plotStatusUiLabel(s) {
  if (s === 'no_iniciada') return 'No iniciada';
  if (s === 'en_desarrollo') return 'En desarrollo';
  if (s === 'resuelta') return 'Resuelta';
  return s;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').Relationship} r
 * @param {string} plotId
 */
function plotRelLineLabel(book, r, plotId) {
  if (r.from.kind === 'plot' && r.from.id === plotId) {
    if (r.to.kind === 'character') {
      const c = book.characters?.find((x) => x.id === r.to.id);
      return `Personaje: ${c ? formatCharacterDisplayName(c) : '—'}`;
    }
    if (r.to.kind === 'event') {
      const e = book.events?.find((x) => x.id === r.to.id);
      return `Evento: ${e?.title?.trim() || '—'}`;
    }
    if (r.to.kind === 'chapter') {
      const ch = book.chapters?.find((x) => x.id === r.to.id);
      return `Capítulo: ${ch?.title || '—'}`;
    }
  }
  if (r.to.kind === 'plot' && r.to.id === plotId && r.from.kind === 'place') {
    const pl = book.places?.find((x) => x.id === r.from.id);
    return `Lugar: ${pl?.name || '—'}`;
  }
  return r.type;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {string} plotId
 */
function plotRelSummaryHtml(book, plotId) {
  const rels = listRelationships(book).filter(
    (r) =>
      (r.from.kind === 'plot' && r.from.id === plotId) || (r.to.kind === 'plot' && r.to.id === plotId)
  );
  if (!rels.length) {
    return '<p class="text-xs text-nl-muted">Sin vínculos. Usa los selectores de abajo para añadir personajes, eventos o capítulos.</p>';
  }
  const lines = rels.map((r) => {
    const line = plotRelLineLabel(book, r, plotId);
    return `<li class="flex items-start justify-between gap-2 py-1 border-b border-nl-border/60 last:border-0">
      <span class="text-xs text-slate-300">${escapeHtml(line)}</span>
      <button type="button" data-plot-rel-rm="${r.id}" class="text-[11px] text-red-400/90 hover:text-red-300 shrink-0">Quitar</button>
    </li>`;
  });
  return `<ul class="space-y-0">${lines.join('')}</ul>`;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').Relationship} r
 * @param {string} placeId
 */
function placeRelLineLabel(book, r, placeId) {
  if (r.from.kind === 'place' && r.from.id === placeId) {
    if (r.to.kind === 'character') {
      const c = book.characters?.find((x) => x.id === r.to.id);
      return `Personaje: ${c ? formatCharacterDisplayName(c) : '—'}`;
    }
    if (r.to.kind === 'plot') {
      const p = book.plots?.find((x) => x.id === r.to.id);
      return `Trama: ${p?.title || '—'}`;
    }
    if (r.to.kind === 'event') {
      const e = book.events?.find((x) => x.id === r.to.id);
      return `Evento: ${e?.title?.trim() || '—'}`;
    }
  }
  if (r.to.kind === 'place' && r.to.id === placeId && r.from.kind === 'character') {
    const c = book.characters?.find((x) => x.id === r.from.id);
    return `Personaje: ${c ? formatCharacterDisplayName(c) : '—'}`;
  }
  return r.type;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {string} placeId
 */
function placeRelSummaryHtml(book, placeId) {
  const rels = listRelationships(book).filter(
    (r) =>
      (r.from.kind === 'place' && r.from.id === placeId) || (r.to.kind === 'place' && r.to.id === placeId)
  );
  if (!rels.length) {
    return '<p class="text-xs text-nl-muted">Sin vínculos. Usa los selectores de abajo para añadir personajes, tramas o eventos.</p>';
  }
  const lines = rels.map((r) => {
    const line = placeRelLineLabel(book, r, placeId);
    return `<li class="flex items-start justify-between gap-2 py-1 border-b border-nl-border/60 last:border-0">
      <span class="text-xs text-slate-300">${escapeHtml(line)}</span>
      <button type="button" data-place-rel-rm="${r.id}" class="text-[11px] text-red-400/90 hover:text-red-300 shrink-0">Quitar</button>
    </li>`;
  });
  return `<ul class="space-y-0">${lines.join('')}</ul>`;
}

/**
 * @param {import('../../core/types.js').Book} book
 */
export function renderPlotsList(book) {
  const plots = [...(book.plots || [])].sort((a, b) =>
    String(a.title || '').localeCompare(String(b.title || ''), 'es')
  );
  return `
    <div class="nl-view">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Tramas</h2>
        <button type="button" data-add-plot class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Nueva trama</button>
      </div>
      <ul class="space-y-2">
        ${plots
          .map((p) => {
            const pct = typeof p.progressPercent === 'number' ? Math.max(0, Math.min(100, p.progressPercent)) : 0;
            const kindClass =
              p.plotKind === 'principal'
                ? 'bg-amber-500/20 text-amber-100 border border-amber-500/35'
                : p.plotKind === 'secundaria'
                  ? 'bg-slate-600/40 text-slate-200 border border-nl-border'
                  : 'bg-nl-raised text-slate-300 border border-nl-border';
            return `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-plot="${p.id}" class="flex-1 text-left p-3 sm:p-4 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40 transition-colors">
              <div class="font-medium text-white text-base leading-snug">${escapeHtml(p.title || 'Sin título')}</div>
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${kindClass}">${escapeHtml(plotKindUiLabel(p.plotKind))}</span>
                <span class="inline-flex items-baseline gap-1 tabular-nums">
                  <span class="text-lg font-semibold text-indigo-300">${pct}</span><span class="text-xs text-indigo-300/80">%</span>
                  <span class="text-[10px] text-nl-muted ml-0.5">completado</span>
                </span>
                <span class="text-xs text-slate-400 border-l border-nl-border pl-3">${escapeHtml(plotStatusUiLabel(p.status))}</span>
              </div>
            </button>
            <button type="button" data-del-plot="${p.id}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>`;
          })
          .join('') || '<li class="text-sm text-nl-muted">Sin tramas. Crea una y vincula personajes, eventos y capítulos desde el editor.</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').Plot} plot
 */
export function renderPlotEditor(book, plot) {
  const charOpts = (book.characters || [])
    .map(
      (c) =>
        `<option value="${escapeHtml(c.id)}">${escapeHtml(formatCharacterDisplayName(c))}</option>`
    )
    .join('');
  const evOpts = (book.events || [])
    .map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title || 'Evento')}</option>`)
    .join('');
  const chOpts = sortByOrder(book.chapters || [], 'order')
    .map((ch) => `<option value="${escapeHtml(ch.id)}">${escapeHtml(ch.title)}</option>`)
    .join('');

  const ms = sortByOrder((plot.milestones || []).slice(), 'order');
  const milestoneRows = ms
    .map(
      (m) => `
    <li class="flex flex-wrap items-center gap-2 p-2 rounded border border-nl-border bg-nl-bg/50">
      <input type="text" data-mile-title="${m.id}" class="flex-1 min-w-[8rem] bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm text-white" value="${escapeHtml(m.title)}" placeholder="Hito" />
      <label class="flex items-center gap-1 text-xs text-nl-muted shrink-0">
        <input type="checkbox" data-mile-done="${m.id}" class="rounded border-nl-border" ${m.completed ? 'checked' : ''} />
        Hecho
      </label>
      <button type="button" data-mile-del="${m.id}" class="text-xs text-red-400 hover:text-red-300 shrink-0">Quitar</button>
    </li>`
    )
    .join('');
  return `
    <div class="nl-view-editor">
    <div class="w-full max-w-3xl mx-auto space-y-6">
      <button type="button" data-back-plots class="text-sm text-indigo-400 hover:text-indigo-300">← Tramas</button>
      <input data-plot-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white" value="${escapeHtml(plot.title)}" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="text-xs text-nl-muted flex flex-col gap-1">Tipo
          <select data-plot-kind class="bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
            <option value="principal" ${plot.plotKind === 'principal' ? 'selected' : ''}>Principal</option>
            <option value="secundaria" ${plot.plotKind === 'secundaria' ? 'selected' : ''}>Secundaria</option>
            <option value="subtrama" ${plot.plotKind === 'subtrama' ? 'selected' : ''}>Subtrama</option>
          </select>
        </label>
        <label class="text-xs text-nl-muted flex flex-col gap-1">Estado
          <select data-plot-status class="bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
            <option value="no_iniciada" ${plot.status === 'no_iniciada' ? 'selected' : ''}>No iniciada</option>
            <option value="en_desarrollo" ${plot.status === 'en_desarrollo' ? 'selected' : ''}>En desarrollo</option>
            <option value="resuelta" ${plot.status === 'resuelta' ? 'selected' : ''}>Resuelta</option>
          </select>
        </label>
      </div>
      <label class="text-xs text-nl-muted flex flex-col gap-1">Objetivo de la trama
        <textarea data-plot-goal rows="2" class="w-full bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">${escapeHtml(plot.narrativeGoal)}</textarea>
      </label>
      <label class="text-xs text-nl-muted flex flex-col gap-1">Conflicto principal
        <textarea data-plot-conflict rows="2" class="w-full bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">${escapeHtml(plot.mainConflict)}</textarea>
      </label>
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-xs text-nl-muted flex flex-col gap-1">Progreso (%)
          <input type="number" min="0" max="100" data-plot-progress class="w-24 bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200 tabular-nums" value="${plot.progressPercent}" />
        </label>
      </div>
      <div>
        <h3 class="text-sm font-medium text-slate-200 mb-2">Descripción</h3>
        ${editorCardWithHost('data-ed-plot class="nl-editor min-h-[180px]"')}
      </div>
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 class="text-sm font-medium text-slate-200">Hitos</h3>
          <button type="button" data-plot-add-milestone class="text-xs px-2 py-1 rounded border border-nl-border text-indigo-300 hover:bg-nl-raised">+ Hito</button>
        </div>
        <ul data-plot-milestones class="space-y-2">${milestoneRows || '<li class="text-xs text-nl-muted">Sin hitos.</li>'}</ul>
      </div>
      <div class="p-4 rounded-xl border border-nl-border bg-nl-surface/80 space-y-4">
        <h3 class="text-sm font-medium text-slate-200">Relaciones</h3>
        ${plotRelSummaryHtml(book, plot.id)}
        <div class="space-y-3 pt-1 border-t border-nl-border/70">
          <p class="text-[10px] text-nl-muted uppercase tracking-wide">Añadir vínculo</p>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label class="flex-1 min-w-0 text-xs text-nl-muted flex flex-col gap-1">Personaje
              <select data-plot-sel-char class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Elegir —</option>${charOpts}
              </select>
            </label>
            <button type="button" data-plot-add-char class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs hover:bg-indigo-500 sm:mb-0.5">Vincular</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label class="flex-1 min-w-0 text-xs text-nl-muted flex flex-col gap-1">Evento
              <select data-plot-sel-ev class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Elegir —</option>${evOpts}
              </select>
            </label>
            <button type="button" data-plot-add-ev class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs hover:bg-indigo-500 sm:mb-0.5">Vincular</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label class="flex-1 min-w-0 text-xs text-nl-muted flex flex-col gap-1">Capítulo
              <select data-plot-sel-ch class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Elegir —</option>${chOpts}
              </select>
            </label>
            <button type="button" data-plot-add-ch class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs hover:bg-indigo-500 sm:mb-0.5">Vincular</button>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-save-plot class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500">Guardar trama</button>
        <button type="button" data-del-plot-editor class="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10">Eliminar trama</button>
      </div>
    </div>
    </div>
  `;
}

/**
 * @param {import('../../core/types.js').Book} book
 */
export function renderPlacesList(book) {
  const places = [...(book.places || [])].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'es')
  );
  return `
    <div class="nl-view">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Lugares</h2>
        <button type="button" data-add-place class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Nuevo lugar</button>
      </div>
      <ul class="space-y-2">
        ${places
          .map(
            (p) => `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-place="${p.id}" class="flex-1 text-left p-3 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40">
              <div class="font-medium text-white">${escapeHtml(p.name || 'Sin nombre')}</div>
              <div class="text-[11px] text-nl-muted mt-1">${escapeHtml(p.placeKind)}</div>
            </button>
            <button type="button" data-del-place="${p.id}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>`
          )
          .join('') || '<li class="text-sm text-nl-muted">Sin lugares.</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').Place} place
 */
export function renderPlaceEditor(book, place) {
  const charOpts = (book.characters || [])
    .map(
      (c) =>
        `<option value="${escapeHtml(c.id)}">${escapeHtml(formatCharacterDisplayName(c))}</option>`
    )
    .join('');
  const plotOpts = (book.plots || [])
    .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title || 'Trama')}</option>`)
    .join('');
  const evOpts = (book.events || [])
    .map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title || 'Evento')}</option>`)
    .join('');

  return `
    <div class="nl-view-editor">
    <div class="w-full max-w-3xl mx-auto space-y-6">
      <button type="button" data-back-places class="text-sm text-indigo-400 hover:text-indigo-300">← Lugares</button>
      <input data-place-name class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white" value="${escapeHtml(place.name)}" placeholder="Nombre del lugar" />
      <label class="text-xs text-nl-muted flex flex-col gap-1 max-w-xs">Tipo
        <select data-place-kind class="bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
          <option value="ciudad" ${place.placeKind === 'ciudad' ? 'selected' : ''}>Ciudad</option>
          <option value="pueblo" ${place.placeKind === 'pueblo' ? 'selected' : ''}>Pueblo</option>
          <option value="pais" ${place.placeKind === 'pais' ? 'selected' : ''}>País</option>
          <option value="region" ${place.placeKind === 'region' ? 'selected' : ''}>Región</option>
          <option value="otro" ${place.placeKind === 'otro' ? 'selected' : ''}>Otro</option>
        </select>
      </label>
      <div>
        <h3 class="text-sm font-medium text-slate-200 mb-2">Descripción</h3>
        ${editorCardWithHost('data-ed-place class="nl-editor min-h-[200px]"')}
      </div>
      <div class="p-4 rounded-xl border border-nl-border bg-nl-surface/80 space-y-4">
        <h3 class="text-sm font-medium text-slate-200">Relaciones</h3>
        ${placeRelSummaryHtml(book, place.id)}
        <div class="space-y-3 pt-1 border-t border-nl-border/70">
          <p class="text-[10px] text-nl-muted uppercase tracking-wide">Añadir vínculo</p>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label class="flex-1 min-w-0 text-xs text-nl-muted flex flex-col gap-1">Personaje
              <select data-place-sel-char class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Elegir —</option>${charOpts}
              </select>
            </label>
            <button type="button" data-place-add-char class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs hover:bg-indigo-500 sm:mb-0.5">Vincular</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label class="flex-1 min-w-0 text-xs text-nl-muted flex flex-col gap-1">Trama
              <select data-place-sel-plot class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Elegir —</option>${plotOpts}
              </select>
            </label>
            <button type="button" data-place-add-plot class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs hover:bg-indigo-500 sm:mb-0.5">Vincular</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
            <label class="flex-1 min-w-0 text-xs text-nl-muted flex flex-col gap-1">Evento
              <select data-place-sel-ev class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Elegir —</option>${evOpts}
              </select>
            </label>
            <button type="button" data-place-add-ev class="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs hover:bg-indigo-500 sm:mb-0.5">Vincular</button>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" data-save-place class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500">Guardar lugar</button>
        <button type="button" data-del-place-editor class="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10">Eliminar lugar</button>
      </div>
    </div>
    </div>
  `;
}
