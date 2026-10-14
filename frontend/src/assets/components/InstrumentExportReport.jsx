import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

export const INSTRUMENT_EXPORT_PRINT_PAGE_STYLE = `
  @page {
    size: landscape;
    margin: 10mm;
  }

  @media print {
    html, body {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }

    #instrument-export-print,
    #instrument-export-print .MuiTableContainer-root {
      width: 100% !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }

    #instrument-export-print table {
      width: 100% !important;
      table-layout: auto !important;
    }

    #instrument-export-print thead {
      display: table-header-group;
    }

    #instrument-export-print tfoot {
      display: table-footer-group;
    }

    #instrument-export-print tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    #instrument-export-print th,
    #instrument-export-print td {
      white-space: normal !important;
      overflow-wrap: anywhere;
    }
  }
`;

const InstrumentExportReport = forwardRef(function InstrumentExportReport(
  { rows },
  ref
) {
  const columns = useMemo(
    () => (rows.length ? Object.keys(rows[0]) : []),
    [rows]
  );

  return (
    <Box
      ref={ref}
      id="instrument-export-print"
      data-testid="instrument-export-print"
      sx={{
        width: '100%',
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible',
        bgcolor: 'background.paper',
        p: 2,
      }}
    >
      <Typography variant="h6" component="h1" sx={{ mb: 1 }}>
        Relatório de instrumentos
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {rows.length.toLocaleString('pt-BR')} instrumento{rows.length === 1 ? '' : 's'}
      </Typography>
      <TableContainer
        data-testid="instrument-export-print-table-container"
        sx={{ height: 'auto', maxHeight: 'none', overflow: 'visible' }}
      >
        <Table size="small" aria-label="Relatório de instrumentos" sx={{ width: '100%', tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700 }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {row[column] ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

InstrumentExportReport.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InstrumentExportReport;
