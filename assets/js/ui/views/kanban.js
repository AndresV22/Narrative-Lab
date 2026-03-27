/**
 * Kanban por libro — Narrative Lab
 */

import { escapeHtml } from '../../core/utils.js';
import { createKanbanBoard, createKanbanColumn, createKanbanTask } from '../../domain/models.js';

/** @param {string} colId @param {string} taskId */
export function dragPayloadTask(colId, taskId) {
  return `kt|${colId}|${taskId}`;
}

/** @param {string} colId */
export function dragPayloadCol(colId) {
  return `kc|${colId}`;
}

/** @param {string} s */
export function parseDragTask(s) {
  if (!s.startsWith('kt|')) return null;
  const parts = s.slice(3).split('|');
  if (parts.length !== 2) return null;
  return { colId: parts[0], taskId: parts[1] };
}

/** @param {string} s */
export function parseDragCol(s) {
  if (!s.startsWith('kc|')) return null;
  const id = s.slice(3);
  return id || null;
}

/**
 * Mueve o reordena una tarea. `beforeTaskId` = insertar antes de esa tarea; null = al final.
 * @param {import('../../core/types.js').KanbanBoard} board
 * @param {string} fromColId
 * @param {string} taskId
 * @param {string} toColId
 * @param {string|null} beforeTaskId
 */
export function moveKanbanTask(board, fromColId, taskId, toColId, beforeTaskId) {
  const fromCol = board.columns.find((c) => c.id === fromColId);
  const toCol = board.columns.find((c) => c.id === toColId);
  if (!fromCol || !toCol) return;
  const fi = fromCol.tasks.findIndex((t) => t.id === taskId);
  if (fi < 0) return;
  const [task] = fromCol.tasks.splice(fi, 1);
  if (fromCol === toCol) {
    let insertAt = toCol.tasks.length;
    if (beforeTaskId && beforeTaskId !== taskId) {
      const bi = toCol.tasks.findIndex((t) => t.id === beforeTaskId);
      insertAt = bi >= 0 ? bi : toCol.tasks.length;
    }
    toCol.tasks.splice(insertAt, 0, task);
    return;
  }
  if (beforeTaskId) {
    const bi = toCol.tasks.findIndex((t) => t.id === beforeTaskId);
    if (bi >= 0) toCol.tasks.splice(bi, 0, task);
    else toCol.tasks.push(task);
  } else {
    toCol.tasks.push(task);
  }
}

/**
 * Reordena columnas por índice de inserción (0 = antes de la primera, length = al final).
 * @param {import('../../core/types.js').KanbanBoard} board
 * @param {string} fromColId
 * @param {number} insertBeforeIndex
 */
export function moveKanbanColumnToInsertIndex(board, fromColId, insertBeforeIndex) {
  const n = board.columns.length;
  if (insertBeforeIndex < 0 || insertBeforeIndex > n) return;
  const fromIdx = board.columns.findIndex((c) => c.id === fromColId);
  if (fromIdx < 0) return;
  const [col] = board.columns.splice(fromIdx, 1);
  let idx = insertBeforeIndex;
  if (fromIdx < insertBeforeIndex) idx = insertBeforeIndex - 1;
  board.columns.splice(idx, 0, col);
  board.columns.forEach((c, i) => {
    c.order = i;
  });
}

/**
 * @deprecated Usar moveKanbanColumnToInsertIndex con zonas de drop.
 */
export function moveKanbanColumn(board, fromColId, toColId) {
  const toIdx = board.columns.findIndex((c) => c.id === toColId);
  if (toIdx < 0) return;
  moveKanbanColumnToInsertIndex(board, fromColId, toIdx);
}

/**
 * Cierra el modal de tarea Kanban si está abierto.
 * @param {import('../../app.js').App} app
 */
export function clearKanbanTaskModal(app) {
  const host = app.els?.modalHost;
  if (!host) return;
  if (host.querySelector('[data-kanban-task-modal]')) {
    host.innerHTML = '';
  }
}

/**
 * @param {HTMLElement} root
 * @param {() => void} close
 */
function attachModalDismiss(root, close) {
  const prev = document.activeElement;
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', onKey, true);
      close();
      if (prev instanceof HTMLElement) prev.focus();
    }
  };
  document.addEventListener('keydown', onKey, true);
  return () => document.removeEventListener('keydown', onKey, true);
}

