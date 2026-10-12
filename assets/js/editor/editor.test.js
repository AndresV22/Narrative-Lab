import { describe, it, expect, vi } from 'vitest';
import { computeEditorRealtimeMetrics, RichEditor } from './editor.js';

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

  it('estima el diálogo por párrafo y por salto br, no por el texto plano junto', () => {
    const html = '<p>— Hola, dijo.</p><p>Ella no contestó.</p><p>Luego añadió:<br>— Está bien.</p>';
    const m = computeEditorRealtimeMetrics(html);
    expect(m.paragraphCount).toBe(3);
    expect(m.dialogueRatio).toBeGreaterThan(0.4);
    expect(m.dialogueRatio).toBeLessThan(1);
  });
});

describe('RichEditor', () => {
  it('no guarda el cromo de paginación y limpia hojas al montar', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = new RichEditor(host);
    editor.mount('<div class="nl-page" data-nl-page=""><p>Hola</p></div>');
    expect(editor.getHtml()).not.toContain('nl-page');
    expect(editor.getHtml()).toContain('Hola');
    expect(host.classList.contains('nl-editor-empty')).toBe(false);
    editor.destroy();
    host.remove();
  });

  it('marca vacío cuando solo queda un párrafo con br', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = new RichEditor(host);
    editor.mount('<p><br></p>');
    expect(host.classList.contains('nl-editor-empty')).toBe(true);
    host.innerHTML = '<p>Texto</p>';
    host.dispatchEvent(new Event('input'));
    expect(host.classList.contains('nl-editor-empty')).toBe(false);
    editor.destroy();
    host.remove();
  });

  it('Ctrl+Shift+- inserta raya y no aleja el zoom', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = new RichEditor(host);
    editor.mount('<p>Hola</p>');
    const text = host.querySelector('p')?.firstChild;
    const range = document.createRange();
    range.setStart(/** @type {Text} */ (text), 4);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const zoom = vi.fn();
    host.addEventListener('nl-editor-zoom-out', zoom);
    const em = new KeyboardEvent('keydown', {
      key: '_',
      code: 'Minus',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(em);
    expect(em.defaultPrevented).toBe(true);
    expect(zoom).not.toHaveBeenCalled();
    expect(host.textContent).toContain('—');

    const out = new KeyboardEvent('keydown', {
      key: '-',
      code: 'Minus',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(out);
    expect(zoom).toHaveBeenCalledTimes(1);

    editor.destroy();
    host.remove();
  });

  it('deshacer y rehacer no se pisan entre sí', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const editor = new RichEditor(host);
    editor.mount('<p>uno</p>');
    host.innerHTML = '<p>uno dos</p>';
    host.dispatchEvent(new Event('input'));
    host.innerHTML = '<p>uno dos tres</p>';
    host.dispatchEvent(new Event('input'));

    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true })
    );
    expect(editor.getHtml()).toContain('uno dos');
    expect(editor.getHtml()).not.toContain('tres');

    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true, cancelable: true })
    );
    expect(editor.getHtml()).toContain('tres');

    editor.destroy();
    host.remove();
  });
});
