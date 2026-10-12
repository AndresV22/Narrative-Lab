import { describe, it, expect, vi } from 'vitest';
import { bindToolbar, computeEditorRealtimeMetrics, RichEditor, toolbarHtml } from './editor.js';

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

describe('tamaño de fuente', () => {
  /**
   * @returns {{ wrap: HTMLElement, host: HTMLElement, editor: RichEditor, input: HTMLInputElement, cleanup: () => void }}
   */
  function mount() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `${toolbarHtml()}<div id="nl-host"></div>`;
    document.body.appendChild(wrap);
    const host = /** @type {HTMLElement} */ (wrap.querySelector('#nl-host'));
    const editor = new RichEditor(host);
    editor.mount('<p>Hola mundo</p>');
    const cleanup = bindToolbar(/** @type {HTMLElement} */ (wrap.querySelector('[data-nl-toolbar]')), editor);
    const input = /** @type {HTMLInputElement} */ (wrap.querySelector('[data-font-size-px]'));
    return { wrap, host, editor, input, cleanup };
  }

  function selectWord(host) {
    const text = host.querySelector('p')?.firstChild;
    const range = document.createRange();
    range.setStart(/** @type {Text} */ (text), 0);
    range.setEnd(/** @type {Text} */ (text), 4);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  it('el botón de subir tamaño cambia la selección y conserva el texto', () => {
    const { wrap, host, editor, cleanup } = mount();
    selectWord(host);
    const up = /** @type {HTMLButtonElement} */ (wrap.querySelector('[data-font-size-step="1"]'));
    up.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    up.click();
    expect(host.textContent).toContain('Hola');
    expect(host.innerHTML).toContain('font-size: 18px');
    cleanup();
    editor.destroy();
    wrap.remove();
  });

  it('escribir 20 no borra la selección y aplica 20px al confirmar', () => {
    const { wrap, host, editor, input, cleanup } = mount();
    selectWord(host);
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    input.focus();
    input.value = '2';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '2' }));
    input.value = '20';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '0' }));
    expect(host.textContent).toContain('Hola mundo');
    expect(host.innerHTML).not.toContain('font-size: 8px');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(host.textContent).toContain('Hola mundo');
    expect(host.innerHTML).toContain('font-size: 20px');
    cleanup();
    editor.destroy();
    wrap.remove();
  });
});
