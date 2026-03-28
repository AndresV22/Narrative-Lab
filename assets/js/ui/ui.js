/**
 * Interfaz y renderizado — Narrative Lab (fachada)
 */

export {
  mountShell,
  saveSnapshotFromHeader,
  updateHeaderSnapshotButton,
  setSaveBadge,
  renderSidebar,
  renderRightPanel,
  applyRightPanelLayout,
  updateHeaderBookToolsVisibility,
} from './ui-shell.js';
export { renderMain, bindMainInteractions } from './ui-main.js';
export {
  renderSearchModal,
  renderTemplateModal,
  renderImportModal,
  renderClearWorkspaceModal,
  showEditorCommentBodyModal,
  showConfirmModal,
  showCharacterRenameModal,
} from './ui-modals.js';
