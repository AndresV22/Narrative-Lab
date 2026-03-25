/**
 * Personajes — Narrative Lab
 */

import { CHARACTER_ROLES, characterRoleLabel } from '../../character-roles.js';
import { escapeHtml } from '../../utils.js';
import { listRelationships, CHARACTER_LINK_ROLE_OPTIONS } from '../../relations.js';

/**
 * @param {import('../../types.js').Book} book
 */
export function renderCharacterList(book, _app) {
  return `
    <div class="nl-view">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Personajes</h2>
        <div class="flex flex-wrap items-center gap-2 justify-end">
          <button type="button" data-all-chars-pdf class="shrink-0 px-3 py-2 rounded-lg border border-nl-border text-sm text-slate-200 hover:bg-nl-raised">PDF — todos los personajes</button>
          <button type="button" data-add-char class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Personaje</button>
        </div>
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
export function renderCharacterForm(book, ch, _app) {
  const rels = listRelationships(book).filter(
    (r) =>
      r.type === 'character_character' &&
      r.from.kind === 'character' &&
      r.to.kind === 'character' &&
      (r.from.id === ch.id || r.to.id === ch.id)
  );
  const rows = rels
    .map((r) => {
      const otherId = r.from.id === ch.id ? r.to.id : r.from.id;
      const other = book.characters.find((c) => c.id === otherId);
      const roleVal = r.meta && typeof r.meta.role === 'string' ? r.meta.role : '';
      const roleLabel =
        CHARACTER_LINK_ROLE_OPTIONS.find((o) => o.value === roleVal)?.label || roleVal || '—';
      return `
        <li class="flex flex-wrap gap-2 items-center justify-between text-sm border border-nl-border rounded-lg px-3 py-2 bg-nl-surface/50">
          <span class="text-slate-300">${escapeHtml(other?.name || otherId)} — ${escapeHtml(roleLabel)}</span>
          <button type="button" data-cc-del-rel="${r.id}" class="text-red-400 text-xs hover:text-red-300">Quitar</button>
        </li>
      `;
    })
    .join('');
  const otherOptions = book.characters
    .filter((c) => c.id !== ch.id)
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name || 'Sin nombre')}</option>`)
    .join('');
  const roleOpts =
    `<option value="">Tipo de vínculo</option>` +
    CHARACTER_LINK_ROLE_OPTIONS.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');

  return `
    <div class="nl-view space-y-3">
      <button type="button" data-back-char class="flex items-center gap-1.5 text-sm text-indigo-400 w-fit"><i class="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i> Personajes</button>
      <div class="flex gap-4">
        <div class="shrink-0 flex flex-col gap-2 w-full max-w-[200px] sm:w-40">
          <div class="w-24 h-24 rounded-xl border border-nl-border bg-nl-raised overflow-hidden">
            ${ch.imageDataUrl ? `<img src="${ch.imageDataUrl}" alt="" class="w-full h-full object-cover cursor-pointer" data-char-img/>` : '<div class="w-full h-full flex items-center justify-center text-xs text-nl-muted">Sin imagen</div>'}
          </div>
          <input type="file" accept="image/*" data-char-file class="w-full text-xs text-nl-muted file:mr-2" />
          ${ch.imageDataUrl ? `<button type="button" data-char-img-zoom class="w-full text-left text-xs text-indigo-400 hover:text-indigo-300 py-1">Ver imagen</button>` : ''}
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

      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Relaciones con otros personajes</h3>
        <ul class="space-y-1">${rows || '<li class="text-nl-muted text-xs">Ninguna aún.</li>'}</ul>
        <div class="flex flex-col sm:flex-row flex-wrap gap-2">
          <select data-cc-other class="flex-1 min-w-[140px] bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
            <option value="">Otro personaje</option>
            ${otherOptions}
          </select>
          <select data-cc-role class="flex-1 min-w-[140px] bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
            ${roleOpts}
          </select>
          <button type="button" data-cc-add class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Añadir vínculo</button>
        </div>
        <div>
          <label class="text-xs text-nl-muted">Nota sobre el vínculo (opcional)</label>
          <textarea data-cc-desc rows="2" class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm mt-1" placeholder="Ej. detalle del parentesco…"></textarea>
        </div>
      </section>

      <div class="flex flex-wrap items-center gap-2">
        <button type="button" data-char-pdf class="px-4 py-2 rounded-lg border border-nl-border text-sm text-slate-200 hover:bg-nl-raised">PDF — esta ficha</button>
        <button type="button" data-save-char class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Guardar</button>
      </div>
    </div>
  `;
}
