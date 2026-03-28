/**
 * Reemplazo de texto en HTML solo en nodos de texto (no atributos).
 */

/**
 * @param {string} s
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} str
 * @param {string} oldText
 * @param {string} newText
 */
function replaceInPlainString(str, oldText, newText) {
  if (!str || !oldText || oldText === newText) return str || '';
  if (/\s/.test(oldText)) {
    if (!str.includes(oldText)) return str;
    return str.split(oldText).join(newText);
  }
  const re = new RegExp(`\\b${escapeRegex(oldText)}\\b`, 'g');
  return str.replace(re, newText);
}

/**
 * @param {string} html
 * @param {string} oldText
 * @param {string} newText
 * @returns {string}
 */
export function replaceInHtmlFragment(html, oldText, newText) {
  if (!html || !oldText || oldText === newText) return html || '';
  if (typeof DOMParser === 'undefined') return html;
  const wrapped = `<div class="nl-repl-root">${html}</div>`;
  const doc = new DOMParser().parseFromString(wrapped, 'text/html');
  const root = doc.querySelector('.nl-repl-root');
  if (!root) return html;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  /** @type {Text[]} */
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) nodes.push(/** @type {Text} */ (n));
  }
  for (const tn of nodes) {
    const p = tn.parentNode;
    if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') continue;
    const cur = tn.textContent || '';
    if (!cur) continue;
    tn.textContent = replaceInPlainString(cur, oldText, newText);
  }
  return root.innerHTML;
}

/**
 * @param {string} text
 * @param {string} oldText
 * @param {string} newText
 */
function replaceMaybeHtml(text, oldText, newText) {
  if (!text) return text;
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return replaceInHtmlFragment(text, oldText, newText);
  }
  return replaceInPlainString(text, oldText, newText);
}

/**
 * @param {import('../core/types.js').Book} book
 * @param {{ old: string, new: string }[]} pairs
 */
export function applyReplacementsToBook(book, pairs) {
  const list = pairs.filter((p) => p.old && p.old !== p.new);
  if (!list.length) return;

  /**
   * @param {string} text
   */
  const run = (text) => {
    let out = text || '';
    for (const { old, new: nw } of list) {
      out = replaceMaybeHtml(out, old, nw);
    }
    return out;
  };

  book.synopsis = run(book.synopsis || '');
  book.prologue = run(book.prologue || '');
  book.epilogue = run(book.epilogue || '');
  book.historicalContext = run(book.historicalContext || '');
  book.worldRules = run(book.worldRules || '');
  book.extras = run(book.extras || '');

  for (const r of book.rules || []) {
    r.title = run(r.title || '');
    r.content = run(r.content || '');
  }
  for (const eb of book.extraBlocks || []) {
    eb.title = run(eb.title || '');
    eb.content = run(eb.content || '');
  }
  for (const ev of book.events || []) {
    ev.title = run(ev.title || '');
    ev.dateLabel = run(ev.dateLabel || '');
    ev.content = run(ev.content || '');
  }
  for (const note of book.notes || []) {
    note.title = run(note.title || '');
    note.content = run(note.content || '');
  }
  for (const ch of book.chapters || []) {
    ch.title = run(ch.title || '');
    ch.content = run(ch.content || '');
    for (const sc of ch.scenes || []) {
      sc.title = run(sc.title || '');
      sc.content = run(sc.content || '');
    }
  }
  for (const c of book.editorComments || []) {
    c.body = run(c.body || '');
  }
  for (const h of book.highlights || []) {
    h.excerpt = run(h.excerpt || '');
    if (typeof h.description === 'string') h.description = run(h.description);
  }
  for (const rel of book.relationships || []) {
    rel.description = run(rel.description || '');
  }
  for (const act of book.acts || []) {
    act.title = run(act.title || '');
    act.description = run(act.description || '');
  }
  for (const kb of book.kanbanBoards || []) {
    kb.name = run(kb.name || '');
    for (const col of kb.columns || []) {
      col.title = run(col.title || '');
      for (const t of col.tasks || []) {
        t.title = run(t.title || '');
        t.description = run(t.description || '');
      }
    }
  }
}
