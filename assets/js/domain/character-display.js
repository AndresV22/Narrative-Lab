/**
 * Nombre visible del personaje (nombre + apellidos).
 * @param {import('../core/types.js').Character} ch
 * @returns {string}
 */
export function formatCharacterDisplayName(ch) {
  const parts = [ch?.name, ch?.paternalSurname, ch?.maternalSurname]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  return parts.join(' ') || 'Sin nombre';
}
