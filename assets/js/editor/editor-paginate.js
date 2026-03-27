/**
 * Paginación visual en modo página (hojas de altura fija).
 */

/**
 * Offset en el flujo solo de nodos de texto (igual que {@link restoreCaretTextOffset}).
 * No usa Range.toString(): incluye saltos implícitos entre bloques y no coincide con el walker.
 * Si el caret está en un elemento (p. ej. &lt;p&gt; con solo &lt;br&gt; tras Enter), devuelve null;
 * ahí se usa {@link insertCaretMarker}.
 * @param {HTMLElement} host
 * @returns {number|null}
 */
function saveCaretTextOffset(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!host.contains(r.commonAncestorContainer)) return null;
  if (r.startContainer.nodeType !== Node.TEXT_NODE) return null;

  const textNode = r.startContainer;
  const offset = r.startOffset;
  let total = 0;
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    if (n === textNode) {
      return total + Math.min(offset, n.length);
    }
    total += n.length;
  }
  return null;
}

/**
 * Inserta un span vacío en el caret (sin nodo de texto) para localizarlo tras rehacer el DOM.
 * @param {HTMLElement} host
 * @returns {boolean}
 */
function insertCaretMarker(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const r = sel.getRangeAt(0);
  if (!r.collapsed) return false;
  if (!host.contains(r.commonAncestorContainer)) return false;

  const span = document.createElement('span');
  span.setAttribute('data-nl-caret-marker', '');
  span.style.display = 'none';
  span.setAttribute('aria-hidden', 'true');
  try {
    r.insertNode(span);
    const nr = document.createRange();
    nr.setStartAfter(span);
    nr.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nr);
  } catch {
    return false;
  }
  return true;
}

/**
 * @param {HTMLElement} host
 * @returns {boolean}
 */
function removeCaretMarker(host) {
  const m = host.querySelector('[data-nl-caret-marker]');
  if (!m?.parentNode) return false;
  const r = document.createRange();
  r.setStartAfter(m);
  r.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  m.parentNode.removeChild(m);
  return true;
}

/**
 * @param {HTMLElement} host
 * @param {number} offset
 */
function restoreCaretTextOffset(host, offset) {
  if (offset < 0) return;
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
  let total = 0;
  let n;
  while ((n = walker.nextNode())) {
    const len = n.length;
    if (total + len >= offset) {
      const r = document.createRange();
      r.setStart(n, Math.min(offset - total, len));
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    total += len;
  }
}

/**
 * @param {Node} n
 * @returns {HTMLElement}
 */
function normalizeTopLevelNode(n) {
  if (n.nodeType === Node.ELEMENT_NODE) return /** @type {HTMLElement} */ (n);
  if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
    const p = document.createElement('p');
    p.appendChild(n);
    return p;
  }
  return document.createElement('p');
}

/**
 * @param {HTMLElement} host
 * @returns {HTMLElement[]}
 */
function collectTopLevelBlocks(host) {
  /** @type {HTMLElement[]} */
  const out = [];
  const pages = host.querySelectorAll(':scope > .nl-page');
  if (pages.length) {
    pages.forEach((p) => {
      Array.from(p.childNodes).forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) out.push(/** @type {HTMLElement} */ (n));
        else if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) out.push(normalizeTopLevelNode(n));
      });
    });
  } else {
    Array.from(host.childNodes).forEach((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) out.push(/** @type {HTMLElement} */ (n));
      else if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) out.push(normalizeTopLevelNode(n));
    });
  }
  return out;
}

/**
 * @returns {HTMLDivElement}
 */
function createPageElement() {
  const page = document.createElement('div');
  page.className = 'nl-page';
  page.setAttribute('data-nl-page', '');
  return page;
}

/**
 * Asegura al menos un contenedor .nl-page con el contenido actual.
 * @param {HTMLElement} host
 */
export function wrapContentInFirstPage(host) {
  if (host.querySelector(':scope > .nl-page')) return;
  const page = createPageElement();
  if (!host.firstChild) {
    const p = document.createElement('p');
    p.appendChild(document.createElement('br'));
    page.appendChild(p);
  } else {
    while (host.firstChild) page.appendChild(host.firstChild);
  }
  host.appendChild(page);
}

