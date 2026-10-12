import { describe, it, expect } from 'vitest';
import { attachListKeyboard, execInsertList } from './editor-list-behavior.js';

/**
 * @param {HTMLElement} el
 */
function caretIn(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

describe('listas del editor', () => {
  it('Enter en un ítem vacío parte la lista y deja un párrafo en medio', () => {
    const host = document.createElement('div');
    host.innerHTML = '<ul><li>a</li><li><br></li><li>c</li></ul>';
    document.body.appendChild(host);
    const empty = host.querySelectorAll('li')[1];
    caretIn(/** @type {HTMLElement} */ (empty));
    const cleanup = attachListKeyboard(host);

    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    host.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    const lists = [...host.querySelectorAll('ul')];
    expect(lists).toHaveLength(2);
    expect(lists[0].textContent).toBe('a');
    expect(lists[1].textContent).toBe('c');
    expect(host.querySelector('p')).toBeTruthy();

    cleanup();
    host.remove();
  });

  it('Enter en un ítem con texto no sale de la lista', () => {
    const host = document.createElement('div');
    host.innerHTML = '<ul><li>texto</li></ul>';
    document.body.appendChild(host);
    caretIn(/** @type {HTMLElement} */ (host.querySelector('li')));
    const cleanup = attachListKeyboard(host);
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    host.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(host.querySelectorAll('ul')).toHaveLength(1);
    cleanup();
    host.remove();
  });

  it('insertar viñetas sustituye el párrafo y no anida la lista dentro', () => {
    const host = document.createElement('div');
    host.contentEditable = 'true';
    host.innerHTML = '<p>Hola</p>';
    document.body.appendChild(host);
    const text = host.querySelector('p')?.firstChild;
    const range = document.createRange();
    range.setStart(/** @type {Text} */ (text), 1);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    execInsertList(host, 'insertUnorderedList');

    expect(host.querySelector('p ul, p ol')).toBeNull();
    expect(host.querySelector('ul > li')?.textContent).toBe('Hola');
    host.remove();
  });
});
