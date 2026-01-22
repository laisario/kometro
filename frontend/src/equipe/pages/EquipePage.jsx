import React, { useEffect, useMemo, useState } from 'react';
import { 
  Card, 
  Container, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead,
  TableRow, 
  Typography,
  CircularProgress,
  Box,
  Button,
  Grid,
  TablePagination,
  Skeleton,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router';
import useUsers from '../../auth/hooks/useUsers';
import useAuth from '../../auth/hooks/useAuth';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';
import useOrdensServico from '../hooks/useOrdensServico';
import OrdemServicoDetailsDialog from '../components/OrdemServicoDetailsDialog';
import OrdensServicoToolbar from '../components/OrdensServicoToolbar';
import OrdemServicoRow from '../components/OrdemServicoRow';
import EquipeSidebar from '../components/EquipeSidebar';

function EquipePage() {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'sm');
  const { isManager, user } = useAuth();
  const { users: staffUsers, isLoadingUsers, errorUsers } = useUsers(null, { isStaff: true });
  const { ordensServico, isLoadingOrdensServico, errorOrdensServico, refetch } = useOrdensServico(
    null,
    { fetchAll: true }
  );
  
  // State management
  const [selectedOS, setSelectedOS] = useState(null);
  const [selectedOSForAssignment, setSelectedOSForAssignment] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    semResponsavel: false,
    semExpiracao: false,
    aVencer: false,
  });

  // Pagination for OS table
  const [osPage, setOsPage] = useState(0);
  const [osRowsPerPage, setOsRowsPerPage] = useState(10);

  // Redirect non-managers to 404
  useEffect(() => {
    if (user && !isManager) {
      navigate('/404', { replace: true });
    }
  }, [user, isManager, navigate]);

  // Filter and search OS
  const filteredOS = useMemo(() => {
    if (!ordensServico) return [];
    
    let filtered = [...ordensServico];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(os => 
        os.numero?.toLowerCase().includes(searchLower) ||
        os.propostaNumero?.toLowerCase().includes(searchLower) ||
        os.clienteNome?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.semResponsavel) {
      filtered = filtered.filter(os => !os.responsavel);
    }
    if (filters.semExpiracao) {
      filtered = filtered.filter(os => !os.dataExpiracao);
    }
    if (filters.aVencer) {
      const hoje = new Date();
      const em7Dias = new Date();
      em7Dias.setDate(hoje.getDate() + 7);
      filtered = filtered.filter(os => {
        if (!os.dataExpiracao) return false;
        const dataExp = new Date(os.dataExpiracao);
        return dataExp >= hoje && dataExp <= em7Dias;
      });
    }

    return filtered;
  }, [ordensServico, search, filters]);

  // Paginated OS data
  const paginatedOS = useMemo(() => {
    if (!filteredOS) return [];
    const start = osPage * osRowsPerPage;
    const end = start + osRowsPerPage;
    return filteredOS.slice(start, end);
  }, [filteredOS, osPage, osRowsPerPage]);

  const hasStaffMembers = useMemo(() => !!staffUsers?.length, [staffUsers]);
  const hasOS = useMemo(() => !!filteredOS?.length, [filteredOS]);

  const handleOSClick = (os) => {
    setSelectedOS(os);
    setDetailsDialogOpen(true);
  };

  const handleOSSelectForAssignment = (os) => {
    setSelectedOSForAssignment(os);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedOS(null);
  };

  const handleUpdateOS = () => {
    refetch();
    // Clear selection after update
    setSelectedOSForAssignment(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setOsPage(0); // Reset to first page on search
  };

  const handleFilterToggle = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
    setOsPage(0); // Reset to first page on filter change
  };

  const handleChangeOsPage = (event, newPage) => {
    setOsPage(newPage);
  };

  const handleChangeOsRowsPerPage = (event) => {
    setOsRowsPerPage(parseInt(event.target.value, 10));
    setOsPage(0);
  };

  if (!user || isLoadingUsers || isLoadingOrdensServico) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" gap={2} minHeight="400px" pt={3}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rectangular" width="100%" height={400} />
        </Box>
      </Container>
    );
  }

  if (!isManager) {
    return null;
  }

  if (errorUsers || errorOrdensServico) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} minHeight="400px" justifyContent="center">
          <Typography variant="h6" color="error">
            {errorOrdensServico ? 'Erro ao carregar ordens de serviço' : 'Erro ao carregar membros da equipe'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> Ordens de Serviço | Kometro </title>
      </Helmet>
      <Container>
        <OrdensServicoToolbar
          search={search}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFilterToggle={handleFilterToggle}
          ordensServico={ordensServico}
          isLoading={isLoadingOrdensServico}
        />

        <Grid container spacing={3}>
          {/* Main Content - OS List */}
          <Grid item xs={12} md={hasStaffMembers ? 8 : 12}>
            {hasOS ? (
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography variant="subtitle2">OS</Typography></TableCell>
                        <TableCell><Typography variant="subtitle2">Cliente</Typography></TableCell>
                        <TableCell><Typography variant="subtitle2">Responsável</Typography></TableCell>
                        <TableCell><Typography variant="subtitle2">Expiração</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOS?.map((os) => (
                        <OrdemServicoRow
                          key={os.id}
                          os={os}
                          onViewDetails={handleOSClick}
                          onSelectForAssignment={handleOSSelectForAssignment}
                          onUpdate={handleUpdateOS}
                          isSelected={selectedOSForAssignment?.id === os.id}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                  component="div"
                  count={filteredOS?.length || 0}
                  rowsPerPage={osRowsPerPage}
                  page={osPage}
                  onPageChange={handleChangeOsPage}
                  onRowsPerPageChange={handleChangeOsRowsPerPage}
                  labelRowsPerPage="Linhas por página"
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                  }
                />
              </Card>
            ) : (
              <EmptyYet 
                content="os" 
                isMobile={isMobile}
                showKaka={false}
              />
            )}
          </Grid>

          {/* Side Panel - Team Members with Tabs */}
          {hasStaffMembers && (
            <Grid item xs={12} md={4}>
              <EquipeSidebar
                staffUsers={staffUsers}
                selectedOS={selectedOSForAssignment}
                onUpdate={handleUpdateOS}
              />
            </Grid>
          )}
        </Grid>

        {selectedOS && (
          <OrdemServicoDetailsDialog
            open={detailsDialogOpen}
            onClose={handleCloseDetailsDialog}
            ordemServico={selectedOS}
          />
        )}
      </Container>
    </>
  );
}

export default EquipePage;
