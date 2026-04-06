import { describe, it, expect } from 'vitest';
import { createEmptyBook, createPlot, createPlace, createCharacter, createEvent, createChapter } from '../domain/models.js';
import {
  characterLinkPhraseForViewer,
  characterLinkCanonicalPhrase,
  isChildRole,
  linkCharacterToEvent,
  linkPlotToCharacter,
  linkPlotToEvent,
  linkPlotToChapter,
  linkPlaceToCharacter,
  linkPlaceToPlot,
  linkPlaceToEvent,
  listRelationships,
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

describe('vínculos plot/place/character_event', () => {
  it('añade character_event, plot_* y place_* sin duplicar', () => {
    const book = createEmptyBook();
    const ch = createCharacter({ id: 'c1' });
    const ev = createEvent({ id: 'e1' });
    const pl = createPlot({ id: 'p1' });
    const place = createPlace({ id: 'l1' });
    const chapter = createChapter({ id: 'h1' });
    book.characters.push(ch);
    book.events.push(ev);
    book.plots.push(pl);
    book.places.push(place);
    book.chapters.push(chapter);

    linkCharacterToEvent(book, 'c1', 'e1', { description: 'x' });
    linkPlotToCharacter(book, 'p1', 'c1');
    linkPlotToEvent(book, 'p1', 'e1');
    linkPlotToChapter(book, 'p1', 'h1');
    linkPlaceToCharacter(book, 'l1', 'c1');
    linkPlaceToPlot(book, 'l1', 'p1');
    linkPlaceToEvent(book, 'l1', 'e1');

    const rels = listRelationships(book);
    expect(rels.length).toBe(7);
    linkCharacterToEvent(book, 'c1', 'e1');
    expect(listRelationships(book).length).toBe(7);
  });
});
