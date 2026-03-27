/**
 * Edad desde fecha de nacimiento (YYYY-MM-DD) — Narrative Lab
 */

/**
 * @param {string} birthDateYmd
 * @param {Date} [ref]
 * @returns {number|null}
 */
export function ageFromBirthDate(birthDateYmd, ref = new Date()) {
  if (!birthDateYmd || typeof birthDateYmd !== 'string') return null;
  const m = birthDateYmd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let age = ref.getFullYear() - y;
  const hadBirthday =
    ref.getMonth() + 1 > mo || (ref.getMonth() + 1 === mo && ref.getDate() >= d);
  if (!hadBirthday) age -= 1;
  return age >= 0 ? age : null;
}
