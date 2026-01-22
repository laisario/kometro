import React, { useState, useMemo } from 'react';
import {
  Card,
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  CircularProgress,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router';
import useUsers from '../../auth/hooks/useUsers';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';

function EquipeTab({ staffUsers, page, rowsPerPage, onPageChange, onRowsPerPageChange, onNavigate }) {
  const paginatedTeam = useMemo(() => {
    if (!staffUsers) return [];
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return staffUsers.slice(start, end);
  }, [staffUsers, page, rowsPerPage]);

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableBody>
            {paginatedTeam?.map((staffMember) => {
              const fullName = `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim();
              const displayName = fullName || staffMember.email || 'Sem nome';
              
              return (
                <TableRow
                  key={staffMember.id}
                  hover
                  onClick={() => onNavigate(staffMember.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="subtitle2" fontSize="0.875rem">
                      {displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {staffMember.email || staffMember.username}
                    </Typography>
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
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage="Linhas por página"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
        }
      />
    </Box>
  );
}

function AtribuirTab({ selectedOS, staffUsers, onUpdate }) {
  const [responsavel, setResponsavel] = useState(selectedOS?.responsavel || '');
  const [dataExpiracao, setDataExpiracao] = useState(
    selectedOS?.dataExpiracao ? dayjs(selectedOS.dataExpiracao) : null
  );
  const { mutateUpdateOrdemServico, isLoadingUpdate } = useOrdemServicoMutations();

  React.useEffect(() => {
    if (selectedOS) {
      setResponsavel(selectedOS.responsavel || '');
      setDataExpiracao(selectedOS.dataExpiracao ? dayjs(selectedOS.dataExpiracao) : null);
    }
  }, [selectedOS]);

  const handleAssignResponsavel = () => {
    if (!selectedOS) return;
    
    const payload = {
      responsavel: responsavel || null,
      data_expiracao: selectedOS.dataExpiracao || null,
    };

    mutateUpdateOrdemServico(
      { osId: selectedOS.id, data: payload },
      {
        onSuccess: () => {
          if (onUpdate) onUpdate();
        },
      }
    );
  };

  const handleAssignExpiracao = () => {
    if (!selectedOS) return;
    
    const payload = {
      responsavel: selectedOS.responsavel || null,
      data_expiracao: dataExpiracao ? dataExpiracao.format('YYYY-MM-DD') : null,
    };

    mutateUpdateOrdemServico(
      { osId: selectedOS.id, data: payload },
      {
        onSuccess: () => {
          if (onUpdate) onUpdate();
        },
      }
    );
  };

  const handleQuickDate = (days) => {
    const newDate = dayjs().add(days, 'day');
    setDataExpiracao(newDate);
  };

  if (!selectedOS) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Selecione uma OS para atribuir
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box display="flex" flexDirection="column" gap={3} p={2}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            OS Selecionada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedOS.numero || 'N/A'}
          </Typography>
        </Box>

        <Box>
          <FormControl fullWidth size="small">
            <InputLabel>Atribuir Responsável</InputLabel>
            <Select
              value={responsavel || ''}
              onChange={(e) => setResponsavel(e.target.value)}
              label="Atribuir Responsável"
              disabled={isLoadingUpdate}
            >
              <MenuItem value="">
                <em>Não atribuído</em>
              </MenuItem>
              {staffUsers?.map((user) => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const displayName = fullName || user.email || 'Sem nome';
                return (
                  <MenuItem key={user.id} value={user.id}>
                    {displayName}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            onClick={handleAssignResponsavel}
            disabled={isLoadingUpdate || responsavel === (selectedOS.responsavel || '')}
          >
            {isLoadingUpdate ? <CircularProgress size={20} /> : 'Atribuir Responsável'}
          </Button>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Definir Expiração
          </Typography>
          <DatePicker
            value={dataExpiracao}
            onChange={setDataExpiracao}
            disabled={isLoadingUpdate}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                placeholder: 'Sem expiração',
              },
            }}
          />
          <ButtonGroup fullWidth size="small" sx={{ mt: 1 }}>
            <Button onClick={() => handleQuickDate(7)}>+7d</Button>
            <Button onClick={() => handleQuickDate(15)}>+15d</Button>
            <Button onClick={() => handleQuickDate(30)}>+30d</Button>
          </ButtonGroup>
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            onClick={handleAssignExpiracao}
            disabled={isLoadingUpdate}
          >
            {isLoadingUpdate ? <CircularProgress size={20} /> : 'Definir Expiração'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

function EquipeSidebar({ staffUsers, selectedOS, onUpdate }) {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [teamPage, setTeamPage] = useState(0);
  const [teamRowsPerPage, setTeamRowsPerPage] = useState(10);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangeTeamPage = (event, newPage) => {
    setTeamPage(newPage);
  };

  const handleChangeTeamRowsPerPage = (event) => {
    setTeamRowsPerPage(parseInt(event.target.value, 10));
    setTeamPage(0);
  };

  const handleNavigate = (userId) => {
    navigate(`/admin/equipe/${userId}`);
  };

  return (
    <Card>
      <Box>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Equipe" />
          <Tab label="Atribuir" />
        </Tabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {tabValue === 0 ? (
          <EquipeTab
            staffUsers={staffUsers}
            page={teamPage}
            rowsPerPage={teamRowsPerPage}
            onPageChange={handleChangeTeamPage}
            onRowsPerPageChange={handleChangeTeamRowsPerPage}
            onNavigate={handleNavigate}
          />
        ) : (
          <AtribuirTab
            selectedOS={selectedOS}
            staffUsers={staffUsers}
            onUpdate={onUpdate}
          />
        )}
      </Box>
    </Card>
  );
}

export default EquipeSidebar;
