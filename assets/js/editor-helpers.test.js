/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  clampZoom,
  editorSourceId,
  nextZoomStepDown,
  nextZoomStepUp,
  stripNlCommentMarks,
} from './editor-helpers.js';

describe('stripNlCommentMarks', () => {
  it('elimina spans de comentario conservando el texto', () => {
    const html =
      '<p>Hola <span class="nl-comment-mark" data-nl-comment-id="abc">mundo</span> fin</p>';
    const out = stripNlCommentMarks(html);
    expect(out).toContain('mundo');
    expect(out).not.toContain('nl-comment-mark');
    expect(out).not.toContain('data-nl-comment-id');
  });
});

describe('zoom', () => {
  it('clampZoom acota el rango', () => {
    expect(clampZoom(50)).toBe(60);
    expect(clampZoom(200)).toBe(160);
    expect(clampZoom(100)).toBe(100);
  });

  it('pasos de zoom suben y bajan según niveles', () => {
    expect(nextZoomStepUp(95)).toBe(100);
    expect(nextZoomStepDown(105)).toBe(100);
  });
});

describe('editorSourceId', () => {
  it('usa kind cuando id es null', () => {
    expect(editorSourceId('synopsis', null)).toBe('synopsis');
  });

  it('prioriza id cuando existe', () => {
    expect(editorSourceId('chapter', 'ch-1')).toBe('ch-1');
  });
});
