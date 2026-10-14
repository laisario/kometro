import { render, screen } from '@testing-library/react';
import InstrumentExportReport, {
  INSTRUMENT_EXPORT_PRINT_PAGE_STYLE,
} from '../../src/assets/components/InstrumentExportReport';

describe('InstrumentExportReport', () => {
  it('renderiza todas as linhas do relatório sem paginação visual', () => {
    const rows = Array.from({ length: 60 }, (_, index) => ({
      TAG: `INST-${index + 1}`,
      Setor: `Setor ${index + 1}`,
    }));

    render(<InstrumentExportReport rows={rows} />);

    expect(screen.getAllByRole('row')).toHaveLength(61);
    expect(screen.getByText('INST-1')).toBeInTheDocument();
    expect(screen.getByText('INST-60')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('não limita o conteúdo por altura ou overflow e configura quebra de páginas', () => {
    render(<InstrumentExportReport rows={[{ TAG: 'INST-1' }]} />);

    expect(screen.getByTestId('instrument-export-print')).toHaveStyle({
      height: 'auto',
      maxHeight: 'none',
      overflow: 'visible',
    });
    expect(screen.getByTestId('instrument-export-print-table-container')).toHaveStyle({
      height: 'auto',
      maxHeight: 'none',
      overflow: 'visible',
    });
    expect(INSTRUMENT_EXPORT_PRINT_PAGE_STYLE).toContain('display: table-header-group');
    expect(INSTRUMENT_EXPORT_PRINT_PAGE_STYLE).toContain('break-inside: avoid');
    expect(INSTRUMENT_EXPORT_PRINT_PAGE_STYLE).toContain('overflow: visible !important');
  });
});
