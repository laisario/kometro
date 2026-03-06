import React from 'react';
import {
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Box,
} from '@mui/material';
import OrdemServicoRow from './OrdemServicoRow';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';

function OSTable({
  ordensServico,
  isLoading,
  onRowClick,
  onUpdate,
  title,
  emptyMessage,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  defaultRowsPerPage = 10,
}) {
  const isMobile = useResponsive('down', 'sm');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);

  // Paginated OS data
  const paginatedOS = React.useMemo(() => {
    if (!ordensServico) return [];
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return ordensServico.slice(start, end);
  }, [ordensServico, page, rowsPerPage]);

  const hasOS = ordensServico && ordensServico.length > 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!hasOS) {
    return (
      <EmptyYet
        content="os"
        isMobile={isMobile}
        showKaka={false}
        customMessage={emptyMessage}
      />
    );
  }
  return (
    <Card>
      {title && <CardHeader sx={{ pb: 2 }} title={title} />}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2">OS</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Cliente</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Expiração</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Tipo</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Liberada para faturamento</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOS.map((os) => (
              <OrdemServicoRow
                key={os.id}
                os={os}
                onViewDetails={onRowClick}
                onUpdate={onUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={ordensServico?.length || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por página"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
        }
      />
    </Card>
  );
}

export default OSTable;
