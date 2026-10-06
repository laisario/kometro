import { act, renderHook, waitFor } from '@testing-library/react';
import { enqueueSnackbar } from 'notistack';
import useAssetsVm from '../../src/assets/viewModels/useAssetsVM';
import useAssets from '../../src/assets/hooks/useAssets';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));
jest.mock('../../src/assets/hooks/useAssets');
jest.mock('../../src/assets/contexts/SectorTreeContext', () => ({
  useSectorTreeContext: () => ({
    nodes: {},
    selectedId: null,
    selectNode: jest.fn(),
    expandPathToSector: jest.fn(),
  }),
}));
jest.mock('../../src/theme/hooks/useResponsive', () => () => false);
jest.mock('../../src/assets/hooks/useAsset', () => () => ({ asset: null, isLoadingAsset: false }));
jest.mock('../../src/assets/hooks/useSectorMutations', () => () => ({}));
jest.mock('../../src/assets/hooks/useDefaultAssets', () => () => ({}));
jest.mock('../../src/assets/hooks/useAssetMutations', () => () => ({
  error: false,
  setError: jest.fn(),
}));
jest.mock('../../src/auth/hooks/useAuth', () => () => ({
  user: { cliente: 1 },
  hasEditPermission: true,
}));

const assetFilterForm = {
  reset: jest.fn(),
};

const createAssetsHookValue = (overrides = {}) => ({
  assets: { count: 2, results: [{ id: 1 }, { id: 2 }] },
  search: '',
  setSearch: jest.fn(),
  assetFilterForm,
  isFetchingAssets: false,
  page: 0,
  rowsPerPage: 25,
  handleChangePage: jest.fn(),
  handleChangeRowsPerPage: jest.fn(),
  fetchAllMatchingAssets: jest.fn().mockResolvedValue({
    count: 2,
    results: [{ id: 1 }, { id: 2 }],
    filterSignature: 'filters-a',
  }),
  filterSignature: 'filters-a',
  isSelectingAll: false,
  ...overrides,
});

describe('useAssetsVM - estado da seleção de exportação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAssets.mockReturnValue(createAssetsHookValue());
  });

  it('seleciona os resultados realmente retornados pela consulta grande', async () => {
    const { result } = renderHook(() => useAssetsVm());

    await act(async () => {
      await result.current.handleCheckboxSelectAll();
    });

    expect(result.current.selectAll).toBe(true);
    expect(result.current.selected.map((item) => item.id)).toEqual([1, 2]);
  });

  it('preserva seleção individual, permite desmarcar e acumula páginas', () => {
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleRowSelect(1, { id: 1 }));
    act(() => result.current.handleRowSelect(2, { id: 2 }));
    expect(result.current.selected.map((item) => item.id)).toEqual([1, 2]);

    act(() => result.current.handleRowSelect(1, { id: 1 }));
    expect(result.current.selected.map((item) => item.id)).toEqual([2]);
    expect(result.current.selectAll).toBe(false);
  });

  it('mantém a seleção anterior quando a consulta falha', async () => {
    useAssets.mockReturnValue(createAssetsHookValue({
      fetchAllMatchingAssets: jest.fn().mockRejectedValue(new Error('falha')),
    }));
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleRowSelect(7, { id: 7 }));
    await act(async () => {
      await result.current.handleCheckboxSelectAll();
    });

    expect(result.current.selected.map((item) => item.id)).toEqual([7]);
    expect(result.current.selectAll).toBe(false);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Não foi possível selecionar todos os instrumentos. Tente novamente.',
      expect.objectContaining({ variant: 'error' })
    );
  });

  it('limpa a seleção quando os filtros mudam', async () => {
    const { result, rerender } = renderHook(() => useAssetsVm());

    await act(async () => {
      await result.current.handleCheckboxSelectAll();
    });
    expect(result.current.selectAll).toBe(true);

    useAssets.mockReturnValue(createAssetsHookValue({
      filterSignature: 'filters-b',
      fetchAllMatchingAssets: jest.fn().mockResolvedValue({
        count: 1,
        results: [{ id: 3 }],
        filterSignature: 'filters-b',
      }),
    }));
    rerender();

    await waitFor(() => expect(result.current.selected).toEqual([]));
    expect(result.current.selectAll).toBe(false);
  });
});
