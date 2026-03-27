/**
 * Plantillas HTML de las vistas principales — Narrative Lab (fachada)
 */

export { wrapEditorSection, renderBookSettings } from './views/core.js';
export {
  renderChaptersList,
  renderChapterEditor,
  renderSceneEditor,
  renderActsList,
  renderActEditor,
} from './views/chapters-scenes.js';
export { renderCharacterList, renderCharacterForm } from './views/characters.js';
export { renderTimelineMerged, renderExtrasList, renderExtraEditor } from './views/timeline-extras.js';
export {
  renderWritingGuide,
  renderAppSettingsPanel,
  renderNotesList,
  renderNoteEditor,
  renderHighlightsList,
  renderHighlightEditor,
} from './views/guide-settings-notes.js';
export { renderAnalysisPanel } from './views/analysis.js';
export {
  renderGraphHost,
  renderSnapshots,
  renderRelations,
  renderExportPanel,
} from './views/graph-snapshots-relations-export.js';
export { renderKanbanList, renderKanbanBoardView } from './views/kanban.js';
