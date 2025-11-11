import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { verifyError } from "../../utils/error";
import { Alert, TextField, Stack, IconButton, InputAdornment, Typography, Container } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from '../../components/Iconify';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import TermsAndConditions from '../components/TermsAndConditions';
import { axios } from "../../api";
import { enqueueSnackbar } from "notistack";
import { jwtDecode } from "jwt-decode";
import useClient from "../../clients/hooks/useClient";


export default function RegisterFromInvite() {
  const { token } = useParams();
  const [form, setForm] = useState({ username: "", firstName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { client } = useClient(clientId)
  const navigate = useNavigate();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    const decoded = jwtDecode(token)
    setClientId(decoded?.cliente_id)

  }, [])

  const handleRegister = async () => {
    if (!termsAccepted) {
      setError({ terms: 'Você deve aceitar os termos e condições para continuar' });
      return;
    }
    
    try {
      setLoading(true)
      const res = await axios.post(`/invites/register/${token}/`, form);
      setLoading(false)
      if (res?.status == 200) {
        enqueueSnackbar('Conta criada com sucesso!', {
          variant: 'success'
        });

      }
      navigate('/login', { replace: true });
    } catch (error) {
      setError(error?.response?.data)
      setLoading(false)
      enqueueSnackbar('Erro ao criar conta, tente novamente!', {
        variant: 'error'
      });
    }
  };

  const company = client?.empresa?.razaoSocial || client?.empresa?.nomeFantasia
  return (
    <Container maxWidth="sm">
      <Typography variant="h3" gutterBottom>
        Configurar acesso
      </Typography>

      <Typography variant="body1" sx={{ mb: 5 }}>
        Bem-vindo! Você recebeu um convite para acessar o sistema da empresa <strong>{company}</strong>.
        Por favor, crie sua conta preenchendo o formulário abaixo.
      </Typography>

      <Stack spacing={3}>
        <TextField 
          error={!!error?.first_name}
          helperText={!!error?.first_name && error?.first_name}
          name="firstName" 
          label="Nome" 
          value={form?.firstName} 
          onChange={(e) => { verifyError('first_name',error,setError); handleChange(e) }} 
        />
        <TextField 
          error={!!error?.username}
          helperText={error?.username}
          name="username"
          label="Email" 
          value={form?.username} 
          onChange={(e) => { verifyError('username',error,setError); handleChange(e) }} 
        />
        <TextField
          fullWidth
          error={!!error?.password}
          helperText={error?.password}
          name="password"
          label="Senha"
          value={form?.password}
          onChange={(e) => {verifyError('password',error,setError); handleChange(e)}}
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
        <PasswordStrengthMeter password={form?.password} />
        <TermsAndConditions
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          error={!!error?.terms}
          helperText={error?.terms}
        />
        {error?.error && (
          <Alert severity="error">
            {error?.error}
          </Alert>
        )}
        <LoadingButton
          loading={loading} 
          variant="contained"
          size="large" 
          onClick={handleRegister} 
          endIcon={<Iconify icon={'eva:arrow-ios-forward-fill'} />}
        >
          Criar conta
        </LoadingButton>
      </Stack>
    </Container>

  );
}
