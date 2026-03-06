import { useState } from "react";
import { Menu, MenuItem, IconButton, CircularProgress, Divider } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ConfirmDeleteDialog from "../../assets/components/ConfirmDeleteDialog";

export default function MenuButton(props) {
  const {
    isDeleting, 
    proposal, 
    isLoadingElaborateProposal, 
    deleteOrderAndNavigate,
    setEdit,
    setElaborateOpen,
    setOpenBillingApprovel,
    isApprovingBilling,
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleClose();
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteOrderAndNavigate();
  };

  return (
    <>
      {isDeleting || isLoadingElaborateProposal || isApprovingBilling ? <CircularProgress size="20px" color="inherit" /> : <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {proposal?.status === "E" ? (
          <MenuItem onClick={() => { handleClose(); setElaborateOpen(true); }}>
            Elaborar proposta
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { handleClose(); setEdit(true); setElaborateOpen(true); }}>
            Editar proposta
          </MenuItem>
        )}

        <MenuItem onClick={() => { handleClose(); setOpenBillingApprovel(true) }}>
          Liberar para faturamento
        </MenuItem>

        <Divider />

        <MenuItem 
          onClick={handleDeleteClick}
          sx={{
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'error.dark',
            },
          }}
        >
          Deletar proposta
        </MenuItem>
      </Menu>

      <ConfirmDeleteDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        type="proposal"
      />
    </>
  );
}
