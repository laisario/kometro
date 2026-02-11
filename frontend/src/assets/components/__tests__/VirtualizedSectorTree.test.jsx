import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import VirtualizedSectorTree from '../VirtualizedSectorTree';
import { SectorTreeProvider } from '../../contexts/SectorTreeContext';

// Mock do useAuth
jest.mock('../../../auth/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: { cliente: '1' },
    hasCreatePermission: true,
    hasEditPermission: true,
    hasDeletePermission: true,
  }),
}));

// Mock do axios
jest.mock('../../../api', () => ({
  axios: {
    get: jest.fn(() => Promise.resolve({
      data: [
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
      ]
    })),
  },
}));

// Mock do react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, height, width }) => {
    console.log('FixedSizeList render:', { itemCount, height, width });
    return (
      <div data-testid="fixed-size-list" style={{ height, width }}>
        {Array.from({ length: itemCount }, (_, index) => (
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
    console.log('AutoSizer render');
    return children({ height: 600, width: 400 });
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SectorTreeProvider>
          {children}
        </SectorTreeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

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
    error: null,
    openFormCreateInstrument: { status: false },
    setOpenFormCreateInstrument: jest.fn(),
    handleCloseCreateInstrument: jest.fn(),
    setError: jest.fn(),
    creatingSector: false,
    handleCloseCreateSector: jest.fn(),
  };

  it('deve renderizar a lista de setores', async () => {
    render(<VirtualizedSectorTree {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Verificar se a FixedSizeList foi renderizada
    const fixedSizeList = screen.getByTestId('fixed-size-list');
    expect(fixedSizeList).toBeInTheDocument();
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
});
