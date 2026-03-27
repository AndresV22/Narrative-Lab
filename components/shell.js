/**
 * Plantilla del layout principal — Narrative Lab
 */

export function shellMarkup() {
  return `
    <header class="shrink-0 border-b border-nl-border bg-nl-surface/95 backdrop-blur z-20">
      <div class="flex items-center gap-4 px-4 py-3 max-w-[100vw]">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-lg font-semibold tracking-tight text-white truncate">Rinconcito narrativo</span>
          <span class="hidden sm:inline text-xs text-nl-muted font-normal">escritura de libros</span>
        </div>
        <div class="flex-1 flex justify-center min-w-0">
          <button type="button" data-action="search" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nl-border bg-nl-raised text-sm text-nl-muted hover:text-slate-200 max-w-md w-full justify-start" aria-label="Abrir búsqueda global">
            <i class="fa-solid fa-magnifying-glass text-sm opacity-80" aria-hidden="true"></i>
            <span>Búsqueda global…</span>
          </button>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span data-save-status class="text-xs text-nl-muted tabular-nums w-[11rem] shrink-0 text-right truncate" aria-live="polite"></span>
          <button type="button" data-action="app-settings" class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised" title="Ajustes" aria-label="Ajustes">
            <i class="fa-solid fa-gear text-sm" aria-hidden="true"></i>
          </button>
          <button type="button" data-action="author-profile" class="px-2 py-1.5 rounded-lg border border-nl-border text-xs text-slate-300 hover:bg-nl-raised" title="Perfil de autor">Autor</button>
          <div data-header-book-only class="hidden lg:flex items-center gap-2">
            <button type="button" data-action="save-snapshot" class="inline-flex px-2 py-1.5 rounded-lg border border-nl-border text-xs text-slate-300 hover:bg-nl-raised disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none" title="Guardar snapshot del libro actual">Guardar snapshot</button>
            <button type="button" data-action="toggle-right" class="inline-flex px-2 py-1.5 rounded-lg border border-nl-border text-xs text-slate-300 hover:bg-nl-raised" title="Mostrar u ocultar panel de progreso">Panel de progreso</button>
          </div>
        </div>
      </div>
    </header>
    <div class="flex flex-1 min-h-0">
      <aside data-sidebar class="w-64 shrink-0 border-r border-nl-border bg-nl-surface flex flex-col nl-scroll overflow-y-auto transition-[width] duration-200 ease-out" aria-label="Navegación del libro"></aside>
      <main data-main class="flex-1 min-w-0 flex flex-col bg-nl-bg nl-scroll overflow-y-auto" role="main" aria-label="Editor y vistas"></main>
      <aside data-right class="nl-right-panel shrink-0 flex flex-col bg-nl-surface nl-scroll transition-[width] duration-200 ease-out w-0 min-w-0 overflow-hidden border-l-0" aria-label="Panel de información"></aside>
    </div>
    <div data-modal-host></div>
  `;
}
