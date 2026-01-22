import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';
import { fDate } from '../../utils/formatTime';

function InlineExpiracaoEditor({ ordemServico, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(
    ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null
  );
  const [originalValue, setOriginalValue] = useState(
    ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null
  );
  const { mutateUpdateOrdemServico, isLoadingUpdate } = useOrdemServicoMutations();

  useEffect(() => {
    const value = ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null;
    setLocalValue(value);
    setOriginalValue(value);
    setIsEditing(false);
  }, [ordemServico]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setLocalValue(originalValue);
    setIsEditing(false);
  };

  const handleConfirm = () => {
    const payload = {
      responsavel: ordemServico?.responsavel || null,
      data_expiracao: localValue ? localValue.format('YYYY-MM-DD') : null,
    };

    mutateUpdateOrdemServico(
      { osId: ordemServico.id, data: payload },
      {
        onSuccess: () => {
          setOriginalValue(localValue);
          setIsEditing(false);
          if (onUpdate) onUpdate();
        },
        onError: () => {
          // Rollback on error
          setLocalValue(originalValue);
        },
      }
    );
  };

  const handleChange = (newValue) => {
    setLocalValue(newValue);
  };

  const isValueChanged = () => {
    if (!localValue && !originalValue) return false;
    if (!localValue || !originalValue) return true;
    return !localValue.isSame(originalValue, 'day');
  };

  const getDisplayBadge = () => {
    if (!ordemServico?.dataExpiracao) {
      return (
        <Chip
          label="Sem expiração"
          size="small"
          variant="outlined"
          color="default"
        />
      );
    }

    const dataExp = new Date(ordemServico.dataExpiracao);
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);

    let color = 'default';
    if (dataExp < hoje) {
      color = 'error'; // Vencida
    } else if (dataExp <= em7Dias) {
      color = 'warning'; // A vencer
    } else {
      color = 'success'; // Em dia
    }

    return (
      <Chip
        label={fDate(ordemServico.dataExpiracao, 'dd/MM/yyyy')}
        size="small"
        color={color}
        variant="outlined"
      />
    );
  };

  if (isEditing) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Box display="flex" alignItems="center" gap={1}>
          <Box position="relative" sx={{ minWidth: 150 }}>
            <DatePicker
              value={localValue}
              onChange={handleChange}
              disabled={isLoadingUpdate}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'Sem expiração',
                  sx: { fontSize: '0.875rem' },
                },
              }}
            />
          </Box>
          <IconButton
            size="small"
            color="primary"
            onClick={handleConfirm}
            disabled={isLoadingUpdate || !isValueChanged()}
          >
            {isLoadingUpdate ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            color="secondary"
            onClick={handleCancel}
            disabled={isLoadingUpdate}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </LocalizationProvider>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {getDisplayBadge()}
      <IconButton size="small" onClick={handleEdit} disabled={isLoadingUpdate}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default InlineExpiracaoEditor;
