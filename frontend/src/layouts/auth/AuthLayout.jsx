import { Outlet } from 'react-router';
import { Container, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Logo from '../../components/Logo';


const StyledRoot = styled(Container)(({ theme }) => ({
    display: 'flex',
    backgroundColor: theme.palette.background.paper,
    flex: 1,
    height: '100vh',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingBottom: 20,
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1
    },
  }));
  
  const LogoBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: theme.spacing(8),
    [theme.breakpoints.up('md')]: {
      marginBottom: 0,
    }
  }))
  

export default function AuthLayout() {
  return (
    <div sx={{ backgroundColor: 'background.paper' }}>

    <StyledRoot >
      <LogoBox>
        <Logo sx={{ maxWidth: 300 }} disabledLink />
      </LogoBox>
      <Outlet />
    </StyledRoot>
    </div>
  );
}
