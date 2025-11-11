import { useState } from "react";
import { Menu, MenuItem, IconButton, CircularProgress } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {isDeleting || isLoadingElaborateProposal || isApprovingBilling ? <CircularProgress size="20px" color="inherit" /> : <IconButton onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => { handleClose(); deleteOrderAndNavigate(); }}>
          Deletar proposta
        </MenuItem>

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
      </Menu>
    </>
  );
}
