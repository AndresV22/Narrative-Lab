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
