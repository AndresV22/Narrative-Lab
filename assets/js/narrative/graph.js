/**
 * Grafo (SVG) — Narrative Lab: vista clásica por anillos y red de personajes ortogonal.
 */

import { listRelationships } from './relations.js';
import { sortByOrder } from '../core/utils.js';
import {
  buildCharacterNetworkLayout,
  polylinePointsAttr,
  NODE_HALF_H,
  nodeBoxWidth,
} from './graph-network.js';
import { formatCharacterDisplayName } from '../domain/character-display.js';

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
 * @param {import('../core/types.js').Book} book
 * @param {string} rootId
 * @returns {{ destroy: () => void }}
 */
function mountCharacterNetworkGraph(container, book, rootId) {
  container.innerHTML = '';
  const layout = buildCharacterNetworkLayout(book, rootId);
  if (!layout || layout.nodes.size === 0) {
    const p = document.createElement('p');
    p.className = 'text-sm text-nl-muted p-6 text-center';
    p.textContent = 'No hay personajes en esta red.';
    container.appendChild(p);
    return { destroy: () => { container.innerHTML = ''; } };
  }

  const { nodes, width, height, rootId: root, drawEdges } = layout;
  const vbW0 = width;
  const vbH0 = height;
  let vbX = 0;
  let vbY = 0;
  let vbW = vbW0;
  let vbH = vbH0;
  /** Margen extra (unidades SVG) para poder arrastrar más allá del borde del grafo */
  const PAN_PAD = Math.max(200, Math.max(vbW0, vbH0) * 0.28);

  const viewport = document.createElement('div');
  viewport.className =
    'nl-graph-pan-zoom relative w-full min-h-[min(80vh,720px)] max-h-[min(80vh,720px)] overflow-hidden touch-none select-none cursor-grab';
  viewport.setAttribute(
    'aria-label',
    'Vista del grafo: arrastra para mover; rueda del ratón o pellizco para acercar o alejar.'
  );

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const setViewBox = () => {
    svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  };
  svg.setAttribute('class', 'block w-full h-full');
  svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
  svg.setAttribute('role', 'img');
  const rootLabel = nodes.get(root)?.label || 'Personaje';
  svg.setAttribute(
    'aria-label',
    `Red de relaciones de ${rootLabel}, ${nodes.size} personajes. Trazado ortogonal; generaciones de arriba a abajo.`
  );

  const gEdges = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gEdges.setAttribute('class', 'nl-graph-edges');
  const gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gNodes.setAttribute('class', 'nl-graph-nodes');

  /**
   * @param {string} stroke
   * @param {string} tip
   * @param {number} tx
   * @param {number} ty
   */
  const edgeLabel = (stroke, tip, tx, ty) => {
    if (!tip) return;
    const short = tip.length > 22 ? `${tip.slice(0, 20)}…` : tip;
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', String(tx));
    lbl.setAttribute('y', String(ty));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('fill', stroke);
    lbl.setAttribute('font-size', '10');
    lbl.setAttribute('font-weight', '500');
    lbl.textContent = short;
    gEdges.appendChild(lbl);
  };

  for (const d of drawEdges || []) {
    if (!d || typeof d.kind !== 'string') continue;
    if (d.kind === 'segment_h') {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(d.x1));
      line.setAttribute('y1', String(d.y));
      line.setAttribute('x2', String(d.x2));
      line.setAttribute('y2', String(d.y));
      line.setAttribute('stroke', d.stroke);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-linecap', 'round');
      if (d.label) line.setAttribute('title', d.label);
      gEdges.appendChild(line);
      edgeLabel(d.stroke, d.label, (d.x1 + d.x2) / 2, d.y - 8);
    } else if (d.kind === 'dual_parent') {
      const h = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      h.setAttribute('x1', String(d.xL));
      h.setAttribute('y1', String(d.yLine));
      h.setAttribute('x2', String(d.xR));
      h.setAttribute('y2', String(d.yLine));
      h.setAttribute('stroke', d.stroke);
      h.setAttribute('stroke-width', '2.5');
      h.setAttribute('stroke-linecap', 'round');
      if (d.label) h.setAttribute('title', d.label);
      gEdges.appendChild(h);
      const v = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      v.setAttribute('x1', String(d.midX));
      v.setAttribute('y1', String(d.yLine));
      v.setAttribute('x2', String(d.midX));
      v.setAttribute('y2', String(d.yTopChild));
      v.setAttribute('stroke', d.stroke);
      v.setAttribute('stroke-width', '2.5');
      v.setAttribute('stroke-linecap', 'round');
      gEdges.appendChild(v);
      edgeLabel(d.stroke, d.label, d.midX, d.yLine + 14);
    } else if (d.kind === 'polyline' && Array.isArray(d.points) && d.points.length) {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', polylinePointsAttr(d.points));
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', d.stroke);
      poly.setAttribute('stroke-width', '2');
      poly.setAttribute('stroke-linejoin', 'round');
      poly.setAttribute('stroke-linecap', 'round');
      poly.setAttribute('opacity', '0.95');
      if (d.label) poly.setAttribute('title', d.label);
      gEdges.appendChild(poly);
      if (d.points.length >= 2) {
        const mx = (d.points[0][0] + d.points[1][0]) / 2;
        const my = (d.points[0][1] + d.points[1][1]) / 2;
        edgeLabel(d.stroke, d.label, mx, my - 5);
      }
    }
  }

  for (const [id, n] of nodes) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const isRoot = id === root;
    const w = nodeBoxWidth(n.label);
    const h = NODE_HALF_H * 2;
    const x = n.x - w / 2;
    const y = n.y - NODE_HALF_H;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(h));
    rect.setAttribute('rx', '8');
    rect.setAttribute('ry', '8');
    rect.setAttribute(
      'fill',
      isRoot ? '#4338ca' : '#0f172a'
    );
    rect.setAttribute('stroke', isRoot ? '#c4b5fd' : '#475569');
    rect.setAttribute('stroke-width', isRoot ? '2' : '1.25');
    rect.setAttribute('title', n.label);
    g.appendChild(rect);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(n.x));
    text.setAttribute('y', String(n.y));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#f8fafc');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '500');
    text.setAttribute('font-family', 'system-ui, -apple-system, BlinkMacSystemFont,Segoe UI,sans-serif');
    const raw = String(n.label);
    const maxLen = 26;
    text.textContent = raw.length > maxLen ? `${raw.slice(0, maxLen - 1)}…` : raw;
    if (raw.length > maxLen) text.setAttribute('title', raw);
    g.appendChild(text);
    gNodes.appendChild(g);
  }

  svg.appendChild(gEdges);
  svg.appendChild(gNodes);

  const toolbar = document.createElement('div');
  toolbar.className =
    'absolute top-2 right-2 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-nl-border bg-nl-surface/95 px-1.5 py-1 shadow-sm';
  const mkBtn = (label, title) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className =
      'px-2 py-1 rounded text-xs text-slate-200 hover:bg-nl-raised border border-transparent hover:border-nl-border';
    b.textContent = label;
    b.title = title;
    return b;
  };
  const btnIn = mkBtn('+', 'Acercar');
  const btnOut = mkBtn('−', 'Alejar');
  const btnReset = mkBtn('⊙', 'Ajustar vista al grafo completo');
  toolbar.appendChild(btnIn);
  toolbar.appendChild(btnOut);
  toolbar.appendChild(btnReset);

  const hint = document.createElement('p');
  hint.className = 'absolute bottom-2 left-2 z-10 max-w-[min(100%,20rem)] rounded border border-nl-border/80 bg-nl-bg/90 px-2 py-1 text-[10px] text-nl-muted pointer-events-none';
  hint.textContent =
    'Vista centrada en el personaje raíz · Arrastra para mover · Rueda para zoom';

  viewport.appendChild(toolbar);
  viewport.appendChild(svg);
  viewport.appendChild(hint);
  container.appendChild(viewport);

  const clampViewBox = () => {
    const minW = vbW0 * 0.04;
    const maxW = vbW0 * 8;
    const minH = vbH0 * 0.04;
    const maxH = vbH0 * 8;
    vbW = Math.min(maxW, Math.max(minW, vbW));
    vbH = Math.min(maxH, Math.max(minH, vbH));
    const clampAxis = (v0, v, vb) => {
      const hi = Math.max(0, v0 - vb) + PAN_PAD;
      const lo = Math.min(0, v0 - vb) - PAN_PAD;
      return Math.min(hi, Math.max(lo, v));
    };
    vbX = clampAxis(vbW0, vbX, vbW);
    vbY = clampAxis(vbH0, vbY, vbH);
  };

  /** Coloca el centro del personaje raíz en el centro de la vista (misma escala actual). */
  const centerViewOnRootCharacter = () => {
    const rn = nodes.get(root);
    if (!rn) {
      setViewBox();
      return;
    }
    vbX = rn.x - vbW / 2;
    vbY = rn.y - vbH / 2;
    clampViewBox();
    setViewBox();
  };

  /** Zoom hacia un punto en coordenadas de usuario SVG (sx, sy). factor < 1 acerca. */
  const zoomAt = (sx, sy, factor) => {
    const newW = vbW * factor;
    const newH = vbH * factor;
    vbX = sx - (newW / vbW) * (sx - vbX);
    vbY = sy - (newH / vbH) * (sy - vbY);
    vbW = newW;
    vbH = newH;
    clampViewBox();
    setViewBox();
  };

  const resetView = () => {
    vbX = 0;
    vbY = 0;
    vbW = vbW0;
    vbH = vbH0;
    setViewBox();
  };

  const onWheel = (e) => {
    e.preventDefault();
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const delta = e.deltaY;
    const factor = delta > 0 ? 1.12 : 1 / 1.12;
    zoomAt(svgPt.x, svgPt.y, factor);
  };

  let dragging = false;
  let lastPx = 0;
  let lastPy = 0;
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const t = /** @type {HTMLElement | null} */ (e.target);
    if (t?.closest?.('button')) return;
    dragging = true;
    lastPx = e.clientX;
    lastPy = e.clientY;
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('cursor-grabbing');
    viewport.classList.remove('cursor-grab');
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastPx;
    const dy = e.clientY - lastPy;
    lastPx = e.clientX;
    lastPy = e.clientY;
    const rw = svg.clientWidth || 1;
    const rh = svg.clientHeight || 1;
    vbX -= (dx / rw) * vbW;
    vbY -= (dy / rh) * vbH;
    clampViewBox();
    setViewBox();
  };
  const endDrag = (e) => {
    if (dragging) {
      dragging = false;
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      viewport.classList.remove('cursor-grabbing');
      viewport.classList.add('cursor-grab');
    }
  };

  viewport.addEventListener('wheel', onWheel, { passive: false });
  viewport.addEventListener('pointerdown', onPointerDown);
  viewport.addEventListener('pointermove', onPointerMove);
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', endDrag);

  btnIn.addEventListener('click', () => {
    zoomAt(vbX + vbW / 2, vbY + vbH / 2, 1 / 1.15);
  });
  btnOut.addEventListener('click', () => {
    zoomAt(vbX + vbW / 2, vbY + vbH / 2, 1.15);
  });
  btnReset.addEventListener('click', resetView);

  centerViewOnRootCharacter();

  return {
    destroy() {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
      viewport.removeEventListener('lostpointercapture', endDrag);
      container.innerHTML = '';
    },
  };
}

/**
 * @param {HTMLElement} container
 */
function mountEmptyCharacterNetworkHint(container) {
  container.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'text-sm text-nl-muted p-8 text-center';
  p.textContent = 'Selecciona un personaje raíz para ver su red de relaciones con trazado ortogonal y colores por tipo de vínculo.';
  container.appendChild(p);
  return {
    destroy() {
      container.innerHTML = '';
    },
  };
}

/**
 * @param {HTMLElement} container
 * @param {import('../core/types.js').Book} book
 * @param {{ mode: GraphMode, rootCharacterId?: string | null }} options
 * @returns {{ destroy: () => void }}
 */
export function mountGraph(container, book, options) {
  const mode = options.mode || 'characters';
  const rootCharacterId = options.rootCharacterId ?? null;

  if (mode === 'characters') {
    if (rootCharacterId) {
      return mountCharacterNetworkGraph(container, book, rootCharacterId);
    }
    return mountEmptyCharacterNetworkHint(container);
  }

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
    label: formatCharacterDisplayName(c),
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

  if (mode === 'chars_chapters') {
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
    if (!includeEv && r.type === 'event_event') {
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
