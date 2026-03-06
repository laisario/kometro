import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

const TIPO_OS_LABELS = {
  'CAL': 'Calibração',
  'BAL': 'Balanças',
  'MAN': 'Manutenção',
  'EXT': 'Serviços Externos',
};

const OS_TYPES = [
  { value: 'CAL', label: 'Calibração' },
  { value: 'BAL', label: 'Balanças' },
  { value: 'MAN', label: 'Manutenção' },
  { value: 'EXT', label: 'Serviços Externos' },
];

function CreateNewOSDialog({
  open,
  onClose,
  selectedInstruments,
  originOsType,
  loading,
  onConfirm,
}) {
  const [selectedOsType, setSelectedOsType] = useState(originOsType || '');

  useEffect(() => {
    // Reset to origin type when dialog opens
    if (open) {
      setSelectedOsType(originOsType || '');
    }
  }, [open, originOsType]);

  const handleConfirm = () => {
    if (selectedOsType) {
      onConfirm(selectedOsType);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Gerar nova OS e mover instrumentos</DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
            Instrumentos selecionados ({selectedInstruments?.length || 0}):
          </Typography>
          <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', mb: 3 }}>
            {selectedInstruments?.map((item, index) => (
              <ListItem key={item.instrumento?.id || index}>
                <ListItemText
                  primary={item.instrumento?.tag || `Instrumento ${index + 1}`}
                  secondary={
                    item.instrumento?.instrumento?.tipoDeInstrumento?.descricao ||
                    'Sem descrição'
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Tipo de OS</InputLabel>
            <Select
              value={selectedOsType}
              onChange={(e) => setSelectedOsType(e.target.value)}
              label="Tipo de OS"
              disabled={loading}
            >
              {OS_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            A nova OS será criada com o tipo selecionado ({TIPO_OS_LABELS[selectedOsType] || selectedOsType}) e pertencerá à mesma proposta.
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Após a confirmação, os instrumentos selecionados serão movidos para a nova OS e removidos desta OS.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || !selectedOsType}
        >
          {loading ? 'Criando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateNewOSDialog;
