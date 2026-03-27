/**
 * Red de personajes: subgrafo conexo, layout genealógico por generaciones y rutas ortogonales — Narrative Lab
 */

import { listRelationships, CHARACTER_LINK_ROLE_OPTIONS, isChildRole } from './relations.js';

/** @type {Record<string, string>} */
export const CHARACTER_LINK_ROLE_EDGE_COLORS = {
  padre: '#60a5fa',
  madre: '#f472b6',
  hijo: '#34d399',
  hija: '#34d399',
  hermano: '#a78bfa',
  casados: '#fbbf24',
  mejores_amigos: '#38bdf8',
  amantes: '#e879f9',
  novios: '#fb7185',
  otro: '#94a3b8',
};

const DEFAULT_EDGE_COLOR = '#64748b';

const PARTNER_ROLES = new Set(['casados', 'amantes', 'novios', 'mejores_amigos']);

/**
 * @param {string} [role]
 * @returns {string}
 */
export function roleEdgeColor(role) {
  if (!role || typeof role !== 'string') return DEFAULT_EDGE_COLOR;
  return CHARACTER_LINK_ROLE_EDGE_COLORS[role] || DEFAULT_EDGE_COLOR;
}

/**
 * @param {import('../core/types.js').Relationship} rel
 * @returns {string}
 */
export function roleEdgeLabel(rel) {
  const role = rel.meta && typeof rel.meta.role === 'string' ? rel.meta.role : '';
  const desc = typeof rel.description === 'string' ? rel.description.trim() : '';
  if (role) {
    if (role === 'padre' || role === 'madre' || isChildRole(role)) {
      return '';
    }
    const opt = CHARACTER_LINK_ROLE_OPTIONS.find((o) => o.value === role);
    if (role === 'otro' && desc) return desc.length > 48 ? `${desc.slice(0, 45)}…` : desc;
    return opt?.legendLabel || opt?.label || role;
  }
  return desc || 'Vínculo';
}

/**
 * @param {import('../core/types.js').Book} book
 * @param {string} rootId
 * @returns {Set<string>}
 */
export function collectConnectedCharacterIds(book, rootId) {
  const out = new Set();
  const rels = listRelationships(book);
  /** @type {Map<string, Set<string>>} */
  const adj = new Map();
  for (const r of rels) {
    if (r.disabled === true || r.type !== 'character_character') continue;
    if (r.from.kind !== 'character' || r.to.kind !== 'character') continue;
    const a = r.from.id;
    const b = r.to.id;
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b);
    adj.get(b).add(a);
  }
  if (!adj.has(rootId)) {
    out.add(rootId);
    return out;
  }
  const q = [rootId];
  out.add(rootId);
  while (q.length) {
    const u = /** @type {string} */ (q.shift());
    for (const v of adj.get(u) || []) {
      if (!out.has(v)) {
        out.add(v);
        q.push(v);
      }
    }
  }
  return out;
}

/**
 * Polilínea ortogonal en L entre dos puntos (solo H/V).
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @returns {[number, number][] puntos consecutivos sin diagonales
 */
export function orthogonalLPath(ax, ay, bx, by) {
  if (ax === bx && ay === by) return [[ax, ay]];
  if (ax === bx) return [[ax, ay], [bx, by]];
  if (ay === by) return [[ax, ay], [bx, by]];
  return [
    [ax, ay],
    [bx, ay],
    [bx, by],
  ];
}

/**
 * @param {[number, number][]} points
 */
