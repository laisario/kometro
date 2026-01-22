import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useMyOrdensServico from '../hooks/useMyOrdensServico';
import useOrdemServico from '../hooks/useOrdemServico';
import useAuth from '../../auth/hooks/useAuth';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';

function OSCard({ os }) {
  const [open, setOpen] = useState(false);
  const { ordemServico, isLoadingOrdemServico } = useOrdemServico(os.id, { enabled: open });

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="subtitle2">
            {os.numero || 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {os.propostaNumero || 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {os.clienteNome || 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {os.instrumentosCount || 0} instrumento(s)
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {os.dataExpiracao ? fDate(os.dataExpiracao, "dd/MM/yyyy") : 'Sem prazo'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              {isLoadingOrdemServico ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : ordemServico?.instrumentos?.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Instrumentos:
                  </Typography>
                  {ordemServico.instrumentos.map((instrumento) => {
                    const tag = instrumento.tag || 'Sem tag';
                    const numeroCertificado = instrumento.numeroCertificado || 'N/A';
                    return (
                      <Chip
                        key={instrumento.id}
                        label={`${tag} - ${numeroCertificado}`}
                        sx={{ mr: 1, mb: 1 }}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sem instrumentos
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function MinhasOSPage() {
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'sm');
  const { user } = useAuth();
  const { ordensServico, isLoadingOrdensServico, errorOrdensServico } = useMyOrdensServico();

  // Show loading while checking permissions or fetching data
  if (!user || isLoadingOrdensServico) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error state
  if (errorOrdensServico) {
    // If 403, redirect to 404 (non-staff user)
    if (errorOrdensServico?.response?.status === 403) {
      navigate('/404', { replace: true });
      return null;
    }
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

        {hasOS ? (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell><Typography variant="subtitle2">Número</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Proposta</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Cliente</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Instrumentos</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Data de Expiração</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordensServico.map((os) => (
                    <OSCard key={os.id} os={os} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ) : (
          <EmptyYet
            content="os"
            isMobile={isMobile}
            showKaka={false}
            customMessage="Você ainda não possui ordens de serviço atribuídas"
          />
        )}
      </Container>
    </>
  );
}

export default MinhasOSPage;
