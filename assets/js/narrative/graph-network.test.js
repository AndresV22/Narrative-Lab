import { describe, it, expect } from 'vitest';
import {
  buildCharacterNetworkLayout,
  CELL_W,
  collectConnectedCharacterIds,
  orthogonalLPath,
  roleEdgeColor,
  roleEdgeLabel,
} from './graph-network.js';
import { createEmptyBook, createCharacter } from '../domain/models.js';
import { linkCharacterToCharacter } from './relations.js';

describe('collectConnectedCharacterIds', () => {
  it('incluye solo la componente conexa del raíz', () => {
    const book = createEmptyBook({ name: 'B' });
    const a = createCharacter({ name: 'A' });
    const b = createCharacter({ name: 'B' });
    const c = createCharacter({ name: 'C' });
    book.characters.push(a, b, c);
    linkCharacterToCharacter(book, a.id, b.id, { role: 'amantes' });
    linkCharacterToCharacter(book, b.id, c.id, { role: 'hermano' });
    const set = collectConnectedCharacterIds(book, a.id);
    expect(set.size).toBe(3);
    expect(set.has(a.id) && set.has(b.id) && set.has(c.id)).toBe(true);
  });

  it('excluye personajes en otra componente', () => {
    const book = createEmptyBook({ name: 'B' });
    const a = createCharacter({ name: 'A' });
    const x = createCharacter({ name: 'X' });
    const y = createCharacter({ name: 'Y' });
    const z = createCharacter({ name: 'Z' });
    book.characters.push(a, x, y, z);
    linkCharacterToCharacter(book, a.id, x.id, { role: 'otro' });
    linkCharacterToCharacter(book, y.id, z.id, { role: 'mejores_amigos' });
    const set = collectConnectedCharacterIds(book, a.id);
    expect(set.has(y.id)).toBe(false);
    expect(set.has(a.id)).toBe(true);
  });
});

describe('orthogonalLPath', () => {
  it('devuelve L horizontal-vertical sin diagonal', () => {
    const p = orthogonalLPath(0, 0, 100, 50);
    expect(p).toEqual([
      [0, 0],
      [100, 0],
      [100, 50],
    ]);
    for (let i = 1; i < p.length; i++) {
      const dx = p[i][0] - p[i - 1][0];
      const dy = p[i][1] - p[i - 1][1];
      expect(dx === 0 || dy === 0).toBe(true);
      expect(dx === 0 || dy === 0).toBe(true);
    }
  });

  it('segmento único si comparten x o y', () => {
    expect(orthogonalLPath(5, 10, 5, 20)).toEqual([
      [5, 10],
      [5, 20],
    ]);
    expect(orthogonalLPath(0, 0, 10, 0)).toEqual([
      [0, 0],
      [10, 0],
    ]);
  });
});

describe('roleEdgeColor', () => {
  it('devuelve color por rol conocido', () => {
    expect(roleEdgeColor('padre')).toMatch(/^#/);
    expect(roleEdgeColor('')).toMatch(/^#/);
  });
});

describe('buildCharacterNetworkLayout', () => {
  it('pone a los copadres en la misma capa aunque no haya vínculo de pareja', () => {
    const book = createEmptyBook({ name: 'B' });
    const abuela = createCharacter({ name: 'Abuela' });
    const abuelo = createCharacter({ name: 'Abuelo' });
    const jason = createCharacter({ name: 'Jason' });
    const madre = createCharacter({ name: 'Madre de Mara' });
    const mara = createCharacter({ name: 'Mara' });
    book.characters.push(abuela, abuelo, jason, madre, mara);
    linkCharacterToCharacter(book, jason.id, abuela.id, { role: 'hijo' });
    linkCharacterToCharacter(book, jason.id, abuelo.id, { role: 'hijo' });
    linkCharacterToCharacter(book, mara.id, jason.id, { role: 'hijo' });
    linkCharacterToCharacter(book, mara.id, madre.id, { role: 'hijo' });
    const layout = buildCharacterNetworkLayout(book, mara.id);
    expect(layout).not.toBeNull();
    const lj = layout?.nodes.get(jason.id)?.layer;
    const lm = layout?.nodes.get(madre.id)?.layer;
    expect(lj).toBe(lm);
  });

  it('separa horizontalmente a copadres cuando uno quedó centrado bajo sus padres', () => {
    const book = createEmptyBook({ name: 'B' });
    const abuela = createCharacter({ name: 'Abuela' });
    const abuelo = createCharacter({ name: 'Abuelo' });
    const jason = createCharacter({ name: 'Jason' });
    const madre = createCharacter({ name: 'Madre de Mara' });
    const mara = createCharacter({ name: 'Mara' });
    book.characters.push(abuela, abuelo, jason, madre, mara);
    linkCharacterToCharacter(book, jason.id, abuela.id, { role: 'hijo' });
    linkCharacterToCharacter(book, jason.id, abuelo.id, { role: 'hijo' });
    linkCharacterToCharacter(book, mara.id, jason.id, { role: 'hijo' });
    linkCharacterToCharacter(book, mara.id, madre.id, { role: 'hijo' });
    const layout = buildCharacterNetworkLayout(book, mara.id);
    expect(layout).not.toBeNull();
    const xj = layout?.nodes.get(jason.id)?.x ?? 0;
    const xm = layout?.nodes.get(madre.id)?.x ?? 0;
    expect(Math.abs(xm - xj)).toBeGreaterThanOrEqual(CELL_W - 1);
  });
});

describe('roleEdgeLabel', () => {
  it('usa leyenda corta para roles no filiación', () => {
    const rel = {
      id: '1',
      type: 'character_character',
      from: { kind: 'character', id: 'a' },
      to: { kind: 'character', id: 'b' },
      meta: { role: 'novios' },
      description: '',
    };
    expect(roleEdgeLabel(rel)).toContain('Novios');
  });

  it('no muestra etiqueta de texto para padre/madre/hijo/hija', () => {
    expect(
      roleEdgeLabel({
        id: '1',
        type: 'character_character',
        from: { kind: 'character', id: 'a' },
        to: { kind: 'character', id: 'b' },
        meta: { role: 'hijo' },
        description: '',
      })
    ).toBe('');
    expect(
      roleEdgeLabel({
        id: '2',
        type: 'character_character',
        from: { kind: 'character', id: 'a' },
        to: { kind: 'character', id: 'b' },
        meta: { role: 'hija' },
        description: '',
      })
    ).toBe('');
  });
});
