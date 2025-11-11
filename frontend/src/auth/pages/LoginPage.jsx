import React from 'react'
import { Helmet } from 'react-helmet-async';
import { Link, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import LoginForm from '../views/LoginForm';
import useLoginVM from '../viewModels/useLoginVM';

function LoginPage() {
  const {
    isLoadingLogin,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleSubmit,
    errorLogin,
  } = useLoginVM()

  return (
    <>
      <Helmet>
        <title> Login </title>
      </Helmet>

      <Container maxWidth="xs">
        <Typography variant="h3" gutterBottom>
          Entrar
        </Typography>

        <Typography variant="body2" sx={{ mb: 5 }}>
          Não tem uma conta? {''}
          <Link 
            to="/register"
            component={RouterLink}
            variant="subtitle2"
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Criar conta
          </Link>
        </Typography>

        <LoginForm
          isLoadingLogin={isLoadingLogin}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleSubmit={handleSubmit}
          errorLogin={errorLogin}
        />
      </Container>
    </>
  )
}

export default LoginPage