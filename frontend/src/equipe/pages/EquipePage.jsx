import React, { useEffect, useMemo, useState } from 'react';
import { 
  Container, 
  Typography,
  Box,
  Button,
  Grid,
  Skeleton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router';
import useUsers from '../../auth/hooks/useUsers';
import useAuth from '../../auth/hooks/useAuth';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';
import useOrdensServico from '../hooks/useOrdensServico';
import useMyOrdensServico from '../hooks/useMyOrdensServico';
import OrdemServicoDetailsDialog from '../components/OrdemServicoDetailsDialog';
import OrdemServicoFormDialog from '../components/OrdemServicoFormDialog';
import OSSummaryRow from '../components/OSSummaryRow';
import OSTable from '../components/OSTable';
import useOSDetailsDialog from '../hooks/useOSDetailsDialog';

function EquipePage() {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'sm');
  const { isManager, hasCreatePermission, user } = useAuth();
  const { users: staffUsers, isLoadingUsers, errorUsers } = useUsers(null, { isStaff: true });
  
  // Tab state management
  // Default to 'todas' for managers, 'minhas' for non-managers
  const [activeTab, setActiveTab] = useState('todas'); // 'todas' | 'minhas'
  
  // Adjust default tab and prevent non-managers from accessing "Todas"
  // useEffect(() => {
  //   if (user && !isManager && activeTab === 'todas') {
  //     setActiveTab('minhas');
  //   }
  // }, [user, isManager, activeTab]);
  
  // Conditional data fetching based on active tab
  const { 
    ordensServico: todasOS, 
    isLoading: isLoadingTodas, 
    error: errorTodas, 
    refetch: refetchTodas 
  } = useOrdensServico(
    null,
    { fetchAll: true, enabled: activeTab === 'todas' }
  );
  
  const { 
    ordensServico: minhasOS, 
    isLoading: isLoadingMinhas, 
    error: errorMinhas, 
    refetch: refetchMinhas 
  } = useMyOrdensServico({
    enabled: activeTab === 'minhas'
  });
  
  // Use appropriate data based on active tab
  const ordensServico = activeTab === 'todas' ? todasOS : minhasOS;
  const isLoadingOrdensServico = activeTab === 'todas' ? isLoadingTodas : isLoadingMinhas;
  const errorOrdensServico = activeTab === 'todas' ? errorTodas : errorMinhas;
  
  // State management
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const { selectedOS, isOpen, openDialog, closeDialog } = useOSDetailsDialog();

  // Create OS dialog state
  const [isCreateOSOpen, setIsCreateOSOpen] = useState(false);

  // Clear employee selection when switching to "Minhas" tab
  useEffect(() => {
    if (activeTab === 'minhas') {
      setSelectedEmployeeId(null);
    }
  }, [activeTab]);


  // Redirect non-staff users to 404
  // Note: "Todas" tab requires manager, but "Minhas" tab is accessible to all staff
  useEffect(() => {
    if (errorOrdensServico?.response?.status === 403) {
      navigate('/404', { replace: true });
    }
  }, [errorOrdensServico, navigate]);

  // Get selected employee name with username fallback
  const getEmployeeDisplayName = (employee) => {
    if (!employee) return null;
    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    return fullName || employee.username || 'Membro da equipe';
  };

  // Get selected employee name
  const selectedEmployeeName = useMemo(() => {
    if (!selectedEmployeeId || !staffUsers) return null;
    const employee = staffUsers.find(u => u.id === selectedEmployeeId);
    return getEmployeeDisplayName(employee);
  }, [selectedEmployeeId, staffUsers]);

  // Filter OS by selected employee (only in "Todas" tab)
  const filteredOS = useMemo(() => {
    if (!ordensServico) return [];
    
    // In "Minhas" tab, don't apply employee filter (already filtered by API)
    if (activeTab === 'minhas') {
      return ordensServico;
    }
    
    // In "Todas" tab, apply employee filter if selected
    if (selectedEmployeeId) {
      return ordensServico.filter(os => {
        return os.responsavel === selectedEmployeeId || 
               os.responsavelId === selectedEmployeeId ||
               (os.responsavel && typeof os.responsavel === 'object' && os.responsavel.id === selectedEmployeeId);
      });
    }
    
    return ordensServico;
  }, [ordensServico, selectedEmployeeId, activeTab]);

  const hasStaffMembers = useMemo(() => !!staffUsers?.length, [staffUsers]);
  const hasOS = useMemo(() => !!filteredOS?.length, [filteredOS]);

  const handleUpdateOS = () => {
    if (activeTab === 'todas') {
      refetchTodas();
    } else {
      refetchMinhas();
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleEmployeeDeselect = () => {
    setSelectedEmployeeId(null);
  };

  const handleCreateOSOpen = () => {
    setIsCreateOSOpen(true);
  };

  const handleCreateOSClose = () => {
    setIsCreateOSOpen(false);
  };

  const handleOSCreated = () => {
    if (activeTab === 'todas') {
      refetchTodas();
    } else {
      refetchMinhas();
    }
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

  // Allow all staff to access the page
  // "Todas" tab functionality requires manager, but "Minhas" tab is for all staff
  // The backend will enforce permissions for each endpoint

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
        <Box mb={3}>
          <Typography variant="h4" gutterBottom>
            Ordens de Serviço
          </Typography>
        </Box>

        {/* Tabs */}
        <Box mb={3}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {isManager && <Tab label="Todas" value="todas" />}
            <Tab label="Minhas" value="minhas" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {/* Right Side - OS Summary and Table */}
          <Grid item xs={12} md={12}>
            {/* OS Summary Row (Above Table) */}
            {hasOS && (
              <Box mb={3}>
                <OSSummaryRow
                  ordensServico={ordensServico}
                  selectedEmployeeId={activeTab === 'todas' ? selectedEmployeeId : null}
                  selectedEmployeeName={activeTab === 'todas' ? selectedEmployeeName : null}
                  isLoadingOrdensServico={isLoadingOrdensServico}
                />
              </Box>
            )}

            {/* OS Table */}
            <OSTable
              ordensServico={filteredOS}
              isLoading={isLoadingOrdensServico}
              onRowClick={openDialog}
              onUpdate={handleUpdateOS}
              selectable={isManager}
              onDeleted={handleUpdateOS}
              title={
                activeTab === 'minhas' 
                  ? 'Minhas Ordens de Serviço'
                  : selectedEmployeeName 
                    ? `Ordens de serviço - ${selectedEmployeeName}` 
                    : 'Ordens de serviço'
              }
              action={
                <Box display="flex" gap={2} alignItems="center">
                  {activeTab === 'todas' && isManager && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel id="responsavel-filter-label">Responsável</InputLabel>
                      <Select
                        labelId="responsavel-filter-label"
                        value={selectedEmployeeId || ''}
                        label="Responsável"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            handleEmployeeDeselect();
                          } else {
                            handleEmployeeSelect(Number(value));
                          }
                        }}
                        aria-label="Filtrar ordens de serviço por responsável"
                      >
                        <MenuItem value="">
                          <em>Todos os responsáveis</em>
                        </MenuItem>
                        {staffUsers?.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {getEmployeeDisplayName(employee)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {hasCreatePermission && (
                    <Button
                      variant="contained"
                      onClick={handleCreateOSOpen}
                      size="small"
                    >
                      Criar visita técnica
                    </Button>
                  )}
                </Box>
              }
              emptyMessage={
                activeTab === 'minhas'
                  ? 'Você ainda não possui ordens de serviço atribuídas'
                  : undefined
              }
            />
          </Grid>
        </Grid>

        {selectedOS && (
          <OrdemServicoDetailsDialog
            open={isOpen}
            onClose={closeDialog}
            ordemServico={selectedOS}
          />
        )}

        <OrdemServicoFormDialog
          open={isCreateOSOpen}
          onClose={handleCreateOSClose}
          mode="create"
          onSaved={handleOSCreated}
        />
      </Container>
    </>
  );
}

export default EquipePage;
