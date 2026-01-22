import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useUsers from '../../auth/hooks/useUsers';
import useOrdemServicoMutations from '../hooks/useOrdemServicoMutations';

function InlineResponsavelEditor({ ordemServico, onUpdate }) {
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

  const getDisplayChip = (userId) => {
    if (!userId) {
      return (
        <Chip
          label="Não atribuído"
          size="small"
          variant="outlined"
          color="default"
        />
      );
    }
    const user = staffUsers?.find(u => u.id === userId);
    if (!user) {
      return (
        <Chip
          label="Não atribuído"
          size="small"
          variant="outlined"
          color="default"
        />
      );
    }
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const displayName = fullName || user.email || 'Sem nome';
    
    // Get initials for avatar
    const initials = fullName
      ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : user.email?.[0]?.toUpperCase() || '?';

    return (
      <Chip
        label={displayName}
        size="small"
        avatar={
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {initials}
          </Box>
        }
      />
    );
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
      {getDisplayChip(ordemServico?.responsavel)}
      <IconButton size="small" onClick={handleEdit} disabled={isLoadingUpdate}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default InlineResponsavelEditor;
