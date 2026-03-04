import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Button, 
  Stack,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router';
import useAsset from '../hooks/useAsset';
import useAssetMutations from '../hooks/useAssetMutations';
import useDefaultAssets from '../hooks/useDefaultAssets';
import RecordList from '../components/RecordList';
import InstrumentDetails from '../components/InstrumentDetails';

function InstrumentoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { asset: instrumento, isLoadingAsset } = useAsset(id);
  
  const [openFormCreateInstrument, setOpenFormCreateInstrument] = useState({
    status: false,
    type: '',
  });
  const [selectedItem, setSelectedItem] = useState(null);

  const handleCloseCreateInstrument = (type) => {
    setOpenFormCreateInstrument(() => ({type: type, status: false}))
    setError({})
  }

  const { 
    mutateCreateClient,
    mutateUpdateClient,
    isLoadingUpdateClient,
    mutateDeleteClient,
    error,
    setError,
    mutateChangePosition,
  } = useAssetMutations(handleCloseCreateInstrument);

  const { 
    defaultAssets, 
    isFetching, 
    search: searchDA, 
    setSearch: setSearchDA, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDefaultAssets();

  const handleGoBack = () => {
    navigate('/dashboard/instrumentos?tab=table');
  };

  if (isLoadingAsset) {
    return (
      <>
        <Helmet>
          <title>Instrumento | Kometro</title>
        </Helmet>
        <Container>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '50vh' 
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{instrumento?.tag || 'Instrumento'} | Kometro</title>
      </Helmet>

      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={handleGoBack}
              variant="outlined"
            >
              Voltar para lista
            </Button>
            <Typography variant="h4" sx={{ flex: 1 }}>
              {instrumento?.tag || 'Instrumento'}
            </Typography>
          </Box>

          <InstrumentDetails
            instrumento={instrumento}
            mutateUpdateClient={mutateUpdateClient}
            mutateCreateClient={mutateCreateClient}
            isLoadingUpdateClient={isLoadingUpdateClient}
            defaultAssets={defaultAssets}
            search={searchDA}
            setSearch={setSearchDA}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            selectedItem={selectedItem}
            mutateDeleteClient={mutateDeleteClient}
            setSelectedItem={setSelectedItem}
            error={error}
            setError={setError}
            isFetching={isFetching}
            mutateChangePosition={mutateChangePosition}
            openFormCreateInstrument={openFormCreateInstrument}
            setOpenFormCreateInstrument={setOpenFormCreateInstrument}
            handleCloseCreateInstrument={handleCloseCreateInstrument}
            onDeleteSuccess={handleGoBack}
          />

          {instrumento && (
            <Card>
              <CardContent>
                <RecordList asset={instrumento} />
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}

export default InstrumentoDetailPage;
