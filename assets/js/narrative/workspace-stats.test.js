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
});
