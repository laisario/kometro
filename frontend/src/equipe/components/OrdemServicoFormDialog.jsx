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
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useForm } from 'react-hook-form';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';
import useUsers from '../../auth/hooks/useUsers';
import useResponsive from '../../theme/hooks/useResponsive';

// Helper to get layout key from tipoOs
const getOsLayoutKey = (tipoOs) => {
  if (!tipoOs) return 'calibracao';
  const tipoMap = {
    'CAL': 'calibracao',
    'BAL': 'balancas',
    'MAN': 'manutencao',
    'EXT': 'externa',
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
};

// Field labels
const FIELD_LABELS = {
  responsavel: 'Responsável',
  dataExpiracao: 'Data de Expiração',
  dataRecebimentoInstrumentos: 'Data de Recebimento dos Instrumentos',
  dataLiberacaoInstrumentos: 'Data de Liberação dos Instrumentos',
  dataCalibracaoInstrumentos: 'Data de Calibração dos Instrumentos',
  dataLiberacaoCalibracao: 'Data de Liberação da Calibração',
};

// Tipo OS options for create mode
const TIPO_OS_OPTIONS = [
  { value: 'CAL', label: 'Calibração' },
  { value: 'BAL', label: 'Balanças' },
  { value: 'MAN', label: 'Manutenção' },
  { value: 'EXT', label: 'Externa' },
];

function OrdemServicoFormDialog({ open, onClose, mode = 'edit', os, defaultTipoOs, onSaved }) {
  const isMobile = useResponsive('down', 'sm');
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
      responsavel: null,
      dataExpiracao: null,
      dataRecebimentoInstrumentos: null,
      dataLiberacaoInstrumentos: null,
      dataCalibracaoInstrumentos: null,
      dataLiberacaoCalibracao: null,
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
      });
    } else if (mode === 'create' && open) {
      form.reset({
        tipoOs: defaultTipoOs || 'CAL',
        responsavel: null,
        dataExpiracao: null,
        dataRecebimentoInstrumentos: null,
        dataLiberacaoInstrumentos: null,
        dataCalibracaoInstrumentos: null,
        dataLiberacaoCalibracao: null,
      });
    }
  }, [mode, os, open, form, defaultTipoOs, users]);

  const handleSubmit = (data) => {
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
      // Include tipoOs for create mode
      payload.tipoOs = data.tipoOs;
      // Note: proposta and other required fields should be added here if needed
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
          {mode === 'edit' ? 'Editar Ordem de Serviço' : 'Criar Ordem de Serviço'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {/* Tipo OS - Only in create mode */}
            {mode === 'create' && (
              <TextField
                select
                label="Tipo de OS"
                value={tipoOs}
                onChange={(e) => form.setValue('tipoOs', e.target.value)}
                fullWidth
                variant="outlined"
              >
                {TIPO_OS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
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
