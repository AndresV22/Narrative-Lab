/**
 * Grafo simple (SVG) — Narrative Lab
 */

import { listRelationships } from './relations.js';
import { sortByOrder } from './utils.js';

/**
 * @typedef {'characters'|'chars_chapters'|'all'} GraphMode
 */

/**
 * @param {{ id: string, label: string, kind: string }[]} items
 * @param {number} r
 * @param {number} cx
 * @param {number} cy
 * @param {number} startAngle
 * @param {Map<string, { id: string, label: string, kind: string, x: number, y: number }>} nodes
 */
function placeRing(items, r, cx, cy, startAngle, nodes) {
  const n = items.length;
  if (!n) return;
  const step = (2 * Math.PI) / n;
  items.forEach((item, i) => {
    const ang = startAngle + i * step;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    const key = `${item.kind}:${item.id}`;
    nodes.set(key, { id: item.id, label: item.label.slice(0, 28), kind: item.kind, x, y });
  });
}

/**
 * @param {HTMLElement} container
 * @param {import('./types.js').Book} book
 * @param {{ mode: GraphMode }} options
 * @returns {{ destroy: () => void }}
 */
export function mountGraph(container, book, options) {
  const mode = options.mode || 'chars_chapters';
  container.innerHTML = '';

  const W = 800;
  const H = 520;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'w-full h-full block');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mapa de relaciones');

  /** @type {Map<string, { id: string, label: string, kind: string, x: number, y: number }>} */
  const nodes = new Map();

  const chars = book.characters || [];
  const chapters = sortByOrder(book.chapters || [], 'order');
  const events = book.events || [];

  const includeEv = mode === 'all';

  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H);

  const charItems = chars.map((c) => ({
    id: c.id,
    label: c.name || 'Sin nombre',
    kind: 'character',
  }));
  const chapterItems = chapters.map((c) => ({
    id: c.id,
    label: c.title || 'Capítulo',
    kind: 'chapter',
  }));
  const eventItems = events.map((e) => ({
    id: e.id,
    label: e.title || 'Evento',
    kind: 'event',
  }));

  if (mode === 'characters') {
    placeRing(charItems, R * 0.35, cx, cy, -Math.PI / 2, nodes);
  } else if (mode === 'chars_chapters') {
    placeRing(charItems, R * 0.28, cx, cy, -Math.PI / 2, nodes);
    placeRing(chapterItems, R * 0.4, cx, cy, 0, nodes);
  } else {
    placeRing(charItems, R * 0.22, cx, cy, -Math.PI / 2, nodes);
    placeRing(chapterItems, R * 0.34, cx, cy, 0.4, nodes);
    placeRing(eventItems, R * 0.42, cx, cy, 1.2, nodes);
  }

  const rels = listRelationships(book);
  for (const r of rels) {
    if (r.disabled === true) continue;
    const fromKey = `${r.from.kind}:${r.from.id}`;
    const toKey = `${r.to.kind}:${r.to.id}`;
    const a = nodes.get(fromKey);
    const b = nodes.get(toKey);
    if (!a || !b) continue;
    if (mode === 'characters') {
      if (r.type !== 'character_character') continue;
    } else if (!includeEv && r.type === 'event_event') {
      continue;
    }
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(a.x));
    line.setAttribute('y1', String(a.y));
    line.setAttribute('x2', String(b.x));
    line.setAttribute('y2', String(b.y));
    line.setAttribute('stroke', '#3f4f63');
    line.setAttribute('stroke-width', '1.2');
    line.setAttribute('opacity', '0.85');
    const tip =
      (typeof r.description === 'string' && r.description.trim()) ||
      (r.meta && typeof r.meta.role === 'string' && r.meta.role) ||
      '';
    if (tip) line.setAttribute('title', tip.slice(0, 200));
    svg.appendChild(line);
  }

  const colors = {
    character: '#818cf8',
    chapter: '#34d399',
    event: '#fbbf24',
  };

  for (const n of nodes.values()) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(n.x));
    circle.setAttribute('cy', String(n.y));
    circle.setAttribute('r', n.kind === 'chapter' ? '10' : n.kind === 'event' ? '8' : '9');
    circle.setAttribute('fill', colors[/** @type {keyof typeof colors} */ (n.kind)] || '#94a3b8');
    circle.setAttribute('stroke', '#1e293b');
    circle.setAttribute('stroke-width', '1');
    g.appendChild(circle);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(n.x));
    text.setAttribute('y', String(n.y + 22));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#94a3b8');
    text.setAttribute('font-size', '10');
    text.textContent = n.label;
    g.appendChild(text);
    svg.appendChild(g);
  }

  if (nodes.size === 0) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(cx));
    t.setAttribute('y', String(cy));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', '#64748b');
    t.setAttribute('font-size', '14');
    t.textContent = 'No hay nodos para este alcance.';
    svg.appendChild(t);
  }

  container.appendChild(svg);

  return {
    destroy() {
      container.innerHTML = '';
    },
  };
}
