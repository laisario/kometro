import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router';
import { styled } from '@mui/material/styles';
import { Button, Typography, Container, Box } from '@mui/material';


const StyledContent = styled('div')(({ theme }) => ({
  maxWidth: 480,
  margin: 'auto',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(1, 0),
}));


export default function Page404() {
  return (
    <>
      <Helmet>
        <title> 404 Página não encontrada | Kometro </title>
      </Helmet>

      <Container>
        <StyledContent sx={{ textAlign: 'center', alignItems: 'center' }}>
          <Typography variant="h3" paragraph>
            Desculpe, página não encontrada!
          </Typography>

          <Typography sx={{ color: 'text.secondary' }}>
            Lamentamos, mas não conseguimos encontrar a página que procura. Talvez você tenha digitado incorretamente o URL? Certifique-se de verificar sua ortografia.
          </Typography>

          <Box
            component="img"
            src="/assets/illustrations/illustration_404.svg"
            sx={{ height: 260, mx: 'auto', my: 5 }}
          />

          <Button to="/" size="large" variant="contained" component={RouterLink}>
            Voltar para login
          </Button>
        </StyledContent>
      </Container>
    </>
  );
}
