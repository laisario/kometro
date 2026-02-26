import React, { useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';

function EmployeeListCard({ 
  staffUsers, 
  selectedEmployeeId, 
  onEmployeeSelect,
  onEmployeeDeselect,
  isLoadingUsers,
  isLoadingOrdensServico,
}) {
  const isMobile = useResponsive('down', 'sm');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get employee display name with username fallback
  const getEmployeeDisplayName = (employee) => {
    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    return fullName || employee.username || 'Sem nome';
  };
  
  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    if (!staffUsers) return [];
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return staffUsers.slice(start, end);
  }, [staffUsers, page, rowsPerPage]);

  const handleEmployeeClick = (employeeId) => {
    // Toggle behavior: if already selected, deselect; otherwise select
    if (selectedEmployeeId === employeeId) {
      onEmployeeDeselect();
    } else {
      onEmployeeSelect(employeeId);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoadingUsers || isLoadingOrdensServico) {
    return (
      <Card>
        <CardHeader title="Equipe" />
        <CardContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!staffUsers || staffUsers.length === 0) {
    return (
      <Card>
        <CardHeader title="Equipe" />
        <CardContent>
          <EmptyYet 
            content="membro da equipe" 
            isMobile={isMobile}
            showKaka={false}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader sx={{ pb: 2 }} title="Equipe" />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              {paginatedEmployees.map((employee) => {
                const displayName = getEmployeeDisplayName(employee);
                const isSelected = selectedEmployeeId === employee.id;

                return (
                  <TableRow
                    key={employee.id}
                    hover
                    onClick={() => handleEmployeeClick(employee.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'action.selected' : 'inherit',
                      '&:hover': {
                        bgcolor: isSelected ? 'action.selected' : 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Typography variant="subtitle2" fontSize="0.875rem">
                          {displayName}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={staffUsers?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </CardContent>
    </Card>
  );
}

export default EmployeeListCard;
