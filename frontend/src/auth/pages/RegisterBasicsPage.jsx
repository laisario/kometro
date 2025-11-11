import { Helmet } from 'react-helmet-async';
import { Container, Typography } from '@mui/material';
import BasicInformation from '../views/BasicInformation';
import useBasicInfoVM from '../viewModels/useBasicInfoVM';


export default function RegisterBasicsPage() {
  const {
    handleSubmit,
    CNPJ,
    tipo,
    razaoSocial,
    IE,
    nomeFantasia,
    filial,
    setCNPJ,
    setRazaoSocial,
    setIE,
    setNomeFantasia,
    setFilial,
    cnpjFormatado,
    cnpjValido,
    error,
    setError,
    verifyError
  } = useBasicInfoVM()

  return (
    <>
      <Helmet>
        <title> Criar conta | Kometro </title>
      </Helmet>

      <Container maxWidth="sm">
        <Typography variant="h3" gutterBottom>
          Criar conta
        </Typography>

        <Typography variant="body2" sx={{ mb: 5 }}>
          Calibre seus instrumentos conosco
        </Typography>

        <BasicInformation
          handleSubmit={handleSubmit}
          tipo={tipo}
          setCNPJ={setCNPJ}
          setRazaoSocial={setRazaoSocial}
          setIE={setIE}
          setNomeFantasia={setNomeFantasia}
          setFilial={setFilial}
          cnpjFormatado={cnpjFormatado}
          cnpjValido={cnpjValido}
          CNPJ={CNPJ}
          razaoSocial={razaoSocial}
          IE={IE}
          nomeFantasia={nomeFantasia}
          filial={filial}
          error={error}
          setError={setError}
          verifyError={verifyError}
        />
      </Container>
    </>
  );
}
