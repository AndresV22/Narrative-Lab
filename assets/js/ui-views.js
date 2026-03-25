/**
 * Plantillas HTML de las vistas principales — Narrative Lab (fachada)
 */

export { wrapEditorSection, renderBookSettings } from './ui/views/core.js';
export {
  renderChaptersList,
  renderChapterEditor,
  renderSceneEditor,
  renderActsView,
} from './ui/views/chapters-scenes.js';
export { renderCharacterList, renderCharacterForm } from './ui/views/characters.js';
export { renderTimelineMerged, renderExtrasList, renderExtraEditor } from './ui/views/timeline-extras.js';
export {
  renderWritingGuide,
  renderAppSettingsPanel,
  renderNotesList,
  renderNoteEditor,
  renderHighlights,
} from './ui/views/guide-settings-notes.js';
export { renderAnalysisPanel } from './ui/views/analysis.js';
export {
  renderGraphHost,
  renderSnapshots,
  renderRelations,
  renderExportPanel,
} from './ui/views/graph-snapshots-relations-export.js';
