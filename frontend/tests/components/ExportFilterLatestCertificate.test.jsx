import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axios } from '../../src/api';
import ExportFilter from '../../src/assets/components/ExportFilter';

jest.mock('../../src/api', () => ({
  axios: {
    post: jest.fn(),
  },
}));

jest.mock('react-papaparse', () => ({
  readString: jest.fn(),
  useCSVDownloader: () => ({
    CSVDownloader: ({ children }) => children,
  }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: () => jest.fn(),
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
    axios.post.mockResolvedValue({ status: 200, data: 'TAG\nINST-1' });
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
});
