import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applySearchHighlightToEditorHost } from './search-highlight.js';

describe('applySearchHighlightToEditorHost', () => {
  let host;

  beforeEach(() => {
    host = document.createElement('div');
    host.setAttribute('contenteditable', 'true');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('envuelve la primera coincidencia en mark.nl-search-hit', () => {
    host.innerHTML = '<p>Un párrafo con <strong>café</strong> y más texto.</p>';
    const ok = applySearchHighlightToEditorHost(host, 'café');
    expect(ok).toBe(true);
    const mark = host.querySelector('mark.nl-search-hit');
    expect(mark).toBeTruthy();
    expect(mark?.textContent).toBe('café');
  });

  it('devuelve false si no hay coincidencia', () => {
    host.innerHTML = '<p>Sin el término.</p>';
    expect(applySearchHighlightToEditorHost(host, 'xyz')).toBe(false);
  });
});
