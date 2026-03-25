/**
 * Esquema de datos y validación — Narrative Lab
 */

import { normalizeCharacterRole } from './character-roles.js';
import { uuid, deepClone, stripHtml } from './utils.js';

export const SCHEMA_VERSION = 4;

/** @typedef {{ kind: string, id: string }} EntityRef */

/**
 * @returns {import('./types.js').Scene}
 */
export function createScene(overrides = {}) {
  return {
    id: uuid(),
    title: 'Nueva escena',
    order: 0,
    content: '',
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').Chapter}
 */
export function createChapter(overrides = {}) {
  return {
    id: uuid(),
    title: 'Capítulo sin título',
    order: 0,
    chapterGoal: '',
    content: '',
    scenes: [],
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').Character}
 */
export function createCharacter(overrides = {}) {
  return {
    id: uuid(),
    name: '',
    role: 'secundario',
    age: '',
    description: '',
    personality: '',
    goals: '',
    conflicts: '',
    narrativeArc: '',
    imageDataUrl: '',
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').BookEvent}
 */
export function createEvent(overrides = {}) {
  return {
    id: uuid(),
    title: '',
    dateLabel: '',
    sortKey: 0,
    content: '',
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').NoteItem}
 */
export function createNote(overrides = {}) {
  return {
    id: uuid(),
    title: 'Nota',
    content: '',
    ...overrides,
  };
}

/**
 * Bloque de contenido extra (material adicional del libro).
 * @returns {import('./types.js').ExtraBlock}
 */
export function createExtraBlock(overrides = {}) {
  return {
    id: uuid(),
    title: 'Extra',
    content: '',
    ...overrides,
  };
}

/**
 * Regla de mundo (contenido enriquecido).
 * @returns {import('./types.js').WorldRule}
 */
export function createWorldRule(overrides = {}) {
  return {
    id: uuid(),
    title: 'Nueva regla',
    content: '',
    ...overrides,
  };
}

/**
 * Acto narrativo: agrupa capítulos por id.
 * @returns {import('./types.js').Act}
 */
export function createAct(overrides = {}) {
  return {
    id: uuid(),
    title: 'Nuevo acto',
    description: '',
    order: 0,
    chapterIds: [],
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').Relationship}
 */
export function createRelationship(type, from, to, overrides = {}) {
  return {
    id: uuid(),
    type,
    from: { kind: from.kind, id: from.id },
    to: { kind: to.kind, id: to.id },
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').Highlight}
 */
export function createHighlight(bookId, sourceKind, sourceId, excerpt, overrides = {}) {
  return {
    id: uuid(),
    bookId,
    sourceKind,
    sourceId,
    excerpt,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').Snapshot}
 */
export function createSnapshot(label, bookPayload, overrides = {}) {
  return {
    id: uuid(),
    label: label || 'Snapshot',
    createdAt: new Date().toISOString(),
    payload: deepClone(bookPayload),
    ...overrides,
  };
}

/**
 * Libro vacío con estructura por defecto.
 * @returns {import('./types.js').Book}
 */
export function createEmptyBook(overrides = {}) {
  const createdAt = new Date().toISOString();
  return {
    id: uuid(),
    name: 'Sin título',
    author: '',
    createdAt,
    date: createdAt.slice(0, 10),
    category: '',
    narratorType: 'Tercera persona',
    status: 'Borrador',
    synopsis: '',
    historicalContext: '',
    worldRules: '',
    rules: [],
    coverImageDataUrl: '',
    prologue: '',
    epilogue: '',
    extras: '',
    extraBlocks: [],
    acts: [],
    wordGoal: 50000,
    chapters: [],
    characters: [],
    events: [],
    relationships: [],
    highlights: [],
    snapshots: [],
    notes: [],
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').AuthorProfile}
 */
export function createEmptyAuthorProfile(overrides = {}) {
  return {
    name: '',
    birthDate: '',
    bio: '',
    imageDataUrl: '',
    ...overrides,
  };
}

/**
 * @returns {import('./types.js').Workspace}
 */
export function createEmptyWorkspace() {
  return {
    schemaVersion: SCHEMA_VERSION,
    authorProfile: createEmptyAuthorProfile(),
    books: [],
  };
}

/**
 * Asegura que un objeto parcial cumple campos mínimos de libro.
 * @param {unknown} raw
 * @returns {import('./types.js').Book}
 */
export function normalizeBook(raw) {
  const b = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  const legacyDate = typeof b.date === 'string' ? b.date : new Date().toISOString().slice(0, 10);
  const createdAt =
    typeof b.createdAt === 'string' && b.createdAt.trim() ? b.createdAt : `${legacyDate}T12:00:00.000Z`;
  const book = createEmptyBook({
    id: typeof b.id === 'string' ? b.id : uuid(),
    name: typeof b.name === 'string' ? b.name : 'Sin título',
    author: typeof b.author === 'string' ? b.author : '',
    createdAt,
    date: createdAt.slice(0, 10),
    category: typeof b.category === 'string' ? b.category : '',
    narratorType: typeof b.narratorType === 'string' ? b.narratorType : 'Tercera persona',
    status: typeof b.status === 'string' ? b.status : 'Borrador',
    synopsis: typeof b.synopsis === 'string' ? b.synopsis : '',
    historicalContext: typeof b.historicalContext === 'string' ? b.historicalContext : '',
    rules: (() => {
      const wrLegacy = typeof b.worldRules === 'string' ? b.worldRules : '';
      let arr = Array.isArray(b.rules) ? b.rules.map(normalizeWorldRule) : [];
      if (arr.length === 0 && stripHtml(wrLegacy).trim()) {
        arr = [createWorldRule({ title: 'Reglas del mundo', content: wrLegacy })];
      }
      return arr;
    })(),
    worldRules: '',
    coverImageDataUrl: typeof b.coverImageDataUrl === 'string' ? b.coverImageDataUrl : '',
    prologue: typeof b.prologue === 'string' ? b.prologue : '',
    epilogue: typeof b.epilogue === 'string' ? b.epilogue : '',
    extras: typeof b.extras === 'string' ? b.extras : '',
    wordGoal: typeof b.wordGoal === 'number' && !Number.isNaN(b.wordGoal) ? b.wordGoal : 50000,
    extraBlocks: (() => {
      let blocks = Array.isArray(b.extraBlocks) ? b.extraBlocks.map(normalizeExtraBlock) : [];
      if (blocks.length === 0 && typeof b.extras === 'string' && stripHtml(b.extras).trim()) {
        blocks = [createExtraBlock({ title: 'General', content: b.extras })];
      }
      return blocks;
    })(),
    acts: Array.isArray(b.acts) ? b.acts.map(normalizeAct) : [],
    chapters: Array.isArray(b.chapters) ? b.chapters.map(normalizeChapter) : [],
    characters: Array.isArray(b.characters) ? b.characters.map(normalizeCharacter) : [],
    events: Array.isArray(b.events) ? b.events.map(normalizeEvent) : [],
    relationships: Array.isArray(b.relationships) ? b.relationships.map(normalizeRelationship) : [],
    highlights: Array.isArray(b.highlights) ? b.highlights.map(normalizeHighlight) : [],
    snapshots: Array.isArray(b.snapshots) ? b.snapshots.map(normalizeSnapshot) : [],
    notes: Array.isArray(b.notes) ? b.notes.map(normalizeNote) : [],
  });
  return book;
}

/**
 * @param {unknown} raw
 */
function normalizeExtraBlock(raw) {
  const x = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createExtraBlock({
    id: typeof x.id === 'string' ? x.id : uuid(),
    title: typeof x.title === 'string' ? x.title : 'Extra',
    content: typeof x.content === 'string' ? x.content : '',
  });
}

/**
 * @param {unknown} raw
 */
function normalizeWorldRule(raw) {
  const x = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createWorldRule({
    id: typeof x.id === 'string' ? x.id : uuid(),
    title: typeof x.title === 'string' ? x.title : 'Regla',
    content: typeof x.content === 'string' ? x.content : '',
  });
}

/**
 * @param {unknown} raw
 */
function normalizeAct(raw) {
  const a = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createAct({
    id: typeof a.id === 'string' ? a.id : uuid(),
    title: typeof a.title === 'string' ? a.title : 'Acto',
    description: typeof a.description === 'string' ? a.description : '',
    order: typeof a.order === 'number' ? a.order : 0,
    chapterIds: Array.isArray(a.chapterIds) ? a.chapterIds.map(String) : [],
  });
}

/**
 * @param {unknown} raw
 */
function normalizeChapter(raw) {
  const c = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createChapter({
    id: typeof c.id === 'string' ? c.id : uuid(),
    title: typeof c.title === 'string' ? c.title : 'Capítulo',
    order: typeof c.order === 'number' ? c.order : 0,
    chapterGoal: typeof c.chapterGoal === 'string' ? c.chapterGoal : '',
    content: typeof c.content === 'string' ? c.content : '',
    scenes: Array.isArray(c.scenes) ? c.scenes.map(normalizeScene) : [],
  });
}

/**
 * @param {unknown} raw
 */
function normalizeScene(raw) {
  const s = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createScene({
    id: typeof s.id === 'string' ? s.id : uuid(),
    title: typeof s.title === 'string' ? s.title : 'Escena',
    order: typeof s.order === 'number' ? s.order : 0,
    content: typeof s.content === 'string' ? s.content : '',
  });
}

/**
 * @param {unknown} raw
 */
function normalizeCharacter(raw) {
  const x = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createCharacter({
    id: typeof x.id === 'string' ? x.id : uuid(),
    name: typeof x.name === 'string' ? x.name : '',
    role: normalizeCharacterRole(typeof x.role === 'string' ? x.role : ''),
    age: typeof x.age === 'string' ? x.age : String(x.age ?? ''),
    description: typeof x.description === 'string' ? x.description : '',
    personality: typeof x.personality === 'string' ? x.personality : '',
    goals: typeof x.goals === 'string' ? x.goals : '',
    conflicts: typeof x.conflicts === 'string' ? x.conflicts : '',
    narrativeArc: typeof x.narrativeArc === 'string' ? x.narrativeArc : '',
    imageDataUrl: typeof x.imageDataUrl === 'string' ? x.imageDataUrl : '',
  });
}

/**
 * @param {unknown} raw
 */
function normalizeEvent(raw) {
  const e = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createEvent({
    id: typeof e.id === 'string' ? e.id : uuid(),
    title: typeof e.title === 'string' ? e.title : '',
    dateLabel: typeof e.dateLabel === 'string' ? e.dateLabel : '',
    sortKey: typeof e.sortKey === 'number' ? e.sortKey : 0,
    content: typeof e.content === 'string' ? e.content : '',
  });
}

/**
 * @param {unknown} raw
 */
function normalizeRelationship(raw) {
  const r = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  const from = r.from && typeof r.from === 'object' ? /** @type {Record<string, unknown>} */ (r.from) : {};
  const to = r.to && typeof r.to === 'object' ? /** @type {Record<string, unknown>} */ (r.to) : {};
  const metaRaw = r.meta && typeof r.meta === 'object' && r.meta !== null ? /** @type {Record<string, unknown>} */ (r.meta) : {};
  const meta = {
    ...metaRaw,
    role: typeof metaRaw.role === 'string' ? metaRaw.role : '',
  };
  return createRelationship(
    typeof r.type === 'string' ? r.type : 'character_chapter',
    { kind: String(from.kind || 'character'), id: String(from.id || '') },
    { kind: String(to.kind || 'chapter'), id: String(to.id || '') },
    {
      id: typeof r.id === 'string' ? r.id : uuid(),
      description: typeof r.description === 'string' ? r.description : '',
      disabled: r.disabled === true,
      meta,
    }
  );
}

/**
 * @param {unknown} raw
 */
function normalizeHighlight(raw) {
  const h = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createHighlight(
    String(h.bookId || ''),
    String(h.sourceKind || 'chapter'),
    String(h.sourceId || ''),
    String(h.excerpt || ''),
    {
      id: typeof h.id === 'string' ? h.id : uuid(),
      createdAt: typeof h.createdAt === 'string' ? h.createdAt : new Date().toISOString(),
      description: typeof h.description === 'string' ? h.description : '',
      characterId: typeof h.characterId === 'string' ? h.characterId : '',
      chapterId: typeof h.chapterId === 'string' ? h.chapterId : '',
    }
  );
}

/**
 * @param {unknown} raw
 */
function normalizeSnapshot(raw) {
  const s = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createSnapshot(
    typeof s.label === 'string' ? s.label : 'Snapshot',
    s.payload ? normalizeBook(s.payload) : createEmptyBook(),
    {
      id: typeof s.id === 'string' ? s.id : uuid(),
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
    }
  );
}

/**
 * @param {unknown} raw
 */
function normalizeNote(raw) {
  const n = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createNote({
    id: typeof n.id === 'string' ? n.id : uuid(),
    title: typeof n.title === 'string' ? n.title : 'Nota',
    content: typeof n.content === 'string' ? n.content : '',
  });
}

/**
 * Valida y normaliza workspace importado.
 * @param {unknown} raw
 * @returns {{ ok: true, workspace: import('./types.js').Workspace } | { ok: false, error: string }}
 */
export function validateWorkspace(raw) {
  try {
    const o = typeof raw === 'object' && raw !== null ? /** @type {Record<string, unknown>} */ (raw) : null;
    if (!o) return { ok: false, error: 'JSON inválido: no es un objeto' };
    if (!('books' in o)) {
      return { ok: false, error: 'El archivo no contiene «books». ¿Es un export de Narrative Lab?' };
    }
    if (!Array.isArray(o.books)) {
      return { ok: false, error: '«books» debe ser un array de libros.' };
    }
    if (o.books.length > 500) {
      return { ok: false, error: 'Demasiados libros en un solo archivo (máx. 500). Divide el archivo o revisa el JSON.' };
    }
    const ver = typeof o.schemaVersion === 'number' ? o.schemaVersion : SCHEMA_VERSION;
    if (ver > SCHEMA_VERSION) {
      return { ok: false, error: `Versión de esquema no soportada (${ver}). Actualiza Narrative Lab.` };
    }
    const books = o.books.map(normalizeBook);
    const apRaw = o.authorProfile && typeof o.authorProfile === 'object' ? o.authorProfile : null;
    const authorProfile = normalizeAuthorProfile(apRaw);
    return {
      ok: true,
      workspace: {
        schemaVersion: SCHEMA_VERSION,
        authorProfile,
        books,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al validar' };
  }
}

/**
 * Migra workspace antiguo si hiciera falta (placeholder).
 * @param {import('./types.js').Workspace} ws
 * @returns {import('./types.js').Workspace}
 */
/**
 * @param {unknown} raw
 * @returns {import('./types.js').AuthorProfile}
 */
function normalizeAuthorProfile(raw) {
  const p = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
  return createEmptyAuthorProfile({
    name: typeof p.name === 'string' ? p.name : '',
    birthDate: typeof p.birthDate === 'string' ? p.birthDate : '',
    bio: typeof p.bio === 'string' ? p.bio : '',
    imageDataUrl: typeof p.imageDataUrl === 'string' ? p.imageDataUrl : '',
  });
}

/**
 * Migra workspace antiguo si hiciera falta.
 * @param {import('./types.js').Workspace} ws
 * @returns {import('./types.js').Workspace}
 */
export function migrateWorkspace(ws) {
  const books = (ws.books || []).map((bk) => normalizeBook(bk));
  const authorProfile = normalizeAuthorProfile(ws.authorProfile);
  return { ...ws, schemaVersion: SCHEMA_VERSION, authorProfile, books };
}
