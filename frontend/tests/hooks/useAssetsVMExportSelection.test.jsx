import { act, renderHook, waitFor } from '@testing-library/react';
import useAssetsVm from '../../src/assets/viewModels/useAssetsVM';
import useAssets from '../../src/assets/hooks/useAssets';
import { MAX_EXPORT_ITEMS } from '../../src/assets/constants';

jest.mock('../../src/assets/hooks/useAssets');
jest.mock('../../src/assets/contexts/SectorTreeContext', () => ({
  useSectorTreeContext: () => ({
    nodes: {}, selectedId: null, selectNode: jest.fn(), expandPathToSector: jest.fn(),
  }),
}));
jest.mock('../../src/theme/hooks/useResponsive', () => () => false);
jest.mock('../../src/assets/hooks/useAsset', () => () => ({ asset: null, isLoadingAsset: false }));
jest.mock('../../src/assets/hooks/useSectorMutations', () => () => ({}));
jest.mock('../../src/assets/hooks/useDefaultAssets', () => () => ({}));
jest.mock('../../src/assets/hooks/useAssetMutations', () => () => ({
  error: false, setError: jest.fn(),
}));
jest.mock('../../src/auth/hooks/useAuth', () => () => ({
  user: { cliente: 1 }, hasEditPermission: true,
}));

const assetFilterForm = { reset: jest.fn() };
const filtersSnapshot = {
  search: '', status: 'all', date_start: null, date_stop: null,
  filter_by_date: false, norma: '',
};

const createAssetsHookValue = (overrides = {}) => ({
  assets: { count: 2, results: [{ id: 1 }, { id: 2 }] },
  search: '', setSearch: jest.fn(), assetFilterForm, isFetchingAssets: false,
  hasAssetsError: false,
  page: 0, rowsPerPage: 25, handleChangePage: jest.fn(),
  handleChangeRowsPerPage: jest.fn(), filtersSnapshot,
  filterSignature: 'filters-a', rawFilterSignature: 'filters-a',
  filtersPending: false,
  ...overrides,
});

describe('useAssetsVM - estado lógico da seleção de exportação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAssets.mockReturnValue(createAssetsHookValue());
  });

  it('seleciona todos logicamente sem guardar objetos da consulta', () => {
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleCheckboxSelectAll());

    expect(result.current.selection).toEqual({
      mode: 'all_filtered', filtersSnapshot, filterSignature: 'filters-a',
      matchedCount: 2, selectedCount: 2,
    });
    expect(result.current.selected).toEqual([]);
    expect(result.current.selectedCount).toBe(2);
  });

  it('preserva seleção manual por IDs, permite desmarcar e acumula páginas', () => {
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleRowSelect(1, { id: 1 }));
    act(() => result.current.handleRowSelect(2, { id: 2 }));
    expect(result.current.selection).toEqual({ mode: 'manual', ids: [1, 2] });

    act(() => result.current.handleRowSelect(1, { id: 1 }));
    expect(result.current.selection).toEqual({ mode: 'manual', ids: [2] });
    expect(result.current.selected.map((item) => item.id)).toEqual([2]);
  });

  it('limita a contagem lógica de selecionados a 9999', () => {
    useAssets.mockReturnValue(createAssetsHookValue({
      assets: { count: 12000, results: [{ id: 1 }] },
    }));
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleCheckboxSelectAll());

    expect(result.current.selection.matchedCount).toBe(12000);
    expect(result.current.selectedCount).toBe(MAX_EXPORT_ITEMS);
  });

  it('limpa all_filtered imediatamente quando o filtro bruto muda', async () => {
    const { result, rerender } = renderHook(() => useAssetsVm());

    act(() => result.current.handleCheckboxSelectAll());
    expect(result.current.selection.mode).toBe('all_filtered');

    useAssets.mockReturnValue(createAssetsHookValue({
      rawFilterSignature: 'filters-b-raw', filterSignature: 'filters-a',
      filtersPending: true,
    }));
    rerender();

    await waitFor(() => expect(result.current.selection).toEqual({
      mode: 'manual', ids: [],
    }));
  });

  it('não cria all_filtered enquanto um filtro aguarda debounce', () => {
    useAssets.mockReturnValue(createAssetsHookValue({ filtersPending: true }));
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleCheckboxSelectAll());

    expect(result.current.selection).toEqual({ mode: 'manual', ids: [] });
    expect(result.current.selectionDisabled).toBe(true);
  });

  it('não cria all_filtered usando resultados mantidos após erro da listagem', () => {
    useAssets.mockReturnValue(createAssetsHookValue({ hasAssetsError: true }));
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleCheckboxSelectAll());

    expect(result.current.selection).toEqual({ mode: 'manual', ids: [] });
    expect(result.current.selectionDisabled).toBe(true);
  });

  it('não desmarca linha em all_filtered e limpa pela ação global', () => {
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleCheckboxSelectAll());
    act(() => result.current.handleRowSelect(1, { id: 1 }));
    expect(result.current.selection.mode).toBe('all_filtered');

    act(() => result.current.handleCheckboxSelectAll());
    expect(result.current.selection).toEqual({ mode: 'manual', ids: [] });
  });

  it('preserva seleção e filtros ao fechar o modal de exportação', () => {
    const { result } = renderHook(() => useAssetsVm());

    act(() => result.current.handleRowSelect(1, { id: 1 }));
    act(() => result.current.handleClose());

    expect(result.current.selection).toEqual({ mode: 'manual', ids: [1] });
    expect(result.current.selected.map((item) => item.id)).toEqual([1]);
    expect(assetFilterForm.reset).not.toHaveBeenCalled();
  });
});
