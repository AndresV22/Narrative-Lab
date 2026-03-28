import { describe, it, expect } from 'vitest';
import { computeEditorRealtimeMetrics } from './editor.js';

describe('computeEditorRealtimeMetrics', () => {
  it('cuenta varios párrafos HTML (&lt;p&gt;), no solo uno', () => {
    const html =
      '<p>Primer bloque de texto.</p><p>Segundo bloque distinto.</p><p>Tercero.</p>';
    const m = computeEditorRealtimeMetrics(html);
    expect(m.skipped).toBeUndefined();
    expect(m.paragraphCount).toBe(3);
    expect(m.maxParagraphWords).toBeGreaterThanOrEqual(2);
  });

  it('cuenta encabezados como bloques separados', () => {
    const html = '<h2>Título</h2><p>Cuerpo del párrafo aquí.</p>';
    const m = computeEditorRealtimeMetrics(html);
    expect(m.paragraphCount).toBe(2);
  });
});
