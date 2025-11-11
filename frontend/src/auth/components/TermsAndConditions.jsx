import React, { useEffect, useState } from 'react';
import {
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link
} from '@mui/material';
import ReactMarkdown from "react-markdown";

export default function TermsAndConditions({ 
  checked, 
  onChange, 
  error = false, 
  helperText 
}) {
  const [open, setOpen] = useState(false);
  const [terms, setTerms] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    fetch("/termos.md")
      .then((res) => res.text())
      .then(setTerms);
  }, []);

  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={onChange}
            color="primary"
            error={error}
          />
        }
        label={
          <Typography variant="body2">
            Ao clicar, você concorda com os{' '}
            <Link
              component="button"
              variant="body2"
              onClick={handleOpen}
              sx={{
                textDecoration: 'underline',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                padding: 0,
                font: 'inherit',
                color: 'primary.main'
              }}
            >
              termos e condições
            </Link>
          </Typography>
        }
        sx={{ alignItems: 'center', mt: 1 }}
      />
      
      {error && helperText && (
        <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Termos e Condições de Uso
        </DialogTitle>
        <DialogContent>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{terms}</ReactMarkdown>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
