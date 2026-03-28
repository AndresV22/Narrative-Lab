import { describe, it, expect } from 'vitest';
import { createEmptyBook, createEmptyWorkspace } from '../domain/models.js';
import { aggregateWorkspaceStats } from './workspace-stats.js';

describe('aggregateWorkspaceStats', () => {
  it('agrega totales', () => {
    const ws = createEmptyWorkspace();
    const a = createEmptyBook({ name: 'A' });
    a.chapters = [{ id: 'c1', title: 'C1', order: 0, chapterGoal: '', content: '<p>x</p>', scenes: [] }];
    ws.books.push(a);
    const agg = aggregateWorkspaceStats(ws);
    expect(agg.bookCount).toBe(1);
    expect(agg.chapterCount).toBe(1);
    expect(agg.totalWords).toBeGreaterThanOrEqual(0);
  });

  it('filtra por ids de libro', () => {
    const ws = createEmptyWorkspace();
    const a = createEmptyBook({ name: 'A' });
    const b = createEmptyBook({ name: 'B' });
    a.chapters = [{ id: 'c1', title: 'C1', order: 0, chapterGoal: '', content: '<p>uno dos</p>', scenes: [] }];
    b.chapters = [{ id: 'c2', title: 'C2', order: 0, chapterGoal: '', content: '<p>tres</p>', scenes: [] }];
    ws.books.push(a, b);
    const onlyA = aggregateWorkspaceStats(ws, { bookIds: new Set([a.id]) });
    expect(onlyA.bookCount).toBe(1);
    expect(onlyA.chapterCount).toBe(1);
    expect(aggregateWorkspaceStats(ws, { bookIds: new Set() }).bookCount).toBe(0);
    expect(aggregateWorkspaceStats(ws, { bookIds: new Set() }).totalWords).toBe(0);
  });
});
