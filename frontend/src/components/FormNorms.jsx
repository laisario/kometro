import { useState } from "react";
import { Dialog, DialogContent, DialogActions, Button, TextField } from "@mui/material";


const FormNorms = ({open, onClose, setNorms}) => {
  const [input, setInput] = useState('')
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <TextField
          label="Norma"
          size="small"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={() => {setNorms((prev) => [...prev, {nome: input, id: prev[prev.length - 1]?.id + 1}]);onClose();}}  variant="contained">Criar norma</Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormNorms;