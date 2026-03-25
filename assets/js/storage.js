/**
 * IndexedDB + auto-guardado — Narrative Lab
 */

import { createEmptyWorkspace, migrateWorkspace } from './models.js';
import { debounce } from './utils.js';
import { getAutosaveMs } from './prefs.js';

const DB_NAME = 'narrative_lab_db';
const DB_VERSION = 1;
const STORE = 'workspace';

/** @type {IDBDatabase|null} */
let dbPromise = null;

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  if (dbPromise) return Promise.resolve(dbPromise);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      dbPromise = req.result;
      resolve(dbPromise);
    };
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
}

const DOC_ID = 'main';

/**
 * @returns {Promise<import('./types.js').Workspace>}
 */
export async function loadWorkspace() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE);
    const g = st.get(DOC_ID);
    g.onerror = () => reject(g.error);
    g.onsuccess = () => {
      const row = g.result;
      if (!row || !row.data) {
        resolve(migrateWorkspace(createEmptyWorkspace()));
        return;
      }
      resolve(migrateWorkspace(row.data));
    };
  });
}

/**
 * @param {import('./types.js').Workspace} workspace
 * @returns {Promise<void>}
 */
export async function saveWorkspace(workspace) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    const put = st.put({ id: DOC_ID, data: workspace, updatedAt: Date.now() });
    put.onerror = () => reject(put.error);
    put.onsuccess = () => resolve();
  });
}

/** @type {((status: 'idle'|'saving'|'saved'|'error') => void)|null} */
let statusCallback = null;

/**
 * @param {(status: 'idle'|'saving'|'saved'|'error') => void} fn
 */
export function setSaveStatusCallback(fn) {
  statusCallback = fn;
}

function emitStatus(/** @type {'idle'|'saving'|'saved'|'error'} */ s) {
  if (statusCallback) statusCallback(s);
}

/** @type {import('./types.js').Workspace|null} */
let pendingWorkspace = null;

/** @type {ReturnType<typeof debounce<[]>>} */
let debouncedFlush = createDebouncedFlush(getAutosaveMs());

function createDebouncedFlush(ms) {
  return debounce(async () => {
    if (!pendingWorkspace) return;
    const ws = pendingWorkspace;
    pendingWorkspace = null;
    try {
      emitStatus('saving');
      await saveWorkspace(ws);
      emitStatus('saved');
      setTimeout(() => emitStatus('idle'), 1500);
    } catch (e) {
      console.error(e);
      emitStatus('error');
    }
  }, ms);
}

/**
 * Actualiza el retardo de guardado automático (vuelve a crear el debounce).
 * @param {number} ms
 */
export function configureAutosaveDelay(ms) {
  debouncedFlush.cancel();
  debouncedFlush = createDebouncedFlush(ms);
}

/**
 * Programa guardado (debounced según preferencias).
 * @param {import('./types.js').Workspace} workspace
 */
export function scheduleSave(workspace) {
  pendingWorkspace = workspace;
  debouncedFlush();
}

/**
 * Guardado inmediato (p. ej. antes de cerrar).
 * @param {import('./types.js').Workspace} workspace
 */
export async function flushSave(workspace) {
  debouncedFlush.cancel();
  pendingWorkspace = null;
  emitStatus('saving');
  await saveWorkspace(workspace);
  emitStatus('saved');
  setTimeout(() => emitStatus('idle'), 1500);
}
