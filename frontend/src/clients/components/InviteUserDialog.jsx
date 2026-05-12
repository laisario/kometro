import React from "react";
import {
  Dialog,
  DialogContent,
  Button,
} from "@mui/material";
import InviteGenerator from "../../access/components/InviteGenerator";

function InviteUserDialog({ open, onClose, overrideClienteId, isAdmin }) {
  if (!isAdmin) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
        <InviteGenerator clientPage overrideClienteId={overrideClienteId} />
        <Button size="small" onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
}

export default InviteUserDialog;