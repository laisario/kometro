import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  type = 'instrument',
}) {
  const getMessage = () => {
    switch (type) {
      case 'sector':
        return {
          title: 'Tem certeza que deseja excluir este setor?',
          message:
            'Essa ação não poderá ser desfeita. Todos os instrumentos associados a este setor também serão apagados permanentemente.',
        };
      case 'instrument':
        return {
          title: 'Tem certeza que deseja excluir este instrumento?',
          message:
            'Essa ação não poderá ser desfeita. Todos os dados relacionados a este instrumento serão perdidos permanentemente.',
        };
      default:
        return {
          title: 'Tem certeza dessa ação?',
          message: 'Essa ação não poderá ser desfeita.',
        };
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const { title, message } = getMessage();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
