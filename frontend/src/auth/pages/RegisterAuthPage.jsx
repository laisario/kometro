import { Helmet } from 'react-helmet-async';
import { Container, Typography } from '@mui/material';
import AuthInformation from '../views/AuthInformation';
import useAuthInfoVM from '../viewModels/useAuthInfoVM';


export default function RegisterAuthPage() {
  const {
    loading,
    setEmail,
    setPassword,
    showPassword,
    setShowPassword,
    handleSubmit,
    error,
    email,
    password,
    handlePasswordChange,
    setError,
    verifyError,
    name,
    setName,
    termsAccepted,
    setTermsAccepted,
  } = useAuthInfoVM()
  return (
    <>
      <Helmet>
        <title> Configurar acesso | Kometro </title>
      </Helmet>

      <Container maxWidth="sm">
        <Typography variant="h3" gutterBottom>
          Configurar acesso
        </Typography>

        <Typography variant="body2" sx={{ mb: 5 }}>
          Deixe sua conta bem segura
        </Typography>

        <AuthInformation
          loading={loading}
          setEmail={setEmail}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleSubmit={handleSubmit}
          error={error}
          email={email}
          password={password}
          handlePasswordChange={handlePasswordChange}
          setError={setError}
          verifyError={verifyError}
          name={name}
          setName={setName}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
        />

        
      </Container>
    </>
  );
}
