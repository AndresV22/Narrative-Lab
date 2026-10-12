/**
 * Listas en contenteditable: inserción fiable y Enter en un ítem vacío para salir.
 * Enter en un ítem con texto lo deja al navegador (crea el siguiente ítem).
 * El segundo Enter, ya sobre el ítem vacío, sale de la lista.
 */

import { blockContainerForNode } from './editor-helpers.js';

/**
 * @param {HTMLElement} host
 * @returns {HTMLLIElement|null}
 */
function getCurrentLi(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let n = sel.anchorNode;
  if (n?.nodeType === Node.TEXT_NODE) n = n.parentNode;
  const el = n && n.nodeType === Node.ELEMENT_NODE ? /** @type {Element} */ (n) : n?.parentElement;
  const li = el?.closest?.('li');
  return li && host.contains(li) ? /** @type {HTMLLIElement} */ (li) : null;
}

/**
 * @param {HTMLLIElement} li
 */
function isLiEmpty(li) {
  const t = (li.textContent || '').replace(/\u00a0/g, ' ').trim();
  return t === '';
}

/**
 * @param {HTMLElement} el
 */
function placeCaretAtStart(el) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.setStart(el, 0);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

/**
 * @param {HTMLElement} list
 * @returns {HTMLElement}
 */
function cloneListShell(list) {
  const next = document.createElement(list.tagName.toLowerCase());
  for (const attr of list.attributes) next.setAttribute(attr.name, attr.value);
  return next;
}

/**
 * Sale del ítem vacío. Si hay ítems delante y detrás, parte la lista en dos.
 * En una lista anidada, el ítem vacío sube un nivel.
 * @param {HTMLElement} host
 * @param {HTMLLIElement} li
 */
function exitListFromEmptyItem(host, li) {
  const list = li.parentElement;
  if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return;
  const parent = list.parentNode;
  if (!parent) return;

  /** @type {Element[]} */
  const after = [];
  let sib = li.nextElementSibling;
  while (sib) {
    const next = sib.nextElementSibling;
    after.push(sib);
    sib = next;
  }

  if (parent instanceof HTMLElement && parent.tagName === 'LI') {
    li.remove();
    const newLi = document.createElement('li');
    newLi.appendChild(document.createElement('br'));
    if (after.length) {
      const rest = cloneListShell(list);
      for (const node of after) rest.appendChild(node);
      newLi.appendChild(rest);
    }
    parent.insertAdjacentElement('afterend', newLi);
    if (!list.children.length) list.remove();
    placeCaretAtStart(newLi);
    host.dispatchEvent(new Event('input'));
    return;
  }

  /** @type {Element[]} */
  const before = [];
  for (const child of [...list.children]) {
    if (child === li) break;
    before.push(child);
  }

  const p = document.createElement('p');
  p.appendChild(document.createElement('br'));
  const frag = document.createDocumentFragment();
  if (before.length) {
    const head = cloneListShell(list);
    for (const node of before) head.appendChild(node);
    frag.appendChild(head);
  }
  frag.appendChild(p);
  if (after.length) {
    const tail = cloneListShell(list);
    for (const node of after) tail.appendChild(node);
    frag.appendChild(tail);
  }
  parent.insertBefore(frag, list);
  list.remove();
  placeCaretAtStart(p);
  host.dispatchEvent(new Event('input'));
}

/**
 * @param {HTMLElement} host
 * @param {Range} range
 */
function rangeInHost(host, range) {
  const node = range.commonAncestorContainer;
  return node === host || host.contains(node);
}

/**
 * Si execCommand no inserta la lista, sustituye el párrafo en lugar de anidar &lt;ul&gt; dentro de &lt;p&gt;.
 * @param {HTMLElement} host
 * @param {'insertUnorderedList'|'insertOrderedList'} cmd
 */
function insertListFallback(host, cmd) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!rangeInHost(host, range)) return;

  const listTag = cmd === 'insertOrderedList' ? 'ol' : 'ul';
  const list = document.createElement(listTag);
  const li = document.createElement('li');
  const block = blockContainerForNode(range.startContainer, host);
  const blockText = (block?.textContent || '').replace(/\u00a0/g, ' ').trim();
  const coversBlock = !range.collapsed && range.toString().trim().length >= blockText.length && blockText.length > 0;

  if (block && block.tagName === 'LI') {
    if (range.collapsed) li.appendChild(document.createElement('br'));
    else li.appendChild(range.extractContents());
    if (!(li.textContent || '').trim() && !li.querySelector('br')) li.appendChild(document.createElement('br'));
    list.appendChild(li);
    block.appendChild(list);
  } else if (
    block &&
    block.parentNode &&
    (block.tagName === 'P' || block.tagName === 'DIV' || block.tagName === 'BLOCKQUOTE') &&
    (range.collapsed || coversBlock)
  ) {
    if (!blockText) li.appendChild(document.createElement('br'));
    else if (range.collapsed) while (block.firstChild) li.appendChild(block.firstChild);
    else {
      li.appendChild(range.extractContents());
      if (!(li.textContent || '').trim()) li.appendChild(document.createElement('br'));
    }
    list.appendChild(li);
    block.replaceWith(list);
  } else {
    if (range.collapsed) li.appendChild(document.createElement('br'));
    else li.appendChild(range.extractContents());
    list.appendChild(li);
    if (block && block.parentNode && host.contains(block)) {
      block.parentNode.insertBefore(list, block.nextSibling);
    } else {
      range.insertNode(list);
      const parentEl = list.parentElement;
      if (parentEl && (parentEl.tagName === 'P' || parentEl.tagName === 'DIV')) {
        parentEl.parentNode?.insertBefore(list, parentEl.nextSibling);
      }
    }
  }

  const r = document.createRange();
  r.selectNodeContents(li);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

/**
 * Inserta lista ordenada o con viñetas de forma fiable.
 * @param {HTMLElement} host
 * @param {'insertUnorderedList'|'insertOrderedList'} cmd
 */
export function execInsertList(host, cmd) {
  host.focus();
  try {
    document.execCommand('styleWithCSS', false, 'true');
  } catch {
    /* ignore */
  }

  let ok = false;
  try {
    ok = document.execCommand(cmd, false);
  } catch {
    ok = false;
  }

  if (!ok) insertListFallback(host, cmd);

  host.dispatchEvent(new Event('input'));
}

/**
 * Enter en ítem vacío sale de la lista. Tab/Shift+Tab ya usa indent en editor.js.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function attachListKeyboard(host) {
  const onKeydown = (/** @type {KeyboardEvent} */ e) => {
    if (e.key !== 'Enter' || e.isComposing || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;

    const li = getCurrentLi(host);
    if (!li || !isLiEmpty(li)) return;

    e.preventDefault();
    exitListFromEmptyItem(host, li);
  };

  host.addEventListener('keydown', onKeydown);
  return () => {
    host.removeEventListener('keydown', onKeydown);
  };
}
