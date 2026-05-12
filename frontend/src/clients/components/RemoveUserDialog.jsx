import React from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";

const RemoveUserDialog = ({ open, user, onClose, onConfirm, isRemoving }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Excluir usuário {user?.username}?</DialogTitle>
    <DialogContent>
      <Typography>
        Isso exclui <strong>{user?.username}</strong> permanentemente do sistema.
      </Typography>
      <Typography color="error" sx={{ mt: 1 }}>
        Esta ação é IRREVERSÍVEL.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={isRemoving}>
        Cancelar
      </Button>
      <Button
        onClick={onConfirm}
        color="error"
        disabled={isRemoving}
        startIcon={isRemoving ? <CircularProgress size={16} /> : null}
      >
        {isRemoving ? "Excluindo..." : "Excluir"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default RemoveUserDialog;