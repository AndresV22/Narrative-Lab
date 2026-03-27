/**
 * Paginación visual en modo página (hojas de altura fija).
 */

/**
 * @param {HTMLElement} host
 * @returns {number|null}
 */
function saveCaretTextOffset(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!host.contains(r.commonAncestorContainer)) return null;
  const pre = document.createRange();
  try {
    pre.setStart(host, 0);
    pre.setEnd(r.startContainer, r.startOffset);
    return pre.toString().length;
  } catch {
    return null;
  }
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

  const saved = saveCaretTextOffset(host);

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

  if (saved !== null) {
    queueMicrotask(() => {
      restoreCaretTextOffset(host, saved);
      host.focus();
    });
  }
}
