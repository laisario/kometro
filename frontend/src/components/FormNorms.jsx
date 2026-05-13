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
        <Button onClick={() => {
          const prev = [];
          const newId = prev.length > 0 ? Math.max(...prev.map(n => n?.id || 0)) + 1 : Date.now();
          setNorms((prev) => [...(Array.isArray(prev) ? prev : []), { nome: input, id: newId }]);
          onClose();
        }} variant="contained">Criar norma</Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormNorms;