import { useState } from 'react';
import { alpha } from '@mui/material/styles';
import { MenuItem, IconButton, Popover } from '@mui/material';
import { useNavigate } from 'react-router';
import { Avatar } from '../../../components/avatar';

import useAuth from '../../../auth/hooks/useAuth';

export default function AccountPopover() {
  const [open, setOpen] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleOpen = (event) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          p: 0,
          ...(open && {
            '&:before': {
              zIndex: 1,
              content: "''",
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              position: 'absolute',
              bgcolor: (theme) => alpha(theme.palette.grey[900], 0.4),
            },
          }),
        }}
      >
        <Avatar />
      </IconButton>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 0,
            mt: 1.5,
            ml: 0.75,
            width: 180,
            '& .MuiMenuItem-root': {
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            logout()
            return navigate('/login', { replace: true });
          }}
          sx={{ m: 1 }}
        >
          Sair
        </MenuItem>
      </Popover>
    </>
  );
}
