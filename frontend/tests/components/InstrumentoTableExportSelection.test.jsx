import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstrumentoTable from '../../src/assets/components/InstrumentoTable';
import { MAX_EXPORT_ITEMS } from '../../src/assets/constants';

const defaultProps = {
  csvContent: null,
  selectAll: false,
  instrumentos: [{ id: 1, tag: 'INST-1' }],
  valueCheckbox: { tag: true },
  selected: [],
  handleCheckboxSelectAll: jest.fn(),
  handleRowSelect: jest.fn(),
  isSelectingAll: false,
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

  it('deriva o checkbox da linha pelos IDs realmente selecionados', () => {
    render(<InstrumentoTable {...defaultProps} selectAll />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('mantém a seleção individual funcionando', async () => {
    const user = userEvent.setup();
    const handleRowSelect = jest.fn();
    render(<InstrumentoTable {...defaultProps} handleRowSelect={handleRowSelect} />);

    await user.click(screen.getAllByRole('checkbox')[1]);

    expect(handleRowSelect).toHaveBeenCalledWith(1, expect.objectContaining({ id: 1 }));
  });

  it('mostra o limite quando existem mais de 9999 resultados', () => {
    const selected = Array.from({ length: MAX_EXPORT_ITEMS }, (_, index) => ({
      id: index + 1,
      instrumento: { id: index + 1 },
    }));
    render(
      <InstrumentoTable
        {...defaultProps}
        selectAll
        selected={selected}
        count={12345}
      />
    );

    expect(screen.getByText(
      '9.999 de 12.345 resultados selecionados — limite de exportação'
    )).toBeInTheDocument();
  });

  it('exibe loading e desabilita a ação durante a consulta', () => {
    render(<InstrumentoTable {...defaultProps} isSelectingAll />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Selecionar todos os resultados').closest('label')).toHaveClass('Mui-disabled');
  });

  it('exibe a tooltip com o limite de exportação', async () => {
    const user = userEvent.setup();
    render(<InstrumentoTable {...defaultProps} />);

    await user.hover(screen.getByRole('button', { name: 'Limite de exportação' }));

    expect(await screen.findByText(
      'É possível exportar até 9.999 instrumentos por vez.'
    )).toBeInTheDocument();
  });
});
