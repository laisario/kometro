import { useState } from 'react';
import { Outlet } from 'react-router';
import { styled } from '@mui/material/styles';
import Header from './header';
import Nav from './nav';
import useAuth from '../../auth/hooks/useAuth';

const APP_BAR_MOBILE = 64;
const APP_BAR_DESKTOP = 92;

const StyledRoot = styled('div')({
  display: 'flex',
  minHeight: '100%',
  overflow: 'hidden',
});

const Main = styled('div')(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  minHeight: '100%',
  paddingTop: APP_BAR_MOBILE + 12,
  paddingBottom: theme.spacing(2),
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
        <Outlet />
      </Main>
    </StyledRoot>
  );
}

export default CommonLayout;