/**
 * Quita .nl-page y deja bloques directamente en el host (modo fluido).
 * @param {HTMLElement} host
 */
export function flattenPageLayout(host) {
  const pages = host.querySelectorAll(':scope > .nl-page');
  if (!pages.length) return;
  const frag = document.createDocumentFragment();
  pages.forEach((p) => {
    while (p.firstChild) frag.appendChild(p.firstChild);
  });
  host.innerHTML = '';
  while (frag.firstChild) host.appendChild(frag.firstChild);
}

/**
 * @param {HTMLElement} root
 * @returns {Text | null}
 */
function findFirstTextNode(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  return /** @type {Text | null} */ (w.nextNode());
}

/**
 * @param {HTMLElement} el
 * @returns {number}
 */
function countTextChars(el) {
  let n = 0;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let t;
  while ((t = w.nextNode())) n += t.textContent.length;
  return n;
}

/**
 * Recorta el subárbol a los primeros maxChars caracteres de texto (orden documento).
 * @param {HTMLElement} root
 * @param {number} maxChars
 */
function truncateElementToTextLength(root, maxChars) {
  if (maxChars <= 0) {
    root.textContent = '';
    return;
  }
  let remaining = maxChars;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) {
    const text = n.textContent;
    const len = text.length;
    if (remaining <= 0) {
      removeNodeAndFollowingInDocument(n, root);
      return;
    }
    if (remaining >= len) {
      remaining -= len;
    } else {
      n.textContent = text.slice(0, remaining);
      remaining = 0;
      removeNodeAndFollowingInDocument(n, root);
      return;
    }
  }
}

/**
 * Elimina el nodo de texto dado y todo lo que le sigue en orden de documento dentro de root.
 * @param {Node} textNode
 * @param {HTMLElement} root
 */
function removeNodeAndFollowingInDocument(textNode, root) {
  let cur = /** @type {Node | null} */ (textNode);
  while (cur && cur !== root) {
    while (cur.nextSibling) {
      cur.nextSibling.remove();
    }
    const parent = cur.parentNode;
    if (!parent || parent === root) break;
    cur = parent;
    while (cur.nextSibling) {
      cur.nextSibling.remove();
    }
  }
}

/**
 * Quita elementos vacíos (p. ej. strong sin texto) de abajo arriba.
 * @param {HTMLElement} root
 */
function pruneEmptyElements(root) {
  const list = root.querySelectorAll('*');
  for (let i = list.length - 1; i >= 0; i--) {
    const el = list[i];
    if (el.tagName === 'BR') continue;
    if (!el.textContent?.trim()) el.remove();
  }
}

/**
 * Rango desde el primer carácter de texto hasta el carácter endOffset (exclusivo del bloque completo).
 * @param {HTMLElement} root
 * @param {number} charCount
 * @returns {Range}
 */
function rangeCoveringFirstCharCount(root, charCount) {
  const range = document.createRange();
  if (charCount <= 0) {
    const first = findFirstTextNode(root);
    if (first) {
      range.setStart(first, 0);
      range.setEnd(first, 0);
    }
    return range;
  }
  let remaining = charCount;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  let started = false;
  while ((n = walker.nextNode())) {
    const len = n.textContent.length;
    if (!started) {
      range.setStart(n, 0);
      started = true;
    }
    if (remaining <= len) {
      range.setEnd(n, remaining);
      return range;
    }
    remaining -= len;
  }
  range.selectNodeContents(root);
  return range;
}

/**
 * @param {HTMLElement} block
 * @returns {boolean}
 */
function isSplittableBlock(block) {
  const tag = block.tagName.toLowerCase();
  if (tag !== 'p' && tag !== 'blockquote' && tag !== 'h2' && tag !== 'h3' && tag !== 'li') return false;
  return countTextChars(block) >= 2;
}

/**
 * Prefijo de texto que cabe en la página (búsqueda binaria sobre un clon).
 * @param {HTMLElement} block
 * @param {HTMLElement} page
 * @returns {number | null}
 */
