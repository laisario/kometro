import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Chip,
  Checkbox,
} from '@mui/material';
import { fDate } from '../../utils/formatTime';

// Status labels mapping
const STATUS_LABELS = {
  'AR': 'A realizar',
  'a_realizar': 'A realizar',
  'EA': 'Em andamento',
  'em_andamento': 'Em andamento',
  'RE': 'Realizado',
  'realizado': 'Realizado',
  'CA': 'Cancelado',
  'cancelado': 'Cancelado',
};

// Tipo OS labels mapping
const TIPO_OS_LABELS = {
  'CAL': 'Calibração',
  'BAL': 'Balanças',
  'MAN': 'Manutenção',
  'EXT': 'Serviços Externos',
  'TV': 'Visita Técnica',
};

function OrdemServicoRow({ 
  os, 
  onViewDetails, 
  onUpdate,
  selectable = false,
  selected = false,
  onSelect,
}) {
  const handleRowClick = (e) => {
    // Don't trigger if clicking on action buttons or editors
    if (e.target.closest('button') || e.target.closest('.MuiSelect-root') || e.target.closest('.MuiInputBase-root')) {
      return;
    }
    onViewDetails(os);
  };
 
  // Get expiration display
  const getExpirationDisplay = () => {
    if (!os.dataExpiracao) {
      return (
        <Typography variant="body2" color="text.secondary">
          Sem expiração
        </Typography>
      );
    }

    const dataExp = new Date(os.dataExpiracao);
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);

    let color = 'text.secondary';
    if (dataExp < hoje) {
      color = 'error'; // Vencida
    } else if (dataExp <= em7Dias) {
      color = 'warning'; // A vencer
    }

    return (
      <Typography variant="body2" color={color}>
        {fDate(os.dataExpiracao, 'dd/MM/yyyy')}
      </Typography>
    );
  };

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      selected={selected}
      sx={{ 
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {selectable && (
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={selected}
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(os.id);
            }}
            inputProps={{
              'aria-label': `Selecionar ordem de serviço ${os.numero || os.id}`,
            }}
          />
        </TableCell>
      )}

      {/* OS Number */}
      <TableCell>
        <Typography variant="subtitle2">
          {os.numero || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {os.propostaNumero || os.proposta_numero || 'N/A'}
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
          {os.clienteNome || os.cliente_nome || 'N/A'}
        </Typography>
      </TableCell>

      {/* Expiração (Read-only) */}
      <TableCell>
        {getExpirationDisplay()}
      </TableCell>

      {/* Tipo */}
      <TableCell>
        <Chip
          label={TIPO_OS_LABELS[os.tipoOs || os.tipo_os] || os.tipoOs || os.tipo_os || 'N/A'}
          size="small"
          color="default"
          variant="outlined"
        />
      </TableCell>

      {/* Status */}
      <TableCell>
        <Chip
          label={STATUS_LABELS[os.status] || os.status || 'N/A'}
          size="small"
          color={
            os.status === 'AR' || os.status === 'a_realizar' ? 'warning' :
            os.status === 'EA' || os.status === 'em_andamento' ? 'info' :
            os.status === 'RE' || os.status === 'realizado' ? 'success' :
            os.status === 'CA' || os.status === 'cancelado' ? 'error' : 'default'
          }
          variant="outlined"
        />
      </TableCell>

      {/* Liberada para faturamento */}
      <TableCell>
        <Typography variant="body2">
          {os.status === 'RE' || os.status === 'realizado' ? 'Sim' : 'Não'}
        </Typography>
      </TableCell>

    </TableRow>
  );
}

export default OrdemServicoRow;
