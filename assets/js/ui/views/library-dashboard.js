/**
 * Dashboard de biblioteca — Narrative Lab
 */

import { escapeHtml } from '../../utils.js';
import { aggregateWorkspaceStats } from '../../workspace-stats.js';

/** @param {number} cx @param {number} cy @param {number} r @param {number} angleRad */
function polar(cx, cy, r, angleRad) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

/**
 * Anillo SVG: rebanadas por fracción de palabras (máx. 6 segmentos).
 * @param {{ label: string, words: number, fraction: number }[]} segments
 */
function donutSvg(segments) {
  const cx = 72;
  const cy = 72;
  const rOuter = 56;
  const rInner = 34;
  const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#c7d2fe', '#94a3b8'];
  let angle = -Math.PI / 2;
  const paths = segments.map((seg, i) => {
    const sweep = seg.fraction * Math.PI * 2;
    if (sweep <= 0) return '';
    const a0 = angle;
    const a1 = angle + sweep;
    angle = a1;
    const p1 = polar(cx, cy, rOuter, a0);
    const p2 = polar(cx, cy, rOuter, a1);
    const p3 = polar(cx, cy, rInner, a1);
    const p4 = polar(cx, cy, rInner, a0);
    const large = sweep > Math.PI ? 1 : 0;
    return `<path d="M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z" fill="${colors[i % colors.length]}" opacity="0.92"/>`;
  });
  return `<svg viewBox="0 0 144 144" class="w-40 h-40 shrink-0" aria-hidden="true">${paths.join('')}</svg>`;
}

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

  const totalW = agg.totalWords;
  /** @type {{ label: string, words: number, fraction: number }[]} */
  let donutSegments = [];
  if (totalW > 0 && agg.perBook.length > 0) {
    const maxSeg = 5;
    const top = agg.perBook.slice(0, maxSeg);
    const used = top.reduce((s, x) => s + x.words, 0);
    const rest = totalW - used;
    for (const r of top) {
      donutSegments.push({ label: r.bookName, words: r.words, fraction: r.words / totalW });
    }
    if (rest > 0) {
      donutSegments.push({ label: 'Otros', words: rest, fraction: rest / totalW });
    }
  }

  const donutBlock =
    totalW > 0 && donutSegments.length > 0
      ? `
        <div class="flex flex-col sm:flex-row gap-6 items-center">
          ${donutSvg(donutSegments)}
          <ul class="text-xs space-y-2 text-slate-400 flex-1 min-w-0">
            ${donutSegments
              .map(
                (s) => `
              <li class="flex justify-between gap-2">
                <span class="truncate">${escapeHtml(s.label)}</span>
                <span class="shrink-0 tabular-nums">${s.words.toLocaleString('es-ES')} (${Math.round(s.fraction * 100)}%)</span>
              </li>`
              )
              .join('')}
          </ul>
        </div>`
      : '<p class="text-sm text-nl-muted">Sin datos para el gráfico circular.</p>';

  const statusBars = agg.statusKeys
    .map((st) => {
      const n = agg.byStatus[st] || 0;
      const pct = agg.bookCount > 0 ? Math.round((n / agg.bookCount) * 100) : 0;
      return `
        <div class="space-y-1">
          <div class="flex justify-between text-[11px] text-nl-muted gap-2">
            <span>${escapeHtml(st)}</span>
            <span class="tabular-nums text-slate-400">${n}</span>
          </div>
          <div class="h-2 rounded-full bg-nl-raised overflow-hidden">
            <div class="h-full bg-slate-500/80 rounded-full" style="width:${pct}%"></div>
          </div>
        </div>`;
    })
    .join('');

  const catEntries = Object.entries(agg.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries.length ? Math.max(...catEntries.map(([, c]) => c), 1) : 1;
  const categoryBars =
    catEntries.length > 0
      ? catEntries
          .slice(0, 10)
          .map(([label, n]) => {
            const pct = Math.round((n / maxCat) * 100);
            return `
            <div class="space-y-1">
              <div class="flex justify-between text-[11px] text-nl-muted gap-2">
                <span class="truncate">${escapeHtml(label)}</span>
                <span class="shrink-0 tabular-nums text-slate-400">${n}</span>
              </div>
              <div class="h-1.5 rounded-full bg-nl-raised overflow-hidden">
                <div class="h-full bg-indigo-400/70 rounded-full" style="width:${pct}%"></div>
              </div>
            </div>`;
          })
          .join('')
      : '<p class="text-xs text-nl-muted">Sin categorías asignadas.</p>';

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
    <div class="nl-view-wide space-y-10 pb-16">
      <div>
        <h2 class="text-xl font-semibold text-white mb-2">Resumen del workspace</h2>
        <p class="text-sm text-nl-muted mb-6">Estadísticas combinadas de todos los libros.</p>
        <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Libros</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.bookCount}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Palabras</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.totalWords.toLocaleString('es-ES')}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Páginas est. (~300 pal.)</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.totalPagesEstimate > 0 ? agg.totalPagesEstimate.toLocaleString('es-ES') : '—'}</dd>
          </div>
          <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
            <dt class="text-[10px] uppercase tracking-wider text-nl-muted">Media palabras/libro</dt>
            <dd class="text-2xl font-semibold text-white tabular-nums mt-1">${agg.bookCount > 0 ? agg.avgWordsPerBook.toLocaleString('es-ES') : '—'}</dd>
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
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
          <h3 class="text-sm font-medium text-slate-200 mb-3">Reparto de palabras (donut)</h3>
          ${donutBlock}
        </div>
        <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
          <h3 class="text-sm font-medium text-slate-200 mb-3">Libros por estado</h3>
          <div class="space-y-3 max-w-md">${statusBars}</div>
        </div>
      </div>
      <div class="rounded-xl border border-nl-border bg-nl-surface p-4">
        <h3 class="text-sm font-medium text-slate-200 mb-3">Libros por categoría (top 10)</h3>
        <div class="max-w-xl space-y-2">${categoryBars}</div>
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
