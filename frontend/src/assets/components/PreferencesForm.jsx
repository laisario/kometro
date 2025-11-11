import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { axios } from '../../api'
import useAuth from '../../auth/hooks/useAuth'
import { enqueueSnackbar } from 'notistack';
import { getErrorMessage } from '../../utils/error';
import useClient from '../../clients/hooks/useClient';
import useClientMutations from '../../clients/hooks/useClientMutations';
import { frequenceCriterion } from '../../utils/assets';

function PreferencesForm({open, handleClose}) {
  const { user } = useAuth();
  const { client } = useClient(user?.cliente)
  const [criterion, setCriterion] = useState(client?.criterioFrequenciaPadrao && 'S')

  const { updateCriterion } = useClientMutations(handleClose)

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Configurar preferências</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2}}>
          Você está definindo um padrão para todos os instrumentos. Mas não se preocupe: também é possível configurar individualmente por instrumento.
        </DialogContentText>
          <FormControl fullWidth>
            <InputLabel id="passagem-tempo-label">
              Critério de frequência
            </InputLabel>
            <Select
              labelId="passagem-tempo-label"
              label="Critério de frequência"
              value={criterion}
              onChange={(e) => setCriterion(e.target.value)}
            >
              <MenuItem value="C">Tempo de calendário</MenuItem>
              <MenuItem value="S">Tempo de serviço</MenuItem>
            </Select>
            <Typography variant='caption' color='secondary'>Preferência atual: {frequenceCriterion[client?.criterioFrequenciaPadrao]}</Typography>
            
          </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={() => updateCriterion({id: user?.cliente, criterion,})}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PreferencesForm