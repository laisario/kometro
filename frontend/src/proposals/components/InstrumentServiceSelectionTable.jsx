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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Component to display and edit instrument service selections
 * 
 * @param {Object} props
 * @param {Array<Object>} props.instruments - Array of selected instruments with selections
 * @param {Function} props.onChange - Callback when selections change: (updatedInstruments) => void
 * @param {Function} props.onRemove - Callback when instrument is removed: (instrumentId) => void
 * @param {Object} props.errors - Validation errors
 */
function InstrumentServiceSelectionTable({ instruments, onChange, onRemove, errors }) {
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
      inst?.id === instrumentId 
        ? { ...inst, local: value }
        : inst
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
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {instruments.map((instrument) => {
            // Get selections from the instrument object itself
            const serviceKind = instrument.service_kind || 'calibracao';
            const local = instrument.local || 'P';
            const instrumentErrors = errors?.[instrument.id] || {};
            const tipoServico = instrument?.instrumento?.tipoDeInstrumento?.tipoDeServico;
            console.log(instrument);
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
                      <MenuItem value="C">Cliente</MenuItem>
                      <MenuItem value="P">Instalações Permanentes</MenuItem>
                      <MenuItem value="T">Terceirizado</MenuItem>
                    </Select>
                    {instrumentErrors.local && (
                      <Typography variant="caption" color="error">
                        {instrumentErrors.local}
                      </Typography>
                    )}
                  </FormControl>
                </TableCell>
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
