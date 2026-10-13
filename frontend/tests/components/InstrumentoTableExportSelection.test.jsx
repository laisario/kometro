import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstrumentoTable from '../../src/assets/components/InstrumentoTable';
import { MAX_EXPORT_ITEMS } from '../../src/assets/constants';

const defaultProps = {
  csvContent: null,
  instrumentos: [{ id: 1, tag: 'INST-1' }],
  valueCheckbox: { tag: true },
  selected: [],
  selectionMode: 'manual',
  selectedIds: [],
  selectedCount: 0,
  handleCheckboxSelectAll: jest.fn(),
  handleRowSelect: jest.fn(),
  selectionDisabled: false,
  page: 0,
  rowsPerPage: 25,
  handleChangePage: jest.fn(),
  handleChangeRowsPerPage: jest.fn(),
  count: 1,
};

describe('InstrumentoTable - seleção para exportação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deriva os checkboxes visíveis do modo all_filtered', () => {
    render(
      <InstrumentoTable
        {...defaultProps}
        selectionMode="all_filtered"
        selectedCount={1}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[1]).toBeDisabled();
  });

  it('mantém a seleção individual funcionando', async () => {
    const user = userEvent.setup();
    const handleRowSelect = jest.fn();
    render(<InstrumentoTable {...defaultProps} handleRowSelect={handleRowSelect} />);

    await user.click(screen.getAllByRole('checkbox')[1]);

    expect(handleRowSelect).toHaveBeenCalledWith(1, expect.objectContaining({ id: 1 }));
  });

  it('mostra o limite quando existem mais de 9999 resultados', () => {
    render(
      <InstrumentoTable
        {...defaultProps}
        selectionMode="all_filtered"
        selectedCount={MAX_EXPORT_ITEMS}
        count={12345}
      />
    );

    expect(screen.getByText(
      '9.999 de 12.345 resultados selecionados — limite de exportação'
    )).toBeInTheDocument();
    expect(screen.getByText('1–25 de 12345')).toBeInTheDocument();
  });

  it('desabilita a seleção total enquanto os filtros estão pendentes', () => {
    render(<InstrumentoTable {...defaultProps} selectionDisabled />);

    expect(screen.getByText('Selecionar todos os 1 resultados').closest('label')).toHaveClass('Mui-disabled');
  });

  it('oferece somente 25, 50 e 100 linhas por página', async () => {
    const user = userEvent.setup();
    render(<InstrumentoTable {...defaultProps} count={458} />);

    expect(screen.getByText('1–25 de 458')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '10' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Todos' })).not.toBeInTheDocument();
  });

  it('exibe a tooltip com o limite de exportação', async () => {
    const user = userEvent.setup();
    render(<InstrumentoTable {...defaultProps} />);

    await user.hover(screen.getByRole('button', { name: 'Limite de exportação' }));

    expect(await screen.findByText(
      'É possível exportar até 9.999 instrumentos por vez.'
    )).toBeInTheDocument();
  });

  it('exibe o número do último certificado retornado pela API', () => {
    render(
      <InstrumentoTable
        {...defaultProps}
        instrumentos={[{
          id: 1,
          numeroUltimoCertificado: 'CERT-100, CERT-101',
        }]}
        valueCheckbox={{ numeroUltimoCertificado: true }}
      />
    );

    expect(screen.getByRole('columnheader', {
      name: 'Número do último certificado',
    })).toBeInTheDocument();
    expect(screen.getByText('CERT-100, CERT-101')).toBeInTheDocument();
  });

  it('mantém a tabela funcional quando não há último certificado', () => {
    render(
      <InstrumentoTable
        {...defaultProps}
        instrumentos={[{ id: 1, numeroUltimoCertificado: null }]}
        valueCheckbox={{ numeroUltimoCertificado: true }}
      />
    );

    expect(screen.getByRole('columnheader', {
      name: 'Número do último certificado',
    })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
