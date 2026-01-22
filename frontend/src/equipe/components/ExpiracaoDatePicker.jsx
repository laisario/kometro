import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';

function ExpiracaoDatePicker({ ordemServico, onUpdate }) {
  const [localValue, setLocalValue] = useState(
    ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null
  );
  const { mutateUpdateOrdemServico, isLoadingUpdate } = useOrdemServicoMutations();

  useEffect(() => {
    setLocalValue(ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null);
  }, [ordemServico]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);

    const payload = {
      responsavel: ordemServico?.responsavel || null,
      data_expiracao: newValue ? newValue.format('YYYY-MM-DD') : null,
    };

    mutateUpdateOrdemServico(
      { osId: ordemServico.id, data: payload },
      {
        onSuccess: () => {
          if (onUpdate) onUpdate();
        },
        onError: () => {
          // Rollback on error
          setLocalValue(
            ordemServico?.dataExpiracao ? dayjs(ordemServico.dataExpiracao) : null
          );
        },
      }
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
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
        {isLoadingUpdate && (
          <Box
            position="absolute"
            right={8}
            top="50%"
            sx={{ transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <CircularProgress size={16} />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}

export default ExpiracaoDatePicker;
