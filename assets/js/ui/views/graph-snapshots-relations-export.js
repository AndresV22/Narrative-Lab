/**
 * Grafo, snapshots, relaciones y exportación — Narrative Lab
 */

import { escapeHtml, sortByOrder } from '../../utils.js';
import { listRelationships } from '../../relations.js';

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
 * @param {import('../../types.js').Book} book
 * @param {import('../../app.js').App} app
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

export function renderSnapshots(book, _app) {
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

export function renderRelations(book, _app) {
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

export function renderExportPanel(_book, _app) {
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
