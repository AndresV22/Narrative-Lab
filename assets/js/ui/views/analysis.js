/**
 * Panel de análisis — Narrative Lab
 */

import { escapeHtml } from '../../utils.js';
import {
  detectNarrativeIssues,
  getBookHealth,
  getBookStats,
  getTimelineConflicts,
} from '../../analysis.js';

/**
 * @param {import('../../types.js').Book} book
 */
export function renderAnalysisPanel(book) {
  const health = getBookHealth(book);
  const stats = getBookStats(book);
  const narrativeOnly = detectNarrativeIssues(book);
  const timelineIssues = getTimelineConflicts(book);

  const issueRow = (/** @type {import('../../types.js').NarrativeIssue} */ i) => {
    const icon = i.severity === 'warning' ? '❗' : 'ℹ️';
    const cls = i.severity === 'warning' ? 'text-amber-200/90' : 'text-slate-400';
    return `<li class="text-sm ${cls} pl-1 border-l-2 ${i.severity === 'warning' ? 'border-amber-500/60' : 'border-nl-border'}">${icon} ${escapeHtml(i.message)}</li>`;
  };

  return `
    <div class="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h2 class="text-lg font-semibold text-white mb-1">Análisis del libro</h2>
        <p class="text-sm text-nl-muted">Avisos importantes y sugerencias informativas. El contador del menú solo cuenta avisos (❗).</p>
      </div>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Salud narrativa</h3>
        <div class="flex items-baseline gap-3">
          <span class="text-4xl font-semibold text-white tabular-nums">${health.score}</span>
          <span class="text-sm text-nl-muted">/ 100</span>
        </div>
        <ul class="text-sm space-y-1 text-emerald-400/90">
          ${health.strengths.length ? health.strengths.map((s) => `<li>✓ ${escapeHtml(s)}</li>`).join('') : '<li class="text-nl-muted">Aún no hay fortalezas destacadas.</li>'}
        </ul>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Resumen</h3>
        <dl class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div><dt class="text-nl-muted">Palabras</dt><dd class="text-white tabular-nums">${stats.totalWords.toLocaleString()}</dd></div>
          <div><dt class="text-nl-muted">Capítulos</dt><dd class="text-white tabular-nums">${stats.chapterCount}</dd></div>
          <div><dt class="text-nl-muted">Escenas</dt><dd class="text-white tabular-nums">${stats.sceneCount}</dd></div>
          <div><dt class="text-nl-muted">Personajes</dt><dd class="text-white tabular-nums">${stats.characterCount}</dd></div>
          <div><dt class="text-nl-muted">Con vínculos</dt><dd class="text-white tabular-nums">${stats.activeCharacters}</dd></div>
          <div><dt class="text-nl-muted">Lectura (~${200} pal/min)</dt><dd class="text-white tabular-nums">~${stats.readingMinutes} min</dd></div>
        </dl>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-3">
        <h3 class="text-sm font-medium text-slate-200">Detalle (${narrativeOnly.length} ítems)</h3>
        <ul class="space-y-2">
          ${narrativeOnly.length ? narrativeOnly.map(issueRow).join('') : '<li class="text-sm text-nl-muted">No se detectaron problemas en capítulos, escenas o vínculos obligatorios.</li>'}
        </ul>
      </section>
      <section class="p-4 rounded-xl border border-nl-border bg-nl-surface space-y-2">
        <h3 class="text-sm font-medium text-slate-200">Línea de tiempo</h3>
        <ul class="space-y-2 text-sm">
          ${
            timelineIssues.length
              ? timelineIssues
                  .map((t) => {
                    const icon = t.severity === 'warning' ? '❗' : 'ℹ️';
                    return `<li class="${t.severity === 'warning' ? 'text-amber-200/90' : 'text-slate-400'}">${icon} ${escapeHtml(t.message)}</li>`;
                  })
                  .join('')
              : '<li class="text-nl-muted">Sin conflictos detectados en orden o fechas.</li>'
          }
        </ul>
      </section>
    </div>
  `;
}
