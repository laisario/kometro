import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchWithTreeExpansion from '../../src/assets/components/SearchWithTreeExpansion';

const mockExpandPathToSector = jest.fn();
const mockSelectNode = jest.fn();

jest.mock('../../src/assets/contexts/SectorTreeContext', () => ({
  useSectorTreeContext: () => ({
    expandPathToSector: mockExpandPathToSector,
    selectNode: mockSelectNode,
  }),
}));

describe('SearchWithTreeExpansion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('repassa a calibração que correspondeu ao certificado pesquisado', async () => {
    const user = userEvent.setup();
    const onSelectInstrument = jest.fn();
    render(
      <SearchWithTreeExpansion
        isFetching={false}
        search="3333333"
        setSearch={jest.fn()}
        data={{
          results: [{
            id: 7,
            tag: 'INST-7',
            setor: { id: 3 },
            instrumento: { tipoDeInstrumento: { descricao: 'Balança' } },
            matchedCalibrationId: 31,
          }],
        }}
        onSelectInstrument={onSelectInstrument}
      />
    );

    await user.click(screen.getByText('INST-7 — Balança'));

    expect(mockExpandPathToSector).toHaveBeenCalledWith('3');
    expect(mockSelectNode).toHaveBeenCalledWith('instrument-7');
    expect(onSelectInstrument).toHaveBeenCalledWith({
      id: 'instrument-7',
      type: 'instrument',
      parentId: 3,
      matchedCalibrationId: 31,
    });
  });

  it('não inventa calibração para uma busca normal', async () => {
    const user = userEvent.setup();
    const onSelectInstrument = jest.fn();
    render(
      <SearchWithTreeExpansion
        isFetching={false}
        search="INST-7"
        setSearch={jest.fn()}
        data={{
          results: [{
            id: 7,
            tag: 'INST-7',
            setor: { id: 3 },
            instrumento: { tipoDeInstrumento: { descricao: 'Balança' } },
            matchedCalibrationId: null,
          }],
        }}
        onSelectInstrument={onSelectInstrument}
      />
    );

    await user.click(screen.getByText('INST-7 — Balança'));

    expect(onSelectInstrument).toHaveBeenCalledWith(expect.objectContaining({
      matchedCalibrationId: null,
    }));
  });
});
