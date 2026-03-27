import { describe, it, expect } from 'vitest';
import {
  characterLinkPhraseForViewer,
  characterLinkCanonicalPhrase,
  isChildRole,
} from './relations.js';

/** @returns {import('../core/types.js').Relationship} */
function ccRel(fromId, toId, role, description = '') {
  return {
    id: 'r1',
    type: 'character_character',
    from: { kind: 'character', id: fromId },
    to: { kind: 'character', id: toId },
    meta: { role },
    description,
  };
}

describe('isChildRole', () => {
  it('reconoce hijo e hija', () => {
    expect(isChildRole('hijo')).toBe(true);
    expect(isChildRole('hija')).toBe(true);
    expect(isChildRole('padre')).toBe(false);
  });
});

describe('characterLinkPhraseForViewer', () => {
  it('desde from: hijo describe al hijo respecto al padre', () => {
    const r = ccRel('mara', 'jason', 'hijo');
    expect(
      characterLinkPhraseForViewer('mara', r, { viewerName: 'Mara', otherName: 'Jason' })
    ).toBe('Mara es hijo de Jason');
  });

  it('desde to: hijo invierte a padre/madre del hijo', () => {
    const r = ccRel('mara', 'jason', 'hijo');
    expect(
      characterLinkPhraseForViewer('jason', r, { viewerName: 'Jason', otherName: 'Mara' })
    ).toBe('Jason es padre o madre de Mara');
  });

  it('desde from: hija', () => {
    const r = ccRel('mara', 'jason', 'hija');
    expect(
      characterLinkPhraseForViewer('mara', r, { viewerName: 'Mara', otherName: 'Jason' })
    ).toBe('Mara es hija de Jason');
  });

  it('hermano es simétrico en el texto', () => {
    const r = ccRel('a', 'b', 'hermano');
    expect(
      characterLinkPhraseForViewer('a', r, { viewerName: 'Ana', otherName: 'Bea' })
    ).toContain('hermano');
    expect(
      characterLinkPhraseForViewer('b', r, { viewerName: 'Bea', otherName: 'Ana' })
    ).toContain('hermana');
  });

  it('casados es simétrico', () => {
    const r = ccRel('a', 'b', 'casados');
    const p = characterLinkPhraseForViewer('b', r, { viewerName: 'B', otherName: 'A' });
    expect(p).toContain('casado');
  });
});

describe('characterLinkCanonicalPhrase', () => {
  it('coincide con frase desde from', () => {
    const r = ccRel('mara', 'jason', 'hija');
    expect(characterLinkCanonicalPhrase(r, 'Mara', 'Jason')).toBe(
      characterLinkPhraseForViewer('mara', r, { viewerName: 'Mara', otherName: 'Jason' })
    );
  });
});
