import { describe, it, expect, afterEach, vi } from 'vitest';
import { editorContentHtml, flattenPageLayout, layoutEditorPages, wrapContentInFirstPage } from './editor-paginate.js';

describe('editor-paginate', () => {
  it('wrapContentInFirstPage envuelve contenido en .nl-page', () => {
    const host = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = 'Hola';
    host.appendChild(p);
    wrapContentInFirstPage(host);
    const page = host.querySelector(':scope > .nl-page');
    expect(page).toBeTruthy();
    expect(page?.querySelector('p')?.textContent).toBe('Hola');
  });

  it('flattenPageLayout elimina .nl-page y conserva bloques', () => {
    const host = document.createElement('div');
    const page = document.createElement('div');
    page.className = 'nl-page';
    const p = document.createElement('p');
    p.textContent = 'X';
    page.appendChild(p);
    host.appendChild(page);
    flattenPageLayout(host);
    expect(host.querySelector('.nl-page')).toBeNull();
    expect(host.querySelector('p')?.textContent).toBe('X');
  });

  describe('layoutEditorPages', () => {
    /** @type {import('vitest').MockInstance | undefined} */
    let clientSpy;
    /** @type {import('vitest').MockInstance | undefined} */
    let scrollSpy;

    afterEach(() => {
      clientSpy?.mockRestore();
      scrollSpy?.mockRestore();
    });

    it('no hace nada si el host no tiene nl-editor-page-layout', () => {
      const host = document.createElement('div');
      host.innerHTML = '<div class="nl-page"><p>a</p></div>';
      layoutEditorPages(host);
      expect(host.querySelectorAll('.nl-page')).toHaveLength(1);
    });

    it('produce estructura con .nl-page sin lanzar', () => {
      const host = document.createElement('div');
      host.className = 'nl-editor-page-layout';
      const p = document.createElement('p');
      p.textContent = 'Corto';
      host.appendChild(p);
      layoutEditorPages(host);
      expect(host.querySelector('.nl-page')).toBeTruthy();
      expect(host.querySelector('p')?.textContent).toContain('Corto');
    });

    it('parte un párrafo largo en varias páginas cuando el layout indica desbordamiento', () => {
      clientSpy = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () {
        if (this instanceof HTMLElement && this.classList.contains('nl-page')) return 100;
        return Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')?.get?.call(this) ?? 0;
      });
      scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
        if (this instanceof HTMLElement && this.classList.contains('nl-page')) {
          const len = (this.textContent || '').length;
          return len > 40 ? 200 : 50;
        }
        return Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')?.get?.call(this) ?? 0;
      });

      const host = document.createElement('div');
      host.className = 'nl-editor-page-layout';
      const long = 'palabra '.repeat(80);
      const p = document.createElement('p');
      p.textContent = long;
      host.appendChild(p);

      layoutEditorPages(host);
      const pages = host.querySelectorAll('.nl-page');
      expect(pages.length).toBeGreaterThan(1);

      const html = editorContentHtml(host);
      expect(html).not.toContain('nl-page');
      expect(html).not.toContain('data-nl-page-cont');
      const stored = document.createElement('div');
      stored.innerHTML = html;
      expect(stored.querySelectorAll('p')).toHaveLength(1);
      expect(stored.textContent?.replace(/\s+/g, ' ').trim()).toBe(long.replace(/\s+/g, ' ').trim());
    });

    it('conserva el marcador de cursor al partir un párrafo', () => {
      clientSpy = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () {
        if (this instanceof HTMLElement && this.classList.contains('nl-page')) return 100;
        return 0;
      });
      scrollSpy = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
        if (this instanceof HTMLElement && this.classList.contains('nl-page')) {
          const len = (this.textContent || '').length;
          return len > 40 ? 200 : 50;
        }
        return 0;
      });

      const host = document.createElement('div');
      host.className = 'nl-editor-page-layout';
      host.contentEditable = 'true';
      const p = document.createElement('p');
      p.textContent = 'palabra '.repeat(80);
      host.appendChild(p);
      document.body.appendChild(host);
      const text = p.firstChild;
      const range = document.createRange();
      range.setStart(/** @type {Text} */ (text), 8);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      layoutEditorPages(host);
      expect(host.querySelector('[data-nl-caret-marker]')).toBeTruthy();
      host.remove();
    });

    it('no devuelve el foco si el usuario ya está en otro control', async () => {
      const host = document.createElement('div');
      host.className = 'nl-editor-page-layout';
      const p = document.createElement('p');
      p.textContent = 'Corto';
      host.appendChild(p);
      const button = document.createElement('button');
      button.textContent = 'Otro';
      document.body.append(host, button);
      button.focus();

      layoutEditorPages(host);
      await new Promise((resolve) => queueMicrotask(resolve));

      expect(document.activeElement).toBe(button);
      host.remove();
      button.remove();
    });
  });

  it('editorContentHtml quita las hojas y vuelve a unir el párrafo partido', () => {
    const host = document.createElement('div');
    host.innerHTML =
      '<div class="nl-page"><p>Hola <strong>mun</strong></p></div><div class="nl-page"><p data-nl-page-cont="1"><strong>do</strong> fin</p></div>';
    const html = editorContentHtml(host);
    expect(html).not.toContain('nl-page');
    expect(html).not.toContain('data-nl-page-cont');
    const stored = document.createElement('div');
    stored.innerHTML = html;
    expect(stored.querySelectorAll('p')).toHaveLength(1);
    expect(stored.querySelectorAll('strong')).toHaveLength(1);
    expect(stored.textContent).toBe('Hola mundo fin');
  });
});