function maxCharsFitInPage(block, page) {
  const total = countTextChars(block);
  if (total < 2) return null;
  let lo = 1;
  let hi = total - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const clone = block.cloneNode(true);
    truncateElementToTextLength(clone, mid);
    pruneEmptyElements(clone);
    page.appendChild(clone);
    const ok = page.scrollHeight <= page.clientHeight;
    page.removeChild(clone);
    if (ok) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (best < 1) return null;
  const raw = block.textContent || '';
  let use = best;
  const lastSpace = raw.slice(0, best).lastIndexOf(' ');
  const lastNl = raw.slice(0, best).lastIndexOf('\n');
  const boundary = Math.max(lastSpace, lastNl);
  if (boundary >= 0) {
    const snapped = boundary + 1;
    if (snapped < best && snapped >= 1) {
      const clone = block.cloneNode(true);
      truncateElementToTextLength(clone, snapped);
      pruneEmptyElements(clone);
      page.appendChild(clone);
      const ok = page.scrollHeight <= page.clientHeight;
      page.removeChild(clone);
      if (ok) use = snapped;
    }
  }
  return use;
}

/**
 * @param {HTMLElement} original
 * @param {DocumentFragment} frag
 * @returns {HTMLElement}
 */
function wrapFragmentInBlockLike(original, frag) {
  const el = document.createElement(original.tagName.toLowerCase());
  for (const a of original.attributes) {
    if (a.name === 'id') continue;
    el.setAttribute(a.name, a.value);
  }
  while (frag.firstChild) el.appendChild(frag.firstChild);
  return el;
}

/**
 * Asegura un párrafo vacío editable (&lt;br&gt;).
 * @param {HTMLElement} el
 */
function ensureBlockEditable(el) {
  const tag = el.tagName.toLowerCase();
  if (tag !== 'p' && tag !== 'li') return;
  if (!el.textContent?.trim()) {
    el.innerHTML = '';
    el.appendChild(document.createElement('br'));
  }
}

/**
 * Redistribuye bloques en páginas de altura fija (overflow oculto).
 * Los párrafos largos se parten entre páginas en lugar de mover el bloque entero.
 * @param {HTMLElement} host
 */
export function layoutEditorPages(host) {
  if (!host.classList.contains('nl-editor-page-layout')) return;

  const savedOffset = saveCaretTextOffset(host);
  const markerPlaced = insertCaretMarker(host);

  const blocks = collectTopLevelBlocks(host);
  /** @type {HTMLElement[]} */
  const detached = [];
  for (const b of blocks) {
    b.parentNode?.removeChild(b);
    detached.push(b);
  }

  host.innerHTML = '';

  if (detached.length === 0) {
    const page = createPageElement();
    const p = document.createElement('p');
    p.appendChild(document.createElement('br'));
    page.appendChild(p);
    host.appendChild(page);
  } else {
    let page = createPageElement();
    host.appendChild(page);
    for (const block of detached) {
      /** @type {HTMLElement | null} */
      let remaining = block;
      while (remaining) {
        page.appendChild(remaining);
        if (page.scrollHeight <= page.clientHeight) {
          remaining = null;
          break;
        }
        page.removeChild(remaining);

        const splitAt = isSplittableBlock(remaining) ? maxCharsFitInPage(remaining, page) : null;
        if (splitAt && splitAt >= 1) {
          const range = rangeCoveringFirstCharCount(remaining, splitAt);
          const frag = range.extractContents();
          const head = wrapFragmentInBlockLike(remaining, frag);
          pruneEmptyElements(head);
          page.appendChild(head);
          pruneEmptyElements(remaining);
          ensureBlockEditable(remaining);
          if (!(remaining.textContent || '').trim()) {
            remaining = null;
            break;
          }
          page = createPageElement();
          host.appendChild(page);
          continue;
        }

        if (page.childNodes.length === 0) {
          page.appendChild(remaining);
          remaining = null;
        } else {
          page = createPageElement();
          host.appendChild(page);
        }
      }
    }
  }

  queueMicrotask(() => {
    if (markerPlaced) {
      if (!removeCaretMarker(host) && savedOffset !== null) {
        restoreCaretTextOffset(host, savedOffset);
      }
    } else if (savedOffset !== null) {
      restoreCaretTextOffset(host, savedOffset);
    }
    host.focus();
  });
}
