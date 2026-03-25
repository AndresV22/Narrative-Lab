/**
 * Listas en contenteditable: inserción fiable y doble Enter para salir de la lista.
 */

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
 * Sale de la lista: quita el ítem vacío y deja un párrafo normal detrás.
 * @param {HTMLElement} host
 * @param {HTMLLIElement} li
 */
function exitListFromEmptyItem(host, li) {
  const list = li.parentElement;
  if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return;

  const p = document.createElement('p');
  p.appendChild(document.createElement('br'));

  if (list.children.length === 1) {
    list.replaceWith(p);
  } else {
    li.remove();
    if (list.nextSibling) {
      list.parentNode?.insertBefore(p, list.nextSibling);
    } else {
      list.parentNode?.appendChild(p);
    }
  }

  const sel = window.getSelection();
  if (sel) {
    const r = document.createRange();
    r.setStart(p, 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
  host.dispatchEvent(new Event('input'));
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

  if (!ok) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const listTag = cmd === 'insertOrderedList' ? 'ol' : 'ul';
    const list = document.createElement(listTag);
    const li = document.createElement('li');
    if (range.collapsed) {
      li.appendChild(document.createElement('br'));
    } else {
      li.appendChild(range.extractContents());
    }
    list.appendChild(li);
    range.insertNode(list);
    const r = document.createRange();
    r.selectNodeContents(li);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  host.dispatchEvent(new Event('input'));
}

/**
 * Doble Enter en ítem vacío → salir de la lista. Tab/Shift+Tab ya usa indent en editor.js.
 * @param {HTMLElement} host
 * @returns {() => void}
 */
export function attachListKeyboard(host) {
  let consecutiveEmptyEnter = 0;

  const reset = () => {
    consecutiveEmptyEnter = 0;
  };

  const onInput = () => {
    const li = getCurrentLi(host);
    if (!li) {
      reset();
      return;
    }
    if (!isLiEmpty(li)) reset();
  };

  const onKeydown = (/** @type {KeyboardEvent} */ e) => {
    if (e.key !== 'Enter' || e.isComposing) return;

    const li = getCurrentLi(host);
    if (!li || !isLiEmpty(li)) {
      reset();
      return;
    }

    consecutiveEmptyEnter++;
    if (consecutiveEmptyEnter >= 2) {
      e.preventDefault();
      exitListFromEmptyItem(host, li);
      reset();
    }
  };

  host.addEventListener('input', onInput);
  host.addEventListener('keydown', onKeydown);
  return () => {
    host.removeEventListener('input', onInput);
    host.removeEventListener('keydown', onKeydown);
  };
}
