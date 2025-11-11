import { Outlet } from 'react-router';
import { styled } from '@mui/material/styles';
import Logo from '../../components/Logo.jsx';


const StyledHeader = styled('header')(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2, 2, 0),
  },
  maxWidth: 250,
  margin: 'auto',
  display: 'flex',
  justifyContent: 'center',
  marginBottom: { xs: 15, sm: 30  }
}));


export default function SimpleLayout() {
  return (
    <>
      <StyledHeader>
        <Logo />
      </StyledHeader>

      <Outlet />
    </>
  );
}
