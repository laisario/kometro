import { act, renderHook } from '@testing-library/react';
import { useInfiniteQuery, useQuery } from 'react-query';
import { axios } from '../../src/api';
import useClientAssets from '../../src/assets/hooks/useClientAsset';

jest.mock('react-query', () => ({
  useQuery: jest.fn(),
  useInfiniteQuery: jest.fn(),
}));

jest.mock('../../src/api', () => ({
  axios: {
    get: jest.fn(),
  },
}));

describe('useClientAssets expiration status filter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useQuery.mockReturnValue({
      data: { count: 0, results: [] },
      error: null,
      isLoading: false,
    });
    useInfiniteQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });
    axios.get.mockResolvedValue({ data: { count: 0, results: [] } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('usa All por padrão sem enviar filtro de status', async () => {
    const { result } = renderHook(() => useClientAssets(42, true));
    const query = useQuery.mock.calls.at(-1)[0];

    await query.queryFn();

    expect(result.current.expirationStatus).toBe('all');
    expect(axios.get).toHaveBeenCalledWith(
      '/instrumentos/',
      expect.objectContaining({
        params: expect.objectContaining({
          client: 42,
          page: 1,
          page_size: 5,
        }),
      })
    );
    expect(axios.get.mock.calls[0][1].params).not.toHaveProperty(
      'expiration_status'
    );
  });

  it('combina status, cliente, busca e paginação e volta para a primeira página', async () => {
    const { result } = renderHook(() => useClientAssets(42, true));

    act(() => {
      result.current.setSearch('VENCIDO');
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    act(() => {
      result.current.setPage(3);
    });

    act(() => {
      result.current.handleExpirationStatusChange('expired');
    });

    const query = useQuery.mock.calls.at(-1)[0];
    await query.queryFn();

    expect(result.current.page).toBe(0);
    expect(axios.get).toHaveBeenLastCalledWith(
      '/instrumentos/',
      expect.objectContaining({
        params: expect.objectContaining({
          client: 42,
          search: 'VENCIDO',
          page: 1,
          expiration_status: 'expired',
        }),
      })
    );
  });

  it('envia up_to_date para instrumentos em dia', async () => {
    const { result } = renderHook(() => useClientAssets(42, true));

    act(() => {
      result.current.handleExpirationStatusChange('up_to_date');
    });

    const query = useQuery.mock.calls.at(-1)[0];
    await query.queryFn();

    expect(axios.get.mock.calls.at(-1)[1].params.expiration_status).toBe(
      'up_to_date'
    );
  });
});
