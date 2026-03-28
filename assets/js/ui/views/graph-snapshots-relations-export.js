/**
 * Grafo, snapshots, relaciones y exportación — Narrative Lab
 */

import { escapeHtml, sortByOrder } from '../../core/utils.js';
import { formatCharacterDisplayName } from '../../domain/character-display.js';
import { formatDateTimeShort } from '../../core/date-format.js';
import {
  listRelationships,
  CHARACTER_LINK_ROLE_OPTIONS,
  characterLinkCanonicalPhrase,
} from '../../narrative/relations.js';
import { CHARACTER_LINK_ROLE_EDGE_COLORS } from '../../narrative/graph-network.js';

/**
 * @param {import('../../core/types.js').Book} book
 * @param {string} kind
 * @param {string} id
 */
function entityLabel(book, kind, id) {
  if (kind === 'character') {
    const c = book.characters.find((x) => x.id === id);
    return c ? formatCharacterDisplayName(c) : id;
  }
  if (kind === 'chapter') {
    const c = book.chapters.find((x) => x.id === id);
    return c?.title || id;
  }
  if (kind === 'event') {
    const e = (book.events || []).find((x) => x.id === id);
    return e?.title || id;
  }
  if (kind === 'scene') {
    for (const ch of book.chapters || []) {
      const sc = ch.scenes.find((s) => s.id === id);
      if (sc) return `${ch.title} · ${sc.title}`;
    }
    return id;
  }
  return id;
}

/**
 * @param {string} t
 */
function relTypeLabel(t) {
  if (t === 'character_chapter') return 'Personaje → Capítulo';
  if (t === 'character_scene') return 'Personaje → Escena';
  if (t === 'event_event') return 'Evento ↔ Evento';
  if (t === 'character_character') return 'Personaje ↔ Personaje';
  return String(t);
}

/**
 * @param {string} iso
 */
