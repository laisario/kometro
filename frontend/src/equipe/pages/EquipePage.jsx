import React, { useEffect, useMemo, useState } from 'react';
import { 
  Container, 
  Typography,
  Box,
  Button,
  Grid,
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
import EmployeeListCard from '../components/EmployeeListCard';
import OSSummaryRow from '../components/OSSummaryRow';
import OSTable from '../components/OSTable';
import useOSDetailsDialog from '../hooks/useOSDetailsDialog';

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const { selectedOS, isOpen, openDialog, closeDialog } = useOSDetailsDialog();


  // Redirect non-managers to 404
  useEffect(() => {
    if (user && !isManager) {
      navigate('/404', { replace: true });
    }
  }, [user, isManager, navigate]);

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

  // Filter OS by selected employee
  const filteredOS = useMemo(() => {
    if (!ordensServico) return [];
    
    if (selectedEmployeeId) {
      return ordensServico.filter(os => {
        return os.responsavel === selectedEmployeeId || 
               os.responsavelId === selectedEmployeeId ||
               (os.responsavel && typeof os.responsavel === 'object' && os.responsavel.id === selectedEmployeeId);
      });
    }
    
    return ordensServico;
  }, [ordensServico, selectedEmployeeId]);

  const hasStaffMembers = useMemo(() => !!staffUsers?.length, [staffUsers]);
  const hasOS = useMemo(() => !!filteredOS?.length, [filteredOS]);

  const handleUpdateOS = () => {
    refetch();
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleEmployeeDeselect = () => {
    setSelectedEmployeeId(null);
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
        <Grid container spacing={3}>
          {/* Left Side - Employee List Card */}
          {hasStaffMembers && (
            <Grid item xs={12} md={4}>
              <EmployeeListCard
                staffUsers={staffUsers}
                selectedEmployeeId={selectedEmployeeId}
                onEmployeeSelect={handleEmployeeSelect}
                onEmployeeDeselect={handleEmployeeDeselect}
                isLoadingUsers={isLoadingUsers}
                isLoadingOrdensServico={isLoadingOrdensServico}
              />
            </Grid>
          )}

          {/* Right Side - OS Summary and Table */}
          <Grid item xs={12} md={hasStaffMembers ? 8 : 12}>
            {/* OS Summary Row (Above Table) */}
            {hasOS && (
              <Box mb={3}>
                <OSSummaryRow
                  ordensServico={ordensServico}
                  selectedEmployeeId={selectedEmployeeId}
                  selectedEmployeeName={selectedEmployeeName}
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
              title={selectedEmployeeName ? `Ordens de serviço - ${selectedEmployeeName}` : 'Ordens de serviço'}
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
      </Container>
    </>
  );
}

export default EquipePage;
