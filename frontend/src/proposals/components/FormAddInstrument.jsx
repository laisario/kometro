import { Autocomplete, Button, Checkbox, Dialog, DialogContent, DialogTitle, TextField, Chip, Box } from '@mui/material'
import React, { useState } from 'react'

function FormAddInstrument(props) {
  const { 
    open, 
    handleClose, 
    data, 
    addInstrumentProposal,
    isLoadingAdd,
  } = props;
  const [instruments, setInstruments] = useState([])

  const submit = async () => {
    addInstrumentProposal(instruments)
    setInstruments([])
    handleClose()
  };

  const optionsAvailable = !!data?.instrumentsAvailable?.length && data?.instrumentsAvailable

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Adicionar outro instrumento:</DialogTitle>
      <DialogContent>
        <Autocomplete
            multiple
            autoHighlight
            options={optionsAvailable || []}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            getOptionLabel={(instrument) => `${instrument?.tag}: ${instrument?.numeroDeSerie} - ${instrument?.instrumento?.tipoDeInstrumento?.descricao} - ${instrument.instrumento?.minimo} - ${instrument?.instrumento?.maximo}`}
            disableCloseOnSelect
            loading={isLoadingAdd}
            renderTags={(value, getTagProps) => value?.map((tag, index) => <Chip {...getTagProps({ index })} key={tag?.tag} label={tag?.tag} />)}
            name="instrumentos"
            value={instruments || null}
            loadingText="Carregando..."
            noOptionsText="Sem resultados"
            onChange={(event, newValue) => setInstruments(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={"Instrumentos"}
                    placeholder="Pesquisar instrumento"
                />
            )}
            renderOption={(props, instrument, { selected }) => {
                const { ...optionProps } = props;
                return (
                    <li key={instrument?.id} {...optionProps}>
                        <Checkbox
                            style={{ marginRight: 8 }}
                            checked={selected}
                        />
                        {instrument?.tag}: {instrument?.numeroDeSerie} - {instrument?.instrumento?.tipoDeInstrumento?.descricao} - {instrument?.instrumento?.minimo} - {instrument?.instrumento?.maximo}
                    </li>
                );
            }}
            sx={{ my: 2 }}
        />
        <Box display='flex' justifyContent='space-between'>
          <Button onClick={() => { handleClose(); setInstruments([]) }}>Cancelar</Button>
          <Button onClick={submit} variant="contained" >Salvar</Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default FormAddInstrument