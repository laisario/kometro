import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Collapse,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useUsers from '../../auth/hooks/useUsers';
import useOrdensServico from '../hooks/useOrdensServico';
import useOrdemServico from '../hooks/useOrdemServico';
import useAuth from '../../auth/hooks/useAuth';
import EmptyYet from '../../components/EmptyYet';
import useResponsive from '../../theme/hooks/useResponsive';
import { fDate } from '../../utils/formatTime';
import EditOSDialog from '../components/EditOSDialog';

function OSCard({ os, isManager, onEdit }) {
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
            {os.numero}
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
        {isManager && (
          <TableCell>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(os);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isManager ? 7 : 6}>
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
                  {ordemServico.instrumentos.map((instrumento) => (
                    <Chip
                      key={instrumento.id}
                      label={`${instrumento.tag || 'Sem tag'} - ${instrumento.instrumento?.tipoDeInstrumento?.descricao || 'N/A'}`}
                      sx={{ mr: 1, mb: 1 }}
                      size="small"
                    />
                  ))}
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

function EquipeMemberPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isMobile = useResponsive('down', 'sm');
  const { isManager, user } = useAuth();
  const userIdNum = userId ? parseInt(userId, 10) : null;
  const { users: staffMember, isLoadingUsers, errorUsers } = useUsers(userIdNum, { isStaff: true });
  const { ordensServico, isLoadingOrdensServico, errorOrdensServico, refetch } = useOrdensServico(userIdNum);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null);

  // Redirect non-managers to 404
  useEffect(() => {
    if (user && !isManager) {
      navigate('/404', { replace: true });
    }
  }, [user, isManager, navigate]);

  // Redirect if userId is invalid
  useEffect(() => {
    if (user && userId && !userIdNum) {
      navigate('/404', { replace: true });
    }
  }, [user, userId, userIdNum, navigate]);

  // Redirect if staff member not found
  useEffect(() => {
    if (user && !isLoadingUsers && !staffMember && userIdNum) {
      navigate('/404', { replace: true });
    }
  }, [user, isLoadingUsers, staffMember, userIdNum, navigate]);

  const handleEditOS = (os) => {
    setSelectedOS(os);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedOS(null);
    refetch();
  };

  // Show loading while checking permissions or fetching data
  if (!user || isLoadingUsers || isLoadingOrdensServico) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // If not manager, don't render (redirect will happen)
  if (!isManager) {
    return null;
  }

  // If staff member not found, don't render (redirect will happen)
  if (!isLoadingUsers && !staffMember && userIdNum) {
    return null;
  }

  // Show error state
  if (errorUsers || errorOrdensServico) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} minHeight="400px" justifyContent="center">
          <Typography variant="h6" color="error">
            {errorUsers ? 'Erro ao carregar membro da equipe' : 'Erro ao carregar ordens de serviço'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </Box>
      </Container>
    );
  }

  const fullName = staffMember ? `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() : '';
  const displayName = fullName || staffMember?.email || 'Membro da equipe';

  const hasOS = ordensServico && ordensServico.length > 0;

  return (
    <>
      <Helmet>
        <title> {displayName} | Kometro </title>
      </Helmet>
      <Container>
        <Box mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/admin/equipe')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {staffMember?.email}
            </Typography>
          </Box>
        </Box>

        {hasOS ? (
          <Card>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Ordens de Serviço
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableBody>
                  {ordensServico.map((os) => (
                    <OSCard
                      key={os.id}
                      os={os}
                      isManager={isManager}
                      onEdit={handleEditOS}
                    />
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
          />
        )}

        {selectedOS && (
          <EditOSDialog
            open={editDialogOpen}
            onClose={handleCloseEditDialog}
            ordemServico={selectedOS}
          />
        )}
      </Container>
    </>
  );
}

export default EquipeMemberPage;
