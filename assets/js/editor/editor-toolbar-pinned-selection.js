/**
 * Selección "fijada" al usar la barra: resaltado gris vía CSS Custom Highlight API
 * cuando el foco sale del contenteditable (navegadores compatibles).
 */

const HIGHLIGHT_NAME = 'nl-editor-toolbar-sel';

let stylesRegistered = false;

export function registerToolbarPinnedSelectionStyles() {
  if (stylesRegistered || typeof document === 'undefined') return;
  stylesRegistered = true;
  const el = document.createElement('style');
  el.setAttribute('data-nl-toolbar-sel-style', '');
  el.textContent = `
    ::highlight(${HIGHLIGHT_NAME}) {
      background-color: rgb(148 163 184 / 0.42);
      color: inherit;
    }
  `;
  document.head.appendChild(el);
}

/**
 * @param {Range | null} range
 */
export function setToolbarPinnedHighlight(range) {
  registerToolbarPinnedSelectionStyles();
  if (typeof CSS === 'undefined' || !CSS.highlights) return;
  try {
    if (!range || range.collapsed) {
      CSS.highlights.delete(HIGHLIGHT_NAME);
      return;
    }
    if (!range.startContainer?.ownerDocument) {
      CSS.highlights.delete(HIGHLIGHT_NAME);
      return;
    }
    CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(range));
  } catch {
    try {
      CSS.highlights.delete(HIGHLIGHT_NAME);
    } catch {
      /* ignore */
    }
  }
}

export function clearToolbarPinnedHighlight() {
  if (typeof CSS === 'undefined' || !CSS.highlights) return;
  try {
    CSS.highlights.delete(HIGHLIGHT_NAME);
  } catch {
    /* ignore */
  }
}
