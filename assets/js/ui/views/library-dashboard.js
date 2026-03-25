/**
 * Dashboard de biblioteca — Narrative Lab
 */

import { escapeHtml } from '../../utils.js';
import { aggregateWorkspaceStats } from '../../workspace-stats.js';

/**
 * @param {import('../../app.js').App} app
 */
export function renderLibraryDashboard(app) {
  const ws = app.workspace;
  if (!ws) return '<div class="p-8 text-nl-muted">Sin datos.</div>';
  const agg = aggregateWorkspaceStats(ws);
  const maxWords = agg.perBook.length ? Math.max(...agg.perBook.map((p) => p.words), 1) : 1;
  const bars =
    agg.perBook.length > 0
      ? agg.perBook
          .map((r) => {
            const pct = maxWords > 0 ? Math.round((r.words / maxWords) * 100) : 0;
            const label = escapeHtml(r.bookName);
            return `
            <div class="space-y-1">
              <div class="flex justify-between text-[11px] text-nl-muted gap-2">
                <span class="truncate">${label}</span>
                <span class="shrink-0 tabular-nums text-slate-400">${r.words.toLocaleString('es-ES')}</span>
              </div>
              <div class="h-2 rounded-full bg-nl-raised overflow-hidden">
                <div class="h-full bg-indigo-500/90 rounded-full transition-all" style="width:${pct}%"></div>
              </div>
            </div>`;
          })
          .join('')
      : '<p class="text-sm text-nl-muted">Añade libros para ver el reparto de palabras.</p>';

  const cards = ws.books
    .map((b) => {
      const cover = b.coverImageDataUrl
        ? `<img src="${b.coverImageDataUrl}" alt="" class="w-full aspect-[2/3] object-cover"/>`
        : '<div class="w-full aspect-[2/3] border border-dashed border-nl-border bg-nl-raised/40 flex items-center justify-center text-[10px] text-nl-muted px-2 text-center">Sin carátula</div>';
      return `
        <button type="button" data-lib-open="${escapeHtml(b.id)}" class="group text-left rounded-xl border border-nl-border bg-nl-surface overflow-hidden hover:border-indigo-500/50 transition-colors">
          <div class="overflow-hidden rounded-t-xl border-b border-nl-border">${cover}</div>
          <div class="p-3">
            <div class="font-medium text-white text-sm truncate group-hover:text-indigo-200">${escapeHtml(b.name)}</div>
          </div>
        </button>
      `;
    })
    .join('');

  return `
    <div class="max-w-5xl mx-auto w-full p-6 space-y-10 pb-16">
      <div>
        <h2 class="text-xl font-semibold text-white mb-2">Resumen del workspace</h2>
        <p class="text-sm text-nl-muted mb-6">Estadísticas combinadas de todos los libros.</p>
        <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Libros</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.bookCount}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Palabras</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.totalWords.toLocaleString('es-ES')}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Capítulos</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.chapterCount}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Escenas</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.sceneCount}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Personajes</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.characterCount}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Eventos (línea)</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.eventCount}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 class="text-sm font-medium text-slate-200 mb-3">Palabras por libro</h3>
        <div class="max-w-xl space-y-3">${bars}</div>
      </div>
      <div>
        <h3 class="text-sm font-medium text-slate-200 mb-4">Tus libros</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          ${cards || '<p class="text-sm text-nl-muted col-span-full">Aún no hay libros. Usa «Nuevo libro» en la barra lateral.</p>'}
        </div>
      </div>
    </div>
  `;
}
