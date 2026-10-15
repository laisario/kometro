import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetsPage from '../../src/assets/pages/AssetsPage';

let mockSelectedItem = { id: 'instrument-7', type: 'instrument' };

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => children,
}));

jest.mock('react-router', () => ({
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('../../src/assets/viewModels/useAssetsVM', () => ({
  __esModule: true,
  default: () => ({
    handleClose: jest.fn(),
    handleClickOpen: jest.fn(),
    handleCheckboxSelectAll: jest.fn(),
    handleRowSelect: jest.fn(),
    handleChangeCheckbox: jest.fn(),
    isMobile: false,
    open: false,
    error: false,
    selection: { mode: 'manual', ids: [] },
    selectedCount: 0,
    selectionDisabled: false,
    valueCheckbox: { tag: true },
    setError: jest.fn(),
    selected: [],
    asset: { id: 7 },
    assets: { count: 1, results: [] },
    selectedItem: mockSelectedItem,
    setSelectedItem: jest.fn(),
    assetFilterForm: {
      register: jest.fn(),
      setValue: jest.fn(),
      watch: jest.fn(),
    },
    isFetchingAssets: false,
    hasEditPermission: true,
    page: 0,
    rowsPerPage: 25,
    handleChangePage: jest.fn(),
    handleChangeRowsPerPage: jest.fn(),
    search: '',
    setSearch: jest.fn(),
  }),
}));

jest.mock('../../src/assets/components/SearchWithTreeExpansion', () => ({
  __esModule: true,
  default: ({ onSelectInstrument }) => (
    <>
      <button type="button" onClick={() => onSelectInstrument({
        id: 'instrument-7',
        matchedCalibrationId: 31,
      })}>
        Resultado por certificado
      </button>
      <button type="button" onClick={() => onSelectInstrument({
        id: 'instrument-7',
        matchedCalibrationId: null,
      })}>
        Resultado normal
      </button>
      <button type="button" onClick={() => onSelectInstrument({
        id: 'instrument-8',
        matchedCalibrationId: 44,
      })}>
        Outro instrumento
      </button>
    </>
  ),
}));

jest.mock('../../src/assets/components/SectorTreeView', () => ({
  __esModule: true,
  default: ({ selectedCalibrationId }) => (
    <div data-testid="selected-calibration">
      {selectedCalibrationId || 'nenhuma'}
    </div>
  ),
}));

jest.mock('../../src/assets/components/ExportFilter', () => () => null);
jest.mock('../../src/assets/components/PreferencesForm', () => () => null);
jest.mock('../../src/assets/components/InstrumentosTable', () => () => null);

describe('AssetsPage - calibração encontrada pela busca', () => {
  beforeEach(() => {
    mockSelectedItem = { id: 'instrument-7', type: 'instrument' };
  });

  it('aplica somente a calibração do certificado no instrumento selecionado', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AssetsPage />);

    expect(screen.getByTestId('selected-calibration')).toHaveTextContent('nenhuma');

    await user.click(screen.getByRole('button', { name: 'Resultado por certificado' }));
    expect(screen.getByTestId('selected-calibration')).toHaveTextContent('31');

    await user.click(screen.getByRole('button', { name: 'Resultado normal' }));
    expect(screen.getByTestId('selected-calibration')).toHaveTextContent('nenhuma');

    await user.click(screen.getByRole('button', { name: 'Resultado por certificado' }));
    await user.click(screen.getByRole('button', { name: 'Outro instrumento' }));
    expect(screen.getByTestId('selected-calibration')).toHaveTextContent('nenhuma');

    mockSelectedItem = { id: 'instrument-8', type: 'instrument' };
    rerender(<AssetsPage />);
    expect(screen.getByTestId('selected-calibration')).toHaveTextContent('44');

    mockSelectedItem = { id: 'instrument-7', type: 'instrument' };
    rerender(<AssetsPage />);
    expect(screen.getByTestId('selected-calibration')).toHaveTextContent('nenhuma');
  });
});
