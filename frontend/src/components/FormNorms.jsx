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
          const nome = input.trim();
          if (!nome) return;
          setNorms((prev) => [...(Array.isArray(prev) ? prev : []), { nome }]);
          setInput('');
          onClose();
        }} variant="contained">Criar norma</Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormNorms;
