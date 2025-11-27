import { Outlet } from 'react-router';
import { Container, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Logo from '../../components/Logo';


const PageWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  minHeight: '100vh',
  width: '100%',
  margin: 0,
  padding: 0,
}));

const StyledRoot = styled(Container)(({ theme }) => ({
    display: 'flex',
    backgroundColor: 'transparent',
    flex: 1,
    minHeight: '100vh',
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
    <PageWrapper>
      <StyledRoot>
        <LogoBox>
          <Logo sx={{ maxWidth: 300 }} disabledLink />
        </LogoBox>
        <Outlet />
      </StyledRoot>
    </PageWrapper>
  );
}
