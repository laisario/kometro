import { useState } from "react";
import { Dialog, DialogContent, DialogActions, Button, TextField } from "@mui/material";


const FormNorms = ({open, onClose, setNorms}) => {
  const [input, setInput] = useState('')
  const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

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
          setNorms((prev) => {
            const current = Array.isArray(prev) ? prev : [];
            const exists = current.some((norma) => normalizeName(norma?.nome) === normalizeName(nome));
            return exists ? current : [...current, { nome }];
          });
          setInput('');
          onClose();
        }} variant="contained">Criar norma</Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormNorms;
