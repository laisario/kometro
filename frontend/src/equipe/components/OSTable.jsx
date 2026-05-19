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
  Checkbox,
  Toolbar,
  Tooltip,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import OrdemServicoRow from './OrdemServicoRow';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';
import ConfirmDeleteDialog from '../../assets/components/ConfirmDeleteDialog';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';

function OSTable({
  ordensServico,
  isLoading,
  onRowClick,
  onUpdate,
  title,
  action,
  emptyMessage,
  rowsPerPageOptions = [5, 10, 25, 50, 100],
  defaultRowsPerPage = 10,
  selectable = false,
  onDeleted,
}) {
  const isMobile = useResponsive('down', 'sm');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const [selectedOSIds, setSelectedOSIds] = React.useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const { mutateDeleteOS, isLoadingDeleteOS } = useOrdemServicoMutations();

  // Paginated OS data
  const paginatedOS = React.useMemo(() => {
    if (!ordensServico) return [];
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return ordensServico.slice(start, end);
  }, [ordensServico, page, rowsPerPage]);

  const hasOS = ordensServico && ordensServico.length > 0;
  const visibleOSIds = React.useMemo(
    () => paginatedOS.map((os) => os.id).filter(Boolean),
    [paginatedOS]
  );
  const selectedVisibleCount = visibleOSIds.filter((id) => selectedOSIds.includes(id)).length;
  const allVisibleSelected = visibleOSIds.length > 0 && selectedVisibleCount === visibleOSIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleOSIds.length;

  React.useEffect(() => {
    const existingIds = new Set((ordensServico || []).map((os) => os.id));
    setSelectedOSIds((previous) => previous.filter((id) => existingIds.has(id)));
  }, [ordensServico]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllVisible = (event) => {
    if (event.target.checked) {
      setSelectedOSIds((previous) => Array.from(new Set([...previous, ...visibleOSIds])));
      return;
    }
    setSelectedOSIds((previous) => previous.filter((id) => !visibleOSIds.includes(id)));
  };

  const handleSelectOS = (id) => {
    setSelectedOSIds((previous) => (
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id]
    ));
  };

  const handleConfirmDelete = () => {
    mutateDeleteOS(selectedOSIds, {
      onSuccess: () => {
        setSelectedOSIds([]);
        setDeleteDialogOpen(false);
        onDeleted?.();
      },
    });
  };

  if (!hasOS && !isLoading) {
    return (
      <EmptyYet
        content="os"
        isMobile={isMobile}
        showKaka={true}
        table={true}
      />
    );
  }
  return (
    <Card>
      {title && (
        <CardHeader
          sx={{ pb: 2 }}
          title={title}
          action={action}
        />
      )}
      {selectable && selectedOSIds.length > 0 && (
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            px: 2,
            py: 1,
            bgcolor: 'action.selected',
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="subtitle1">
            {selectedOSIds.length > 1
              ? `${selectedOSIds.length} selecionadas`
              : '1 selecionada'}
          </Typography>
          <Tooltip title="Excluir ordens de serviço selecionadas">
            <span>
              <IconButton
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isLoadingDeleteOS}
                aria-label="Excluir ordens de serviço selecionadas"
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Toolbar>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={someVisibleSelected}
                    checked={allVisibleSelected}
                    onChange={handleSelectAllVisible}
                    inputProps={{
                      'aria-label': 'Selecionar todas as ordens de serviço visíveis',
                    }}
                  />
                </TableCell>
              )}
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
                selectable={selectable}
                selected={selectedOSIds.includes(os.id)}
                onSelect={handleSelectOS}
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
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          selectedOSIds.length > 1
            ? `Excluir ${selectedOSIds.length} ordens de serviço?`
            : 'Excluir esta ordem de serviço?'
        }
        message="Essa ação não poderá ser desfeita. As ordens de serviço selecionadas serão removidas permanentemente."
      />
    </Card>
  );
}

export default OSTable;
