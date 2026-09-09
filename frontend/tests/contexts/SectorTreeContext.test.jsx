import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from 'react-query';
import { axios } from '../../src/api';
import { SectorTreeProvider, useSectorTreeContext } from '../../src/assets/contexts/SectorTreeContext';
import { sectorQueryKey } from '../../src/assets/api/sectorsApi';

jest.unmock('react-query');

let mockUser = { cliente: 'A' };
let observedRefetchReferences = [];

jest.mock('../../src/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: mockUser }),
}));

jest.mock('../../src/api', () => ({
  axios: { get: jest.fn() },
}));

function ContextProbe() {
  const context = useSectorTreeContext();
  observedRefetchReferences.push(context.refetchSectors);
  return (
    <div>
      <span data-testid="client-id">{context.clienteId ?? 'none'}</span>
      <span data-testid="sector-ids">{context.rootIds.join(',')}</span>
      <span data-testid="selected-id">{context.selectedId ?? 'none'}</span>
      <span data-testid="is-loading">{String(context.isLoadingTree)}</span>
      <span data-testid="is-fetching">{String(context.isFetchingTree)}</span>
      <span data-testid="query-key">{context.sectorQueryKey.join(':')}</span>
      <button type="button" onClick={() => context.selectNode(context.rootIds[0])}>Selecionar primeiro</button>
      <button type="button" onClick={() => context.refetchSectors()}>Atualizar setores</button>
    </div>
  );
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: Infinity },
    },
  });
}

function renderProvider(queryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SectorTreeProvider>
        <ContextProbe />
      </SectorTreeProvider>
    </QueryClientProvider>,
  );
}

describe('SectorTreeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { cliente: 'A' };
    observedRefetchReferences = [];
    axios.get.mockImplementation((_url, { params }) => Promise.resolve({
      data: [{
        id: params.cliente_id === 'A' ? 1 : 2,
        nome: `Setor ${params.cliente_id}`,
        cliente: params.cliente_id,
        subsetores: [],
        instrumentos: [],
      }],
    }));
  });

  afterEach(() => {
    focusManager.setFocused(undefined);
    onlineManager.setOnline(undefined);
  });

  it('isola os dados e a query key pelo cliente autenticado', async () => {
    const queryClient = createQueryClient();
    const view = renderProvider(queryClient);

    await waitFor(() => expect(screen.getByTestId('sector-ids')).toHaveTextContent('1'));
    expect(queryClient.getQueryData(sectorQueryKey('A'))[0].nome).toBe('Setor A');

    let resolveClienteB;
    axios.get.mockImplementationOnce(() => new Promise((resolve) => {
      resolveClienteB = resolve;
    }));
    mockUser = { cliente: 'B' };
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SectorTreeProvider>
          <ContextProbe />
        </SectorTreeProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('query-key')).toHaveTextContent('setores:B');
    expect(screen.getByTestId('sector-ids')).toBeEmptyDOMElement();
    expect(screen.getByTestId('sector-ids')).not.toHaveTextContent('1');

    await act(async () => {
      resolveClienteB({
        data: [{ id: 2, nome: 'Setor B', cliente: 'B', subsetores: [], instrumentos: [] }],
      });
    });
    await waitFor(() => expect(screen.getByTestId('sector-ids')).toHaveTextContent('2'));
    expect(queryClient.getQueryData(sectorQueryKey('A'))[0].nome).toBe('Setor A');
    expect(queryClient.getQueryData(sectorQueryKey('B'))[0].nome).toBe('Setor B');
  });

  it('não exibe setores anteriores entre logout e novo login', async () => {
    const queryClient = createQueryClient();
    const view = renderProvider(queryClient);
    await waitFor(() => expect(screen.getByTestId('sector-ids')).toHaveTextContent('1'));

    mockUser = null;
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SectorTreeProvider><ContextProbe /></SectorTreeProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('client-id')).toHaveTextContent('none');
    expect(screen.getByTestId('sector-ids')).toBeEmptyDOMElement();

    mockUser = { cliente: 'B' };
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SectorTreeProvider><ContextProbe /></SectorTreeProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('sector-ids')).not.toHaveTextContent('1');
    await waitFor(() => expect(screen.getByTestId('sector-ids')).toHaveTextContent('2'));
  });

  it('refaz a consulta ao recuperar foco e conexão', async () => {
    const queryClient = createQueryClient();
    renderProvider(queryClient);
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

    act(() => {
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
    });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));
  });

  it('mantém dados, seleção e callback estáveis durante refetch em segundo plano', async () => {
    const queryClient = createQueryClient();
    renderProvider(queryClient);
    await waitFor(() => expect(screen.getByTestId('sector-ids')).toHaveTextContent('1'));
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar primeiro' }));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('1');

    let resolveRefetch;
    axios.get.mockImplementationOnce(() => new Promise((resolve) => {
      resolveRefetch = resolve;
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar setores' }));

    await waitFor(() => expect(screen.getByTestId('is-fetching')).toHaveTextContent('true'));
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('sector-ids')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-id')).toHaveTextContent('1');
    expect(new Set(observedRefetchReferences).size).toBe(1);

    await act(async () => {
      resolveRefetch({
        data: [{ id: 1, nome: 'Setor A', cliente: 'A', subsetores: [], instrumentos: [] }],
      });
    });

    await waitFor(() => expect(screen.getByTestId('is-fetching')).toHaveTextContent('false'));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('1');
    expect(new Set(observedRefetchReferences).size).toBe(1);
  });
});
