import { describe, it, expect, afterEach, vi } from 'vitest';
import { flattenPageLayout, layoutEditorPages, wrapContentInFirstPage } from './editor-paginate.js';

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
    });
  });
});
