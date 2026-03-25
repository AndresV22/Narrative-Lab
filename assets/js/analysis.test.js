import { describe, it, expect } from 'vitest';
import { getTimelineConflicts } from './analysis.js';

describe('getTimelineConflicts', () => {
  it('avisa si un evento posterior en la línea tiene fecha calendario anterior', () => {
    const book = {
      events: [
        { id: 'a', title: 'Presente', dateLabel: '01/01/2020', sortKey: 0, content: '' },
        { id: 'b', title: 'Pasado', dateLabel: '01/01/2019', sortKey: 1, content: '' },
      ],
    };
    const c = getTimelineConflicts(/** @type {import('./types.js').Book} */ (book));
    expect(c.some((x) => x.code === 'event_date_order_mismatch')).toBe(true);
  });

  it('no avisa si las fechas van en orden no decreciente', () => {
    const book = {
      events: [
        { id: 'a', title: 'A', dateLabel: '01/01/2019', sortKey: 0, content: '' },
        { id: 'b', title: 'B', dateLabel: '01/01/2020', sortKey: 1, content: '' },
      ],
    };
    const c = getTimelineConflicts(/** @type {import('./types.js').Book} */ (book));
    expect(c.some((x) => x.code === 'event_date_order_mismatch')).toBe(false);
  });

  it('ignora pares con etiquetas no numéricas DD/MM/AAAA', () => {
    const book = {
      events: [
        { id: 'a', title: 'A', dateLabel: 'Era antigua', sortKey: 0, content: '' },
        { id: 'b', title: 'B', dateLabel: '01/01/2020', sortKey: 1, content: '' },
      ],
    };
    const c = getTimelineConflicts(/** @type {import('./types.js').Book} */ (book));
    expect(c.some((x) => x.code === 'event_date_order_mismatch')).toBe(false);
  });
});
