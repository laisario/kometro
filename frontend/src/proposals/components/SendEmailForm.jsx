import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  List
} from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';

export default function SendEmailForm({ open, onClose, sendProposalToEmail }) {
  const form = useForm({
    defaultValues: {
      emails: []
    }
  });
  const [emailInput, setEmailInput] = useState('');
  
  const {
    emails
  } = useWatch({ control: form.control })

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && validateEmail(email) && !emails.includes(email)) {
      const currentValues = form.getValues('emails') || [];
      form.setValue('emails', [...currentValues, emailInput]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (indexToRemove) => {
    const currentValues = form.getValues('emails');
    const newValues = currentValues?.filter((_, index) => index !== indexToRemove);
    form.setValue('emails', newValues);
  };

  const handleClose = () => {
    form.reset();
    setEmailInput('');
    onClose();
  };
  const sendEmailValidation = () => {
    return !!emails?.length;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={form.handleSubmit((data) => {sendProposalToEmail(data); handleClose()})}>
        <DialogTitle>Enviar Proposta por E-mail</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ mb: 1 }}>Enviar para e-mail(s):</Typography>

          <Box display="flex" flexDirection="column" width="100%">
            <Box display="flex" flexDirection="row" gap={2}>
              <TextField
                label="E-mail"
                variant="outlined"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                size="small"
                fullWidth
              />
              <Button variant="contained" onClick={handleAddEmail}>
                Adicionar
              </Button>
            </Box>

            <List sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {emails.map((email, index) => (
                <Chip
                  key={index}
                  label={email}
                  onDelete={() => handleRemoveEmail(index)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </List>
          </Box>
        </DialogContent>

        <DialogActions>
          <Box  width="100%"  display="flex" alignItems="center" justifyContent="space-between">
            <Button onClick={handleClose} color="secondary">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={!sendEmailValidation()}  color="primary">
              Enviar
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
