import { Link, Box, TextField, Typography, Alert, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Link as RouterLink } from 'react-router';
import FormControl from '@mui/material/FormControl';
import Iconify from '../../components/Iconify';

export default function BasicInformation(props) {
  const {
    handleSubmit,
    CNPJ,
    setCNPJ,
    setRazaoSocial,
    setIE,
    setNomeFantasia,
    setFilial,
    cnpjFormatado,
    cnpjValido,
    razaoSocial,
    IE,
    nomeFantasia,
    filial,
    error,
    setError,
    verifyError
  } = props;

  return (
    <form onSubmit={handleSubmit}>
      <FormControl sx={{ width: '100%', gap: 3, mb: 4 }}>
        <TextField
          fullWidth
          helperText={((!cnpjValido || CNPJ?.length > 18) && 'Por favor, digite um CNPJ válido') || (!!error['cnpj']?.length && error['cnpj'][0]) }
          error={(!cnpjValido && CNPJ?.length > 18) || !!error['cnpj']?.length}
          name="CNPJ"
          label="CNPJ"
          placeholder="Digite o CNPJ da empresa"
          value={cnpjFormatado || CNPJ}
          onChange={(e) => {
            verifyError('cnpj', error, setError)
            setCNPJ(e.target.value);
          }}
        />
        {cnpjValido && (
          <>
            <TextField
              fullWidth
              helperText={!!error['razaoSocial']?.length && error['razaoSocial'][0]}
              error={!!error['razaoSocial']?.length}
              name="razaoSocial"
              label="Razão Social"
              value={razaoSocial}
              onChange={(e) => {
                verifyError('razaoSocial', error, setError)
                setRazaoSocial(e.target.value);
              }}
            />
            <Grid container spacing={1}>
              <Grid item sm={4} xs={12}>
                <TextField
                  fullWidth
                  name="IE"
                  helperText={!!error['ie']?.length && error['ie'][0]}
                  error={!!error['ie']?.length}
                  label="Inscrição Estadual"
                  value={IE}
                  onChange={(e) => {
                    verifyError('ie', error, setError)
                    setIE(e.target.value);
                  }}
                />
              </Grid>
              <Grid item sm={4} xs={12}>
                <TextField
                  fullWidth
                  name="nomeFantasia"
                  error={!!error['nomeFantasia']?.length}
                  helperText={!!error['nomeFantasia']?.length && error['nomeFantasia'][0]}
                  label="Nome Fantasia"
                  value={nomeFantasia}
                  onChange={(e) => {
                    verifyError('nomeFantasia', error, setError)
                    setNomeFantasia(e.target.value);
                  }}
                />
              </Grid>
              <Grid item sm={4} xs={12}>
                <TextField
                  fullWidth
                  name="filial"
                  helperText={!!error['filial']?.length && error['filial'][0]}
                  error={!!error['filial']?.length}
                  label="Filial"
                  value={filial}
                  onChange={(e) => {
                    verifyError('filial', error, setError)
                    setFilial(e.target.value);
                  }}
                />

              </Grid>
            </Grid>
          </>
        )}
      </FormControl>
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
          endIcon={<Iconify icon={'eva:arrow-ios-forward-fill'} />}
          sx={{ maxWidth: '45%' }}
          type="submit"
          fullWidth
          size="large"
          variant="contained"
        >
          Continuar
        </LoadingButton>
      </Box>
    </form>
  );
}
