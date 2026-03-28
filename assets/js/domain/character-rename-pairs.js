/**
 * Pares texto antiguo → nuevo para ofrecer reemplazo en el libro al editar identidad del personaje.
 */

/**
 * @typedef {Object} CharacterIdentitySlice
 * @property {string} [name]
 * @property {string} [paternalSurname]
 * @property {string} [maternalSurname]
 * @property {string} [nicknames]
 */

/**
 * @param {string} [s]
 * @returns {string[]}
 */
export function parseCommaSeparatedTokens(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * @typedef {Object} RenamePair
 * @property {string} old
 * @property {string} new
 * @property {string} label
 */

/**
 * @param {CharacterIdentitySlice} prev
 * @param {CharacterIdentitySlice} next
 * @returns {RenamePair[]}
 */
export function computeCharacterRenamePairs(prev, next) {
  /** @type {RenamePair[]} */
  const pairs = [];
  const fields = [
    ['name', 'Nombre'],
    ['paternalSurname', 'Apellido paterno'],
    ['maternalSurname', 'Apellido materno'],
  ];
  for (const [key, label] of fields) {
    const o = typeof prev[key] === 'string' ? prev[key].trim() : '';
    const n = typeof next[key] === 'string' ? next[key].trim() : '';
    if (o && o !== n) {
      pairs.push({
        old: o,
        new: n,
        label: `${label}: «${o}» → «${n}»`,
      });
    }
  }
  const oldNick = parseCommaSeparatedTokens(prev.nicknames);
  const newNick = parseCommaSeparatedTokens(next.nicknames);
  const max = Math.max(oldNick.length, newNick.length);
  for (let i = 0; i < max; i++) {
    const o = oldNick[i] || '';
    const n = newNick[i] || '';
    if (o && o !== n && n) {
      pairs.push({
        old: o,
        new: n,
        label: `Apodo ${i + 1}: «${o}» → «${n}»`,
      });
    }
  }
  return pairs;
}
