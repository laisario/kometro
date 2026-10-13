import { act, renderHook } from '@testing-library/react';
import { useQuery } from 'react-query';
import { useForm, useWatch } from 'react-hook-form';
import { axios } from '../../src/api';
import useAssets, { buildAssetsParams } from '../../src/assets/hooks/useAssets';

jest.mock('react-query', () => ({ useQuery: jest.fn() }));
jest.mock('react-hook-form', () => ({ useForm: jest.fn(), useWatch: jest.fn() }));
jest.mock('../../src/api', () => ({ axios: { get: jest.fn() } }));

describe('useAssets - paginação e filtros da exportação', () => {
  let watchedFilters;
  let queryOptions;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryOptions = null;
    useQuery.mockImplementation((options) => {
      queryOptions = options;
      return {
        data: { count: 128, results: [] },
        isFetching: false,
        isError: false,
      };
    });
    axios.get.mockResolvedValue({ data: { count: 128, results: [] } });
    watchedFilters = {
      status: 'all', dateStart: '', dateStop: '', filterByDate: false, norma: '',
    };
    useForm.mockReturnValue({
      control: {},
      setValue: jest.fn((name, value) => {
        watchedFilters = { ...watchedFilters, [name]: value };
      }),
    });
    useWatch.mockImplementation(() => watchedFilters);
  });

  afterEach(() => jest.useRealTimers());

  it('monta a paginação e os filtros canônicos para a listagem', () => {
    expect(buildAssetsParams({
      search: 'termometro', status: 'expired', date_start: '2026-01-01',
      date_stop: '2026-02-01', filter_by_date: true, norma: 'ISO', page: 1,
      pageSize: 100,
    })).toEqual({
      search: 'termometro', status: 'expired', dateStart: '2026-01-01',
      dateStop: '2026-02-01', filterByDate: true, norma: 'ISO', page: 1,
      page_size: 100,
    });
  });

  it('inicia com 25 linhas e não expõe consulta para buscar todos', () => {
    const { result } = renderHook(() => useAssets());

    expect(result.current.rowsPerPage).toBe(25);
    expect(result.current.fetchAllMatchingAssets).toBeUndefined();
  });

  it('mantém a consulta da tabela paginada após selecionar filtros', async () => {
    const { result, rerender } = renderHook(() => useAssets());

    act(() => result.current.setSearch('termometro'));
    rerender();
    act(() => jest.advanceTimersByTime(400));
    rerender();

    await act(async () => queryOptions.queryFn({ signal: undefined }));

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('/instrumentos/', {
      signal: undefined,
      params: expect.objectContaining({ search: 'termometro', page: 1, page_size: 25 }),
    });
    expect(axios.get.mock.calls[0][1].params.page_size).not.toBe(9999);
  });

  it('marca filtros como pendentes imediatamente, antes do debounce', () => {
    const { result, rerender } = renderHook(() => useAssets());

    act(() => result.current.setSearch('novo filtro'));
    rerender();

    expect(result.current.filtersPending).toBe(true);
    expect(result.current.rawFilterSignature).not.toBe(result.current.filterSignature);

    act(() => jest.advanceTimersByTime(400));
    rerender();

    expect(result.current.filtersPending).toBe(false);
    expect(result.current.filtersSnapshot.search).toBe('novo filtro');
  });

  it('nunca transforma o tamanho da página em -1', () => {
    const { result } = renderHook(() => useAssets());

    act(() => result.current.handleChangeRowsPerPage({ target: { value: '-1' } }));

    expect(result.current.rowsPerPage).toBe(25);
    expect(result.current.rowsPerPage).not.toBe(-1);
  });
});
