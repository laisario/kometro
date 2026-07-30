/* global beforeEach, describe, expect, it, jest */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FileAccessRequestsPage from '../../src/blog/pages/FileAccessRequestsPage';
import useFileAccessRequests from '../../src/blog/hooks/useFileAccessRequests';
import { navConfig } from '../../src/layouts/common/nav/config';
import { render } from '../utils/test-utils';

jest.mock('../../src/blog/hooks/useFileAccessRequests', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-helmet-async', () => ({
  Helmet: () => null,
}));

jest.mock('../../src/components/Loading', () => {
  function MockLoading() {
    return <div>Carregando solicitações</div>;
  }

  return MockLoading;
});

const defaultHookResult = {
  requests: {
    count: 1,
    next: null,
    previous: null,
    results: [
      {
        id: 10,
        nome: 'Maria da Silva',
        empresa: 'Empresa Exemplo',
        email: 'maria@example.com',
        telefone: '24999999999',
        arquivo: {
          id: 5,
          titulo: 'Manual técnico',
          nomeOriginal: 'manual.pdf',
        },
        dataSolicitacao: '2026-07-29',
        horaSolicitacao: '14:35:20',
      },
    ],
  },
  error: null,
  isFetching: false,
  refetch: jest.fn(),
  page: 0,
  rowsPerPage: 10,
  handleChangePage: jest.fn(),
  handleChangeRowsPerPage: jest.fn(),
};

describe('FileAccessRequestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFileAccessRequests.mockReturnValue(defaultHookResult);
  });

  it('exibe as colunas e os dados da solicitação', () => {
    render(<FileAccessRequestsPage />);

    [
      'Nome',
      'Empresa',
      'Email',
      'Telefone',
      'Arquivo solicitado',
      'Data',
      'Hora',
    ].forEach((column) => {
      expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument();
    });
    expect(screen.getByText('Maria da Silva')).toBeInTheDocument();
    expect(screen.getByText('Empresa Exemplo')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText('24999999999')).toBeInTheDocument();
    expect(screen.getByText('Manual técnico')).toBeInTheDocument();
    expect(screen.getByText('29/07/2026')).toBeInTheDocument();
    expect(screen.getByText('14:35')).toBeInTheDocument();
  });

  it('exibe os estados de carregamento e lista vazia', () => {
    useFileAccessRequests.mockReturnValueOnce({
      ...defaultHookResult,
      requests: { count: 0, results: [] },
      isFetching: true,
    });
    const { rerender } = render(<FileAccessRequestsPage />);

    expect(screen.getByText('Carregando solicitações')).toBeInTheDocument();

    useFileAccessRequests.mockReturnValue({
      ...defaultHookResult,
      requests: { count: 0, results: [] },
    });
    rerender(<FileAccessRequestsPage />);

    expect(
      screen.getByText('Nenhuma solicitação de arquivo encontrada.')
    ).toBeInTheDocument();
  });

  it('exibe erro e permite tentar novamente', async () => {
    const user = userEvent.setup();
    const refetch = jest.fn();
    useFileAccessRequests.mockReturnValue({
      ...defaultHookResult,
      requests: { count: 0, results: [] },
      error: new Error('Falha na API'),
      refetch,
    });

    render(<FileAccessRequestsPage />);

    expect(
      screen.getByText('Não foi possível carregar as solicitações de arquivos.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('mostra o item de navegação somente para administradores', () => {
    expect(
      navConfig(true, false).find(
        (item) => item.path === '/admin/solicitacoes-arquivos'
      )?.title
    ).toBe('Solicitações de arquivos');
    expect(
      navConfig(false, false).some(
        (item) => item.path === '/admin/solicitacoes-arquivos'
      )
    ).toBe(false);
  });
});
