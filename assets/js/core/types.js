/**
 * Definiciones JSDoc para el workspace — Narrative Lab
 * @module types
 */

/**
 * @typedef {Object} Scene
 * @property {string} id
 * @property {string} title
 * @property {number} order
 * @property {string} content
 */

/**
 * @typedef {Object} Chapter
 * @property {string} id
 * @property {string} title
 * @property {number} order
 * @property {string} chapterGoal
 * @property {string} content
 * @property {Scene[]} scenes
 */

/**
 * @typedef {'protagonista'|'antagonista'|'secundario'|'terciario'} CharacterRole
 */

/**
 * @typedef {Object} Character
 * @property {string} id
 * @property {string} name
 * @property {CharacterRole} role
 * @property {string} age
 * @property {string} description
 * @property {string} personality
 * @property {string} goals
 * @property {string} conflicts
 * @property {string} narrativeArc
 * @property {string} imageDataUrl
 */

/**
 * @typedef {Object} BookEvent
 * @property {string} id
 * @property {string} title
 * @property {string} dateLabel
 * @property {number} sortKey
 * @property {string} content
 */

/**
 * @typedef {Object} NoteItem
 * @property {string} id
 * @property {string} title
 * @property {string} content
 */

/**
 * @typedef {Object} ExtraBlock
 * @property {string} id
 * @property {string} title
 * @property {string} content
 */

/**
 * @typedef {Object} WorldRule
 * @property {string} id
 * @property {string} title
 * @property {string} content
 */

/**
 * @typedef {Object} Act
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {number} order
 * @property {string[]} chapterIds
 */

/**
 * @typedef {'character_chapter'|'character_scene'|'event_event'|'character_character'} RelationshipType
 */

/**
 * @typedef {Object} Relationship
 * @property {string} id
 * @property {RelationshipType|string} type
 * @property {{ kind: string, id: string }} from
 * @property {{ kind: string, id: string }} to
 * @property {string} [description]
 * @property {boolean} [disabled]
 * @property {{ role?: string } & Record<string, unknown>} [meta]
 */

/**
 * @typedef {Object} Highlight
 * @property {string} id
 * @property {string} bookId
 * @property {string} sourceKind
 * @property {string} sourceId
 * @property {string} excerpt
 * @property {string} createdAt
 * @property {string} [description]
 * @property {string} [characterId]
 * @property {string} [chapterId] capítulo padre si sourceKind es escena
 */

/**
 * Comentario en línea en el editor (metadatos; el HTML guarda el span).
 * @typedef {Object} EditorComment
 * @property {string} id
 * @property {string} bookId
 * @property {string} sourceKind
 * @property {string} sourceId
 * @property {string} body
 * @property {string} createdAt
 * @property {string} [updatedAt]
 * @property {string} [chapterId] capítulo padre si sourceKind es escena
 */

/**
 * @typedef {Object} Snapshot
 * @property {string} id
 * @property {string} label
 * @property {string} createdAt
 * @property {Book} payload
 */

/**
 * Tarea en un tablero Kanban (por libro).
 * @typedef {Object} KanbanTask
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} startDate fecha ISO (YYYY-MM-DD) o vacío
 * @property {string} dueDate fecha ISO (YYYY-MM-DD) o vacío
 * @property {string} backgroundColor color CSS o vacío
 */

/**
 * Columna Kanban con tareas embebidas.
 * @typedef {Object} KanbanColumn
 * @property {string} id
 * @property {string} title
 * @property {number} order
 * @property {KanbanTask[]} tasks
 */

/**
 * Tablero Kanban asociado a un libro.
 * @typedef {Object} KanbanBoard
 * @property {string} id
 * @property {string} name
 * @property {string} [createdAt]
 * @property {KanbanColumn[]} columns
 */

/**
 * @typedef {Object} Book
 * @property {string} id
 * @property {string} name
 * @property {string} author
 * @property {string} createdAt
 * @property {string} date
 * @property {string} category
 * @property {string} narratorType
 * @property {string} status
 * @property {string} synopsis
 * @property {string} historicalContext
 * @property {string} worldRules
 * @property {WorldRule[]} rules
 * @property {string} coverImageDataUrl
 * @property {string} prologue
 * @property {string} epilogue
 * @property {string} extras
 * @property {ExtraBlock[]} extraBlocks
 * @property {Act[]} acts
 * @property {number} wordGoal
 * @property {Chapter[]} chapters
 * @property {Character[]} characters
 * @property {BookEvent[]} events
 * @property {Relationship[]} relationships
 * @property {Highlight[]} highlights
 * @property {EditorComment[]} editorComments
 * @property {Snapshot[]} snapshots
 * @property {NoteItem[]} notes
 * @property {KanbanBoard[]} kanbanBoards
 */

/**
 * @typedef {Object} AuthorProfile
 * @property {string} name
 * @property {string} birthDate
 * @property {string} bio
 * @property {string} imageDataUrl
 */

/**
 * @typedef {Object} Workspace
 * @property {number} schemaVersion
 * @property {AuthorProfile} authorProfile
 * @property {Book[]} books
 */

/**
 * @typedef {'warning'|'info'} IssueSeverity
 */

/**
 * @typedef {Object} NarrativeIssue
 * @property {IssueSeverity} severity
 * @property {string} code
 * @property {string} message
 * @property {string} [chapterId]
 * @property {string} [sceneId]
 * @property {string} [characterId]
 * @property {string} [eventId]
 */

/**
 * @typedef {Object} BookStats
 * @property {number} totalWords
 * @property {number} wordGoal
 * @property {number} chapterCount
 * @property {number} sceneCount
 * @property {number} characterCount
 * @property {number} eventCount
 * @property {number} activeCharacters
 * @property {number} readingMinutes
 */

/**
 * @typedef {Object} CharacterUsageEntry
 * @property {string} characterId
 * @property {string} name
 * @property {string[]} chapterIds
 * @property {string[]} sceneIds
 */

/**
 * @typedef {Object} TimelineConflict
 * @property {'warning'|'info'} severity
 * @property {string} code
 * @property {string} message
 * @property {string} [eventId]
 */

/**
 * @typedef {Object} BookHealth
 * @property {number} score
 * @property {NarrativeIssue[]} issues
 * @property {string[]} strengths
 */

export {};
