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
 * Redistribuye bloques en páginas de altura fija (overflow oculto).
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
      page.appendChild(block);
      if (page.scrollHeight > page.clientHeight) {
        page.removeChild(block);
        if (page.childNodes.length === 0) {
          page.appendChild(block);
        } else {
          page = createPageElement();
          host.appendChild(page);
          page.appendChild(block);
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
