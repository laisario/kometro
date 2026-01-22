import React, { useState, useEffect } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useUsers from '../../auth/hooks/useUsers';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';

function ResponsavelSelect({ ordemServico, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(ordemServico?.responsavel || '');
  const [originalValue, setOriginalValue] = useState(ordemServico?.responsavel || '');
  const { users: staffUsers, isLoadingUsers } = useUsers(null, { isStaff: true });
  const { mutateUpdateOrdemServico, isLoadingUpdate } = useOrdemServicoMutations();

  useEffect(() => {
    const value = ordemServico?.responsavel || '';
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
      responsavel: localValue || null,
      data_expiracao: ordemServico?.dataExpiracao || null,
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

  const handleChange = (event) => {
    setLocalValue(event.target.value);
  };

  const getDisplayName = (userId) => {
    if (!userId) return 'Não atribuído';
    const user = staffUsers?.find(u => u.id === userId);
    if (!user) return 'Não atribuído';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'Sem nome';
  };

  if (isEditing) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={localValue || ''}
            onChange={handleChange}
            disabled={isLoadingUsers || isLoadingUpdate}
            displayEmpty
            sx={{ fontSize: '0.875rem' }}
          >
            <MenuItem value="">
              <em>Não atribuído</em>
            </MenuItem>
            {isLoadingUsers ? (
              <MenuItem disabled>
                <CircularProgress size={16} />
              </MenuItem>
            ) : (
              staffUsers?.map((user) => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const displayName = fullName || user.email || 'Sem nome';
                return (
                  <MenuItem key={user.id} value={user.id}>
                    {displayName}
                  </MenuItem>
                );
              })
            )}
          </Select>
        </FormControl>
        <IconButton
          size="small"
          color="primary"
          onClick={handleConfirm}
          disabled={isLoadingUpdate || localValue === originalValue}
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
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" sx={{ minWidth: 150 }}>
        {getDisplayName(ordemServico?.responsavel)}
      </Typography>
      <IconButton size="small" onClick={handleEdit} disabled={isLoadingUpdate}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default ResponsavelSelect;
