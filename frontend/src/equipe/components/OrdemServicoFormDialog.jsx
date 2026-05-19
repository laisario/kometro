import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';
import useUsers from '../../auth/hooks/useUsers';
import useAuth from '../../auth/hooks/useAuth';
import useResponsive from '../../theme/hooks/useResponsive';
import ClientAutocomplete from '../../proposals/components/ClientAutocomplete';

// Helper to get layout key from tipoOs
const getOsLayoutKey = (tipoOs) => {
  if (!tipoOs) return 'calibracao';
  const tipoMap = {
    'CAL': 'calibracao',
    'BAL': 'balancas',
    'MAN': 'manutencao',
    'EXT': 'externa',
    'TV': 'visitaTecnica',
  };
  return tipoMap[tipoOs] || 'calibracao';
};

// Field configuration by OS type
const OS_FORM_FIELDS_BY_TYPE = {
  calibracao: {
    fields: [
      'responsavel',
      'dataExpiracao',
      'dataRecebimentoInstrumentos',
      'dataLiberacaoInstrumentos',
    ],
  },
  balancas: {
    fields: [
      'responsavel',
      'dataExpiracao',
      'dataRecebimentoInstrumentos',
      'dataLiberacaoInstrumentos',
    ],
  },
  manutencao: {
    fields: [
      'responsavel',
      'dataExpiracao',
      'dataLiberacaoInstrumentos',
      'osRecebimentoDosInstruementos',
    ],
  },
  externa: {
    fields: [
      'responsavel',
      'dataExpiracao',
      'dataCalibracaoInstrumentos',
      'dataLiberacaoCalibracao',
    ],
  },
  visitaTecnica: {
    fields: [
      'responsavel',
      'dataExpiracao',
      'descricao',
    ],
  },
};

// Field labels
const FIELD_LABELS = {
  responsavel: 'Responsável',
  dataExpiracao: 'Data de Expiração',
  dataRecebimentoInstrumentos: 'Data de Recebimento dos Instrumentos',
  dataLiberacaoInstrumentos: 'Data de Liberação dos Instrumentos',
  dataCalibracaoInstrumentos: 'Data de Calibração dos Instrumentos',
  dataLiberacaoCalibracao: 'Data de Liberação da Calibração',
  osRecebimentoDosInstruementos: 'OS de Recebimento dos Instrumentos',
  descricao: 'Descrição',
};

