import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render } from '../utils/test-utils';
import ClientDetailsPage from '../../src/clients/pages/ClientDetailsPage';
import useClientVM from '../../src/clients/viewModels/useClientVM';
import useAuth from '../../src/auth/hooks/useAuth';

jest.mock('../../src/clients/viewModels/useClientVM', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../src/auth/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-helmet-async', () => ({
  Helmet: () => null,
}));

jest.mock('../../src/clients/components/ClientInformation', () => () => null);
jest.mock(
  '../../src/clients/components/ClientInstrumentInformation',
  () => () => <div>Instrumento existente</div>
);
jest.mock('../../src/assets/components/CreateInstrument', () => () => null);
jest.mock('../../src/components/EmptyYet', () => () => <div>Lista vazia</div>);

describe('ClientDetailsPage instrument status filter', () => {
  const handleExpirationStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { admin: true } });
    useClientVM.mockReturnValue({
      client: { id: 42 },
      isMobile: false,
      search: '',
      setSearch: jest.fn(),
      expirationStatus: 'all',
      handleExpirationStatusChange,
      handleOpenCreateForm: jest.fn(),
      handleCloseCreateForm: jest.fn(),
      handleOpenEditForm: jest.fn(),
      handleCloseEditForm: jest.fn(),
      openCreateForm: false,
      editFormState: { open: false, instrument: null },
      isLoadingClient: false,
      rowsPerPage: 5,
      page: 0,
      handleChangePage: jest.fn(),
      handleChangeRowsPerPage: jest.fn(),
      isDeleting: false,
      mutateDelete: jest.fn(),
      isLoadingAssets: false,
      assets: { count: 1, results: [{ id: 1 }] },
      defaultAssets: [],
      isFetching: false,
      searchDA: '',
      setSearchDA: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      mutateCreateClient: jest.fn(),
      mutateUpdateClient: jest.fn(),
      error: {},
      setError: jest.fn(),
    });
  });

  it('exibe All por padrão e permite selecionar Expired ou Up to date', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin/cliente/42']}>
        <Routes>
          <Route path="/admin/cliente/:id" element={<ClientDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    const statusFilter = screen.getByRole('combobox', { name: 'Status' });
    expect(statusFilter).toHaveTextContent('Todos');

    await user.click(statusFilter);
    expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vencidos' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Em dia' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Vencidos' }));
    expect(handleExpirationStatusChange).toHaveBeenCalledWith('expired');
    expect(screen.getByText('Instrumento existente')).toBeInTheDocument();
  });
});
