import { Button, Dialog, DialogContent, DialogTitle, DialogActions, Box, Typography } from '@mui/material'
import React, { useState } from 'react'
import VirtualizedInstrumentAutocomplete from './VirtualizedInstrumentAutocomplete';
import InstrumentServiceSelectionTable from './InstrumentServiceSelectionTable';

function FormAddInstrument(props) {
  const { 
    open, 
    handleClose, 
    data, 
    addInstrumentProposal,
    isLoadingAdd,
  } = props;
  const [instruments, setInstruments] = useState([])

  const handleInstrumentChange = (event, newValue) => {
    // Transform to new format with default selections
    const formattedInstruments = newValue?.map(inst => ({
      id: inst.id,
      service_kind: 'calibracao', // default
      local: 'P', // default
      ...inst, // Keep original instrument data
    })) || [];
    setInstruments(formattedInstruments);
  };

  const handleServiceSelectionChange = (updatedInstruments) => {
    setInstruments(updatedInstruments);
  };

  const handleRemoveInstrument = (instrumentId) => {
    const updated = instruments.filter(inst => inst.id !== instrumentId);
    setInstruments(updated);
  };

  const submit = async () => {
    // Validate that all instruments have service_kind and local
    const validInstruments = instruments.every(inst => 
      inst.service_kind && ['calibracao', 'manutencao'].includes(inst.service_kind) &&
      inst.local && ['P', 'C', 'T'].includes(inst.local)
    );

    if (!validInstruments) {
      // This should not happen if InstrumentServiceSelectionTable is working correctly
      console.error('Invalid instrument data');
      return;
    }

    addInstrumentProposal(instruments);
    setInstruments([]);
    handleClose();
  };

  const handleCancel = () => {
    setInstruments([]);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
      <DialogTitle>Adicionar outro instrumento:</DialogTitle>
      <DialogContent>
        <VirtualizedInstrumentAutocomplete
          clientId={data?.cliente?.id}
          value={instruments}
          onChange={handleInstrumentChange}
          label="Instrumentos"
          placeholder="Pesquisar instrumento"
          sx={{ my: 2 }}
        />
        
        {instruments && instruments.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Configurar serviços para cada instrumento:
            </Typography>
            <InstrumentServiceSelectionTable
              instruments={instruments}
              onChange={handleServiceSelectionChange}
              onRemove={handleRemoveInstrument}
              errors={{}}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isLoadingAdd}>
          Cancelar
        </Button>
        <Button 
          onClick={submit} 
          variant="contained"
          disabled={isLoadingAdd || instruments.length === 0}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormAddInstrument