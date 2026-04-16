import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Typography,
  Box,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/** Suggested price: alternative first, else catalog by local. T -> null. */
export function getSuggestedPreco(instrument, local) {
  if (local === 'T') return null;
  if (instrument?.precoAlternativoCalibracao != null) return Number(instrument.precoAlternativoCalibracao);
  const inst = instrument?.instrumento;
  if (!inst) return null;
  const p = local === 'C' ? inst.precoCalibracaoNoCliente : inst.precoCalibracaoNoLaboratorio;
  return p != null ? Number(p) : 0;
}

/**
 * Component to display and edit instrument service selections
 * 
 * @param {Object} props
 * @param {Array<Object>} props.instruments - Array of selected instruments with selections
 * @param {Function} props.onChange - Callback when selections change: (updatedInstruments) => void
 * @param {Function} props.onRemove - Callback when instrument is removed: (instrumentId) => void
 * @param {Object} props.errors - Validation errors
 * @param {boolean} props.showPreco - When true, show editable price column
 */
function InstrumentServiceSelectionTable({ instruments, onChange, onRemove, errors, showPreco = false }) {
  const handleServiceKindChange = (instrumentId, value) => {
    const updated = instruments?.map(inst => 
      inst?.id === instrumentId 
        ? { ...inst, service_kind: value }
        : inst
    );
    onChange(updated);
  };

  const handleLocalChange = (instrumentId, value) => {
    const updated = instruments?.map(inst =>
      inst?.id === instrumentId ? { ...inst, local: value } : inst
    );
    onChange(updated);
  };

  const handlePrecoChange = (instrumentId, value) => {
    const num = value === '' || value == null ? null : Number(value);
    const updated = instruments?.map(inst =>
      inst?.id === instrumentId ? { ...inst, preco: isNaN(num) ? inst.preco : num } : inst
    );
    onChange(updated);
  };

  const handleTipoDeServicoChange = (instrumentId, value) => {
    const updated = instruments?.map(inst =>
      inst?.id === instrumentId ? { ...inst, tipoDeServico: value || null } : inst
    );
    onChange(updated);
  };

  if (!instruments || instruments?.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2, mb: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Instrumento</TableCell>
            <TableCell>Tipo de Serviço</TableCell>
            <TableCell>Local</TableCell>
            <TableCell>Tipo</TableCell>
            {showPreco && <TableCell align="right">Preço (R$)</TableCell>}
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {instruments.map((instrument) => {
            const serviceKind = instrument.service_kind || 'calibracao';
            const local = instrument.local || 'P';
            const displayPreco = instrument.preco != null ? instrument.preco : '';
            const instrumentErrors = errors?.[instrument.id] || {};
            const tipoServico = instrument?.instrumento?.tipoDeInstrumento?.tipoDeServico;
            return (
              <TableRow key={instrument.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {instrument.tag || `ID: ${instrument.id}`}
                    </Typography>
                    {instrument.numeroDeSerie && (
                      <Typography variant="caption" color="text.secondary">
                        N/S: {instrument.numeroDeSerie}
                      </Typography>
                    )}
                    {instrument.instrumento?.tipoDeInstrumento?.descricao && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {instrument.instrumento.tipoDeInstrumento.descricao}
                      </Typography>
                    )}
                    {tipoServico && (
                      <Typography variant="caption" color="primary" display="block">
                        Tipo: {tipoServico === 'A' ? 'Acreditado' : 'Não Acreditado'}
                      </Typography>
                    )}
                    {showPreco && (instrument.precoAlternativoCalibracao ?? instrument.preco_alternativo_calibracao) != null && (
                      <Typography variant="caption" color="info.main" display="block" sx={{ mt: 0.5 }}>
                        Preço alternativo: R$ {instrument.precoAlternativoCalibracao ?? instrument.preco_alternativo_calibracao}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small" error={!!instrumentErrors.service_kind}>
                    <RadioGroup
                      row
                      value={serviceKind}
                      onChange={(e) => handleServiceKindChange(instrument?.id, e.target.value)}
                    >
                      <FormControlLabel 
                        value="calibracao" 
                        control={<Radio size="small" />} 
                        label="Calibração" 
                      />
                      <FormControlLabel 
                        value="manutencao" 
                        control={<Radio size="small" />} 
                        label="Manutenção" 
                      />
                    </RadioGroup>
                    {instrumentErrors.service_kind && (
                      <Typography variant="caption" color="error">
                        {instrumentErrors.service_kind}
                      </Typography>
                    )}
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small" error={!!instrumentErrors.local}>
                    <Select
                      value={local}
                      onChange={(e) => handleLocalChange(instrument.id, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="C">Cliente {showPreco && (`- R$ ${instrument.instrumento?.precoCalibracaoNoCliente}` || 0)}</MenuItem>
                      <MenuItem value="P">Instalações Permanentes {showPreco && (`- R$ ${instrument.instrumento?.precoCalibracaoNoLaboratorio}` || 0)}</MenuItem>
                      <MenuItem value="T">Terceirizado</MenuItem>
                    </Select>
                    {instrumentErrors.local && (
                      <Typography variant="caption" color="error">
                        {instrumentErrors.local}
                      </Typography>
                    )}
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={instrument.tipoDeServico || ''}
                      onChange={(e) => handleTipoDeServicoChange(instrument.id, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value=""><em>Não definido</em></MenuItem>
                      <MenuItem value="A">Acreditado</MenuItem>
                      <MenuItem value="NA">Não acreditado</MenuItem>
                      <MenuItem value="I">Interno</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                {showPreco && (
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={displayPreco}
                      onChange={(e) => handlePrecoChange(instrument.id, e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                )}
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => onRemove(instrument.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default InstrumentServiceSelectionTable;