function polylinePointsAttr(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

export { polylinePointsAttr };

/**
 * @typedef {Object} NetworkEdge
 * @property {string} id
 * @property {string} fromId
 * @property {string} toId
 * @property {import('../core/types.js').Relationship} rel
 */

/**
 * @typedef {Object} NetworkLayout
 * @property {Map<string, { x: number, y: number, label: string, layer: number }>} nodes
 * @property {NetworkEdge[]} edges
 * @property {number} width
 * @property {number} height
 * @property {string} rootId
 * @property {object[]} drawEdges instrucciones de dibujo (segment_h | dual_parent | polyline)
 */

/** @param {import('../core/types.js').Relationship} r */
function roleOf(r) {
  return r.meta && typeof r.meta.role === 'string' ? r.meta.role : '';
}

/**
 * @param {import('../core/types.js').Relationship} r
 * @returns {{ parent: string, child: string } | null}
 */
function parentChildFromRel(r) {
  const role = roleOf(r);
  if (role === 'padre' || role === 'madre') {
    return { parent: r.from.id, child: r.to.id };
  }
  if (isChildRole(role)) {
    return { parent: r.to.id, child: r.from.id };
  }
  return null;
}

/** Separación horizontal entre centros de nodos (evita solape de cajas ~168px). */
const CELL_W = 220;
const CELL_H = 96;
const PAD = 44;
/** Mitad altura del nodo (rectángulo redondeado) para geometría de aristas */
const NODE_HALF_H = 20;
const GAP_BELOW_NODE = 10;

/**
 * Ancho del contenedor del nombre (misma fórmula que el SVG del grafo).
 * @param {string} [label]
 * @returns {number}
 */
export function nodeBoxWidth(label) {
  const s = String(label || '');
  return Math.min(168, Math.max(88, 22 + s.length * 6.5));
}

/**
 * @param {string} [label]
 * @returns {number}
 */
export function nodeHalfWidth(label) {
  return nodeBoxWidth(label) / 2;
}

/**
 * Capas por generación (ancestros arriba): padre/madre/hijo + parejas/hermanos alineados.
 * @param {import('../core/types.js').Book} book
 * @param {string} rootId personaje elegido (resaltado)
 * @returns {NetworkLayout | null}
 */
export function buildCharacterNetworkLayout(book, rootId) {
  const ids = collectConnectedCharacterIds(book, rootId);
  const chars = book.characters || [];
  /** @type {Map<string, string>} */
  const labels = new Map();
  for (const c of chars) {
    labels.set(c.id, (c.name || 'Sin nombre').slice(0, 34));
  }

  const rels = listRelationships(book);
  /** @type {import('../core/types.js').Relationship[]} */
  const compRels = [];
  for (const r of rels) {
    if (r.disabled === true || r.type !== 'character_character') continue;
    if (r.from.kind !== 'character' || r.to.kind !== 'character') continue;
    const a = r.from.id;
    const b = r.to.id;
    if (!ids.has(a) || !ids.has(b)) continue;
    compRels.push(r);
  }

  /** @type {Map<string, Set<string>>} */
  const parentsOf = new Map();
  /** @type {import('../core/types.js').Relationship[]} */
  const partnerRels = [];
  /** @type {import('../core/types.js').Relationship[]} */
  const siblingRels = [];
  /** @type {import('../core/types.js').Relationship[]} */
  const otherRels = [];

  for (const r of compRels) {
    const role = roleOf(r);
    const pc = parentChildFromRel(r);
    if (pc) {
      if (!parentsOf.has(pc.child)) parentsOf.set(pc.child, new Set());
      parentsOf.get(pc.child).add(pc.parent);
      continue;
    }
    if (PARTNER_ROLES.has(role)) {
      partnerRels.push(r);
      continue;
    }
    if (role === 'hermano') {
      siblingRels.push(r);
      continue;
    }
    otherRels.push(r);
  }

  /** @type {Map<string, number>} */
  const layer = new Map();
  for (const id of ids) {
    layer.set(id, 0);
  }

  const relax = () => {
    /** Copadres (mismo hijo) comparten generación aunque no haya vínculo de pareja. */
    for (const [, ps] of parentsOf) {
      if (ps.size < 2) continue;
      let m = 0;
      for (const p of ps) m = Math.max(m, layer.get(p) ?? 0);
      for (const p of ps) layer.set(p, m);
    }
    for (const [child, ps] of parentsOf) {
      if (!ps.size) continue;
      let nl = 0;
      for (const p of ps) {
        nl = Math.max(nl, (layer.get(p) ?? 0) + 1);
      }
      layer.set(child, Math.max(layer.get(child) ?? 0, nl));
    }
    for (const r of partnerRels) {
      const a = r.from.id;
      const b = r.to.id;
      const m = Math.max(layer.get(a) ?? 0, layer.get(b) ?? 0);
      layer.set(a, m);
      layer.set(b, m);
    }
    for (const r of siblingRels) {
      const a = r.from.id;
      const b = r.to.id;
      const m = Math.max(layer.get(a) ?? 0, layer.get(b) ?? 0);
      layer.set(a, m);
      layer.set(b, m);
    }
  };

  for (let i = 0; i < Math.max(ids.size * 2, 8); i++) {
    relax();
  }

  let maxLayer = 0;
  for (const id of ids) {
    maxLayer = Math.max(maxLayer, layer.get(id) ?? 0);
  }

  /** @type {Map<number, string[]>} */
  const byLayer = new Map();
  for (const id of ids) {
    const L = layer.get(id) ?? 0;
    if (!byLayer.has(L)) byLayer.set(L, []);
    byLayer.get(L).push(id);
  }
  for (const [, row] of byLayer) {
    row.sort((a, b) => (labels.get(a) || a).localeCompare(labels.get(b) || b, 'es'));
  }

  const partnerOf = new Map();
  for (const r of partnerRels) {
    const a = r.from.id;
    const b = r.to.id;
    partnerOf.set(a, b);
    partnerOf.set(b, a);
  }

  /** @type {Map<number, string[][]>} */
  const rowGroups = new Map();
  for (const [L, row] of [...byLayer.entries()].sort((a, b) => a[0] - b[0])) {
    const used = new Set();
    /** @type {string[][]} */
    const groups = [];
    for (const id of row) {
      if (used.has(id)) continue;
      const p = partnerOf.get(id);
      if (p && row.includes(p) && !used.has(p)) {
        const left = id < p ? id : p;
        const right = id < p ? p : id;
        groups.push([left, right]);
        used.add(left);
        used.add(right);
      } else {
        groups.push([id]);
        used.add(id);
      }
    }
    rowGroups.set(L, groups);
  }

  /** @type {Map<string, { x: number, y: number, label: string, layer: number }>} */
  const nodes = new Map();
  let maxCols = 0;
  for (const [L, groups] of [...rowGroups.entries()].sort((a, b) => a[0] - b[0])) {
    let col = 0;
    const y = PAD + L * CELL_H + CELL_H / 2;
    for (const g of groups) {
      for (const id of g) {
        const x = PAD + col * CELL_W + CELL_W / 2;
        nodes.set(id, { x, y, label: labels.get(id) || id, layer: L });
        col += 1;
      }
      maxCols = Math.max(maxCols, col);
    }
  }

  /** Centrar hijos bajo el punto medio entre sus dos padres (línea vertical del tronco). */
  /** @type {Map<string, string[]>} */
  const childrenByPair = new Map();
  for (const [child, ps] of parentsOf) {
    if (ps.size !== 2) continue;
    const sorted = [...ps].sort();
    const pairKey = `${sorted[0]}|${sorted[1]}`;
    if (!childrenByPair.has(pairKey)) childrenByPair.set(pairKey, []);
    childrenByPair.get(pairKey).push(child);
  }
  /**
   * Centra cada hijo bajo el punto medio de sus dos padres.
   * @returns {Set<string>} ids cuyo x se acaba de fijar por esta regla (para no desplazarlos al separar copadres).
   */
  const applyCenterChildrenUnderParents = () => {
    const anchored = new Set();
    for (const [, chList] of childrenByPair) {
      chList.sort((a, b) => (labels.get(a) || a).localeCompare(labels.get(b) || b, 'es'));
      const parents = parentsOf.get(chList[0]);
      if (!parents || parents.size !== 2) continue;
      const [pa, pb] = [...parents].sort();
      const n1 = nodes.get(pa);
      const n2 = nodes.get(pb);
      if (!n1 || !n2) continue;
      const midX = (n1.x + n2.x) / 2;
      const spread = Math.min(56, CELL_W * 0.4);
      chList.forEach((cid, i) => {
        const n = nodes.get(cid);
        if (!n) return;
        const off = chList.length === 1 ? 0 : (i - (chList.length - 1) / 2) * spread;
        nodes.set(cid, { ...n, x: midX + off });
        anchored.add(cid);
      });
    }
    return anchored;
  };

  const anchoredAsChild = applyCenterChildrenUnderParents();

  /**
   * Si dos padres comparten hijo(s) y quedan demasiado juntos (p. ej. uno centrado bajo abuelos y el otro no),
   * separa horizontalmente sin mover al padre ya anclado por el centrado hijo–padres.
   */
  const alignCoparentHorizontalSpacing = () => {
    const pairsSeen = new Set();
    for (const [, ps] of parentsOf) {
      if (ps.size !== 2) continue;
      const [a, b] = [...ps].sort();
      const pairKey = `${a}|${b}`;
      if (pairsSeen.has(pairKey)) continue;
      pairsSeen.add(pairKey);
      const na = nodes.get(a);
      const nb = nodes.get(b);
      if (!na || !nb) continue;
      const leftId = na.x <= nb.x ? a : b;
      const rightId = na.x <= nb.x ? b : a;
      const nl = nodes.get(leftId);
      const nr = nodes.get(rightId);
      if (!nl || !nr) continue;
      if (nr.x - nl.x >= CELL_W - 0.5) continue;
      const leftAnch = anchoredAsChild.has(leftId);
      const rightAnch = anchoredAsChild.has(rightId);
      if (leftAnch && !rightAnch) {
        nodes.set(rightId, { ...nr, x: nl.x + CELL_W });
      } else if (!leftAnch && rightAnch) {
        nodes.set(leftId, { ...nl, x: nr.x - CELL_W });
      } else {
        const mid = (nl.x + nr.x) / 2;
        nodes.set(leftId, { ...nl, x: mid - CELL_W / 2 });
        nodes.set(rightId, { ...nr, x: mid + CELL_W / 2 });
      }
    }
  };

  alignCoparentHorizontalSpacing();
  applyCenterChildrenUnderParents();

  let minXNode = Infinity;
  let maxXNode = -Infinity;
  for (const n of nodes.values()) {
    const hw = nodeHalfWidth(n.label);
    minXNode = Math.min(minXNode, n.x - hw - 8);
    maxXNode = Math.max(maxXNode, n.x + hw + 8);
  }
  if (nodes.size > 0 && Number.isFinite(minXNode) && minXNode < PAD) {
    const shift = PAD - minXNode;
    for (const id of nodes.keys()) {
      const n = nodes.get(id);
      if (n) nodes.set(id, { ...n, x: n.x + shift });
    }
    maxXNode += shift;
  }
  const width =
    nodes.size === 0
      ? 420
      : Math.max(maxXNode + PAD, PAD * 2 + maxCols * CELL_W, 420);
  const height = Math.max(PAD * 2 + (maxLayer + 1) * CELL_H, 300);

  /** @type {NetworkEdge[]} */
  const edges = [];
  const seen = new Set();
  for (const r of compRels) {
    const a = r.from.id;
    const b = r.to.id;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ id: r.id, fromId: a, toId: b, rel: r });
  }

  /** @type {object[]} */
  const drawEdges = [];

  const yStub = (ly) => ly + NODE_HALF_H + GAP_BELOW_NODE;

  /** @param {string} id */
  const npos = (id) => nodes.get(id);

  for (const r of partnerRels) {
    const na = npos(r.from.id);
    const nb = npos(r.to.id);
    if (!na || !nb) continue;
    const y = yStub(na.y);
    const left = na.x <= nb.x ? na : nb;
    const right = na.x <= nb.x ? nb : na;
    let x1 = left.x + nodeHalfWidth(left.label);
    let x2 = right.x - nodeHalfWidth(right.label);
    if (x1 >= x2) {
      const mx = (left.x + right.x) / 2;
      x1 = mx - 1;
      x2 = mx + 1;
    }
    drawEdges.push({
      kind: 'segment_h',
      x1,
      x2,
      y,
      stroke: roleEdgeColor(roleOf(r)),
      label: roleEdgeLabel(r),
      rel: r,
    });
  }

  for (const r of siblingRels) {
    const na = npos(r.from.id);
    const nb = npos(r.to.id);
    if (!na || !nb) continue;
    const y = yStub(na.y);
    const left = na.x <= nb.x ? na : nb;
    const right = na.x <= nb.x ? nb : na;
    let x1 = left.x + nodeHalfWidth(left.label);
    let x2 = right.x - nodeHalfWidth(right.label);
    if (x1 >= x2) {
      const mx = (left.x + right.x) / 2;
      x1 = mx - 1;
      x2 = mx + 1;
    }
    drawEdges.push({
      kind: 'segment_h',
      x1,
      x2,
      y,
      stroke: roleEdgeColor(roleOf(r)),
      label: roleEdgeLabel(r),
      rel: r,
    });
  }

  for (const [child, ps] of parentsOf) {
    const parArr = [...ps];
    const nc = npos(child);
    if (!nc) continue;
    if (parArr.length >= 2) {
      const sorted = [...parArr].sort((a, b) => (npos(a)?.x ?? 0) - (npos(b)?.x ?? 0));
      const p1 = npos(sorted[0]);
      const p2 = npos(sorted[sorted.length - 1]);
      if (!p1 || !p2) continue;
      const left = p1.x <= p2.x ? p1 : p2;
      const right = p1.x <= p2.x ? p2 : p1;
      let xBarL = left.x + nodeHalfWidth(left.label);
      let xBarR = right.x - nodeHalfWidth(right.label);
      if (xBarL >= xBarR) {
        const mx = (left.x + right.x) / 2;
        xBarL = mx - 1;
        xBarR = mx + 1;
      }
      const yLine = Math.max(...parArr.map((id) => {
        const p = npos(id);
        return p ? yStub(p.y) : 0;
      }));
      const midX = nc.x;
      const yTopChild = nc.y - NODE_HALF_H - GAP_BELOW_NODE;
      const casadosR = partnerRels.find(
        (r) =>
          (r.from.id === sorted[0] && r.to.id === sorted[sorted.length - 1]) ||
          (r.from.id === sorted[sorted.length - 1] && r.to.id === sorted[0])
      );
      const stroke = casadosR ? roleEdgeColor('casados') : '#94a3b8';
      const childRel = compRels.find((rr) => {
        const pc = parentChildFromRel(rr);
        return pc && pc.child === child && (pc.parent === parArr[0] || pc.parent === parArr[1]);
      });
      const label = childRel ? roleEdgeLabel(childRel) : 'Descendencia';
      drawEdges.push({
        kind: 'dual_parent',
        xL: xBarL,
        xR: xBarR,
        yLine,
        midX,
        yTopChild,
        stroke,
        label,
        rel: childRel || casadosR,
      });
      continue;
    }
    if (parArr.length === 1) {
      const p = npos(parArr[0]);
      if (!p) continue;
      const rel = compRels.find((rr) => {
        const pc = parentChildFromRel(rr);
        return pc && pc.child === child && pc.parent === parArr[0];
      });
      const stroke = rel ? roleEdgeColor(roleOf(rel)) : DEFAULT_EDGE_COLOR;
      const yStubP = yStub(p.y);
      const childTop = nc.y - NODE_HALF_H - 4;
      const tail = orthogonalLPath(p.x, yStubP, nc.x, childTop);
      const pts = /** @type {[number, number][]} */ ([
        [p.x, p.y + NODE_HALF_H],
        [p.x, yStubP],
        ...tail.slice(1),
      ]);
      drawEdges.push({
        kind: 'polyline',
        points: pts,
        stroke,
        label: rel ? roleEdgeLabel(rel) : '',
        rel: rel || undefined,
      });
    }
  }

  for (const r of otherRels) {
    const na = npos(r.from.id);
    const nb = npos(r.to.id);
    if (!na || !nb) continue;
    const pts = orthogonalLPath(
      na.x,
      na.y + NODE_HALF_H,
      nb.x,
      nb.y - NODE_HALF_H
    );
    drawEdges.push({
      kind: 'polyline',
      points: pts,
      stroke: roleEdgeColor(roleOf(r)),
      label: roleEdgeLabel(r),
      rel: r,
    });
  }

  return { nodes, edges, width, height, rootId, drawEdges };
}

export { NODE_HALF_H, CELL_W, CELL_H, PAD };
