import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { HelmetProvider } from 'react-helmet-async';
import AssetsPage from '../../src/assets/pages/AssetsPage';

// Desabilitar mock automático do react-query
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

// Mock do useAuth
const mockUser = {
  cliente: '1',
  admin: false,
};

jest.mock('../../src/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    user: mockUser,
    hasCreatePermission: true,
    hasEditPermission: true,
    hasDeletePermission: true,
  })),
}));

// Mock do react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }) => {
    if (itemCount === 0) {
      return <div data-testid="fixed-size-list-empty">Vazio</div>;
    }
    return (
      <div data-testid="fixed-size-list">
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
  AutoSizer: ({ children }) => (
    <div data-testid="autosizer">{children({ height: 600, width: 400 })}</div>
  ),
}));

/**
 * Test Data Factories
 */
const createSector = (overrides = {}) => ({
  id: Math.floor(Math.random() * 10000),
  nome: 'Setor Teste',
  subsetores: [],
  instrumentos: [],
  ...overrides,
});

const createInstrument = (overrides = {}) => ({
  id: Math.floor(Math.random() * 10000),
  tag: 'INST-001',
  numeroDeSerie: 'SN-001',
  ...overrides,
});

const createSectorWithChildren = (name, childrenSectors = [], instruments = []) => ({
  id: Math.floor(Math.random() * 10000),
  nome: name,
  subsetores: childrenSectors,
  instrumentos: instruments,
});

/**
 * Helper to create test query client
 */
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

/**
 * Helper to render with all providers
 */
