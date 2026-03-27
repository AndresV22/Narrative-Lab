/**
 * Guía de escritura, ajustes de app, notas y destacados — Narrative Lab
 */

import { escapeHtml } from '../../core/utils.js';
import { formatHighlightSource, canNavigateHighlightSource } from '../../editor/highlight-source.js';
import { editorCardWithHost } from '../../editor/editor.js';
import {
  getAutosaveMs,
  getProgressMode,
  getRightPanelDefaultExpanded,
  getSpellcheckEnabled,
  getSnapshotIntervalMinutes,
} from '../../domain/prefs.js';
import { WRITING_GUIDE_ARTICLES, getWritingGuideArticle } from '../../domain/writing-guide-content.js';

/**
 * @param {import('../../app.js').App} app
 */
export function renderWritingGuide(app) {
  const id = app.state.guideArticleId;
  if (id) {
    const article = getWritingGuideArticle(id);
    if (!article) {
      return `
        <div class="nl-view">
          <button type="button" data-guide-back class="text-sm text-indigo-400 hover:text-indigo-300 mb-4">← Índice de la guía</button>
          <p class="text-nl-muted text-sm">Artículo no encontrado.</p>
        </div>
      `;
    }
    return `
      <div class="nl-view nl-view-grow">
        <button type="button" data-guide-back class="text-sm text-indigo-400 hover:text-indigo-300 mb-4 w-fit">← Índice de la guía</button>
        <article class="rounded-xl border border-nl-border bg-nl-surface p-6 nl-scroll overflow-y-auto flex-1 min-h-0">
          <p class="text-[10px] uppercase tracking-wider text-indigo-400/90 mb-2">${escapeHtml(article.category)}</p>
          <h2 class="text-xl font-semibold text-white mb-4">${escapeHtml(article.title)}</h2>
          <div class="text-sm max-w-none space-y-1">${article.body}</div>
        </article>
      </div>
    `;
  }

  const byCat = {};
  for (const a of WRITING_GUIDE_ARTICLES) {
    if (!byCat[a.category]) byCat[a.category] = [];
    byCat[a.category].push(a);
  }
  const cats = Object.keys(byCat).sort();
  const sections = cats
    .map(
      (cat) => `
    <section class="mb-8">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-nl-muted mb-3">${escapeHtml(cat)}</h3>
      <ul class="space-y-2">
        ${byCat[cat]
          .map(
            (a) => `
          <li>
            <button type="button" data-guide-open="${escapeHtml(a.id)}" class="w-full text-left p-4 rounded-xl border border-nl-border bg-nl-surface hover:border-indigo-500/40 transition-colors">
              <span class="font-medium text-white">${escapeHtml(a.title)}</span>
              <p class="text-xs text-nl-muted mt-1">${escapeHtml(a.excerpt)}</p>
            </button>
          </li>
        `
          )
          .join('')}
      </ul>
    </section>
  `
    )
    .join('');

  return `
    <div class="nl-view nl-view-grow">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-white">Guía de escritura</h2>
        <p class="text-sm text-nl-muted mt-2 max-w-xl">Ficción, ciencia ficción, fantasía, romance y técnica narrativa. Referencias de estudio a Isaac Asimov, J. R. R. Tolkien y Brandon Sanderson (ilustrativas, no prescriptivas).</p>
      </div>
      <div class="nl-scroll overflow-y-auto flex-1 min-h-0" data-guide-index>
        ${sections}
      </div>
    </div>
  `;
}