/**
 * @param {import('../../app.js').App} app
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').KanbanBoard} board
 */
function mountKanbanTaskModal(app, book, board) {
  const tid = app.state.kanbanTaskId;
  if (!tid) return;
  let editTask = null;
  let editColId = '';
  for (const col of board.columns) {
    const t = col.tasks.find((x) => x.id === tid);
    if (t) {
      editTask = t;
      editColId = col.id;
      break;
    }
  }
  if (!editTask) {
    app.state.kanbanTaskId = null;
    clearKanbanTaskModal(app);
    return;
  }

  const host = app.els.modalHost;
  const defaultColor =
    editTask.backgroundColor && /^#[0-9a-fA-F]{6}$/.test(editTask.backgroundColor) ? editTask.backgroundColor : '#334155';

  host.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-kanban-task-modal data-kanban-backdrop>
      <div class="w-full max-w-md max-h-[min(90vh,32rem)] overflow-y-auto nl-scroll rounded-xl border border-nl-border bg-nl-surface shadow-xl p-5" data-kanban-panel role="dialog" aria-modal="true" aria-labelledby="kanban-task-edit-title">
        <div class="flex items-center justify-between gap-2 mb-4">
          <h3 id="kanban-task-edit-title" class="text-base font-semibold text-white">Editar tarea</h3>
          <button type="button" data-kan-task-modal-close class="text-nl-muted hover:text-slate-300 text-sm" aria-label="Cerrar">✕</button>
        </div>
        <div class="space-y-3">
          <input type="text" data-kan-task-title class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-white" value="${escapeHtml(editTask.title)}" placeholder="Título" />
          <textarea data-kan-task-desc rows="3" class="w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-slate-200" placeholder="Descripción">${escapeHtml(editTask.description)}</textarea>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-nl-muted">Inicio</label>
              <input type="date" data-kan-task-start class="mt-1 w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-slate-200" value="${escapeHtml(editTask.startDate)}" />
            </div>
            <div>
              <label class="text-xs text-nl-muted">Fin estimado</label>
              <input type="date" data-kan-task-due class="mt-1 w-full bg-nl-raised border border-nl-border rounded-lg px-3 py-2 text-sm text-slate-200" value="${escapeHtml(editTask.dueDate)}" />
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <label class="text-xs text-nl-muted">Color de fondo</label>
            <input type="color" data-kan-task-color class="h-8 w-14 rounded border border-nl-border bg-nl-raised cursor-pointer" value="${defaultColor}" />
            <button type="button" data-kan-task-clear-color class="text-xs text-indigo-400 hover:text-indigo-300">Quitar color</button>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" data-kan-task-modal-cancel class="px-3 py-2 rounded-lg border border-nl-border text-sm text-slate-300 hover:bg-nl-raised">Cancelar</button>
            <button type="button" data-kan-task-save class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const overlay = /** @type {HTMLElement|null} */ (host.querySelector('[data-kanban-backdrop]'));
  const panel = /** @type {HTMLElement|null} */ (host.querySelector('[data-kanban-panel]'));

  /** @type {() => void} */
  let removeDismiss = () => {};

  function closeModal() {
    removeDismiss();
    app.state.kanbanTaskId = null;
    host.innerHTML = '';
    app.refreshMain();
  }

  function saveAndClose() {
    const col = board.columns.find((c) => c.id === editColId);
    const task = col?.tasks.find((t) => t.id === tid);
    if (!task) {
      closeModal();
      return;
    }
    task.title = /** @type {HTMLInputElement} */ (host.querySelector('[data-kan-task-title]'))?.value.trim() || task.title;
    task.description = /** @type {HTMLTextAreaElement} */ (host.querySelector('[data-kan-task-desc]'))?.value || '';
    task.startDate = /** @type {HTMLInputElement} */ (host.querySelector('[data-kan-task-start]'))?.value || '';
    task.dueDate = /** @type {HTMLInputElement} */ (host.querySelector('[data-kan-task-due]'))?.value || '';
    const colorIn = /** @type {HTMLInputElement|null} */ (host.querySelector('[data-kan-task-color]'));
    task.backgroundColor = colorIn?.value || '';
    app.persist();
    closeModal();
  }

  removeDismiss = attachModalDismiss(/** @type {HTMLElement} */ (overlay), closeModal);

  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  panel?.addEventListener('click', (e) => e.stopPropagation());

  host.querySelector('[data-kan-task-modal-close]')?.addEventListener('click', closeModal);
  host.querySelector('[data-kan-task-modal-cancel]')?.addEventListener('click', closeModal);
  host.querySelector('[data-kan-task-save]')?.addEventListener('click', saveAndClose);
  host.querySelector('[data-kan-task-clear-color]')?.addEventListener('click', () => {
    const col = board.columns.find((c) => c.id === editColId);
    const task = col?.tasks.find((t) => t.id === tid);
    if (!task) return;
    task.backgroundColor = '';
    app.persist();
    app.refresh();
  });

  queueMicrotask(() => {
    /** @type {HTMLInputElement|null} */ (host.querySelector('[data-kan-task-title]'))?.focus();
  });
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../app.js').App} _app
 */
export function renderKanbanList(book, _app) {
  const boards = book.kanbanBoards || [];
  return `
    <div class="nl-view max-w-3xl">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Kanban</h2>
        <button type="button" data-kan-add-board class="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white">+ Nuevo tablero</button>
      </div>
      <ul class="space-y-2" data-kan-board-list>
        ${boards.length === 0 ? '<li class="text-sm text-nl-muted px-1 py-4">Aún no hay tableros. Crea uno para organizar tareas por columnas.</li>' : ''}
        ${boards
          .map(
            (kb) => `
          <li class="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-nl-border bg-nl-surface">
            <button type="button" data-kan-open-board="${escapeHtml(kb.id)}" class="flex-1 text-left text-sm text-white hover:text-indigo-300 font-medium">${escapeHtml(kb.name)}</button>
            <div class="flex items-center gap-2 shrink-0">
              <input type="text" data-kan-rename-board="${escapeHtml(kb.id)}" class="bg-nl-raised border border-nl-border rounded px-2 py-1 text-xs text-slate-200 w-40 max-w-full" value="${escapeHtml(kb.name)}" aria-label="Renombrar tablero" />
              <button type="button" data-kan-del-board="${escapeHtml(kb.id)}" class="text-xs text-red-400 hover:text-red-300 px-2" title="Eliminar tablero">Eliminar</button>
            </div>
          </li>`
          )
          .join('')}
      </ul>
    </div>
  `;
}

/**
 * Zona de inserción entre columnas (índice = posición antes de la columna en ese índice; length = al final).
 * @param {number} insertIdx
 */
function renderColDropZone(insertIdx) {
  return `
    <div class="kanban-col-drop flex-shrink-0 w-3 sm:w-4 self-stretch min-h-[8rem] rounded transition-colors flex justify-center"
         data-kan-col-drop="${insertIdx}"
         aria-hidden="true">
      <span class="kanban-col-drop-line w-0.5 h-full max-h-full rounded-full bg-transparent opacity-0 transition-opacity pointer-events-none"></span>
    </div>`;
}

/**
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').KanbanBoard} board
 * @param {import('../../app.js').App} app
 */
export function renderKanbanBoardView(_book, board, _app) {
  const n = board.columns.length;
  /** @type {string[]} */
  const parts = [];
  for (let i = 0; i <= n; i++) {
    parts.push(renderColDropZone(i));
    if (i < n) {
      const col = board.columns[i];
      const tasksHtml = col.tasks
        .map(
          (t) => `
        <li draggable="true" data-kan-task="${escapeHtml(t.id)}" data-kan-task-col="${escapeHtml(col.id)}"
            class="p-2 rounded-lg border border-nl-border cursor-grab active:cursor-grabbing text-left ${t.backgroundColor ? '' : 'bg-nl-bg'}"
            style="${t.backgroundColor ? `background-color: ${escapeHtml(t.backgroundColor)}` : ''}">
          <button type="button" data-kan-task-open="${escapeHtml(t.id)}" class="w-full text-left">
            <span class="text-sm font-medium text-white block truncate">${escapeHtml(t.title)}</span>
            ${t.description ? `<span class="text-xs text-nl-muted line-clamp-2">${escapeHtml(t.description)}</span>` : ''}
            <span class="text-[10px] text-nl-muted mt-1 block">
              ${t.startDate ? `Inicio ${escapeHtml(t.startDate)}` : ''}${t.startDate && t.dueDate ? ' · ' : ''}${t.dueDate ? `Fin ${escapeHtml(t.dueDate)}` : ''}
            </span>
          </button>
          <button type="button" data-kan-task-del="${escapeHtml(t.id)}" data-kan-task-del-col="${escapeHtml(col.id)}" class="mt-1 text-[10px] text-red-400 hover:text-red-300">Eliminar</button>
        </li>`
        )
        .join('');
      parts.push(`
      <div class="flex-1 min-w-[14rem] max-w-md flex flex-col rounded-lg border border-nl-border bg-nl-surface/80 min-h-0" data-kan-col="${escapeHtml(col.id)}">
        <div class="p-2 border-b border-nl-border flex items-center gap-2 bg-nl-raised/50 shrink-0">
          <button type="button" draggable="true" data-kan-col-handle="${escapeHtml(col.id)}" class="shrink-0 w-7 flex flex-col items-center justify-center rounded text-nl-muted hover:text-slate-300 cursor-grab active:cursor-grabbing select-none" title="Arrastrar columna" aria-label="Arrastrar columna">
            <span class="text-[10px] leading-none">⋮⋮</span>
          </button>
          <input type="text" data-kan-col-title="${escapeHtml(col.id)}" class="flex-1 min-w-0 bg-transparent border-b border-transparent focus:border-indigo-500 text-sm text-white font-medium focus:outline-none" value="${escapeHtml(col.title)}" />
          <button type="button" data-kan-col-del="${escapeHtml(col.id)}" class="text-xs text-red-400 hover:text-red-300 shrink-0 px-1" title="Eliminar columna">✕</button>
        </div>
        <ul data-kan-col-tasks="${escapeHtml(col.id)}" class="flex-1 p-2 space-y-2 nl-scroll overflow-y-auto min-h-[8rem]">
          ${tasksHtml}
        </ul>
        <div class="p-2 border-t border-nl-border shrink-0">
          <button type="button" data-kan-add-task="${escapeHtml(col.id)}" class="w-full py-1.5 rounded border border-dashed border-nl-border text-xs text-nl-muted hover:text-slate-300 hover:border-slate-500">+ Tarea</button>
        </div>
      </div>`);
    }
  }

  return `
    <div class="nl-view-kanban-board" data-kanban-root data-kanban-id="${escapeHtml(board.id)}">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0 mb-3">
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" data-kan-back-list class="text-sm text-indigo-400 hover:text-indigo-300 shrink-0">← Tableros</button>
          <input type="text" data-kan-board-title class="text-lg font-semibold bg-transparent border-b border-nl-border flex-1 min-w-0 text-white focus:outline-none focus:border-indigo-500 pb-1" value="${escapeHtml(board.name)}" />
        </div>
        <button type="button" data-kan-board-del class="text-xs text-red-400 hover:text-red-300 shrink-0 self-start sm:self-center">Eliminar tablero</button>
      </div>
      <div class="flex items-center gap-2 shrink-0 mb-2">
        <button type="button" data-kan-add-column class="text-xs px-3 py-1.5 rounded-lg border border-nl-border text-slate-300 hover:bg-nl-raised">+ Columna</button>
      </div>
      <div class="flex flex-1 min-h-0 gap-0 items-stretch w-full min-w-0 overflow-x-auto overflow-y-hidden nl-scroll pb-1" data-kan-columns>
        ${parts.join('')}
      </div>
    </div>
  `;
}

/**
 * @param {HTMLElement} main
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../app.js').App} app
 */
export function bindKanbanList(main, book, app) {
  clearKanbanTaskModal(app);
  if (!book.kanbanBoards) book.kanbanBoards = [];

  main.querySelector('[data-kan-add-board]')?.addEventListener('click', () => {
    const kb = createKanbanBoard();
    book.kanbanBoards.push(kb);
    app.persist();
    app.state.kanbanBoardId = kb.id;
    app.setView('kanbanBoard');
  });

  main.querySelectorAll('[data-kan-open-board]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-kan-open-board');
      if (id) {
        app.state.kanbanBoardId = id;
        app.state.kanbanTaskId = null;
        app.setView('kanbanBoard');
      }
    });
  });

  main.querySelectorAll('[data-kan-rename-board]').forEach((inp) => {
    inp.addEventListener('change', () => {
      const id = inp.getAttribute('data-kan-rename-board');
      const kb = id && book.kanbanBoards.find((b) => b.id === id);
      if (kb) {
        kb.name = /** @type {HTMLInputElement} */ (inp).value.trim() || kb.name;
        app.persist();
        app.refreshSidebar();
      }
    });
  });

  main.querySelectorAll('[data-kan-del-board]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-kan-del-board');
      const kb = id && book.kanbanBoards.find((b) => b.id === id);
      if (!kb) return;
      if (!confirm(`¿Eliminar el tablero «${kb.name}»?`)) return;
      book.kanbanBoards = book.kanbanBoards.filter((b) => b.id !== id);
      app.persist();
      app.refresh();
    });
  });
}

