/**
 * Perfil de autor (workspace) — Narrative Lab
 */

import { escapeHtml } from '../../utils.js';
import { ageFromBirthDate } from '../../author-age.js';
import { isoDateToDisplay } from '../../date-format.js';

/**
 * @param {import('../../types.js').AuthorProfile} profile
 */
export function renderAuthorProfileForm(profile) {
  const age = ageFromBirthDate(profile.birthDate || '');
  const ageLine =
    age !== null ? `<span class="text-slate-300 tabular-nums">${age} años</span>` : '—';
  const birthDisplay = profile.birthDate ? isoDateToDisplay(profile.birthDate) : '';
  const birthFormatLine = birthDisplay
    ? `<p class="text-xs text-nl-muted mt-1">Formato: <span class="text-slate-400 tabular-nums">${escapeHtml(birthDisplay)}</span> (DD/MM/AAAA)</p>`
    : '';
  const hasPhoto = !!profile.imageDataUrl;
  const preview = hasPhoto
    ? `<img src="${profile.imageDataUrl}" alt="" class="w-32 h-32 rounded-full object-cover border border-nl-border"/>`
    : '<div class="w-32 h-32 rounded-full border border-dashed border-nl-border bg-nl-raised flex items-center justify-center text-xs text-nl-muted">Sin foto</div>';

  return `
    <div class="nl-view space-y-6">
      <h2 class="text-lg font-semibold text-white">Perfil de autor</h2>
      <p class="text-sm text-nl-muted">Estos datos se usan al crear libros nuevos. Puedes editarlos en cualquier momento.</p>
      <div class="flex flex-col sm:flex-row gap-6">
        <div class="flex flex-col items-center sm:items-start gap-3 shrink-0">
          ${preview}
          <input type="file" accept="image/*" data-author-photo class="text-xs text-nl-muted w-full max-w-[200px]" />
        </div>
        <div class="flex-1 space-y-4">
          <div>
            <label class="block text-xs text-nl-muted mb-1">Nombre</label>
            <input data-f="author-name" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(profile.name)}" />
          </div>
          <div>
            <label class="block text-xs text-nl-muted mb-1">Fecha de nacimiento</label>
            <input type="date" data-f="author-birth" lang="es" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(profile.birthDate)}" />
            ${birthFormatLine}
            <p class="text-xs text-nl-muted mt-1">Edad: ${ageLine}</p>
          </div>
          <div>
            <label class="block text-xs text-nl-muted mb-1">Biografía</label>
            <textarea data-f="author-bio" rows="6" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm">${escapeHtml(profile.bio)}</textarea>
          </div>
        </div>
      </div>
      <button type="button" data-save-author class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">Guardar perfil</button>
    </div>
  `;
}
