/**
 * Utilidades puras para exportación (impresión, DOCX) — testeables sin DOM pesado.
 */

/** Pila tipográfica segura para CSS (p. ej. "Crimson Pro"). */
export function cssFontStackForExport(stack) {
  return stack
    .split(',')
    .map((s) => {
      const t = s.trim();
      if (!t) return '';
      return /\s/.test(t) ? `"${t.replace(/"/g, '')}"` : t;
    })
    .filter(Boolean)
    .join(', ');
}

/** 1 cm → twips (1 in = 1440 twips). */
export function cmToPageTwip(cm) {
  return Math.round((Number(cm) / 2.54) * 1440);
}

/**
 * @param {string} id
 * @returns {{ width: number, height: number }}
 */
export function editorPageSizeToDocxTwips(id) {
  switch (id) {
    case 'letter':
      return { width: 12240, height: 15840 };
    case 'legal':
      return { width: 12240, height: 20160 };
    case 'a5':
      return { width: 8391, height: 11906 };
    case 'a4':
    default:
      return { width: 11906, height: 16838 };
  }
}

/**
 * @param {string} [cssColor]
 * @returns {string|undefined} RRGGBB sin # para docx
 */
export function parseColorForDocx(cssColor) {
  if (!cssColor) return undefined;
  const s = String(cssColor).trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return h.toUpperCase();
  }
  const rgb = s.match(/^rgba?\(\s*([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].trim().split(/[\s,/]+/).filter((x) => x !== '' && x !== '/');
    if (parts.length >= 3) {
      const toHex = (n) => Math.min(255, Math.max(0, Math.round(Number(n)))).toString(16).padStart(2, '0');
      return `${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`.toUpperCase();
    }
  }
  return undefined;
}

/**
 * @param {string} [fontSize] CSS font-size
 * @returns {number|undefined} Medios puntos (docx)
 */
export function cssFontSizeToHalfPoints(fontSize) {
  if (!fontSize) return undefined;
  const s = String(fontSize).trim();
  const px = s.match(/^([\d.]+)px$/i);
  if (px) {
    const pt = (parseFloat(px[1]) * 72) / 96;
    return Math.max(2, Math.round(pt * 2));
  }
  const pt = s.match(/^([\d.]+)pt$/i);
  if (pt) return Math.max(2, Math.round(parseFloat(pt[1]) * 2));
  return undefined;
}

/**
 * @param {string} stack
 * @returns {string|undefined}
 */
export function firstFontFromStack(stack) {
  if (!stack) return undefined;
  const first = stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
  return first || undefined;
}
