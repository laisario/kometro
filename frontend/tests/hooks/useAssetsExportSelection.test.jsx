import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { useQuery } from 'react-query';
import { useForm, useWatch } from 'react-hook-form';
import { axios } from '../../src/api';
import useAssets, { buildAssetsParams } from '../../src/assets/hooks/useAssets';
import { MAX_EXPORT_ITEMS } from '../../src/assets/constants';

jest.mock('react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
  useWatch: jest.fn(),
}));

jest.mock('../../src/api', () => ({
  axios: {
    get: jest.fn(),
  },
}));

describe('useAssets - seleção de todos os resultados', () => {
  let watchedFilters;
  let assetFilterForm;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useQuery.mockReturnValue({
      data: { count: 128, results: [] },
      isFetching: false,
    });
    axios.get.mockResolvedValue({ data: { count: 128, results: [] } });
    watchedFilters = {
      status: 'all',
      dateStart: '',
      dateStop: '',
      filterByDate: false,
      norma: '',
    };
    assetFilterForm = {
      control: {},
      setValue: jest.fn((name, value) => {
        watchedFilters = { ...watchedFilters, [name]: value };
      }),
    };
    useForm.mockReturnValue(assetFilterForm);
    useWatch.mockImplementation(() => watchedFilters);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('usa uma única função para montar paginação e filtros', () => {
    expect(buildAssetsParams({
      search: 'termometro',
      status: 'expired',
      dateStart: 'inicio',
      dateStop: 'fim',
      filterByDate: true,
      norma: 'ISO',
      page: 1,
      pageSize: 128,
    })).toEqual({
      search: 'termometro',
      status: 'expired',
      dateStart: 'inicio',
      dateStop: 'fim',
      filterByDate: true,
      norma: 'ISO',
      page: 1,
      page_size: 128,
    });
  });

  it('busca todos com page 1, page_size igual ao total e preserva filtros', async () => {
    const dateStart = dayjs('2026-01-01');
    const dateStop = dayjs('2026-02-01');
    const { result, rerender } = renderHook(() => useAssets());

    act(() => {
      result.current.setSearch('termometro');
      result.current.assetFilterForm.setValue('status', 'expired');
      result.current.assetFilterForm.setValue('dateStart', dateStart);
      result.current.assetFilterForm.setValue('dateStop', dateStop);
      result.current.assetFilterForm.setValue('filterByDate', true);
      result.current.assetFilterForm.setValue('norma', 'ISO 9001');
    });
    rerender();
    act(() => {
      jest.advanceTimersByTime(500);
    });

    axios.get.mockResolvedValueOnce({
      data: { count: 128, results: [{ id: 1 }] },
    });

    await act(async () => {
      await result.current.fetchAllMatchingAssets(128);
    });

    expect(axios.get).toHaveBeenCalledWith('/instrumentos/', {
      params: {
        search: 'termometro',
        status: 'expired',
        dateStart,
        dateStop,
        filterByDate: true,
        norma: 'ISO 9001',
        page: 1,
        page_size: 128,
      },
    });
    expect(result.current.rowsPerPage).toBe(25);
    expect(result.current.page).toBe(0);
  });

  it('limita a consulta a 9999 quando o total é maior', async () => {
    const { result } = renderHook(() => useAssets());

    await act(async () => {
      await result.current.fetchAllMatchingAssets(12345);
    });

    expect(axios.get).toHaveBeenCalledWith('/instrumentos/', {
      params: expect.objectContaining({
        page: 1,
        page_size: MAX_EXPORT_ITEMS,
      }),
    });
  });

  it('mantém loading durante a consulta e impede requests concorrentes', async () => {
    let resolveRequest;
    axios.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const { result } = renderHook(() => useAssets());

    let firstRequest;
    act(() => {
      firstRequest = result.current.fetchAllMatchingAssets(128);
    });

    await waitFor(() => expect(result.current.isSelectingAll).toBe(true));

    let secondResult;
    await act(async () => {
      secondResult = await result.current.fetchAllMatchingAssets(128);
    });
    expect(secondResult).toBeNull();
    expect(axios.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ data: { count: 128, results: [] } });
      await firstRequest;
    });
    expect(result.current.isSelectingAll).toBe(false);
  });

  it('remove o loading quando a consulta falha', async () => {
    axios.get.mockRejectedValueOnce(new Error('falha de rede'));
    const { result } = renderHook(() => useAssets());

    await expect(act(async () => {
      await result.current.fetchAllMatchingAssets(128);
    })).rejects.toThrow('falha de rede');

    expect(result.current.isSelectingAll).toBe(false);
  });
});
