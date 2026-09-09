import {
  findSectorInHierarchy,
  sectorQueriesKey,
  sectorQueryKey,
} from '../../src/assets/api/sectorsApi';

describe('sector query helpers', () => {
  it('constrói uma chave isolada e estável por cliente', () => {
    expect(sectorQueriesKey()).toEqual(['setores']);
    expect(sectorQueryKey(10)).toEqual(['setores', '10']);
    expect(sectorQueryKey('20')).toEqual(['setores', '20']);
    expect(sectorQueryKey(10)).not.toEqual(sectorQueryKey(20));
  });

  it('localiza setores em qualquer nível da hierarquia', () => {
    const child = { id: 2, nome: 'Filho', cliente: 7, subsetores: [] };
    const hierarchy = [{ id: 1, nome: 'Raiz', cliente: 7, subsetores: [child] }];

    expect(findSectorInHierarchy(hierarchy, '2')).toBe(child);
    expect(findSectorInHierarchy(hierarchy, 999)).toBeNull();
  });
});
