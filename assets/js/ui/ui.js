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
} from './ui-shell.js';
export { renderMain, bindMainInteractions } from './ui-main.js';
export {
  renderSearchModal,
  renderTemplateModal,
  renderImportModal,
  renderClearWorkspaceModal,
} from './ui-modals.js';