export function renderAppSettingsPanel() {
  const rawMs = getAutosaveMs();
  const opts = [2000, 4000, 8000, 12000];
  const ms = opts.reduce((a, b) => (Math.abs(b - rawMs) < Math.abs(a - rawMs) ? b : a), 4000);
  const pm = getProgressMode();
  const sc = getSpellcheckEnabled();
  const snapMin = getSnapshotIntervalMinutes();
  const snapOpts = [0, 5, 15, 30, 60, 120];
  return `
    <div class="nl-view space-y-6">
      <h2 class="text-lg font-semibold text-white">Ajustes</h2>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Corrector ortográfico del navegador</h3>
        <p class="text-xs text-nl-muted">Subraya posibles errores según el idioma del sistema (no sustituye texto automáticamente).</p>
        <label class="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" class="mt-1 rounded border-nl-border" data-app-spellcheck ${sc ? 'checked' : ''} />
          <span>Activar subrayado ortográfico nativo en los editores</span>
        </label>
        <p class="text-xs text-nl-muted">Se aplica al guardar o al volver a abrir un editor.</p>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Panel derecho (progreso)</h3>
        <p class="text-xs text-nl-muted">Estadísticas, métricas y comentarios del fragmento activo. Puedes mostrarlo u ocultarlo también con el botón «Panel de progreso» en la barra superior.</p>
        <label class="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" class="mt-1 rounded border-nl-border" data-app-right-panel-default ${getRightPanelDefaultExpanded() ? 'checked' : ''} />
          <span>Mostrar el panel derecho al iniciar la aplicación o al abrir un libro</span>
        </label>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Guardado automático</h3>
        <p class="text-xs text-nl-muted">Frecuencia con la que se guarda el workspace en el navegador (IndexedDB).</p>
        <select data-app-autosave class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-slate-200">
          ${opts.map((v) => `<option value="${v}" ${ms === v ? 'selected' : ''}>Cada ${v / 1000} s</option>`).join('')}
        </select>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Snapshots automáticos</h3>
        <p class="text-xs text-nl-muted">Crea un snapshot del libro abierto cada cierto tiempo (igual que el botón de la barra superior).</p>
        <select data-app-snapshot-interval class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-slate-200">
          ${snapOpts.map((m) => {
            const label = m === 0 ? 'Desactivado' : `Cada ${m} min`;
            return `<option value="${m}" ${snapMin === m ? 'selected' : ''}>${label}</option>`;
          }).join('')}
        </select>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Panel de progreso (conteo de palabras)</h3>
        <label class="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
          <input type="radio" name="nl-prog" value="boundary" class="mt-1" ${pm === 'boundary' ? 'checked' : ''} data-prog-mode />
          <span>Actualizar al pulsar <strong class="text-slate-200 font-medium">espacio</strong> o <strong class="text-slate-200 font-medium">punto</strong></span>
        </label>
        <label class="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
          <input type="radio" name="nl-prog" value="debounce" class="mt-1" ${pm === 'debounce' ? 'checked' : ''} data-prog-mode />
          <span>Actualizar mientras escribes (ligero retraso)</span>
        </label>
        <p class="text-xs text-nl-muted">El modo de progreso se aplica al abrir o cambiar de editor.</p>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3" data-export-reminder-section>
        <h3 class="text-sm font-medium text-slate-200">Copia de seguridad</h3>
        <p class="text-xs text-nl-muted">Exporta el workspace JSON desde aquí o desde la barra lateral. La fecha muestra la última exportación registrada en este dispositivo.</p>
        <p class="text-sm text-slate-300" data-last-export-label></p>
        <button type="button" data-export-workspace-settings class="px-4 py-2 rounded-lg border border-nl-border text-sm text-slate-200 hover:bg-nl-raised">Exportar workspace (JSON)</button>
      </section>
      <button type="button" data-save-app-settings class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500">Guardar ajustes</button>
      <section class="p-4 rounded-xl border border-red-500/25 bg-red-500/5 space-y-3 mt-10">
        <h3 class="text-sm font-medium text-red-200">Zona de peligro</h3>
        <p class="text-xs text-nl-muted">Elimina por completo el workspace guardado en este navegador (IndexedDB) y las preferencias locales de la app. Libera el espacio ocupado por estos datos.</p>
        <button type="button" data-open-clear-workspace-modal class="w-full px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-200 hover:bg-red-500/20">Eliminar datos del navegador…</button>
      </section>
      <footer class="mt-10 pt-6 border-t border-nl-border text-center text-xs text-nl-muted space-y-2">
        <p class="text-slate-400">Copyright © ${new Date().getFullYear()} · Creado por Andrés Alcaíno.</p>
        <p class="tabular-nums">Versión ${__APP_VERSION__}</p>
      </footer>
    </div>
  `;
}

export function renderNotesList(book, _app) {
  return `
    <div class="nl-view">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Notas</h2>
        <button type="button" data-add-note class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500">+ Nota</button>
      </div>
      <ul class="space-y-2">
        ${book.notes.map((n) => `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-note="${n.id}" class="flex-1 text-left p-3 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40">
              <div class="font-medium text-white">${escapeHtml(n.title)}</div>
            </button>
            <button type="button" data-del-note="${n.id}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>
        `).join('') || '<li class="text-sm text-nl-muted">Sin notas.</li>'}
      </ul>
    </div>
  `;
}

