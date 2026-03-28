/**
 * Personajes — Narrative Lab
 */

import { CHARACTER_ROLES, characterRoleLabel } from '../../domain/character-roles.js';
import { escapeHtml } from '../../core/utils.js';
import { formatCharacterDisplayName } from '../../domain/character-display.js';
import {
  listRelationships,
  CHARACTER_LINK_ROLE_OPTIONS,
  characterLinkPhraseForViewer,
} from '../../narrative/relations.js';

/**
 * @param {import('../../core/types.js').Book} book
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
                  <span class="font-medium text-white truncate">${escapeHtml(formatCharacterDisplayName(c))}</span>
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
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').Character} ch
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
      const phrase = characterLinkPhraseForViewer(ch.id, r, {
        viewerName: formatCharacterDisplayName(ch),
        otherName: other ? formatCharacterDisplayName(other) : otherId,
      });
      return `
        <li class="flex flex-wrap gap-2 items-center justify-between text-sm border border-nl-border rounded-lg px-3 py-2 bg-nl-surface/50">
          <span class="text-slate-300">${escapeHtml(phrase)}</span>
          <button type="button" data-cc-del-rel="${r.id}" class="text-red-400 text-xs hover:text-red-300">Quitar</button>
        </li>
      `;
    })
    .join('');
  const otherOptions = book.characters
    .filter((c) => c.id !== ch.id)
    .map((c) => `<option value="${c.id}">${escapeHtml(formatCharacterDisplayName(c))}</option>`)
    .join('');
  const roleOpts =
    `<option value="">Tipo de vínculo</option>` +
    CHARACTER_LINK_ROLE_OPTIONS.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');

  const ta = (field, label, rows, placeholder = '') => `
    <label class="text-xs text-nl-muted">${label}</label>
    <textarea data-f="${field}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" class="nl-textarea-autosize w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm max-h-96 overflow-y-auto">${escapeHtml(ch[field] || '')}</textarea>
  `;

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
        <div class="flex-1 space-y-2 min-w-0">
          <label class="text-xs text-nl-muted">Nombre</label>
          <input data-f="name" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.name)}" />
          <label class="text-xs text-nl-muted">Apellido paterno</label>
          <input data-f="paternalSurname" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.paternalSurname || '')}" />
          <label class="text-xs text-nl-muted">Apellido materno</label>
          <input data-f="maternalSurname" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.maternalSurname || '')}" />
          <label class="text-xs text-nl-muted">Apodos (separados por coma)</label>
          <input data-f="nicknames" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.nicknames || '')}" placeholder="Ej. Jay, J" />
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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-nl-muted">Lugar de nacimiento</label>
          <input data-f="birthPlace" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.birthPlace || '')}" />
        </div>
        <div>
          <label class="text-xs text-nl-muted">Fecha de nacimiento</label>
          <input data-f="birthDate" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.birthDate || '')}" placeholder="Texto libre o DD/MM/AAAA" />
        </div>
        <div>
          <label class="text-xs text-nl-muted">Fecha de defunción</label>
          <input data-f="deathDate" class="w-full bg-nl-raised border border-nl-border rounded px-3 py-2 text-sm" value="${escapeHtml(ch.deathDate || '')}" />
        </div>
      </div>
      ${ta('likes', 'Cosas que le gustan', 2)}
      ${ta('dislikes', 'Cosas que no le gustan', 2)}
      ${ta('description', 'Descripción', 3)}
      ${ta('personality', 'Personalidad', 2)}
      ${ta('goals', 'Objetivos', 2)}
      ${ta('conflicts', 'Conflictos', 2)}
      ${ta('narrativeArc', 'Arco narrativo', 3)}

      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Relaciones con otros personajes</h3>
        <p class="text-[11px] text-nl-muted leading-relaxed">El tipo de vínculo describe tu papel respecto al otro personaje <strong class="text-slate-400 font-medium">desde esta ficha</strong> (por ejemplo: si eliges «Soy hija de la otra persona», queda guardado que tú eres hija suya).</p>
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
