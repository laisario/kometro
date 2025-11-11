import { Link as RouterLink } from 'react-router';
import { Box, Stack, IconButton, InputAdornment, TextField, Alert, Link, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from '../../components/Iconify';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import TermsAndConditions from '../components/TermsAndConditions';


export default function AuthInformation(props) {
  const {
    loading,
    setEmail,
    showPassword,
    setShowPassword,
    handleSubmit,
    error,
    setError,
    email,
    password,
    handlePasswordChange,
    verifyError,
    name,
    setName,
    termsAccepted,
    setTermsAccepted
  } = props;
  
  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField 
          error={!!error?.first_name}
          helperText={!!error?.first_name && error?.first_name}
          name="name" 
          label="Nome gerente" 
          value={name} 
          onChange={(e) => { verifyError('first_name',error,setError); setName(e.target.value) }} 
        />
        <TextField 
          error={!!error?.username}
          helperText={error?.username}
          name="email"
          label="Email" 
          value={email} 
          onChange={(e) => { verifyError('username',error,setError); setEmail(e.target.value) }} 
        />
        <TextField
          fullWidth
          error={!!error?.password}
          helperText={error?.password}
          name="password"
          label="Senha"
          value={password}
          onChange={(e) => {verifyError('password',error,setError); handlePasswordChange(e)}}
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ marginBottom: 0 }}
        />
        <PasswordStrengthMeter password={password} />
        <TermsAndConditions
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          error={!!error?.terms}
          helperText={error?.terms}
        />
      </Stack>

      <Box display="flex" alignItems="center" justifyContent="space-between" mt={4}>
        <Typography variant="body2">
          Já tem uma conta? {''}
          <Link
            to="/login"
            component={RouterLink}
            variant="subtitle2"
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Entrar
          </Link>
        </Typography>
        <LoadingButton
          loading={loading} 
          variant="contained"
          size="large" 
          sx={{ minWidth: '45%' }} 
          onClick={handleSubmit} 
          endIcon={<Iconify icon={'eva:arrow-ios-forward-fill'} />}
        >
          Continuar
        </LoadingButton>
      </Box>
    </form>
  );
}
