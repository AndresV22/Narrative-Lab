/**
 * Tamaños de página para modo documento (valores estándar ISO / ANSI).
 * @see https://en.wikipedia.org/wiki/Paper_size — A4 210×297 mm, Letter 8.5×11 in, etc.
 */

/** @typedef {'letter'|'a4'|'legal'|'a5'} EditorPageSizeId */

/** @type {readonly { id: EditorPageSizeId, label: string, width: string, minHeight: string }[]} */
export const EDITOR_PAGE_SIZE_PRESETS = [
  { id: 'letter', label: 'Carta (Letter)', width: '8.5in', minHeight: '11in' },
  { id: 'a4', label: 'A4', width: '210mm', minHeight: '297mm' },
  { id: 'legal', label: 'Legal', width: '8.5in', minHeight: '14in' },
  { id: 'a5', label: 'A5', width: '148mm', minHeight: '210mm' },
];

/** @param {string} id */
export function isValidEditorPageSize(id) {
  return EDITOR_PAGE_SIZE_PRESETS.some((p) => p.id === id);
}
