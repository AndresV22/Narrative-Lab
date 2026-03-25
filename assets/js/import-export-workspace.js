/**
 * Importar / exportar workspace JSON completo — Narrative Lab
 */

import { validateWorkspace } from './models.js';
import { deepClone, uuid } from './utils.js';

/** Nombre de la aplicación en metadatos de exportación */
export const APP_EXPORT_NAME = 'Narrative Lab';

/** Versión del sobre JSON de exportación (independiente de schemaVersion de libros) */
export const EXPORT_FORMAT_VERSION = 1;

/**
 * Objeto listo para serializar (incluye metadatos de exportación).
 * @param {import('./types.js').Workspace} workspace
 */
export function buildExportPayload(workspace) {
  return {
    schemaVersion: workspace.schemaVersion,
    books: workspace.books,
    exportedAt: new Date().toISOString(),
    appName: APP_EXPORT_NAME,
    exportFormatVersion: EXPORT_FORMAT_VERSION,
  };
}

/**
 * @param {import('./types.js').Workspace} workspace
 * @returns {string}
 */
export function serializeWorkspace(workspace) {
  return JSON.stringify(buildExportPayload(workspace), null, 2);
}

/**
 * @param {import('./types.js').Workspace} workspace
 * @param {string} [filename]
 */
export function downloadWorkspaceJson(workspace, filename = 'narrative-lab-workspace.json') {
  const blob = new Blob([serializeWorkspace(workspace)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * @param {File} file
 * @returns {Promise<unknown>}
 */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        resolve(JSON.parse(String(r.result)));
      } catch {
        reject(new Error('El archivo no es JSON válido'));
      }
    };
    r.onerror = () => reject(r.error);
    r.readAsText(file, 'utf-8');
  });
}

/**
 * Fusiona workspaces: mantiene libros existentes por id, añade nuevos, actualiza por id coincidente.
 * @param {import('./types.js').Workspace} base
 * @param {import('./types.js').Workspace} incoming
 * @returns {import('./types.js').Workspace}
 */
export function mergeWorkspaces(base, incoming) {
  const map = new Map();
  for (const b of base.books) map.set(b.id, deepClone(b));
  for (const b of incoming.books) {
    if (map.has(b.id)) {
      map.set(b.id, deepClone(b));
    } else {
      map.set(b.id, deepClone(b));
    }
  }
  return {
    schemaVersion: base.schemaVersion,
    books: Array.from(map.values()),
  };
}

/**
 * Reasigna IDs de libros entrantes para evitar colisiones.
 * @param {import('./types.js').Workspace} base
 * @param {import('./types.js').Workspace} incoming
 */
export function mergeWorkspacesKeepBoth(base, incoming) {
  const existing = new Set(base.books.map((b) => b.id));
  const books = [...base.books.map(deepClone)];
  for (const b of incoming.books) {
    let nb = deepClone(b);
    if (existing.has(nb.id)) {
      const oldId = nb.id;
      nb.id = uuid();
      // Actualizar referencias internas bookId en highlights
      for (const h of nb.highlights || []) {
        if (h.bookId === oldId) h.bookId = nb.id;
      }
    }
    existing.add(nb.id);
    books.push(nb);
  }
  return { schemaVersion: base.schemaVersion, books };
}

/**
 * @param {unknown} raw
 */
export function parseAndValidate(raw) {
  return validateWorkspace(raw);
}
