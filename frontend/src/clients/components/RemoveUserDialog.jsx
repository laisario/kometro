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

const RemoveUserDialog = ({ open, user, onClose, onConfirm, isRemoving, mode = "remove-access" }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>
      {mode === "deactivate-user"
        ? `Desativar usuário ${user?.username}?`
        : `Remover acesso de ${user?.username}?`}
    </DialogTitle>
    <DialogContent>
      {mode === "deactivate-user" ? (
        <Typography>
          Isso desativa <strong>{user?.username}</strong> no sistema. O registro será preservado,
          mas o usuário não aparecerá nas listagens comuns.
        </Typography>
      ) : (
        <Typography>
          Isso remove o acesso de <strong>{user?.username}</strong> a este cliente.
          O usuário continuará ativo no sistema.
        </Typography>
      )}
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
        {isRemoving
          ? mode === "deactivate-user" ? "Desativando..." : "Removendo..."
          : mode === "deactivate-user" ? "Desativar usuário" : "Remover acesso"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default RemoveUserDialog;