function OrdemServicoFormDialog({ open, onClose, mode = 'edit', os, defaultTipoOs, onSaved }) {
  const isMobile = useResponsive('down', 'sm');
  const { user } = useAuth();
  const { users, isLoadingUsers } = useUsers(null, { isStaff: true });
  const {
    mutateUpdateOSAsync,
    isLoadingUpdateOS,
    mutateCreateOS,
    isLoadingCreateOS,
  } = useOrdemServicoMutations();

  const form = useForm({
    defaultValues: {
      tipoOs: defaultTipoOs || (mode === 'edit' && os?.tipoOs ? os.tipoOs : 'CAL'),
      cliente: null,
      responsavel: null,
      dataExpiracao: null,
      dataRecebimentoInstrumentos: null,
      dataLiberacaoInstrumentos: null,
      dataCalibracaoInstrumentos: null,
      dataLiberacaoCalibracao: null,
      descricao: '',
    },
  });

  const isLoading = isLoadingUpdateOS || isLoadingCreateOS;

  // Determine layout key and visible fields
  const tipoOs = form.watch('tipoOs') || (mode === 'edit' && os?.tipoOs ? os.tipoOs : 'CAL');
  const layoutKey = useMemo(() => getOsLayoutKey(tipoOs), [tipoOs]);
  const visibleFields = useMemo(
    () => OS_FORM_FIELDS_BY_TYPE[layoutKey]?.fields || OS_FORM_FIELDS_BY_TYPE.calibracao.fields,
    [layoutKey]
  );

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === 'edit' && os && open && users) {
      const user = os.responsavel && users?.find((u) => u.id === os.responsavel);
      form.reset({
        tipoOs: os.tipoOs || 'CAL',
        cliente: null,
        responsavel: user || null,
        dataExpiracao: os.dataExpiracao ? dayjs(os.dataExpiracao) : null,
        dataRecebimentoInstrumentos: os.dataRecebimentoInstrumentos
          ? dayjs(os.dataRecebimentoInstrumentos)
          : null,
        dataLiberacaoInstrumentos: os.dataLiberacaoInstrumentos
          ? dayjs(os.dataLiberacaoInstrumentos)
          : null,
        dataCalibracaoInstrumentos: os.dataCalibracaoInstrumentos
          ? dayjs(os.dataCalibracaoInstrumentos)
          : null,
        dataLiberacaoCalibracao: os.dataLiberacaoCalibracao
          ? dayjs(os.dataLiberacaoCalibracao)
          : null,
        osRecebimentoDosInstruementos: os.osRecebimentoDosInstruementos || '',
        descricao: os.descricao || '',
      });
    } else if (mode === 'create' && open) {
      form.reset({
        tipoOs: 'TV',
        cliente: null,
        responsavel: null,
        dataExpiracao: null,
        dataRecebimentoInstrumentos: null,
        dataLiberacaoInstrumentos: null,
        dataCalibracaoInstrumentos: null,
        dataLiberacaoCalibracao: null,
        osRecebimentoDosInstruementos: '',
        descricao: '',
      });
    }
  }, [mode, os, open, form, defaultTipoOs, users]);

  const handleSubmit = (data) => {
    // Validate required fields for create mode
    if (mode === 'create' && !data.cliente?.id) {
      enqueueSnackbar('Por favor, selecione um cliente para criar a OS manualmente.', {
        variant: 'warning',
        autoHideDuration: 4000,
      });
      return;
    }
    const payload = {};

    // Only include visible fields that have values
    if (visibleFields.includes('responsavel') && data.responsavel?.id) {
      payload.responsavel = data.responsavel.id;
    }
    if (visibleFields.includes('dataExpiracao') && data.dataExpiracao) {
      payload.dataExpiracao = dayjs(data.dataExpiracao).format('YYYY-MM-DD');
    }
    if (visibleFields.includes('dataRecebimentoInstrumentos') && data.dataRecebimentoInstrumentos) {
      payload.dataRecebimentoInstrumentos = dayjs(data.dataRecebimentoInstrumentos).format(
        'YYYY-MM-DD'
      );
    }
    if (visibleFields.includes('dataLiberacaoInstrumentos') && data.dataLiberacaoInstrumentos) {
      payload.dataLiberacaoInstrumentos = dayjs(data.dataLiberacaoInstrumentos).format('YYYY-MM-DD');
    }
    if (visibleFields.includes('dataCalibracaoInstrumentos') && data.dataCalibracaoInstrumentos) {
      payload.dataCalibracaoInstrumentos = dayjs(data.dataCalibracaoInstrumentos).format(
        'YYYY-MM-DD'
      );
    }
    if (visibleFields.includes('dataLiberacaoCalibracao') && data.dataLiberacaoCalibracao) {
      payload.dataLiberacaoCalibracao = dayjs(data.dataLiberacaoCalibracao).format('YYYY-MM-DD');
    }
    if (visibleFields.includes('osRecebimentoDosInstruementos') && data.osRecebimentoDosInstruementos) {
        payload.osRecebimentoDosInstruementos = data.osRecebimentoDosInstruementos;
    }
    if (visibleFields.includes('descricao') && data.descricao) {
      payload.descricao = data.descricao.trim();
    }

    if (mode === 'edit' && os?.id) {
      mutateUpdateOSAsync({ id: os.id, data: payload })
        .then(() => {
          onSaved?.();
          onClose();
        })
        .catch(() => {
          // Error handling is done in the mutation hook
        });
    } else if (mode === 'create') {
      // Include cliente for manual OS creation (required when no proposta)
      if (data.cliente?.id) {
        payload.cliente = data.cliente.id;
      }
      mutateCreateOS(payload, {
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
      });
    }
  };

  const responsavelValue = form.watch('responsavel');
  const userOptions = users || [];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        PaperProps={{
          component: 'form',
          onSubmit: form.handleSubmit(handleSubmit),
        }}
      >
        <DialogTitle>
          {mode === 'edit' ? 'Editar Ordem de Serviço' : 'Criar Visita Técnica'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {/* Cliente - Only in create mode */}
            {mode === 'create' && (
              <ClientAutocomplete
                user={user}
                value={form.watch('cliente')}
                onChange={(event, newValue) => {
                  form.setValue('cliente', newValue);
                }}
                required
                helperText="O cliente é obrigatório para criação manual de OS"
              />
            )}

            {visibleFields.includes('descricao') && (
              <TextField
                label={FIELD_LABELS.descricao}
                placeholder="Descreva o objetivo da visita técnica"
                fullWidth
                multiline
                minRows={3}
                {...form.register('descricao')}
              />
            )}

            {/* Responsável */}
            {visibleFields.includes('responsavel') && (
              <Autocomplete
                options={userOptions}
                value={responsavelValue}
                onChange={(event, newValue) => {
                  form.setValue('responsavel', newValue);
                }}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'object' && option.id) {
                    const fullName = `${option.first_name || ''} ${option.last_name || ''}`.trim();
                    return fullName || option.username || '';
                  }
                  return '';
                }}
                isOptionEqualToValue={(option, value) => {
                  if (!option || !value) return false;
                  return option.id === (value?.id || value);
                }}
                loading={isLoadingUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={FIELD_LABELS.responsavel}
                    placeholder="Selecione um responsável"
                  />
                )}
              />
            )}

            {/* Data de Expiração */}
            {visibleFields.includes('dataExpiracao') && (
              <DatePicker
                label={FIELD_LABELS.dataExpiracao}
                value={form.watch('dataExpiracao')}
                onChange={(newValue) => form.setValue('dataExpiracao', newValue)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                  },
                }}
              />
            )}

            {/* Data de Recebimento dos Instrumentos */}
            {visibleFields.includes('dataRecebimentoInstrumentos') && (
              <DatePicker
                label={FIELD_LABELS.dataRecebimentoInstrumentos}
                value={form.watch('dataRecebimentoInstrumentos')}
                onChange={(newValue) =>
                  form.setValue('dataRecebimentoInstrumentos', newValue)
                }
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                  },
                }}
              />
            )}

            {/* Data de Liberação dos Instrumentos */}
            {visibleFields.includes('dataLiberacaoInstrumentos') && (
              <DatePicker
                label={FIELD_LABELS.dataLiberacaoInstrumentos}
                value={form.watch('dataLiberacaoInstrumentos')}
                onChange={(newValue) => form.setValue('dataLiberacaoInstrumentos', newValue)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                  },
                }}
              />
            )}

            {/* Data de Calibração dos Instrumentos */}
            {visibleFields.includes('dataCalibracaoInstrumentos') && (
              <DatePicker
                label={FIELD_LABELS.dataCalibracaoInstrumentos}
                value={form.watch('dataCalibracaoInstrumentos')}
                onChange={(newValue) => form.setValue('dataCalibracaoInstrumentos', newValue)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                  },
                }}
              />
            )}

            {/* Data de Liberação da Calibração */}
            {visibleFields.includes('dataLiberacaoCalibracao') && (
              <DatePicker
                label={FIELD_LABELS.dataLiberacaoCalibracao}
                value={form.watch('dataLiberacaoCalibracao')}
                onChange={(newValue) => form.setValue('dataLiberacaoCalibracao', newValue)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                  },
                }}
              />
            )}

            {/* OS de Recebimento dos Instrumentos */}
            {visibleFields.includes('osRecebimentoDosInstruementos') && (
              <TextField
                label={FIELD_LABELS.osRecebimentoDosInstruementos}
                value={form.watch('osRecebimentoDosInstruementos')}
                onChange={(e) => form.setValue('osRecebimentoDosInstruementos', e.target.value)}
                fullWidth
                variant="outlined"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? (
              <CircularProgress size={20} />
            ) : mode === 'edit' ? (
              'Salvar'
            ) : (
              'Criar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

export default OrdemServicoFormDialog;
