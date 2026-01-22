import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useForm } from 'react-hook-form';
import useUsers from '../../auth/hooks/useUsers';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';
import useResponsive from '../../theme/hooks/useResponsive';

function EditOSDialog({ open, onClose, ordemServico }) {
  const isMobile = useResponsive('down', 'sm');
  const { users: staffUsers, isLoadingUsers } = useUsers(null, { isStaff: true });
  const { mutateUpdateOrdemServico, isLoadingUpdate } = useOrdemServicoMutations();

  const form = useForm({
    defaultValues: {
      responsavel: ordemServico?.responsavel || null,
      dataExpiracao: ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null,
    }
  });

  useEffect(() => {
    if (ordemServico) {
      form.reset({
        responsavel: ordemServico.responsavel || null,
        dataExpiracao: ordemServico.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null,
      });
    }
  }, [ordemServico, form]);

  const handleSubmit = (data) => {
    const payload = {
      responsavel: data.responsavel || null,
      data_expiracao: data.dataExpiracao ? data.dataExpiracao.format('YYYY-MM-DD') : null,
    };

    mutateUpdateOrdemServico(
      { osId: ordemServico.id, data: payload },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>Editar Ordem de Serviço</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel id="responsavel-label">Responsável</InputLabel>
              <Select
                labelId="responsavel-label"
                id="responsavel"
                label="Responsável"
                {...form.register("responsavel")}
                value={form.watch("responsavel") || ''}
                onChange={(e) => form.setValue("responsavel", e.target.value)}
                disabled={isLoadingUsers || isLoadingUpdate}
              >
                {isLoadingUsers ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : (
                  staffUsers?.map((user) => {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    const displayName = fullName || user.email || 'Sem nome';
                    return (
                      <MenuItem key={user.id} value={user.id}>
                        {displayName} - {user.email || user.username}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>

            <DatePicker
              label="Data de Expiração"
              value={form.watch("dataExpiracao")}
              onChange={(newValue) => form.setValue("dataExpiracao", newValue)}
              disabled={isLoadingUpdate}
              slotProps={{
                textField: {
                  fullWidth: true,
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
            <Button onClick={onClose} color="secondary" disabled={isLoadingUpdate}>
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              variant="contained"
              color="primary"
              disabled={isLoadingUpdate}
            >
              {isLoadingUpdate ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default EditOSDialog;
