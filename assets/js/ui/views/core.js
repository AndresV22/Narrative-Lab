/**
 * Metadatos y envoltorio del editor — Narrative Lab
 */

import { escapeHtml } from '../../utils.js';
import { toolbarHtml } from '../../editor.js';

export function wrapEditorSection(title, _field) {
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
 * @param {import('../../types.js').Book} book
 */
export function renderBookSettings(book) {
  const hasCover = !!book.coverImageDataUrl;
  const coverPreview = hasCover
    ? `<img src="${book.coverImageDataUrl}" alt="" class="w-full max-h-48 object-contain rounded-lg border border-nl-border bg-nl-bg" data-cover-preview />`
    : '<div class="w-full h-36 rounded-lg border border-dashed border-nl-border flex items-center justify-center text-xs text-nl-muted">Sin carátula</div>';
  return `
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <h2 class="text-lg font-semibold text-white">Metadatos</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Nombre</label>
          <input data-f="name" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.name)}" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Autor</label>
          <input data-f="author" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.author)}" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Fecha</label>
          <input data-f="date" type="date" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.date)}" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Categoría</label>
          <input data-f="category" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.category)}" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Tipo de narrador</label>
          <input data-f="narratorType" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.narratorType)}" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Estado</label>
          <select data-f="status" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm">
            ${['Borrador', 'En revisión', 'Publicado'].map((s) => `<option ${book.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="block text-xs text-nl-muted">Meta de palabras</label>
          <input data-f="wordGoal" type="number" min="0" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${book.wordGoal}" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <label class="block text-xs text-nl-muted">Carátula</label>
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="w-full sm:w-40 shrink-0">${coverPreview}</div>
            <div class="flex flex-col gap-2">
              <input type="file" accept="image/*" data-cover-file class="text-xs text-nl-muted" />
              <button type="button" data-cover-zoom class="text-left text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:pointer-events-none" ${hasCover ? '' : 'disabled'}>Ver en grande</button>
            </div>
          </div>
        </div>
      </div>
      <button type="button" data-save-meta class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Guardar cambios</button>
    </div>
  `;
}