function formatSnapshotDate(iso) {
  try {
    return formatDateTimeShort(iso);
  } catch {
    return String(iso || '');
  }
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../app.js').App} app
 */
export function renderGraphHost(book, app) {
  const mode = app.state.graphMode || 'characters';
  const rootId = app.state.graphRootCharacterId ?? null;
  const btn = (m, label) =>
    `<button type="button" data-graph-mode="${m}" class="px-3 py-1.5 rounded-lg text-xs border ${
      mode === m ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-nl-border text-slate-300 hover:bg-nl-raised'
    }">${label}</button>`;
  const charsSorted = [...(book.characters || [])].sort((a, b) =>
    formatCharacterDisplayName(a).localeCompare(formatCharacterDisplayName(b), 'es')
  );
  const rootOpts =
    `<option value="">— Personaje raíz (red ortogonal) —</option>` +
    charsSorted
      .map(
        (c) =>
          `<option value="${escapeHtml(c.id)}"${rootId === c.id ? ' selected' : ''}>${escapeHtml(formatCharacterDisplayName(c))}</option>`
      )
      .join('');
  const legendItems = CHARACTER_LINK_ROLE_OPTIONS.map(
    (o) =>
      `<span class="inline-flex items-center gap-1.5 text-[11px] text-slate-300"><span class="w-6 h-0.5 rounded shrink-0" style="background:${CHARACTER_LINK_ROLE_EDGE_COLORS[o.value] || '#64748b'}" title=""></span>${escapeHtml(o.legendLabel || o.label)}</span>`
  ).join('');
  const networkControls =
    mode === 'characters'
      ? `
      <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 p-3 rounded-xl border border-nl-border bg-nl-surface/50">
        <label class="flex flex-col gap-1 text-xs text-nl-muted shrink-0">
          Red desde personaje
          <select data-graph-root class="min-w-[12rem] bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
            ${rootOpts}
          </select>
        </label>
        <div class="flex flex-wrap gap-x-4 gap-y-2 items-center flex-1 min-w-0">
          <span class="text-[10px] uppercase tracking-wide text-nl-muted shrink-0">Leyenda</span>
          <div class="flex flex-wrap gap-x-3 gap-y-1">${legendItems}</div>
        </div>
      </div>`
      : '';
  return `
    <div class="nl-view-wide nl-view-grow space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-white mb-1">Mapa de relaciones</h2>
        <p class="text-sm text-nl-muted">En «Solo personajes», elige un raíz para ver su red conexa con líneas solo horizontales/verticales y color por tipo de vínculo. Otros modos: vista clásica por anillos.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        ${btn('characters', 'Solo personajes')}
        ${btn('chars_chapters', 'Personajes + capítulos')}
        ${btn('all', 'Todo')}
      </div>
      ${networkControls}
      <div data-graph-host class="min-h-[420px] flex-1 rounded-xl border border-nl-border bg-nl-bg overflow-auto"></div>
    </div>
  `;
}

export function renderSnapshots(book, _app) {
  const snapOpts =
    book.snapshots.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)} (${escapeHtml(formatSnapshotDate(s.createdAt))})</option>`).join('') ||
    '<option value="">Sin snapshots</option>';
  return `
    <div class="nl-view space-y-6">
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
  const charOpts = chars.map((c) => `<option value="${c.id}">${escapeHtml(formatCharacterDisplayName(c))}</option>`).join('');
  const chOpts = chapters.map((c) => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
  const evOpts = events.map((e) => `<option value="${e.id}">${escapeHtml(e.title || 'Evento')}</option>`).join('');
  const roleOpts = CHARACTER_LINK_ROLE_OPTIONS.map(
    (o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`
  ).join('');

  const relRows = listRelationships(book)
    .map((r) => {
      const a = entityLabel(book, r.from.kind, r.from.id);
      const b = entityLabel(book, r.to.kind, r.to.id);
      const desc = typeof r.description === 'string' ? r.description : '';
      const ccPhrase =
        r.type === 'character_character' && r.from.kind === 'character' && r.to.kind === 'character'
          ? characterLinkCanonicalPhrase(r, a, b)
          : '';
      return `
        <li class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-2">
          <div class="flex justify-between gap-2 items-start">
            <div>
              <span class="text-[10px] uppercase tracking-wider text-indigo-300/90">${escapeHtml(relTypeLabel(r.type))}</span>
              <p class="text-sm text-slate-200 mt-1">${escapeHtml(a)} → ${escapeHtml(b)}</p>
              ${ccPhrase ? `<p class="text-xs text-slate-400 mt-1">${escapeHtml(ccPhrase)}</p>` : ''}
            </div>
            <button type="button" data-rel-del="${r.id}" class="text-red-400 text-sm shrink-0">✕</button>
          </div>
          <label class="block text-[10px] text-nl-muted">Descripción (por qué están relacionados)</label>
          <textarea data-rel-desc="${r.id}" rows="2" class="w-full text-xs bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-slate-200">${escapeHtml(desc)}</textarea>
          <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" data-rel-visible="${r.id}" class="rounded border-nl-border" ${r.disabled ? '' : 'checked'} />
            <span>Visible en el grafo</span>
          </label>
        </li>
      `;
    })
    .join('');

  return `
    <div class="nl-view space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-lg font-semibold text-white">Relaciones</h2>
        <button type="button" data-rel-open-wizard class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">+ Nueva relación</button>
      </div>

      <div data-rel-modal class="fixed inset-0 z-50 hidden bg-black/60 p-4 items-center justify-center">
        <div class="max-w-lg w-full rounded-xl border border-nl-border bg-nl-surface p-6 max-h-[90vh] overflow-y-auto nl-scroll" data-rel-modal-panel role="dialog" aria-modal="true" aria-labelledby="rel-wizard-title">
          <h3 id="rel-wizard-title" class="text-lg font-semibold text-white mb-2">Nueva relación</h3>
          <div data-rel-wiz-type class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" data-rel-wiz-pick="pc" class="p-3 rounded-lg border border-nl-border text-left text-sm text-slate-200 hover:border-indigo-500/50 hover:bg-nl-raised/60">Personaje ↔ Capítulo</button>
            <button type="button" data-rel-wiz-pick="ps" class="p-3 rounded-lg border border-nl-border text-left text-sm text-slate-200 hover:border-indigo-500/50 hover:bg-nl-raised/60">Personaje ↔ Escena</button>
            <button type="button" data-rel-wiz-pick="ee" class="p-3 rounded-lg border border-nl-border text-left text-sm text-slate-200 hover:border-indigo-500/50 hover:bg-nl-raised/60">Evento ↔ Evento</button>
            <button type="button" data-rel-wiz-pick="cc" class="p-3 rounded-lg border border-nl-border text-left text-sm text-slate-200 hover:border-indigo-500/50 hover:bg-nl-raised/60">Personaje ↔ Personaje</button>
          </div>
          <div data-rel-wiz-form class="hidden space-y-3 mt-4">
            <button type="button" data-rel-wiz-back class="text-sm text-indigo-400 hover:text-indigo-300">← Elegir otro tipo</button>
            <div data-rel-wiz-panel-pc class="hidden space-y-2">
              <select data-wz-pc-char class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Personaje</option>${charOpts}
              </select>
              <select data-wz-pc-ch class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Capítulo</option>${chOpts}
              </select>
              <textarea data-wz-pc-desc rows="2" class="w-full text-xs bg-nl-bg border rounded px-2 py-1" placeholder="Descripción (opcional)"></textarea>
              <button type="button" data-wz-pc-add class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Vincular</button>
            </div>
            <div data-rel-wiz-panel-ps class="hidden space-y-2">
              <select data-wz-ps-char class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Personaje</option>${charOpts}
              </select>
              <select data-wz-ps-ch class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Capítulo</option>${chOpts}
              </select>
              <select data-wz-ps-sc class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Escena</option>
              </select>
              <textarea data-wz-ps-desc rows="2" class="w-full text-xs bg-nl-bg border rounded px-2 py-1" placeholder="Descripción (opcional)"></textarea>
              <button type="button" data-wz-ps-add class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Vincular</button>
            </div>
            <div data-rel-wiz-panel-ee class="hidden space-y-2">
              <select data-wz-ee-a class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Evento A</option>${evOpts}
              </select>
              <select data-wz-ee-b class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Evento B</option>${evOpts}
              </select>
              <textarea data-wz-ee-desc rows="2" class="w-full text-xs bg-nl-bg border rounded px-2 py-1" placeholder="Descripción (opcional)"></textarea>
              <button type="button" data-wz-ee-add class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Vincular</button>
            </div>
            <div data-rel-wiz-panel-cc class="hidden space-y-2">
              <p class="text-[11px] text-nl-muted leading-relaxed">La <strong class="text-slate-400 font-medium">primera persona</strong> es quien cumple el rol respecto a la <strong class="text-slate-400 font-medium">segunda</strong> (igual que al vincular desde la ficha de la primera).</p>
              <select data-wz-cc-a class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Personaje A</option>${charOpts}
              </select>
              <select data-wz-cc-b class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Personaje B</option>${charOpts}
              </select>
              <select data-wz-cc-role class="w-full bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm">
                <option value="">Tipo de vínculo</option>${roleOpts}
              </select>
              <textarea data-wz-cc-desc rows="2" class="w-full text-xs bg-nl-bg border rounded px-2 py-1" placeholder="Descripción (opcional)"></textarea>
              <button type="button" data-wz-cc-add class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">Vincular</button>
            </div>
          </div>
          <button type="button" data-rel-modal-close class="mt-4 text-sm text-nl-muted hover:text-slate-300">Cerrar</button>
        </div>
      </div>

      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Personaje → Capítulo</h3>
        <div class="flex flex-wrap gap-2">
          <select data-rel-pc-char class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Personaje</option>
            ${charOpts}
          </select>
          <select data-rel-pc-ch class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Capítulo</option>
            ${chOpts}
          </select>
          <button type="button" data-rel-pc-add class="px-3 py-1 rounded bg-indigo-600 text-sm text-white">Vincular</button>
        </div>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Personaje → Escena</h3>
        <div class="flex flex-wrap gap-2">
          <select data-rel-ps-char class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Personaje</option>
            ${charOpts}
          </select>
          <select data-rel-ps-ch class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Capítulo</option>
            ${chOpts}
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
            ${evOpts}
          </select>
          <select data-rel-ee-b class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Evento B</option>
            ${evOpts}
          </select>
          <button type="button" data-rel-ee-add class="px-3 py-1 rounded bg-indigo-600 text-sm text-white">Vincular</button>
        </div>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Personaje ↔ Personaje</h3>
        <p class="text-[11px] text-nl-muted leading-relaxed">Personaje A es quien cumple el rol respecto a B (A es la «primera» del vínculo guardado).</p>
        <div class="flex flex-wrap gap-2">
          <select data-rel-cc-a class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Personaje A</option>
            ${charOpts}
          </select>
          <select data-rel-cc-b class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Personaje B</option>
            ${charOpts}
          </select>
          <select data-rel-cc-role class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-sm">
            <option value="">Tipo</option>
            ${roleOpts}
          </select>
          <button type="button" data-rel-cc-add class="px-3 py-1 rounded bg-indigo-600 text-sm text-white">Vincular</button>
        </div>
      </section>
      <div>
        <h3 class="text-sm font-medium text-slate-200 mb-3">Todas las relaciones</h3>
        <ul class="space-y-2 text-sm">
          ${relRows || '<li class="text-nl-muted text-sm">No hay relaciones.</li>'}
        </ul>
      </div>
    </div>
  `;
}

export function renderExportPanel(_book, _app) {
  return `
    <div class="nl-view space-y-8">
      <div>
        <h2 class="text-lg font-semibold text-white mb-2">Exportar libro</h2>
        <p class="text-sm text-nl-muted">Solo la obra: prólogo, capítulos, escenas y epílogo (sin sinopsis ni notas del autor).</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button type="button" data-exp="md" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Markdown (.md)</button>
        <button type="button" data-exp="txt" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Texto (.txt)</button>
        <button type="button" data-exp="pdf" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">PDF (imprimir)</button>
        <button type="button" data-exp="docx" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Word (.docx)</button>
        <button type="button" data-exp="epub" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">EPUB</button>
      </div>
      <div>
        <h3 class="text-sm font-medium text-slate-200 mb-2">Material de planificación</h3>
        <p class="text-sm text-nl-muted mb-3">Sinopsis, contexto, reglas, personajes, extras y notas en un solo archivo.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" data-exp-ref="pdf" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">PDF (imprimir)</button>
          <button type="button" data-exp-ref="docx" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Word (.docx)</button>
          <button type="button" data-exp-ref="txt" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">Texto (.txt)</button>
          <button type="button" data-exp-ref="epub" class="py-3 rounded-lg border border-nl-border hover:bg-nl-raised text-sm">EPUB</button>
        </div>
      </div>
    </div>
  `;
}
