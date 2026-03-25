import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SCHEMA_VERSION,
  createEmptyBook,
  createEmptyWorkspace,
  migrateWorkspace,
  validateWorkspace,
} from './models.js';

describe('validateWorkspace', () => {
  it('rechaza no-objeto', () => {
    const r = validateWorkspace(null);
    expect(r.ok).toBe(false);
  });

  it('rechaza sin books', () => {
    const r = validateWorkspace({});
    expect(r.ok).toBe(false);
  });

  it('rechaza books no array', () => {
    const r = validateWorkspace({ books: 'x' });
    expect(r.ok).toBe(false);
  });

  it('acepta workspace mínimo', () => {
    const r = validateWorkspace({ books: [] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.workspace.schemaVersion).toBe(SCHEMA_VERSION);
      expect(r.workspace.books).toEqual([]);
    }
  });

  it('rechaza esquema futuro', () => {
    const r = validateWorkspace({ schemaVersion: SCHEMA_VERSION + 99, books: [] });
    expect(r.ok).toBe(false);
  });
});

describe('migrateWorkspace', () => {
  it('normaliza libros y versión', () => {
    const ws = createEmptyWorkspace();
    const b = createEmptyBook({ name: 'Test' });
    ws.books.push(b);
    const m = migrateWorkspace(ws);
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    expect(m.books[0].name).toBe('Test');
  });
});

describe('normalizeBook via validateWorkspace', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('fixed-uuid-1');
  });

  it('rellena campos por defecto', () => {
    const r = validateWorkspace({
      books: [{}],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.workspace.books[0].id).toBe('fixed-uuid-1');
      expect(r.workspace.books[0].name).toBe('Sin título');
    }
  });
});
