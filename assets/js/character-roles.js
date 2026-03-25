/**
 * Papel del personaje en la historia — Narrative Lab
 */

export const CHARACTER_ROLES = /** @type {const} */ ([
  'protagonista',
  'antagonista',
  'secundario',
  'terciario',
]);

const ROLE_SET = new Set(CHARACTER_ROLES);

/** @param {string} [role] @returns {import('./types.js').CharacterRole} */
export function normalizeCharacterRole(role) {
  if (typeof role === 'string' && ROLE_SET.has(/** @type {import('./types.js').CharacterRole} */ (role))) {
    return /** @type {import('./types.js').CharacterRole} */ (role);
  }
  return 'secundario';
}

/** @param {string} [role] */
export function characterRoleLabel(role) {
  const map = {
    protagonista: 'Protagonista',
    antagonista: 'Antagonista',
    secundario: 'Secundario',
    terciario: 'Terciario',
  };
  const k = normalizeCharacterRole(role || '');
  return map[k];
}
