/**
 * Personajes — Narrative Lab
 */

import { CHARACTER_ROLES, characterRoleLabel } from '../../character-roles.js';
import { escapeHtml } from '../../utils.js';

/**
 * @param {import('../../types.js').Book} book
 */
export function renderCharacterList(book, _app) {
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
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-medium text-white truncate">${escapeHtml(c.name || 'Sin nombre')}</span>
                  <span class="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-nl-border text-indigo-300/90">${escapeHtml(characterRoleLabel(c.role))}</span>
                </div>
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

/**
 * @param {import('../../types.js').Book} book
 * @param {import('../../types.js').Character} ch
 */
export function renderCharacterForm(_book, ch, _app) {
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
          <label class="text-xs text-nl-muted">Papel en la historia</label>
          <select data-f="role" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm text-slate-200">
            ${CHARACTER_ROLES.map((r) => {
              const sel = (ch.role || 'secundario') === r ? ' selected' : '';
              return `<option value="${r}"${sel}>${escapeHtml(characterRoleLabel(r))}</option>`;
            }).join('')}
          </select>
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
