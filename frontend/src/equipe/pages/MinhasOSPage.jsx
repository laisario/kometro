import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  Skeleton,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router';
import useMyOrdensServico from '../hooks/useMyOrdensServico';
import useAuth from '../../auth/hooks/useAuth';
import useResponsive from '../../theme/hooks/useResponsive';
import OSSummaryRow from '../components/OSSummaryRow';
import OSTable from '../components/OSTable';
import OrdemServicoDetailsDialog from '../components/OrdemServicoDetailsDialog';
import useOSDetailsDialog from '../hooks/useOSDetailsDialog';

function MinhasOSPage() {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'sm');
  const { user } = useAuth();
  const { ordensServico, isLoadingOrdensServico, errorOrdensServico, refetch } = useMyOrdensServico();
  const { selectedOS, isOpen, openDialog, closeDialog } = useOSDetailsDialog();

  // Redirect non-staff users to 404
  useEffect(() => {
    if (errorOrdensServico?.response?.status === 403) {
      navigate('/404', { replace: true });
    }
  }, [errorOrdensServico, navigate]);

  // Show loading while checking permissions or fetching data
  if (!user || isLoadingOrdensServico) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" gap={2} minHeight="400px" pt={3}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="rectangular" width="100%" height={400} />
        </Box>
      </Container>
    );
  }

  // Show error state
  if (errorOrdensServico && errorOrdensServico?.response?.status !== 403) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} minHeight="400px" justifyContent="center">
          <Typography variant="h6" color="error">
            Erro ao carregar ordens de serviço
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </Box>
      </Container>
    );
  }

  const hasOS = ordensServico && ordensServico.length > 0;

  const handleUpdateOS = () => {
    refetch();
  };

  return (
    <>
      <Helmet>
        <title> Minhas Ordens de Serviço | Kometro </title>
      </Helmet>
      <Container>
        <Box mb={3}>
          <Typography variant="h4" gutterBottom>
            Minhas Ordens de Serviço
          </Typography>
        </Box>

        {/* OS Summary Row (Above Table) */}
        {hasOS && (
          <Box mb={3}>
            <OSSummaryRow
              ordensServico={ordensServico}
              selectedEmployeeId={null}
              selectedEmployeeName={null}
              isLoadingOrdensServico={isLoadingOrdensServico}
            />
          </Box>
        )}

        {/* OS Table */}
        <OSTable
          ordensServico={ordensServico}
          isLoading={isLoadingOrdensServico}
          onRowClick={openDialog}
          onUpdate={handleUpdateOS}
          title="Minhas Ordens de Serviço"
          emptyMessage="Você ainda não possui ordens de serviço atribuídas"
        />

        {/* OS Details Dialog */}
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

export default MinhasOSPage;
