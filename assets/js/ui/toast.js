/**
 * Notificaciones temporales — Narrative Lab
 */

/** @type {number|null} */
let hideTimer = null;

/**
 * @param {string} message
 * @param {'success'|'warning'|'error'} [kind]
 */
export function showToast(message, kind = 'success') {
  let host = document.getElementById('nl-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'nl-toast-host';
    host.className = 'nl-toast-host';
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }

  const base =
    kind === 'error'
      ? 'border-red-500/40 bg-red-950/90 text-red-100'
      : kind === 'warning'
        ? 'border-amber-500/40 bg-amber-950/90 text-amber-100'
        : 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100';

  host.innerHTML = `
    <div class="nl-toast rounded-lg border px-4 py-3 text-sm shadow-lg max-w-md ${base}" role="status">
      ${escapeToastHtml(message)}
    </div>
  `;

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    host.innerHTML = '';
    hideTimer = null;
  }, 5000);
}

/**
 * @param {string} s
 */
function escapeToastHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