export function renderNoteEditor(note, _app) {
  return `
    <div class="nl-view-editor space-y-4">
      <button type="button" data-back-notes class="text-sm text-indigo-400 hover:text-indigo-300">← Notas</button>
      <input data-note-title class="text-xl font-semibold bg-transparent border-b border-nl-border w-full text-white" value="${escapeHtml(note.title)}" />
      ${editorCardWithHost('data-ed-note class="nl-editor min-h-[200px]"')}
      <button type="button" data-save-note class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500">Guardar nota</button>
    </div>
  `;
}

/**
 * Lista compacta; el editor completo está en {@link renderHighlightEditor}.
 * @param {import('../../core/types.js').Book} book
 */
export function renderHighlightsList(book) {
  const list = book.highlights || [];
  return `
    <div class="nl-view">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Frases destacadas</h2>
        <p class="text-xs text-nl-muted sm:max-w-sm">Pulsa una frase para editarla. En el editor usa «Destacar selección» para añadir más.</p>
      </div>
      <ul class="space-y-2">
        ${list.length
          ? list
              .map((h) => {
                const src = formatHighlightSource(book, h);
                const preview = (h.excerpt || '').slice(0, 160) + ((h.excerpt || '').length > 160 ? '…' : '');
                return `
          <li class="flex gap-2 items-stretch">
            <button type="button" data-open-hl="${escapeHtml(h.id)}" class="flex-1 min-w-0 text-left p-3 rounded-lg border border-nl-border bg-nl-surface hover:border-indigo-500/40 transition-colors">
              <blockquote class="text-slate-200 text-sm border-l-2 border-indigo-500/50 pl-3 line-clamp-3">${escapeHtml(preview || '(vacío)')}</blockquote>
              <p class="text-[11px] text-nl-muted mt-2 truncate">Origen: <span class="text-slate-400">${escapeHtml(src)}</span></p>
            </button>
            <button type="button" data-del-hl="${escapeHtml(h.id)}" class="shrink-0 px-3 rounded-lg border border-nl-border text-red-400 hover:bg-red-500/10 text-sm" title="Eliminar">✕</button>
          </li>`;
              })
              .join('')
          : '<li class="text-nl-muted text-sm">Selecciona texto en el editor y usa «Destacar selección».</li>'}
      </ul>
    </div>
  `;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').Highlight} h
 */
export function renderHighlightEditor(book, h) {
  const src = formatHighlightSource(book, h);
  const canGo = canNavigateHighlightSource(book, h);
  const sel = String(h.characterId || '');
  const charOptions = (book.characters || [])
    .map(
      (c) =>
        `<option value="${escapeHtml(c.id)}" ${sel === c.id ? 'selected' : ''}>${escapeHtml(c.name || 'Sin nombre')}</option>`
    )
    .join('');
  return `
    <div class="nl-view space-y-4">
      <button type="button" data-back-highlights class="text-sm text-indigo-400 hover:text-indigo-300">← Frases destacadas</button>
      <h2 class="text-lg font-semibold text-white">Editar frase</h2>
      <div class="p-4 rounded-lg border border-nl-border bg-nl-surface space-y-3">
        <blockquote class="text-slate-200 text-sm border-l-2 border-indigo-500/50 pl-3">${escapeHtml(h.excerpt)}</blockquote>
        <p class="text-[11px] text-nl-muted">Origen: <span class="text-slate-400">${escapeHtml(src)}</span></p>
        <div class="space-y-1">
          <label class="text-[10px] text-nl-muted">Descripción / nota</label>
          <textarea data-hl-desc="${escapeHtml(h.id)}" rows="3" class="w-full text-sm bg-nl-bg border border-nl-border rounded px-2 py-1.5 text-slate-200">${escapeHtml(h.description || '')}</textarea>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] text-nl-muted">Personaje (opcional)</label>
          <select data-hl-char="${escapeHtml(h.id)}" class="w-full max-w-md bg-nl-raised border border-nl-border rounded px-2 py-1.5 text-sm text-slate-200">
            <option value="">— Ninguno —</option>
            ${charOptions}
          </select>
        </div>
        <div class="flex flex-wrap gap-2 items-center pt-1">
          <button type="button" data-save-hl="${escapeHtml(h.id)}" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-500">Guardar</button>
          <button type="button" data-go-hl="${escapeHtml(h.id)}" class="px-3 py-1.5 rounded-lg border border-nl-border text-xs text-slate-300 hover:bg-nl-raised disabled:opacity-40 disabled:pointer-events-none" ${canGo ? '' : 'disabled'}>Ir al origen</button>
          <button type="button" data-del-hl="${escapeHtml(h.id)}" class="text-xs text-red-400 hover:text-red-300 ml-auto">Eliminar</button>
        </div>
      </div>
    </div>
  `;
}