const renderWithProviders = (ui) => {
  const queryClient = createTestQueryClient();
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider maxSnack={3}>
            {ui}
          </SnackbarProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('Sector Tree - User Flows (TDD)', () => {
  let user;
  
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Default mocks
    mockAxios.get.mockImplementation((url) => {
      if (url === '/setores/hierarquia/') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/instrumentos/') {
        return Promise.resolve({ data: { results: [], count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe('A) Delete sector (empty)', () => {
    it('should remove empty sector from tree and call API with correct id', async () => {
      const emptySector = createSector({ id: 100, nome: 'Empty Sector' });
      
      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [emptySector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      mockAxios.delete.mockResolvedValue({ data: {} });

      renderWithProviders(<AssetsPage />);

      // Wait for sector to load
      await waitFor(() => {
        expect(screen.getByText('Empty Sector')).toBeInTheDocument();
      });

      // Select the sector
      await user.click(screen.getByText('Empty Sector'));

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /deletar/i });
      await user.click(deleteButton);

      // Confirm deletion in dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /confirmar|excluir/i });
      await user.click(confirmButton);

      // Verify API was called with correct ID
      await waitFor(() => {
        expect(mockAxios.delete).toHaveBeenCalledWith(
          '/setores/100/',
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' },
            data: expect.objectContaining({
              action: expect.any(String),
            }),
          })
        );
      });

      // Verify sector is removed from tree
      await waitFor(() => {
        expect(screen.queryByText('Empty Sector')).not.toBeInTheDocument();
      });
    });

    it('should reset selected sector state after deletion', async () => {
      const emptySector = createSector({ id: 101, nome: 'Sector to Delete' });
      
      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [emptySector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      mockAxios.delete.mockResolvedValue({ data: {} });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sector to Delete')).toBeInTheDocument();
      });

      // Select and delete
      await user.click(screen.getByText('Sector to Delete'));
      
      // Verify sector is selected (has highlighted styling or action buttons visible)
      const selectedRow = screen.getByText('Sector to Delete').closest('div');
      expect(selectedRow).toHaveStyle({ backgroundColor: expect.any(String) });

      const deleteButton = screen.getByRole('button', { name: /deletar/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /confirmar|excluir/i });
      await user.click(confirmButton);

      // After deletion, no sector should be selected
      // (Verify by checking that action buttons are not visible or no instrument details panel)
      await waitFor(() => {
        expect(screen.queryByText('Sector to Delete')).not.toBeInTheDocument();
      });
    });
  });

  describe('B) Delete sector with instruments and children', () => {
    it('should show delete dialog with options when sector has instruments', async () => {
      const sectorWithInstruments = createSectorWithChildren(
        'Sector with Instruments',
        [],
        [createInstrument({ id: 1, tag: 'INST-001' })]
      );

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [sectorWithInstruments] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sector with Instruments')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sector with Instruments'));

      const deleteButton = screen.getByRole('button', { name: /deletar/i });
      await user.click(deleteButton);

      // Dialog should show options for handling instruments
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        // Should show warning about instruments
        expect(within(dialog).getByText(/este setor contém instrumentos|possui instrumentos/i)).toBeInTheDocument();
        
        // Should show action options (delete all, transfer, etc.)
        expect(within(dialog).getByText(/excluir tudo|deletar|transferir/i)).toBeInTheDocument();
      });
    });

    it('should show delete dialog with options when sector has subsectors', async () => {
      const childSector = createSector({ id: 201, nome: 'Child Sector' });
      const parentSector = createSectorWithChildren('Parent Sector', [childSector], []);

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [parentSector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Parent Sector')).toBeInTheDocument();
      });

      // Expand parent to show child
      await user.click(screen.getByText('Parent Sector'));

      await waitFor(() => {
        expect(screen.getByText('Child Sector')).toBeInTheDocument();
      });

      // Try to delete parent
      await user.click(screen.getByText('Parent Sector'));
      const deleteButton = screen.getByRole('button', { name: /deletar/i });
      await user.click(deleteButton);

      // Dialog should warn about nested content
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        // Should show some indication that there are subsectors
        // The exact message depends on backend rules
        expect(dialog.textContent).toMatch(/subsetor|filho|nested|conteúdo/i);
      });
    });

    it('should call API with transfer action when user chooses to transfer instruments', async () => {
      const targetSector = createSector({ id: 301, nome: 'Target Sector' });
      const sectorToDelete = createSectorWithChildren(
        'Sector to Delete',
        [],
        [createInstrument({ id: 1, tag: 'INST-001' })]
      );

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [sectorToDelete, targetSector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      mockAxios.delete.mockResolvedValue({ data: {} });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Sector to Delete')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sector to Delete'));

      const deleteButton = screen.getByRole('button', { name: /deletar/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Select "transfer to existing sector" option
      const transferOption = screen.getByRole('radio', { name: /transferir.*existente|mover para setor/i });
      await user.click(transferOption);

      // Select target sector from autocomplete/dropdown
      const autocomplete = screen.getByRole('combobox', { name: /setor de destino|destino/i });
      await user.click(autocomplete);
      await user.type(autocomplete, 'Target');

      await waitFor(() => {
        expect(screen.getByText('Target Sector')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Target Sector'));

      // Confirm
      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', { name: /confirmar|excluir/i });
      await user.click(confirmButton);

      // Verify API called with transfer action
      await waitFor(() => {
        expect(mockAxios.delete).toHaveBeenCalledWith(
          expect.stringContaining('/setores/'),
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'transfer_existing',
              targetSetorId: 301,
            }),
          })
        );
      });
    });
  });

  describe('C) Edit sector name', () => {
    it('should update sector name in UI and call API when user edits', async () => {
      const sector = createSector({ id: 400, nome: 'Old Name' });

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [sector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      mockAxios.patch.mockResolvedValue({ 
        data: { ...sector, nome: 'New Name' } 
      });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Old Name')).toBeInTheDocument();
      });

      // Select sector
      await user.click(screen.getByText('Old Name'));

      // Click edit button
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Should show input field for editing
      await waitFor(() => {
        const input = screen.getByDisplayValue('Old Name');
        expect(input).toBeInTheDocument();
        expect(input).toHaveFocus();
      });

      // Change name
      const input = screen.getByDisplayValue('Old Name');
      await user.clear(input);
      await user.type(input, 'New Name');

      // Submit (press Enter or click confirm button)
      await user.keyboard('{Enter}');

      // Verify API was called
      await waitFor(() => {
        expect(mockAxios.patch).toHaveBeenCalledWith(
          '/setores/400/',
          expect.objectContaining({
            nome: 'New Name',
          })
        );
      });

      // Verify UI updated
      await waitFor(() => {
        expect(screen.getByText('New Name')).toBeInTheDocument();
        expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
      });
    });

    it('should show optimistic update while editing', async () => {
      const sector = createSector({ id: 401, nome: 'Original' });

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [sector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      // Simulate slow API
      mockAxios.patch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: { ...sector, nome: 'Updated' } });
          }, 500);
        });
      });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Original'));

      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
      });

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.type(input, 'Updated');
      await user.keyboard('{Enter}');

      // UI should update immediately (optimistic)
      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      }, { timeout: 100 });

      // And stay updated after API confirms
      await waitFor(() => {
        expect(mockAxios.patch).toHaveBeenCalled();
      });

      expect(screen.getByText('Updated')).toBeInTheDocument();
    });
  });

  describe('D) Create root sector (CRITICAL: Legacy behavior)', () => {
    it('should create root sector, select it, and auto-open rename input', async () => {
      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      const newSector = createSector({ id: 500, nome: 'Novo setor' });
      mockAxios.post.mockResolvedValue({ data: newSector });

      renderWithProviders(<AssetsPage />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/criar setor/i)).toBeInTheDocument();
      });

      // Click "Criar setor" button
      const createButton = screen.getByRole('button', { name: /criar setor/i });
      await user.click(createButton);

      // Wait for API to be called
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/setores/',
          expect.objectContaining({
            nome: 'Novo setor',
            cliente: '1',
          })
        );
      });

      // CRITICAL: After creation, sector should appear in tree
      await waitFor(() => {
        expect(screen.getByText('Novo setor')).toBeInTheDocument();
      });

      // CRITICAL: Sector should be selected (verify by checking highlighted state or visible action buttons)
      const sectorRow = screen.getByText('Novo setor').closest('div');
      expect(sectorRow).toHaveAttribute('data-selected', 'true');
      // OR verify action buttons are visible
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();

      // CRITICAL: Rename input should auto-open and be focused
      await waitFor(() => {
        const input = screen.getByDisplayValue('Novo setor');
        expect(input).toBeInTheDocument();
        expect(input).toHaveFocus();
      });
    });

    it('should allow immediate rename after auto-opening input', async () => {
      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      const newSector = createSector({ id: 501, nome: 'Novo setor' });
      mockAxios.post.mockResolvedValue({ data: newSector });
      mockAxios.patch.mockResolvedValue({ 
        data: { ...newSector, nome: 'My Custom Name' } 
      });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criar setor/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /criar setor/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalled();
      });

      // Wait for auto-opened input
      await waitFor(() => {
        const input = screen.getByDisplayValue('Novo setor');
        expect(input).toBeInTheDocument();
        expect(input).toHaveFocus();
      });

      // User can immediately type new name
      const input = screen.getByDisplayValue('Novo setor');
      await user.clear(input);
      await user.type(input, 'My Custom Name');
      await user.keyboard('{Enter}');

      // Verify rename API called
      await waitFor(() => {
        expect(mockAxios.patch).toHaveBeenCalledWith(
          '/setores/501/',
          expect.objectContaining({
            nome: 'My Custom Name',
          })
        );
      });

      // Verify updated in UI
      await waitFor(() => {
        expect(screen.getByText('My Custom Name')).toBeInTheDocument();
      });
    });

    it('should cancel creation if user presses Escape on auto-opened input', async () => {
      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      const newSector = createSector({ id: 502, nome: 'Novo setor' });
      mockAxios.post.mockResolvedValue({ data: newSector });
      mockAxios.delete.mockResolvedValue({ data: {} });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criar setor/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /criar setor/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalled();
      });

      // Wait for auto-opened input
      await waitFor(() => {
        const input = screen.getByDisplayValue('Novo setor');
        expect(input).toBeInTheDocument();
      });

      // Press Escape to cancel
      await user.keyboard('{Escape}');

      // Should call delete API to remove the newly created sector
      await waitFor(() => {
        expect(mockAxios.delete).toHaveBeenCalledWith(
          '/setores/502/',
          expect.objectContaining({
            data: expect.objectContaining({
              action: 'delete_all',
            }),
          })
        );
      });

      // Sector should be removed from tree
      await waitFor(() => {
        expect(screen.queryByText('Novo setor')).not.toBeInTheDocument();
      });
    });
  });

  describe('E) Create subsector (CRITICAL: Legacy behavior)', () => {
    it('should create subsector under parent, select it, and auto-open rename input', async () => {
      const parentSector = createSector({ id: 600, nome: 'Parent Sector' });

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [parentSector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      const newSubsector = createSector({ 
        id: 601, 
        nome: 'Novo setor',
      });
      mockAxios.post.mockResolvedValue({ data: newSubsector });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Parent Sector')).toBeInTheDocument();
      });

      // Select parent sector
      await user.click(screen.getByText('Parent Sector'));

      // Click "Create subsector" button (AddIcon button)
      const createSubsectorButton = screen.getByRole('button', { name: /criar subsetor/i });
      await user.click(createSubsectorButton);

      // Verify API called with parent ID
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/setores/',
          expect.objectContaining({
            nome: 'Novo setor',
            setorPaiId: 600,
          })
        );
      });

      // CRITICAL: Subsector should appear nested under parent
      await waitFor(() => {
        expect(screen.getByText('Novo setor')).toBeInTheDocument();
      });

      // Verify it's nested (indentation or visible under parent)
      const subsectorRow = screen.getByText('Novo setor').closest('div');
      expect(subsectorRow).toHaveStyle({ paddingLeft: expect.stringMatching(/\d+px/) });

      // CRITICAL: Subsector should be selected
      expect(subsectorRow).toHaveAttribute('data-selected', 'true');

      // CRITICAL: Rename input should auto-open and be focused
      await waitFor(() => {
        const input = screen.getByDisplayValue('Novo setor');
        expect(input).toBeInTheDocument();
        expect(input).toHaveFocus();
      });
    });

    it('should auto-expand parent when creating subsector', async () => {
      const parentSector = createSector({ id: 602, nome: 'Collapsed Parent' });

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ data: [parentSector] });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      const newSubsector = createSector({ id: 603, nome: 'Novo setor' });
      mockAxios.post.mockResolvedValue({ data: newSubsector });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Collapsed Parent')).toBeInTheDocument();
      });

      // Select collapsed parent
      await user.click(screen.getByText('Collapsed Parent'));

      // Create subsector
      const createSubsectorButton = screen.getByRole('button', { name: /criar subsetor/i });
      await user.click(createSubsectorButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalled();
      });

      // Parent should auto-expand to show the new subsector
      await waitFor(() => {
        expect(screen.getByText('Novo setor')).toBeInTheDocument();
      });

      // Verify parent is expanded (look for expand icon or chevron pointing down)
      const parentRow = screen.getByText('Collapsed Parent').closest('div');
      const expandIcon = within(parentRow).getByTestId(/expand|chevron/i);
      expect(expandIcon).toHaveAttribute('data-expanded', 'true');
    });

    it('should handle creating nested subsectors (grandchild)', async () => {
      const grandparent = createSector({ id: 700, nome: 'Grandparent' });
      const parent = createSector({ id: 701, nome: 'Parent' });

      mockAxios.get.mockImplementation((url) => {
        if (url === '/setores/hierarquia/') {
          return Promise.resolve({ 
            data: [{
              ...grandparent,
              subsetores: [parent],
            }] 
          });
        }
        return Promise.resolve({ data: { results: [], count: 0 } });
      });

      const grandchild = createSector({ id: 702, nome: 'Novo setor' });
      mockAxios.post.mockResolvedValue({ data: grandchild });

      renderWithProviders(<AssetsPage />);

      await waitFor(() => {
        expect(screen.getByText('Grandparent')).toBeInTheDocument();
      });

      // Expand grandparent
      await user.click(screen.getByText('Grandparent'));

      await waitFor(() => {
        expect(screen.getByText('Parent')).toBeInTheDocument();
      });

      // Select parent and create subsector
      await user.click(screen.getByText('Parent'));

      const createSubsectorButton = screen.getByRole('button', { name: /criar subsetor/i });
      await user.click(createSubsectorButton);

      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/setores/',
          expect.objectContaining({
            setorPaiId: 701,
          })
        );
      });

      // Grandchild should appear with correct nesting level
      await waitFor(() => {
        expect(screen.getByText('Novo setor')).toBeInTheDocument();
      });

      const grandchildRow = screen.getByText('Novo setor').closest('div');
      // Should have deeper indentation than parent
      const grandchildIndent = parseInt(grandchildRow.style.paddingLeft);
      const parentIndent = parseInt(screen.getByText('Parent').closest('div').style.paddingLeft);
      expect(grandchildIndent).toBeGreaterThan(parentIndent);

      // Auto-opened input should be focused
      await waitFor(() => {
        const input = screen.getByDisplayValue('Novo setor');
        expect(input).toHaveFocus();
      });
    });
  });
});
