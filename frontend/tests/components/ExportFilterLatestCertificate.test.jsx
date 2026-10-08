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
  selectAll: false,
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
  isSelectingAll: false,
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
        instrumentosSelecionados: [{ id: 1 }],
        camposSelecionados: ['tag', 'numeroUltimoCertificado'],
      });
    });
  });
});
