import { useState } from 'react';
import { Outlet } from 'react-router';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from './header';
import Nav from './nav';
import useAuth from '../../auth/hooks/useAuth';
import { SectorTreeProvider } from '../../assets/contexts/SectorTreeContext';

const APP_BAR_MOBILE = 64;
const APP_BAR_DESKTOP = 92;

const StyledRoot = styled('div')({
  display: 'flex',
  minHeight: '100dvh',
  overflow: 'hidden',
  position: 'relative',
});

const Main = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minHeight: 0,
  overflow: 'auto',
  paddingTop: APP_BAR_MOBILE + 12,
  paddingBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.up('lg')]: {
    paddingTop: APP_BAR_DESKTOP + 12,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

function CommonLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const admin = user?.admin && user?.admin;

  return (
    <StyledRoot>
      <Header
        onOpenNav={() => setOpen(true)}
      />

      <Nav openNav={open} onCloseNav={() => setOpen(false)} admin={admin} />

      <Main>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SectorTreeProvider>
            <Outlet />
          </SectorTreeProvider>
        </Box>
      </Main>
    </StyledRoot>
  );
}

export default CommonLayout;
