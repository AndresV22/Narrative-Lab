/**
 * Plantilla del layout principal — Narrative Lab
 */

export function shellMarkup() {
  return `
    <header class="shrink-0 border-b border-nl-border bg-nl-surface/95 backdrop-blur z-20">
      <div class="flex items-center gap-4 px-4 py-3 max-w-[100vw]">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-lg font-semibold tracking-tight text-white truncate">Narrative Lab</span>
          <span class="hidden sm:inline text-xs text-nl-muted font-normal">escritura de libros</span>
        </div>
        <div class="flex-1 flex justify-center min-w-0">
          <button type="button" data-action="search" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nl-border bg-nl-raised text-sm text-nl-muted hover:text-slate-200 max-w-md w-full justify-start" aria-label="Abrir búsqueda global">
            <span aria-hidden="true">⌕</span>
            <span>Búsqueda global…</span>
          </button>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span data-save-status class="text-xs text-nl-muted tabular-nums"></span>
          <button type="button" data-action="save-snapshot" class="hidden lg:inline-flex px-2 py-1.5 rounded-lg border border-nl-border text-xs text-slate-300 hover:bg-nl-raised disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none" title="Guardar snapshot del libro actual">Guardar snapshot</button>
          <button type="button" data-action="toggle-right" class="hidden lg:inline-flex px-2 py-1.5 rounded-lg border border-nl-border text-xs text-slate-300 hover:bg-nl-raised" title="Panel lateral">Panel</button>
        </div>
      </div>
    </header>
    <div class="flex flex-1 min-h-0">
      <aside data-sidebar class="w-64 shrink-0 border-r border-nl-border bg-nl-surface flex flex-col nl-scroll overflow-y-auto" aria-label="Navegación del libro"></aside>
      <main data-main class="flex-1 min-w-0 flex flex-col bg-nl-bg nl-scroll overflow-y-auto" role="main" aria-label="Editor y vistas"></main>
      <aside data-right class="hidden lg:flex w-80 shrink-0 border-l border-nl-border bg-nl-surface flex-col nl-scroll overflow-y-auto" aria-label="Panel de información"></aside>
    </div>
    <div data-modal-host></div>
  `;
}
