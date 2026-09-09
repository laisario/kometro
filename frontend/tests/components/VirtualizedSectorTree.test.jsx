import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { focusManager, QueryClient, QueryClientProvider } from 'react-query';
import VirtualizedSectorTree from '../../src/assets/components/VirtualizedSectorTree';
import { SectorTreeProvider } from '../../src/assets/contexts/SectorTreeContext';

// Desabilitar mock automático do react-query para usar a implementação real
jest.unmock('react-query');

// Mock do axios API
jest.mock('../../src/api', () => ({
  axios: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { axios as mockAxios } from '../../src/api';
const mockAxiosGet = mockAxios.get;
let mockCreateInstrumentMounts = 0;
let mockCreateInstrumentUnmounts = 0;

jest.mock('../../src/assets/components/CreateInstrument', () => {
  const ReactActual = jest.requireActual('react');
  return function MockCreateInstrument({ open }) {
    ReactActual.useEffect(() => {
      mockCreateInstrumentMounts += 1;
      return () => {
        mockCreateInstrumentUnmounts += 1;
      };
    }, []);
    return open ? <div data-testid="create-instrument-dialog">Formulário</div> : null;
  };
});

// Mock do useAuth
jest.mock('../../src/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    user: { cliente: '1' },
    hasCreatePermission: true,
    hasEditPermission: true,
    hasDeletePermission: true,
  })),
}));

// Mock do react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, height, width }) => {
    if (itemCount === 0) {
      return <div data-testid="fixed-size-list-empty">Vazio</div>;
    }
    return (
      <div data-testid="fixed-size-list" style={{ height, width }}>
        {Array.from({ length: Math.min(itemCount, 20) }, (_, index) => (
          <div key={index} data-testid={`list-item-${index}`}>
            {children({ index, style: {} })}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock do AutoSizer
jest.mock('react-virtualized-auto-sizer', () => ({
  AutoSizer: ({ children }) => {
    return <div data-testid="autosizer">{children({ height: 600, width: 400 })}</div>;
  },
}));

// Mock de componentes MUI que podem causar problemas
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  };
});

const mockSectorData = [
  {
    id: 1,
    nome: 'Setor Teste 1',
    subsetores: [
      {
        id: 2,
        nome: 'Subsetor 1.1',
        subsetores: [],
        instrumentos: []
      }
    ],
    instrumentos: [
      {
        id: 100,
        tag: 'INST-001',
        numeroDeSerie: 'SN-001'
      }
    ]
  },
  {
    id: 3,
    nome: 'Setor Teste 2',
    subsetores: [],
    instrumentos: []
  }
];

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Silenciar erros do QueryClient
    },
  });
};

const createWrapper = () => {
  const queryClient = createTestQueryClient();

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <SectorTreeProvider>
        {children}
      </SectorTreeProvider>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  // Reset mocks
  mockAxiosGet.mockClear();
  mockCreateInstrumentMounts = 0;
  mockCreateInstrumentUnmounts = 0;
  
  // Setup axios mock to return resolved promise
  mockAxiosGet.mockResolvedValue({ data: mockSectorData });
});

afterEach(() => {
  focusManager.setFocused(undefined);
});

describe('VirtualizedSectorTree', () => {
  const defaultProps = {
    onEditSetor: jest.fn(),
    onDeleteSetor: jest.fn(),
    handleCreate: jest.fn(),
    handleEdit: jest.fn(),
    defaultAssets: [],
    search: '',
    setSearch: jest.fn(),
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    mutate: jest.fn(),
    isFetching: false,
    duplicateInstrument: jest.fn(),
    error: {},
    openFormCreateInstrument: { status: false },
    setOpenFormCreateInstrument: jest.fn(),
    handleCloseCreateInstrument: jest.fn(),
    setError: jest.fn(),
    creatingSector: false,
    handleCloseCreateSector: jest.fn(),
    openCreateSectorId: null,
  };

  it('deve renderizar a lista de setores', async () => {
    render(<VirtualizedSectorTree {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    // Aguardar que a FixedSizeList seja renderizada
    await waitFor(() => {
      const fixedSizeList = screen.queryByTestId('fixed-size-list');
      expect(fixedSizeList).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Verificar que tem itens
    await waitFor(() => {
      const listItems = screen.getAllByTestId(/^list-item-/);
      expect(listItems.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('deve renderizar os setores na lista', async () => {
    render(<VirtualizedSectorTree {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verificar se há itens na lista
    await waitFor(() => {
      const listItems = screen.getAllByTestId(/^list-item-/);
      expect(listItems.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('deve renderizar os nomes dos setores', async () => {
    render(<VirtualizedSectorTree {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verificar se os setores aparecem
    await waitFor(() => {
      expect(screen.getByText('Setor Teste 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Setor Teste 2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('não desmonta o formulário nem troca a árvore por loading durante refetch', async () => {
    render(
      <VirtualizedSectorTree
        {...defaultProps}
        openFormCreateInstrument={{ status: true, type: 'create' }}
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(screen.getByTestId('create-instrument-dialog')).toBeInTheDocument());
    expect(mockCreateInstrumentMounts).toBe(1);

    let resolveRefetch;
    mockAxiosGet.mockImplementationOnce(() => new Promise((resolve) => {
      resolveRefetch = resolve;
    }));
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    await waitFor(() => expect(mockAxiosGet).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('create-instrument-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
    expect(mockCreateInstrumentMounts).toBe(1);
    expect(mockCreateInstrumentUnmounts).toBe(0);

    await act(async () => {
      resolveRefetch({ data: mockSectorData });
    });
    await waitFor(() => expect(mockAxiosGet).toHaveBeenCalledTimes(2));
    expect(mockCreateInstrumentMounts).toBe(1);
    expect(mockCreateInstrumentUnmounts).toBe(0);
  });
});
