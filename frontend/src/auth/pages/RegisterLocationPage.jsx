import { Helmet } from 'react-helmet-async';
import { Container, Typography } from '@mui/material';
import AddressInformation from '../views/AddressInformation';
import useLocationInfoVM from '../viewModels/useLocationInfoVM';


export default function RegisterLocationPage() {
  const {
    handleSubmit,
    isValid,
    form,
    error,
  } = useLocationInfoVM()
  return (
    <>
      <Helmet>
        <title> Localização | Kometro </title>
      </Helmet>

      <Container maxWidth="sm">
        <Typography variant="h3" gutterBottom>
          Localização
        </Typography>

        <AddressInformation
          handleSubmit={handleSubmit}
          isValid={isValid}
          form={form}
          error={error}
        />
      </Container>
    </>
  );
}
