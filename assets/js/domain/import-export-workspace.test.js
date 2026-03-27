import { describe, it, expect } from 'vitest';
import {
  APP_EXPORT_NAME,
  EXPORT_FORMAT_VERSION,
  buildExportPayload,
  mergeWorkspaces,
  mergeWorkspacesKeepBoth,
  parseAndValidate,
  serializeWorkspace,
} from './import-export-workspace.js';
import { createEmptyBook, createEmptyWorkspace, createKanbanBoard } from './models.js';

describe('buildExportPayload', () => {
  it('incluye metadatos y libros', () => {
    const ws = createEmptyWorkspace();
    const b = createEmptyBook({ name: 'Libro A' });
    ws.books.push(b);
    const p = buildExportPayload(ws);
    expect(p.appName).toBe(APP_EXPORT_NAME);
    expect(p.exportFormatVersion).toBe(EXPORT_FORMAT_VERSION);
    expect(p.books).toHaveLength(1);
    expect(p.books[0].name).toBe('Libro A');
    expect(p.authorProfile).toBeDefined();
    expect(p.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('serializeWorkspace', () => {
  it('produce JSON parseable', () => {
    const ws = createEmptyWorkspace();
    const s = serializeWorkspace(ws);
    const o = JSON.parse(s);
    expect(o.books).toEqual([]);
  });
});

describe('mergeWorkspaces', () => {
  it('actualiza libro por id coincidente', () => {
    const base = createEmptyWorkspace();
    const b1 = createEmptyBook({ name: 'Uno' });
    base.books.push(b1);
    const incoming = createEmptyWorkspace();
    const b2 = { ...createEmptyBook({ name: 'Actualizado' }), id: b1.id };
    incoming.books.push(b2);
    const m = mergeWorkspaces(base, incoming);
    expect(m.books).toHaveLength(1);
    expect(m.books[0].name).toBe('Actualizado');
  });

  it('sustituye tableros Kanban al fusionar libro por id', () => {
    const base = createEmptyWorkspace();
    const b1 = createEmptyBook({ name: 'L' });
    b1.kanbanBoards = [createKanbanBoard({ name: 'Viejo' })];
    base.books.push(b1);
    const incoming = createEmptyWorkspace();
    const b2 = createEmptyBook({ name: 'L', id: b1.id });
    b2.kanbanBoards = [createKanbanBoard({ name: 'Nuevo' })];
    incoming.books.push(b2);
    const m = mergeWorkspaces(base, incoming);
    expect(m.books[0].kanbanBoards).toHaveLength(1);
    expect(m.books[0].kanbanBoards[0].name).toBe('Nuevo');
  });

  it('añade libros nuevos', () => {
    const base = createEmptyWorkspace();
    const a = createEmptyBook({ name: 'A' });
    base.books.push(a);
    const incoming = createEmptyWorkspace();
    const b = createEmptyBook({ name: 'B' });
    incoming.books.push(b);
    const m = mergeWorkspaces(base, incoming);
    expect(m.books).toHaveLength(2);
  });
});

describe('mergeWorkspacesKeepBoth', () => {
  it('reasigna id en colisión y actualiza bookId en highlights', () => {
    const base = createEmptyWorkspace();
    const b1 = createEmptyBook({ name: 'Original' });
    base.books.push(b1);
    const incoming = createEmptyWorkspace();
    const dup = createEmptyBook({ name: 'Copia' });
    dup.id = b1.id;
    dup.highlights = [{ bookId: b1.id, id: 'h1', excerpt: 'x' }];
    incoming.books.push(dup);
    const m = mergeWorkspacesKeepBoth(base, incoming);
    expect(m.books).toHaveLength(2);
    const added = m.books.find((x) => x.name === 'Copia');
    expect(added).toBeDefined();
    expect(added.id).not.toBe(b1.id);
    expect(added.highlights[0].bookId).toBe(added.id);
  });
});

describe('parseAndValidate', () => {
  it('delega en validateWorkspace', () => {
    const r = parseAndValidate({ books: [] });
    expect(r.ok).toBe(true);
  });
});
