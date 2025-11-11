import { Stack, IconButton, InputAdornment, TextField, Typography, Link } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Link as RouterLink } from 'react-router';
import Iconify from '../../components/Iconify.jsx';


export default function LoginForm(props) {
  const {
    isLoadingLogin,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleSubmit,
  } = props;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          name="email"
          required
          label="Email"
          value={email}
          onChange={(e) => { setEmail(e.target.value) }}
        />

        <TextField
          name="password"
          label="Senha"
          required
          value={password}
          onChange={(e) => { setPassword(e.target.value) }}
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}  
                  onClick={() => setShowPassword(!showPassword)} 
                  edge="end"
                >
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Typography component="p" variant="body2">
          Esqueceu sua senha? {''}
          <Link 
            to="/reset-password-request"
            component={RouterLink}
            variant="body2"
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Resetar senha
          </Link>
        </Typography>

      </Stack>

        <LoadingButton 
          disabled={!email || !password} 
          loading={isLoadingLogin} 
          sx={{ mt: 4 }}
          type="submit"
          fullWidth 
          size="large" 
          variant="contained" 
          onClick={handleSubmit}
          >
          Entrar
        </LoadingButton>
    </form>
  );
}
