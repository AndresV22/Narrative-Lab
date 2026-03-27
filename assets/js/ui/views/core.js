/**
 * Metadatos y envoltorio del editor — Narrative Lab
 */

import { escapeHtml } from '../../core/utils.js';
import { formatDateDDMMYYYY } from '../../core/date-format.js';
import { editorCardWithHost } from '../../editor/editor.js';
import { NOVEL_CATEGORY_OPTIONS, NOVEL_CATEGORY_OTHER } from '../../domain/book-categories.js';

export function wrapEditorSection(title, _field) {
  return `
    <div class="nl-view nl-view-grow">
      <h2 class="text-lg font-semibold text-white mb-4">${escapeHtml(title)}</h2>
      ${editorCardWithHost('data-ed class="nl-editor flex-1 min-h-[12rem]"')}
    </div>
  `;
}

/**
 * @param {import('../../core/types.js').Book} book
 */
export function renderBookSettings(book) {
  const hasCover = !!book.coverImageDataUrl;
  const coverPreview = hasCover
    ? `<img src="${book.coverImageDataUrl}" alt="" class="w-full max-h-48 object-contain rounded-lg border border-nl-border bg-nl-bg" data-cover-preview />`
    : '<div class="w-full h-36 rounded-lg border border-dashed border-nl-border flex items-center justify-center text-xs text-nl-muted">Sin carátula</div>';
  const createdRaw = book.createdAt || `${book.date}T12:00:00.000Z`;
  const createdLabel = (() => {
    try {
      const d = new Date(createdRaw);
      if (Number.isNaN(d.getTime())) return book.date || '—';
      return formatDateDDMMYYYY(d);
    } catch {
      return book.date || '—';
    }
  })();
  const presetCats = new Set(NOVEL_CATEGORY_OPTIONS.filter((c) => c !== NOVEL_CATEGORY_OTHER));
  const isCategoryOther = Boolean(book.category && !presetCats.has(book.category));
  const categoryCustomValue = isCategoryOther ? book.category : '';
  const categoryOptionsHtml = [
    '<option value="">—</option>',
    ...NOVEL_CATEGORY_OPTIONS.map((c) => {
      const sel =
        (!isCategoryOther && book.category === c) || (isCategoryOther && c === NOVEL_CATEGORY_OTHER)
          ? ' selected'
          : '';
      return `<option value="${escapeHtml(c)}"${sel}>${escapeHtml(c)}</option>`;
    }),
  ].join('');
  return `
    <div class="nl-view space-y-6">
      <h2 class="text-lg font-semibold text-white">Metadatos</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Nombre</label>
          <input data-f="name" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm" value="${escapeHtml(book.name)}" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs text-nl-muted">Autor</label>
          <p class="text-sm text-slate-300 py-2 px-1">${escapeHtml(book.author || '—')}</p>
          <p class="text-[11px] text-nl-muted">Procede del <button type="button" data-go-author-profile class="text-indigo-400 hover:text-indigo-300 underline">perfil de autor</button>. Edítalo allí para actualizar los libros nuevos.</p>
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="block text-xs text-nl-muted">Fecha de creación</label>
          <p class="text-sm text-slate-300 py-2">${escapeHtml(createdLabel)}</p>
          <p class="text-[11px] text-nl-muted">Se asigna automáticamente al crear el libro.</p>
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="block text-xs text-nl-muted">Categoría</label>
          <select data-f="category-sel" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm">${categoryOptionsHtml}</select>
          <input data-f="category-custom" placeholder="Describe la categoría" class="mt-2 w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm ${isCategoryOther ? '' : 'hidden'}" value="${escapeHtml(categoryCustomValue)}" />
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
