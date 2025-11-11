import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async';
import { Container, Typography, TextField, Button, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { Link, Link as RouterLink } from 'react-router';
import Iconify from '../../components/Iconify';
import { useNavigate, useParams } from 'react-router';
import { axios } from '../../api';
import { enqueueSnackbar } from 'notistack';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {token} = useParams();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/reset-password/${token}/`, {
        newPassword,
        confirmPassword,
      });

      enqueueSnackbar(response.data.success || 'Senha atualizada com sucesso', {
        variant: 'success'
      });
      
      navigate('/login')
      
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.new_password) {
          enqueueSnackbar(errorData.new_password[0], { variant: 'error' });
        } else if (errorData.confirm_password) {
          enqueueSnackbar(errorData.confirm_password[0], { variant: 'error' });
        } else if (errorData.error) {
          enqueueSnackbar(errorData.error, { variant: 'error' });
        } else {
          enqueueSnackbar('Erro ao redefinir senha', { variant: 'error' });
        }
      } else {
        enqueueSnackbar('Erro de conexão. Tente novamente.', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title> Definir nova senha | Kometro </title>
      </Helmet>

      <Container maxWidth="xs">
        <Typography variant="h3" gutterBottom>
          Definir nova senha
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Digite a nova senha  
        </Typography>
        <TextField
          name="newPassword"
          label="Nova senha"
          required
          fullWidth
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value) }}
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


        <TextField
          label="Confirmar senha"
          type={showConfirmPassword ? 'text' : 'password'}
          fullWidth
          required
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value) }}
          sx={{ my: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}  
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  edge="end"
                >
                  <Iconify icon={showConfirmPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <PasswordStrengthMeter password={newPassword} />
       
        <Button variant="contained" sx={{ my: 2 }} fullWidth color="primary" onClick={handleSubmit}>
         {loading ? <CircularProgress size={20} /> : 'Definir nova senha'}
        </Button>

        <Typography variant="body2">
            Voltar para{' '}
          <Link to="/login" sx={{ textDecoration: 'none', cursor: 'pointer' }} variant="body2" component={RouterLink}>login</Link>
        </Typography>
      </Container>
    </>
  )
}

export default ResetPasswordPage