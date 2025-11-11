import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import React from 'react'
import { statusLabel } from '../../utils/calibration'

function CriticalAnalysisDialog({ data, open, handleClose, handleConfirmationAnalysis, analiseCliente, handleChange }) {
  return (
    <Dialog disableEscapeKeyDown open={open} onClose={handleClose}>
      <DialogTitle>Nos informe sua análise da calibração</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          {data?.status && (
            <Typography variant="body2" color='grey'>Status: {statusLabel[data?.status]}</Typography>
          )}
          {data?.maiorErro && (
            <Typography variant="body2" color='grey'>Maior erro: {data?.maiorErro}</Typography>
          )}
          {data?.incerteza && (
            <Typography variant="body2" color='grey'>Incerteza: {data?.incerteza}</Typography>
          )}
          {data?.criterioDeAceitacao && (
            <Typography variant="body2" color='grey'>Critério de Aceitação: {data?.criterioDeAceitacao}</Typography>
          )}
          {data?.observacaoCriterioAceitacao && (
            <Typography variant="body2" color='grey'>Observação: {data.observacaoCriterioAceitacao}</Typography>
          )}
          {data?.referenciaDoCriterio && (
            <Typography variant="body2" color='grey'>Referência: {data.referenciaDoCriterio}</Typography>
          )}
        </Box>
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap', mt: 1}}>
          <FormControl fullWidth size='small'>
            <InputLabel id="analise-critica-select">Análise Crítica</InputLabel>
            <Select
              labelId="analise-critica-select"
              id="analise-critica-field"
              value={analiseCliente?.criticalAnalysis}
              onChange={handleChange}
              label="Análise Crítica"
              name="criticalAnalysis"
            >
              <MenuItem value="A">Aprovada</MenuItem>
              <MenuItem value="X">Reprovada</MenuItem>
              <MenuItem value="R">Aprovada com restrições</MenuItem>
            </Select>
          </FormControl>
          {analiseCliente?.criticalAnalysis === "R" && <TextField
            id="restrictions"
            label="Restrições"
            multiline
            fullWidth
            onChange={handleChange}
            value={analiseCliente?.restrictions}
            name="restrictions"
            helperText="Escreva quais foram as restrições"
            sx={{mt: 1}}
          />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={() => handleConfirmationAnalysis(analiseCliente)}>Confirmar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CriticalAnalysisDialog