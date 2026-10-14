import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axios } from '../../src/api';
import ExportFilter from '../../src/assets/components/ExportFilter';

const mockPrint = jest.fn();
const mockUseReactToPrint = jest.fn(() => mockPrint);
const mockReadString = jest.fn();

jest.mock('../../src/api', () => ({
  axios: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

jest.mock('react-papaparse', () => ({
  readString: (...args) => mockReadString(...args),
  useCSVDownloader: () => ({
    CSVDownloader: ({ children }) => children,
  }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: (options) => mockUseReactToPrint(options),
}));

const instrumento = {
  id: 1,
  tag: 'INST-1',
  numeroUltimoCertificado: 'CERT-100',
};

const defaultProps = {
  open: true,
  handleClose: jest.fn(),
  selected: [{ id: 1, instrumento }],
  handleChangeCheckbox: jest.fn(),
  valueCheckbox: {
    tag: true,
    numeroUltimoCertificado: true,
  },
  error: false,
  setError: jest.fn(),
  selection: { mode: 'manual', ids: [1] },
  selectedCount: 1,
  selectionDisabled: false,
  assets: { count: 1, results: [instrumento] },
  handleCheckboxSelectAll: jest.fn(),
  assetFilterForm: {
    register: jest.fn(() => ({})),
    reset: jest.fn(),
    setValue: jest.fn(),
    watch: jest.fn((name) => (name === 'status' ? 'all' : '')),
  },
  isFetchingAssets: false,
  page: 0,
  rowsPerPage: 25,
  handleChangePage: jest.fn(),
  handleChangeRowsPerPage: jest.fn(),
  handleRowSelect: jest.fn(),
};

function ExportFilterHarness() {
  const [valueCheckbox, setValueCheckbox] = useState({
    tag: true,
    numeroUltimoCertificado: false,
  });

  return (
    <ExportFilter
      {...defaultProps}
      valueCheckbox={valueCheckbox}
      handleChangeCheckbox={(event) => {
        const { name, checked } = event.target;
        setValueCheckbox((current) => ({ ...current, [name]: checked }));
      }}
    />
  );
}

describe('ExportFilter - número do último certificado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    axios.post.mockResolvedValue({ status: 200, data: 'TAG\nINST-1' });
    mockReadString.mockImplementation((csvContent, { complete }) => {
      const [headerLine, ...dataLines] = csvContent.trim().split('\n');
      const headers = headerLine.split(',');
      const data = dataLines.map((line) => Object.fromEntries(
        line.split(',').map((value, index) => [headers[index], value])
      ));
      complete({ data, errors: [] });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exibe a opção e adiciona a coluna quando ela é selecionada', async () => {
    const user = userEvent.setup();
    render(<ExportFilterHarness />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'Número do último certificado',
    });
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByRole('columnheader', {
      name: 'Número do último certificado',
    })).not.toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByRole('columnheader', {
      name: 'Número do último certificado',
    })).toBeInTheDocument();
    expect(screen.getByText('CERT-100')).toBeInTheDocument();
  });

  it('envia o campo selecionado para a exportação', async () => {
    const user = userEvent.setup();
    render(<ExportFilter {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/instrumentos/exportar/', {
        requestId: expect.any(String),
        selection: { mode: 'manual', ids: [1] },
        camposSelecionados: ['tag', 'numeroUltimoCertificado'],
      });
    });
  });

  it('envia o snapshot dos filtros em all_filtered', async () => {
    const user = userEvent.setup();
    const filtersSnapshot = {
      search: 'termometro',
      status: 'expired',
      date_start: null,
      date_stop: null,
      filter_by_date: false,
      norma: 'ISO 9001',
    };
    render(
      <ExportFilter
        {...defaultProps}
        selection={{
          mode: 'all_filtered',
          filtersSnapshot,
          matchedCount: 458,
          selectedCount: 458,
        }}
        selectedCount={458}
        assets={{ count: 458, results: [instrumento] }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/instrumentos/exportar/', {
        requestId: expect.any(String),
        selection: { mode: 'all_filtered', filters: filtersSnapshot },
        camposSelecionados: ['tag', 'numeroUltimoCertificado'],
      });
    });
  });

  it('encerra o loading e mantém o erro visível quando a exportação falha', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error('falha de rede'));
    render(<ExportFilter {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Exportar' }));

    expect(await screen.findByText(
      'Não foi possível exportar os instrumentos. Tente novamente.'
    )).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeEnabled();
    consoleError.mockRestore();
  });

  it('não dispara duas exportações simultâneas', async () => {
    const user = userEvent.setup();
    let resolveExport;
    axios.post.mockReturnValueOnce(new Promise((resolve) => {
      resolveExport = resolve;
    }));
    render(<ExportFilter {...defaultProps} />);

    const exportButton = screen.getByRole('button', { name: 'Exportar' });
    await user.dblClick(exportButton);

    expect(axios.post).toHaveBeenCalledTimes(1);

    resolveExport({ status: 200, data: 'TAG\nINST-1' });
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  it('resposta 202 inicia polling e termina em completed', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    axios.post.mockResolvedValueOnce({
      status: 202,
      data: {
        jobId: 'job-1',
        status: 'queued',
        matchedCount: 458,
        exportedCount: 458,
        limitApplied: false,
        statusUrl: '/instrumentos/exportacoes/job-1/',
      },
    });
    axios.get
      .mockResolvedValueOnce({
        data: {
          jobId: 'job-1',
          status: 'processing',
          matchedCount: 458,
          exportedCount: 458,
          limitApplied: false,
          statusUrl: '/instrumentos/exportacoes/job-1/',
        },
      })
      .mockResolvedValueOnce({
        data: {
          jobId: 'job-1',
          status: 'completed',
          matchedCount: 458,
          exportedCount: 458,
          limitApplied: false,
          statusUrl: '/instrumentos/exportacoes/job-1/',
          downloadUrl: '/instrumentos/exportacoes/job-1/download/',
        },
      });
    render(<ExportFilter {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(await screen.findByText('Preparando relatório de 458 instrumentos...')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    expect(axios.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    expect(await screen.findByRole('button', { name: 'Baixar relatório' })).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(window.sessionStorage.getItem('instrument-export-job')).toBeNull();
    });

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it.each([
    ['failed', 'Não foi possível gerar o relatório.'],
    ['expired', 'Este relatório expirou. Solicite uma nova exportação.'],
  ])('encerra polling quando o job fica %s', async (jobStatus, expectedMessage) => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    axios.post.mockResolvedValueOnce({
      status: 202,
      data: {
        jobId: 'job-terminal',
        status: 'queued',
        matchedCount: 12000,
        exportedCount: 9999,
        limitApplied: true,
        statusUrl: '/instrumentos/exportacoes/job-terminal/',
      },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        jobId: 'job-terminal',
        status: jobStatus,
        matchedCount: 12000,
        exportedCount: 9999,
        limitApplied: true,
        statusUrl: '/instrumentos/exportacoes/job-terminal/',
        error: jobStatus === 'failed' ? expectedMessage : undefined,
      },
    });
    render(<ExportFilter {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(await screen.findByText(/Preparando relatório de 9\.999 instrumentos/)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    await waitFor(() => {
      expect(window.sessionStorage.getItem('instrument-export-job')).toBeNull();
    });
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it.each(['completed', 'failed', 'expired'])(
    'não restaura job %s persistido de uma sessão anterior',
    (jobStatus) => {
      window.sessionStorage.setItem('instrument-export-job', JSON.stringify({
        jobId: 'job-antigo',
        status: jobStatus,
        statusUrl: '/instrumentos/exportacoes/job-antigo/',
      }));

      render(<ExportFilter {...defaultProps} />);

      expect(window.sessionStorage.getItem('instrument-export-job')).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument();
    }
  );

  it.each(['queued', 'processing'])(
    'restaura job ativo %s de uma sessão anterior',
    (jobStatus) => {
      const storedJob = {
        jobId: `job-${jobStatus}`,
        status: jobStatus,
        matchedCount: 4,
        exportedCount: 4,
        statusUrl: `/instrumentos/exportacoes/job-${jobStatus}/`,
      };
      window.sessionStorage.setItem(
        'instrument-export-job',
        JSON.stringify(storedJob)
      );

      render(<ExportFilter {...defaultProps} />);

      expect(screen.getByText('Preparando relatório de 4 instrumentos...')).toBeInTheDocument();
      expect(JSON.parse(
        window.sessionStorage.getItem('instrument-export-job')
      )).toEqual(storedJob);
    }
  );

  it('fecha completed, preserva seleção e usa novo request_id na próxima exportação', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const filtersSnapshot = {
      search: '',
      status: 'all',
      date_start: null,
      date_stop: null,
      filter_by_date: false,
      norma: '',
    };
    axios.post
      .mockResolvedValueOnce({
        status: 202,
        data: {
          jobId: 'job-concluido',
          status: 'queued',
          matchedCount: 4,
          exportedCount: 4,
          limitApplied: false,
          statusUrl: '/instrumentos/exportacoes/job-concluido/',
        },
      })
      .mockResolvedValueOnce({
        status: 202,
        data: {
          jobId: 'job-novo',
          status: 'queued',
          matchedCount: 4,
          exportedCount: 4,
          limitApplied: false,
          statusUrl: '/instrumentos/exportacoes/job-novo/',
        },
      });
    axios.get.mockResolvedValueOnce({
      data: {
        jobId: 'job-concluido',
        status: 'completed',
        matchedCount: 4,
        exportedCount: 4,
        limitApplied: false,
        statusUrl: '/instrumentos/exportacoes/job-concluido/',
        downloadUrl: '/instrumentos/exportacoes/job-concluido/download/',
      },
    });
    render(
      <ExportFilter
        {...defaultProps}
        selection={{
          mode: 'all_filtered',
          filtersSnapshot,
          matchedCount: 4,
          selectedCount: 4,
        }}
        selectedCount={4}
        assets={{ count: 4, results: [instrumento] }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    const firstRequestId = axios.post.mock.calls[0][1].requestId;
    expect(await screen.findByText(
      'Preparando relatório de 4 instrumentos...'
    )).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    expect(await screen.findByRole('button', { name: 'Baixar relatório' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(defaultProps.handleClose).toHaveBeenCalled();
    expect(window.sessionStorage.getItem('instrument-export-job')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
    expect(axios.post.mock.calls[1][1]).toMatchObject({
      selection: { mode: 'all_filtered', filters: filtersSnapshot },
    });
    expect(axios.post.mock.calls[1][1].requestId).not.toEqual(firstRequestId);
    await waitFor(() => {
      expect(JSON.parse(
        window.sessionStorage.getItem('instrument-export-job')
      )?.jobId).toBe('job-novo');
    });
    jest.useRealTimers();
  });

  it('encerra polling e limpa job restaurado quando ele não existe mais', async () => {
    jest.useFakeTimers();
    window.sessionStorage.setItem('instrument-export-job', JSON.stringify({
      jobId: 'job-inexistente',
      status: 'queued',
      matchedCount: 4,
      exportedCount: 4,
      statusUrl: '/instrumentos/exportacoes/job-inexistente/',
    }));
    axios.get.mockRejectedValueOnce({ response: { status: 404 } });
    render(<ExportFilter {...defaultProps} />);

    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });

    expect(await screen.findByText(
      'Este relatório expirou. Solicite uma nova exportação.'
    )).toBeInTheDocument();
    await waitFor(() => {
      expect(window.sessionStorage.getItem('instrument-export-job')).toBeNull();
    });
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('baixa o arquivo concluído pelo endpoint autenticado', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    window.URL.createObjectURL = jest.fn(() => 'blob:export');
    window.URL.revokeObjectURL = jest.fn();
    axios.post.mockResolvedValueOnce({
      status: 202,
      data: {
        jobId: 'job-download',
        status: 'queued',
        matchedCount: 101,
        exportedCount: 101,
        limitApplied: false,
        statusUrl: '/instrumentos/exportacoes/job-download/',
      },
    });
    axios.get
      .mockResolvedValueOnce({
        data: {
          jobId: 'job-download',
          status: 'completed',
          matchedCount: 101,
          exportedCount: 101,
          limitApplied: false,
          statusUrl: '/instrumentos/exportacoes/job-download/',
          downloadUrl: '/instrumentos/exportacoes/job-download/download/',
        },
      })
      .mockResolvedValueOnce({ data: new Blob(['csv']) });
    render(<ExportFilter {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(await screen.findByText('Preparando relatório de 101 instrumentos...')).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    await user.click(await screen.findByRole('button', { name: 'Baixar relatório' }));

    expect(axios.get).toHaveBeenLastCalledWith(
      '/instrumentos/exportacoes/job-download/download/',
      { responseType: 'blob' }
    );
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:export');
    jest.useRealTimers();
  });

  it('imprime todas as linhas do CSV sem limitar pela página visual', async () => {
    const user = userEvent.setup();
    const csvRows = Array.from(
      { length: 60 },
      (_, index) => `INST-${index + 1}`
    );
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: `TAG\n${csvRows.join('\n')}`,
    });
    render(
      <ExportFilter
        {...defaultProps}
        assets={{ count: 60, results: [instrumento] }}
        rowsPerPage={25}
      />
    );

    expect(screen.getByText('1–25 de 60')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Exportar' }));

    expect(await screen.findByText('INST-60')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(61);
    expect(screen.queryByText('1–25 de 60')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(mockPrint).toHaveBeenCalledTimes(1);
  });

  it('imprime somente os instrumentos presentes no relatório da seleção manual', async () => {
    const user = userEvent.setup();
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: 'TAG\nINST-SELECIONADO',
    });
    render(
      <ExportFilter
        {...defaultProps}
        assets={{
          count: 2,
          results: [
            instrumento,
            { id: 2, tag: 'INST-NAO-SELECIONADO' },
          ],
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Exportar' }));

    expect(await screen.findByText('INST-SELECIONADO')).toBeInTheDocument();
    expect(screen.queryByText('INST-NAO-SELECIONADO')).not.toBeInTheDocument();
  });

  it('busca o CSV autenticado e imprime todos os resultados de all_filtered', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const filtersSnapshot = {
      search: '',
      status: 'all',
      date_start: null,
      date_stop: null,
      filter_by_date: false,
      norma: '',
    };
    const csvRows = Array.from(
      { length: 30 },
      (_, index) => `FILTRADO-${index + 1}`
    );
    axios.post.mockResolvedValueOnce({
      status: 202,
      data: {
        jobId: 'job-print',
        status: 'queued',
        matchedCount: 30,
        exportedCount: 30,
        limitApplied: false,
        statusUrl: '/instrumentos/exportacoes/job-print/',
      },
    });
    axios.get
      .mockResolvedValueOnce({
        data: {
          jobId: 'job-print',
          status: 'completed',
          matchedCount: 30,
          exportedCount: 30,
          limitApplied: false,
          statusUrl: '/instrumentos/exportacoes/job-print/',
          downloadUrl: '/instrumentos/exportacoes/job-print/download/',
        },
      })
      .mockResolvedValueOnce({ data: `TAG\n${csvRows.join('\n')}` });
    render(
      <ExportFilter
        {...defaultProps}
        selection={{
          mode: 'all_filtered',
          filtersSnapshot,
          matchedCount: 30,
          selectedCount: 30,
        }}
        selected={[]}
        selectedCount={30}
        assets={{ count: 30, results: [instrumento] }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(await screen.findByText('Preparando relatório de 30 instrumentos...')).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    await user.click(await screen.findByRole('button', { name: 'Imprimir relatório' }));

    expect(axios.get).toHaveBeenLastCalledWith(
      '/instrumentos/exportacoes/job-print/download/',
      { responseType: 'text' }
    );
    expect(await screen.findByText('FILTRADO-30')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(31);
    await waitFor(() => expect(mockPrint).toHaveBeenCalledTimes(1));
    jest.useRealTimers();
  });
});