/**
 * @param {HTMLElement} main
 * @param {import('../../core/types.js').Book} book
 * @param {import('../../core/types.js').KanbanBoard} board
 * @param {import('../../app.js').App} app
 */
export function bindKanbanBoard(main, book, board, app) {
  if (!main.querySelector('[data-kanban-root]')) return;

  if (app.state.kanbanTaskId) {
    mountKanbanTaskModal(app, book, board);
  } else {
    clearKanbanTaskModal(app);
  }

  main.querySelector('[data-kan-back-list]')?.addEventListener('click', () => {
    clearKanbanTaskModal(app);
    app.state.kanbanBoardId = null;
    app.state.kanbanTaskId = null;
    app.setView('kanban');
  });

  const titleIn = main.querySelector('[data-kan-board-title]');
  titleIn?.addEventListener('change', () => {
    board.name = /** @type {HTMLInputElement} */ (titleIn).value.trim() || board.name;
    app.persist();
    app.refreshSidebar();
  });

  main.querySelector('[data-kan-board-del]')?.addEventListener('click', () => {
    if (!confirm(`¿Eliminar el tablero «${board.name}»?`)) return;
    clearKanbanTaskModal(app);
    book.kanbanBoards = book.kanbanBoards.filter((b) => b.id !== board.id);
    app.state.kanbanBoardId = null;
    app.state.kanbanTaskId = null;
    app.persist();
    app.setView('kanban');
  });

  main.querySelector('[data-kan-add-column]')?.addEventListener('click', () => {
    const col = createKanbanColumn({ title: 'Nueva columna', order: board.columns.length });
    board.columns.push(col);
    board.columns.forEach((c, i) => {
      c.order = i;
    });
    app.persist();
    app.refresh();
  });

  main.querySelectorAll('[data-kan-col-title]').forEach((inp) => {
    inp.addEventListener('change', () => {
      const id = inp.getAttribute('data-kan-col-title');
      const col = id && board.columns.find((c) => c.id === id);
      if (col) {
        col.title = /** @type {HTMLInputElement} */ (inp).value.trim() || col.title;
        app.persist();
      }
    });
  });

  main.querySelectorAll('[data-kan-col-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-kan-col-del');
      if (!id) return;
      if (!confirm('¿Eliminar esta columna y las tareas que contiene?')) return;
      board.columns = board.columns.filter((c) => c.id !== id);
      board.columns.forEach((c, i) => {
        c.order = i;
      });
      app.persist();
      app.refresh();
    });
  });

  main.querySelectorAll('[data-kan-add-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const colId = btn.getAttribute('data-kan-add-task');
      const col = colId && board.columns.find((c) => c.id === colId);
      if (!col) return;
      const t = createKanbanTask();
      col.tasks.push(t);
      app.state.kanbanTaskId = t.id;
      app.persist();
      app.refresh();
    });
  });

  main.querySelectorAll('[data-kan-task-open]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-kan-task-open');
      if (id) {
        app.state.kanbanTaskId = id;
        app.refresh();
      }
    });
  });

  main.querySelectorAll('[data-kan-task-del]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tid = btn.getAttribute('data-kan-task-del');
      const cid = btn.getAttribute('data-kan-task-del-col');
      const col = cid && board.columns.find((c) => c.id === cid);
      if (!col || !tid) return;
      col.tasks = col.tasks.filter((t) => t.id !== tid);
      if (app.state.kanbanTaskId === tid) app.state.kanbanTaskId = null;
      clearKanbanTaskModal(app);
      app.persist();
      app.refresh();
    });
  });

  /** @type {string|null} */
  let dragTaskPayload = null;

  main.querySelectorAll('[data-kan-task]').forEach((li) => {
    li.addEventListener('dragstart', (e) => {
      const tid = li.getAttribute('data-kan-task');
      const cid = li.getAttribute('data-kan-task-col');
      if (!tid || !cid) return;
      dragTaskPayload = dragPayloadTask(cid, tid);
      const dt = e.dataTransfer;
      if (dt) {
        dt.setData('text/plain', dragTaskPayload);
        dt.effectAllowed = 'move';
      }
    });
    li.addEventListener('dragend', () => {
      dragTaskPayload = null;
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const raw = e.dataTransfer?.getData('text/plain') || dragTaskPayload || '';
      const parsed = parseDragTask(raw);
      const targetTid = li.getAttribute('data-kan-task');
      const targetCid = li.getAttribute('data-kan-task-col');
      if (!parsed || !targetTid || !targetCid) return;
      if (parsed.taskId === targetTid) return;
      moveKanbanTask(board, parsed.colId, parsed.taskId, targetCid, targetTid);
      app.persist();
      app.refresh();
    });
  });

  main.querySelectorAll('[data-kan-col-tasks]').forEach((ul) => {
    const colId = ul.getAttribute('data-kan-col-tasks');
    if (!colId) return;
    ul.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    ul.addEventListener('drop', (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('[data-kan-task]')) return;
      e.preventDefault();
      const raw = e.dataTransfer?.getData('text/plain') || '';
      const parsed = parseDragTask(raw);
      if (!parsed || !colId) return;
      moveKanbanTask(board, parsed.colId, parsed.taskId, colId, null);
      app.persist();
      app.refresh();
    });
  });

  /** Arrastre de columnas solo desde el asa (getData en dragover suele ir vacío; usamos bandera). */
  /** @type {string|null} */
  let dragColPayload = null;
  /** @type {string|null} */
  let activeColDragId = null;

  function clearColDropHighlights() {
    main.querySelectorAll('[data-kan-col-drop]').forEach((z) => {
      z.classList.remove('kanban-col-drop--active');
      const line = z.querySelector('.kanban-col-drop-line');
      line?.classList.add('opacity-0', 'bg-transparent');
      line?.classList.remove('opacity-100', 'bg-indigo-400');
    });
  }

  main.querySelectorAll('[data-kan-col-handle]').forEach((handle) => {
    handle.addEventListener('dragstart', (e) => {
      const colId = handle.getAttribute('data-kan-col-handle');
      if (!colId) return;
      activeColDragId = colId;
      dragColPayload = dragPayloadCol(colId);
      const dt = e.dataTransfer;
      if (dt) {
        dt.setData('text/plain', dragColPayload);
        dt.effectAllowed = 'move';
      }
      e.stopPropagation();
    });
    handle.addEventListener('dragend', () => {
      activeColDragId = null;
      dragColPayload = null;
      clearColDropHighlights();
    });
  });

  main.querySelectorAll('[data-kan-col-drop]').forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      if (!activeColDragId) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      zone.classList.add('kanban-col-drop--active');
      const line = zone.querySelector('.kanban-col-drop-line');
      line?.classList.remove('opacity-0', 'bg-transparent');
      line?.classList.add('opacity-100', 'bg-indigo-400');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('kanban-col-drop--active');
      const line = zone.querySelector('.kanban-col-drop-line');
      line?.classList.add('opacity-0', 'bg-transparent');
      line?.classList.remove('opacity-100', 'bg-indigo-400');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      const raw = e.dataTransfer?.getData('text/plain') || dragColPayload || '';
      const fromId = parseDragCol(raw) || activeColDragId;
      const idxStr = zone.getAttribute('data-kan-col-drop');
      const insertBeforeIndex = idxStr != null ? parseInt(idxStr, 10) : NaN;
      clearColDropHighlights();
      activeColDragId = null;
      dragColPayload = null;
      if (!fromId || Number.isNaN(insertBeforeIndex)) return;
      moveKanbanColumnToInsertIndex(board, fromId, insertBeforeIndex);
      app.persist();
      app.refresh();
    });
  });
}
