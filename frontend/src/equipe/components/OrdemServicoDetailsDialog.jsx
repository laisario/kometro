import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import useOrdemServico from '../hooks/useOrdemServico';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';

function OrdemServicoDetailsDialog({ open, onClose, ordemServico }) {
  const isMobile = useResponsive('down', 'sm');
  const { ordemServico: osDetails, isLoadingOrdemServico, errorOrdemServico } = useOrdemServico(
    ordemServico?.id,
    { enabled: open && !!ordemServico?.id }
  );
  console.log(osDetails, "OS DETAILS")

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle>Detalhes da Ordem de Serviço</DialogTitle>
      <DialogContent>
        {isLoadingOrdemServico ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : errorOrdemServico ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={3}>
            <Typography variant="body1" color="error">
              Erro ao carregar detalhes da ordem de serviço
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </Box>
        ) : osDetails ? (
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Número
              </Typography>
              <Typography variant="body1">
                {osDetails.numero || 'N/A'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Proposta
              </Typography>
              <Typography variant="body1">
                {osDetails.propostaNumero || 'N/A'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Cliente
              </Typography>
              <Typography variant="body1">
                {osDetails.clienteNome || 'N/A'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Responsável
              </Typography>
              <Typography variant="body1">
                {osDetails.responsavelNome || 'Não atribuído'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Data de Expiração
              </Typography>
              <Typography variant="body1">
                {osDetails.dataExpiracao ? fDate(osDetails.dataExpiracao, 'dd/MM/yyyy') : 'Sem expiração'}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Instrumentos
              </Typography>
              {osDetails.instrumentos && osDetails.instrumentos.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {osDetails.instrumentos.map((instrumento) => {
                    const tag = instrumento.tag || 'Sem tag';
                    const descricao = instrumento.instrumento?.tipoDeInstrumento?.descricao || 'N/A';
                    const numeroCertificado = instrumento.numeroCertificado || 'N/A';
                    return (
                      <Chip
                        key={instrumento.id}
                        label={`${tag} - ${numeroCertificado}${descricao !== 'N/A' ? ` (${descricao})` : ''}`}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum instrumento associado
                </Typography>
              )}
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OrdemServicoDetailsDialog;
