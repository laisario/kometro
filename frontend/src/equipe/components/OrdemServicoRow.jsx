import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import InlineResponsavelEditor from './InlineResponsavelEditor';
import InlineExpiracaoEditor from './InlineExpiracaoEditor';

function OrdemServicoRow({ 
  os, 
  onViewDetails, 
  onSelectForAssignment,
  onUpdate,
  isSelected,
  isEditing,
  onEditClick,
  onEditCancel,
}) {
  const handleRowClick = (e) => {
    // Don't trigger if clicking on action buttons or editors
    if (e.target.closest('button') || e.target.closest('.MuiSelect-root') || e.target.closest('.MuiInputBase-root')) {
      return;
    }
    onViewDetails(os);
    if (onSelectForAssignment) {
      onSelectForAssignment(os);
    }
  };

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{ 
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'inherit',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
      }}
    >
      {/* OS Number and Proposta */}
      <TableCell>
        <Typography variant="subtitle2">
          {os.numero || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Proposta {os.propostaNumero || 'N/A'}
        </Typography>
      </TableCell>

      {/* Cliente */}
      <TableCell>
        <Typography 
          variant="body2" 
          sx={{ 
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {os.clienteNome || 'N/A'}
        </Typography>
      </TableCell>

      {/* Responsável */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <InlineResponsavelEditor
          ordemServico={os}
          onUpdate={onUpdate}
        />
      </TableCell>

      {/* Expiração */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <InlineExpiracaoEditor
          ordemServico={os}
          onUpdate={onUpdate}
        />
      </TableCell>

    </TableRow>
  );
}

export default OrdemServicoRow;
