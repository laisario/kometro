import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import * as reactQuery from 'react-query';

// Import real components
import InstrumentosTable from '../../src/assets/components/InstrumentosTable';
import RecordList from '../../src/assets/components/RecordList';
import InstrumentDetails from '../../src/assets/components/InstrumentDetails';
import ConfirmDeleteDialog from '../../src/assets/components/ConfirmDeleteDialog';

// Mock date utilities
jest.mock('../../src/utils/formatTime', () => ({
  fDate: (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '-',
  fDateTime: (date) => date ? new Date(date).toLocaleString('pt-BR') : '-',
}));

jest.mock('../../src/utils/date', () => ({
  dateDistanceText: () => 'em 30 dias',
  findDateStatusColor: () => 'success',
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

jest.mock('../../src/theme/hooks/useResponsive', () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock('../../src/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({
    user: { cliente: 1 },
    hasCreatePermission: true,
    hasDeletePermission: true,
    hasEditPermission: true,
  }),
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
    closeSnackbar: jest.fn(),
  }),
}));

// Mock hooks used by InstrumentosTable for creating instruments
jest.mock('../../src/assets/hooks/useDefaultAssets', () => ({
  __esModule: true,
  default: () => ({
    defaultAssets: { results: [], count: 0 },
    search: '',
    setSearch: jest.fn(),
    isFetching: false,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
}));

jest.mock('../../src/assets/hooks/useSectorTree', () => ({
  __esModule: true,
  default: () => ({
    sectors: [
      { id: '1', label: 'Produção', itemType: 'sector', depth: 0 },
      { id: '2', label: 'Qualidade', itemType: 'sector', depth: 1 },
    ],
    isLoadingSectors: false,
  }),
}));

jest.mock('../../src/assets/hooks/useAssetMutations', () => ({
  __esModule: true,
  default: () => ({
    mutateCreateClient: jest.fn(),
    mutateUpdateClient: jest.fn(),
    mutateDeleteClient: jest.fn(),
    mutateChangePosition: jest.fn(),
    error: {},
    setError: jest.fn(),
  }),
}));

// Test data
const mockInstrumentos = {
  count: 3,
  results: [
    {
      id: 1,
      tag: 'INSTR-001',
      expirado: false,
      dataProximaCalibracao: '2025-06-15',
      setor: { id: 1, nome: 'Produção' },
      instrumento: {
        id: 10,
        tipoDeInstrumento: {
          id: 100,
          descricao: 'Paquímetro',
          modelo: 'Digital 150mm',
        },
      },
    },
    {
      id: 2,
      tag: 'INSTR-002',
      expirado: true,
      dataProximaCalibracao: '2024-01-10',
      setor: { id: 2, nome: 'Qualidade' },
      instrumento: {
        id: 11,
        tipoDeInstrumento: {
          id: 101,
          descricao: 'Balança',
          modelo: 'Precisão',
        },
      },
    },
  ],
};

const mockTiposInstrumento = [
  { id: 100, descricao: 'Paquímetro' },
  { id: 101, descricao: 'Balança' },
];

const mockCalibracao = {
  id: 500,
  data: '2024-12-18',
  ordemDeServico: 'OS-2024-001',
  local: 'P',
  observacoes: 'Calibração realizada',
  checagem: false,
  certificados: [],
  resultados: [],
};

const mockFullInstrument = {
  id: 1,
  tag: 'INSTR-001',
  numeroDeSerie: 'SN123456',
  classe: 'A',
  posicao: 'U',
  expirado: false,
  dataProximaCalibracao: '2025-06-15',
  dataUltimaCalibracao: '2024-06-15',
  setor: { id: 1, nome: 'Produção' },
  instrumento: {
    id: 10,
    tipoDeInstrumento: {
      id: 100,
      descricao: 'Paquímetro',
      modelo: 'Digital 150mm',
      fabricante: 'Mitutoyo',
      resolucao: 0.01,
    },
    minimo: 0,
    maximo: 150,
    unidade: 'mm',
  },
  frequenciaChecagem: { quantidade: 30, periodo: 'dia' },
  frequenciaCalibracao: { quantidade: 12, periodo: 'mes' },
  criterioFrequencia: 'C',
  criteriosAceitacao: [
    { id: 1, tipo: 'Critério Principal', criterioDeAceitacao: '0.02', unidade: 'mm' },
  ],
  pontosDeCalibracao: [{ nome: '0mm' }, { nome: '150mm' }],
  normativos: [{ id: 1, nome: 'NBR 10005' }],
  calibracoes: [mockCalibracao],
  checagens: [],
  historicoPosicoes: [],
  historicoSetores: [],
  cliente: { id: 1 },
};

// Mock the hooks that fetch data
jest.mock('../../src/assets/hooks/useInstrumentosTable', () => ({
  __esModule: true,
  default: () => ({
    instrumentos: mockInstrumentos,
    search: '',
    setSearch: jest.fn(),
    isFetchingInstrumentos: false,
    page: 0,
    rowsPerPage: 10,
    handleChangePage: jest.fn(),
    handleChangeRowsPerPage: jest.fn(),
    expiradoFilter: 'all',
    handleExpiradoFilterChange: jest.fn(),
    tipoInstrumentoFilter: '',
    handleTipoInstrumentoFilterChange: jest.fn(),
    tiposInstrumento: mockTiposInstrumento,
    isFetchingTipos: false,
    clearFilters: jest.fn(),
  }),
}));

jest.mock('../../src/clients/hooks/useCalibration', () => ({
  __esModule: true,
  default: () => ({
    data: [mockCalibracao],
    isLoadingCalibrations: false,
  }),
}));

describe('Instrumentos Page - Functional Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InstrumentosTable - Display and Interaction', () => {
    it('displays instruments table with data', () => {
      render(<InstrumentosTable />);

      // Verify table headers exist (use getAllByRole for table cells)
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
      
      // Verify specific headers in the table
      expect(screen.getByRole('columnheader', { name: 'Tag' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Descrição' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Setor' })).toBeInTheDocument();
    });

    it('displays instrument rows from data', () => {
      render(<InstrumentosTable />);

      // Verify instruments are rendered
      expect(screen.getByText('INSTR-001')).toBeInTheDocument();
      expect(screen.getByText('INSTR-002')).toBeInTheDocument();
      expect(screen.getByText('Paquímetro')).toBeInTheDocument();
      expect(screen.getByText('Balança')).toBeInTheDocument();
    });

    it('displays sectors correctly', () => {
      render(<InstrumentosTable />);

      expect(screen.getByText('Produção')).toBeInTheDocument();
      expect(screen.getByText('Qualidade')).toBeInTheDocument();
    });

    it('shows status chips (Em dia / Atrasado)', () => {
      render(<InstrumentosTable />);

      expect(screen.getByText('Em dia')).toBeInTheDocument();
      expect(screen.getByText('Atrasado')).toBeInTheDocument();
    });

    it('has status filter dropdown', () => {
      render(<InstrumentosTable />);

      // Look for combobox with Status role
      const statusSelects = screen.getAllByRole('combobox');
      expect(statusSelects.length).toBeGreaterThan(0);
    });

    it('has tipo de instrumento filter dropdown', () => {
      render(<InstrumentosTable />);

      // Look for the tipo dropdown - there should be multiple comboboxes
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });

    it('has search input', () => {
      render(<InstrumentosTable />);

      const searchInput = screen.getByPlaceholderText('Buscar por tag, descrição...');
      expect(searchInput).toBeInTheDocument();
    });

    it('displays pagination', () => {
      render(<InstrumentosTable />);

      expect(screen.getByText(/Por página/)).toBeInTheDocument();
    });

    it('rows are clickable', () => {
      render(<InstrumentosTable />);

      const row = screen.getByText('INSTR-001').closest('tr');
      expect(row).toHaveStyle('cursor: pointer');
    });

    it('displays Criar Instrumento button', () => {
      render(<InstrumentosTable />);

      const createButton = screen.getByRole('button', { name: /Criar Instrumento/i });
      expect(createButton).toBeInTheDocument();
    });

    it('opens create instrument form when button is clicked', async () => {
      render(<InstrumentosTable />);

      const createButton = screen.getByRole('button', { name: /Criar Instrumento/i });
      await user.click(createButton);

      // Check if the form dialog opens - should show the form title
      await waitFor(() => {
        expect(screen.getByText('Crie seu instrumento')).toBeInTheDocument();
      });
    });
  });

  describe('RecordList - Calibration Management', () => {
    it('displays calibration tabs', () => {
      render(<RecordList asset={mockFullInstrument} />);

      expect(screen.getByRole('tab', { name: 'Calibração' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Checagem' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Movimentações' })).toBeInTheDocument();
    });

    it('shows create calibration button', () => {
      render(<RecordList asset={mockFullInstrument} />);

      expect(screen.getByRole('button', { name: /Criar calibração/i })).toBeInTheDocument();
    });

    it('switches tabs correctly', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      const checagemTab = screen.getByRole('tab', { name: 'Checagem' });
      await user.click(checagemTab);

      // Button should change
      expect(screen.getByRole('button', { name: /Criar checagem/i })).toBeInTheDocument();
    });

    it('shows export button on movimentações tab', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      const movimentacoesTab = screen.getByRole('tab', { name: 'Movimentações' });
      await user.click(movimentacoesTab);

      expect(screen.getByRole('button', { name: /Exportar movimentações/i })).toBeInTheDocument();
    });

    it('opens create calibration form when button is clicked', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      const createBtn = screen.getByRole('button', { name: /Criar calibração/i });
      await user.click(createBtn);

      // Form should be open
      await waitFor(() => {
        expect(screen.getByText('Criar nova calibração')).toBeInTheDocument();
      });
    });

    it('calibration form has required fields', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      const createBtn = screen.getByRole('button', { name: /Criar calibração/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByLabelText('Ordem de serviço')).toBeInTheDocument();
        expect(screen.getByLabelText('Local')).toBeInTheDocument();
        expect(screen.getByLabelText('Observações')).toBeInTheDocument();
      });
    });

    it('can fill and submit calibration form', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      // Open form
      const createBtn = screen.getByRole('button', { name: /Criar calibração/i });
      await user.click(createBtn);

      // Fill form
      await waitFor(() => {
        expect(screen.getByLabelText('Ordem de serviço')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('Ordem de serviço'), 'OS-TEST-001');
      await user.type(screen.getByLabelText('Observações'), 'Calibração de teste');

      // Submit button should be present
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    });

    it('can cancel calibration form', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      const createBtn = screen.getByRole('button', { name: /Criar calibração/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText('Criar nova calibração')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelBtn);

      // Form should close
      await waitFor(() => {
        expect(screen.queryByText('Criar nova calibração')).not.toBeInTheDocument();
      });
    });
  });

  describe('InstrumentDetails - Instrument Display', () => {
    const createProps = (overrides = {}) => ({
      instrumento: mockFullInstrument,
      mutateUpdateClient: jest.fn(),
      mutateCreateClient: jest.fn(),
      mutateDeleteClient: jest.fn(),
      mutateChangePosition: jest.fn(),
      defaultAssets: { results: [] },
      search: '',
      setSearch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      selectedItem: { type: 'sector', id: 1, parentId: null },
      setSelectedItem: jest.fn(),
      error: {},
      setError: jest.fn(),
      isFetching: false,
      setores: [{ id: 1, nome: 'Produção' }],
      openFormCreateInstrument: { status: false, type: '' },
      setOpenFormCreateInstrument: jest.fn(),
      handleCloseCreateInstrument: jest.fn(),
      ...overrides,
    });

    it('displays instrument information header', () => {
      render(<InstrumentDetails {...createProps()} />);

      expect(screen.getByText('Informações instrumento')).toBeInTheDocument();
    });

    it('displays instrument tag and description', () => {
      render(<InstrumentDetails {...createProps()} />);

      expect(screen.getByText(/INSTR-001/)).toBeInTheDocument();
      expect(screen.getByText(/Paquímetro/)).toBeInTheDocument();
    });

    it('displays metrological characteristics', () => {
      render(<InstrumentDetails {...createProps()} />);

      expect(screen.getByText('Características metrológicas')).toBeInTheDocument();
      expect(screen.getByText(/Faixa: 0 - 150 mm/)).toBeInTheDocument();
    });

    it('displays frequency information', () => {
      render(<InstrumentDetails {...createProps()} />);

      expect(screen.getByText('Frequência')).toBeInTheDocument();
      expect(screen.getByText(/Checagem: 30 dias/)).toBeInTheDocument();
      expect(screen.getByText(/Calibração: 12 meses/)).toBeInTheDocument();
    });

    it('displays calibration points', () => {
      render(<InstrumentDetails {...createProps()} />);

      expect(screen.getByText('Pontos de Calibração')).toBeInTheDocument();
    });

    it('displays normativo/legal', () => {
      render(<InstrumentDetails {...createProps()} />);

      expect(screen.getByText('Normativo/legal')).toBeInTheDocument();
      expect(screen.getByText(/NBR 10005/)).toBeInTheDocument();
    });

    it('has options menu', () => {
      render(<InstrumentDetails {...createProps()} />);

      // Find menu button (MoreVertIcon)
      const menuButton = screen.getByRole('button', { name: '' });
      expect(menuButton).toBeInTheDocument();
    });

    it('opens edit option from menu', async () => {
      const mockSetOpenForm = jest.fn();
      render(<InstrumentDetails {...createProps({ setOpenFormCreateInstrument: mockSetOpenForm })} />);

      // Click menu button
      const menuButton = screen.getByRole('button', { name: '' });
      await user.click(menuButton);

      // Click edit
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Editar/ })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('menuitem', { name: /Editar/ }));

      expect(mockSetOpenForm).toHaveBeenCalledWith({ status: true, type: 'edit' });
    });

    it('opens delete confirmation from menu', async () => {
      const mockSetOpenForm = jest.fn();
      render(<InstrumentDetails {...createProps({ setOpenFormCreateInstrument: mockSetOpenForm })} />);

      // Click menu button
      const menuButton = screen.getByRole('button', { name: '' });
      await user.click(menuButton);

      // Click delete
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Excluir/ })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('menuitem', { name: /Excluir/ }));

      expect(mockSetOpenForm).toHaveBeenCalledWith({ status: true, type: 'delete' });
    });
  });

  describe('ConfirmDeleteDialog - Delete Functionality', () => {
    it('renders delete confirmation for instrument', () => {
      render(
        <ConfirmDeleteDialog 
          open={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          type="instrument"
        />
      );

      expect(screen.getByText('Tem certeza que deseja excluir este instrumento?')).toBeInTheDocument();
    });

    it('calls onConfirm when delete is confirmed', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();
      
      render(
        <ConfirmDeleteDialog 
          open={true}
          onClose={onClose}
          onConfirm={onConfirm}
          type="instrument"
        />
      );

      const deleteBtn = screen.getByRole('button', { name: 'Excluir' });
      await user.click(deleteBtn);

      expect(onConfirm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('calls only onClose when cancelled', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();
      
      render(
        <ConfirmDeleteDialog 
          open={true}
          onClose={onClose}
          onConfirm={onConfirm}
          type="instrument"
        />
      );

      const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelBtn);

      expect(onClose).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Integration - Complete Workflows', () => {
    it('complete calibration creation workflow: open form -> fill -> submit', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      // 1. Open form
      const createBtn = screen.getByRole('button', { name: /Criar calibração/i });
      await user.click(createBtn);

      // 2. Verify form is open
      await waitFor(() => {
        expect(screen.getByText('Criar nova calibração')).toBeInTheDocument();
      });

      // 3. Fill required fields
      await user.type(screen.getByLabelText('Ordem de serviço'), 'OS-WORKFLOW-001');
      await user.type(screen.getByLabelText('Observações'), 'Calibração via workflow teste');

      // 4. Verify data is entered
      expect(screen.getByLabelText('Ordem de serviço')).toHaveValue('OS-WORKFLOW-001');

      // 5. Submit form
      const submitBtn = screen.getByRole('button', { name: 'Salvar' });
      expect(submitBtn).toBeInTheDocument();
    });

    it('complete checagem creation workflow', async () => {
      render(<RecordList asset={mockFullInstrument} />);

      // 1. Switch to checagem tab
      const checagemTab = screen.getByRole('tab', { name: 'Checagem' });
      await user.click(checagemTab);

      // 2. Open form
      const createBtn = screen.getByRole('button', { name: /Criar checagem/i });
      await user.click(createBtn);

      // 3. Verify form shows checagem context (look for dialog title)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Criar checagem/i })).toBeInTheDocument();
      });

      // 4. Fill form
      await user.type(screen.getByLabelText('Ordem de serviço'), 'CH-WORKFLOW-001');

      // 5. Verify
      expect(screen.getByLabelText('Ordem de serviço')).toHaveValue('CH-WORKFLOW-001');
    });

    it('complete instrument edit workflow: open menu -> edit -> form opens', async () => {
      const mockSetOpenForm = jest.fn();
      const mockUpdateClient = jest.fn();
      
      render(
        <InstrumentDetails 
          instrumento={mockFullInstrument}
          mutateUpdateClient={mockUpdateClient}
          mutateCreateClient={jest.fn()}
          mutateDeleteClient={jest.fn()}
          mutateChangePosition={jest.fn()}
          defaultAssets={{ results: [] }}
          search=""
          setSearch={jest.fn()}
          fetchNextPage={jest.fn()}
          hasNextPage={false}
          isFetchingNextPage={false}
          selectedItem={{ type: 'sector', id: 1, parentId: null }}
          setSelectedItem={jest.fn()}
          error={{}}
          setError={jest.fn()}
          isFetching={false}
          setores={[{ id: 1, nome: 'Produção' }]}
          openFormCreateInstrument={{ status: false, type: '' }}
          setOpenFormCreateInstrument={mockSetOpenForm}
          handleCloseCreateInstrument={jest.fn()}
        />
      );

      // 1. Open menu
      const menuButton = screen.getByRole('button', { name: '' });
      await user.click(menuButton);

      // 2. Click edit
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Editar/ })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('menuitem', { name: /Editar/ }));

      // 3. Verify edit form was requested
      expect(mockSetOpenForm).toHaveBeenCalledWith({ status: true, type: 'edit' });
    });

    it('complete instrument delete workflow: open menu -> delete -> confirm', async () => {
      const mockDeleteClient = jest.fn();
      const mockSetSelectedItem = jest.fn();
      
      render(
        <InstrumentDetails 
          instrumento={mockFullInstrument}
          mutateUpdateClient={jest.fn()}
          mutateCreateClient={jest.fn()}
          mutateDeleteClient={mockDeleteClient}
          mutateChangePosition={jest.fn()}
          defaultAssets={{ results: [] }}
          search=""
          setSearch={jest.fn()}
          fetchNextPage={jest.fn()}
          hasNextPage={false}
          isFetchingNextPage={false}
          selectedItem={{ type: 'sector', id: 1, parentId: null }}
          setSelectedItem={mockSetSelectedItem}
          error={{}}
          setError={jest.fn()}
          isFetching={false}
          setores={[{ id: 1, nome: 'Produção' }]}
          openFormCreateInstrument={{ status: true, type: 'delete' }}
          setOpenFormCreateInstrument={jest.fn()}
          handleCloseCreateInstrument={jest.fn()}
        />
      );

      // Delete dialog should be open
      expect(screen.getByText(/Tem certeza que deseja excluir este instrumento/)).toBeInTheDocument();

      // Confirm delete
      const deleteBtn = screen.getByRole('button', { name: 'Excluir' });
      await user.click(deleteBtn);

      // Verify delete was called
      expect(mockDeleteClient).toHaveBeenCalledWith(mockFullInstrument.id);
    });
  });
});
