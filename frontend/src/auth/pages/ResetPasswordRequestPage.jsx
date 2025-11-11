import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async';
import { Container, Typography, TextField, Button, Link, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { axios } from '../../api';

function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage(null);
    setError(null);
    
    try {
      const response = await axios.post('/reset-password-request/', { email });
      setMessage(response.data.success);
      setEmail('');
    } catch (error) {
      console.error(error);
      setError('Erro ao processar solicitação. Tente novamente.');
    }
    setIsLoading(false);
  }

  return (
    <>
      <Helmet>
        <title> Resetar senha | Kometro </title>
      </Helmet>

      <Container maxWidth="xs">
        <Typography variant="h3" gutterBottom>
          Resetar senha
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Digite seu email cadastrado para receber o link para resetar sua senha.
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          value={email}
          fullWidth
          required
          onChange={(e) => {setEmail(e.target.value); setError(null); setMessage(null);}}
          onKeyPress={(e) => e.key === 'Enter' && email && handleSubmit()}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          fullWidth
          disabled={!email || isLoading}
          sx={{ mt: 2 }}
        >
          {isLoading ? 'Enviando...' : 'Resetar senha'}
        </Button>

        <Typography variant="body2" sx={{ mt: 2 }}>
            Voltar para{' '}
          <Link to="/login" sx={{ textDecoration: 'none', cursor: 'pointer' }} variant="body2" component={RouterLink}>login</Link>
        </Typography>
      </Container>
    </>
  )
}

export default ResetPasswordRequestPage