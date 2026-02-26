import React, { useMemo } from 'react';
import {
  Card,
  Box,
  Typography,
  Grid,
  CircularProgress,
  CardHeader,
} from '@mui/material';

function OSSummaryRow({ 
  ordensServico, 
  selectedEmployeeId, 
  selectedEmployeeName,
  isLoadingOrdensServico,
}) {
  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    if (!ordensServico) {
      return {
        todos: 0,
        aRealizar: 0,
        emAndamento: 0,
        finalizadas: 0,
      };
    }

    // Filter by selected employee if any
    const filteredOS = selectedEmployeeId
      ? ordensServico.filter(os => {
          return os.responsavel === selectedEmployeeId || 
                 os.responsavelId === selectedEmployeeId ||
                 (os.responsavel && typeof os.responsavel === 'object' && os.responsavel.id === selectedEmployeeId);
        })
      : ordensServico;

    return {
      todos: filteredOS.length,
      aRealizar: filteredOS.filter(os => os.status === 'AR' || os.status === 'a_realizar').length,
      emAndamento: filteredOS.filter(os => os.status === 'EA' || os.status === 'em_andamento').length,
      finalizadas: filteredOS.filter(os => os.status === 'RE' || os.status === 'realizado').length,
    };
  }, [ordensServico, selectedEmployeeId]);

  if (isLoadingOrdensServico) {
    return (
      <Card>
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Estatísticas de status das OS" />
      <Box p={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item display="flex" flexDirection="column" alignItems="center" xs={6} sm={3}>
            <Typography color="info" variant="h6" fontWeight={600}>
              {statusDistribution.todos}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Todos
            </Typography>
          </Grid>
          <Grid item display="flex" flexDirection="column" alignItems="center" xs={6} sm={3}>
            <Typography color="error" variant="h6" fontWeight={600}>
              {statusDistribution.aRealizar}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A realizar
            </Typography>
          </Grid>
          <Grid item display="flex" flexDirection="column" alignItems="center" xs={6} sm={3}>
            <Typography color="warning" variant="h6" fontWeight={600}>
              {statusDistribution.emAndamento}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Em andamento
            </Typography>
          </Grid>
          <Grid item display="flex" flexDirection="column" alignItems="center" xs={6} sm={3}>
            <Typography variant="h6" color="success" fontWeight={600}>
              {statusDistribution.finalizadas}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Finalizadas
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}

export default OSSummaryRow;
