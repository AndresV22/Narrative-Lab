/**
 * Reglas del mundo (lista y editor) — Narrative Lab
 */

import { escapeHtml } from '../../core/utils.js';
import { editorCardWithHost } from '../../editor/editor.js';

/**
 * @param {import('../../core/types.js').Book} book
 */
export function renderWorldRulesList(book) {
  const rules = book.rules || [];
  return `
    <div class="nl-view space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">Reglas del mundo</h2>
          <p class="text-xs text-nl-muted mt-2 max-w-xl">Define las leyes de tu ficción. Puedes tener varias reglas y editarlas por separado.</p>
        </div>
        <button type="button" data-add-world-rule class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">+ Nueva regla</button>
      </div>
      <ul class="space-y-2">
        ${rules.length
          ? rules
              .map(
                (r) => `
          <li class="flex items-center gap-2 p-3 rounded-lg border border-nl-border bg-nl-surface">
            <button type="button" data-open-world-rule="${escapeHtml(r.id)}" class="flex-1 text-left text-white hover:text-indigo-300 text-sm">${escapeHtml(r.title || 'Sin título')}</button>
            <button type="button" data-del-world-rule="${escapeHtml(r.id)}" class="text-xs text-red-400 hover:text-red-300 px-2 shrink-0">Eliminar</button>
          </li>`
              )
              .join('')
          : '<li class="text-sm text-nl-muted">No hay reglas. Crea una con «+ Nueva regla».</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {import('../../core/types.js').WorldRule} rule
 */
export function renderWorldRuleEditor(rule) {
  return `
    <div class="nl-view nl-view-grow space-y-4">
      <button type="button" data-back-world-rules class="text-sm text-indigo-400 hover:text-indigo-300 shrink-0">← Lista de reglas</button>
      <input data-world-rule-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white py-2 focus:outline-none focus:border-indigo-500" value="${escapeHtml(rule.title)}" placeholder="Título de la regla" />
      ${editorCardWithHost('data-ed-world-rule class="nl-editor flex-1 min-h-[240px]"')}
      <div class="flex flex-wrap gap-3 shrink-0">
        <button type="button" data-save-world-rule class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Guardar</button>
        <button type="button" data-del-world-rule-editor class="px-4 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10">Eliminar regla</button>
      </div>
    </div>
  `;
}
