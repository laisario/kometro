import { Box, Button, CircularProgress, Container, InputAdornment, Paper, Snackbar, Stack, TablePagination, TextField, Typography } from '@mui/material'
import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router';
import SearchIcon from '@mui/icons-material/Search';
import ClientInformation from '../components/ClientInformation';
import ClientInstrumentInformation from '../components/ClientInstrumentInformation';
import useClientVM from '../viewModels/useClientVM';
import EmptyYet from '../../components/EmptyYet'
import CreateInstrument from '../../assets/components/CreateInstrument';


function ClientDetailsPage() {
  const { id } = useParams();
  const { 
    client,
    isMobile,
    search,
    setSearch,
    handleOpenCreateForm,
    handleCloseCreateForm,
    handleOpenEditForm,
    handleCloseEditForm,
    openCreateForm,
    editFormState,
    isLoadingClient,
    rowsPerPage,
    page,
    handleChangePage,
    handleChangeRowsPerPage,
    isDeleting,
    mutateDelete,
    isLoadingAssets,
    assets,
    defaultAssets, 
    isFetching, 
    searchDA, 
    setSearchDA, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    mutateCreateClient,
    mutateUpdateClient: mutateEditInstrument,
    error,
    setError, 
  } = useClientVM(id);

  return (
    <>
      <Helmet>
        <title>Cliente | Kometro </title>
      </Helmet>
      <Container>
        <Typography variant="h4" mb={5} gutterBottom>
          Informações cliente
        </Typography>
        {isLoadingClient 
          ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
              </Box>
            ) 
          : <ClientInformation data={client} isMobile={isMobile} />}
        <br />
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}  sx={{ flexWrap: 'wrap' }}>
          <Typography variant="h4" gutterBottom>
            Instrumentos
          </Typography>
          <Stack direction='row' gap={2}>
            <TextField
              id="search-instrument"
              size='small'
              label="Busque um instrumento"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant='contained' 
              onClick={handleOpenCreateForm} 
              size={isMobile ? 'small' : 'medium'} 
            >
              Novo instrumento
            </Button>
            <CreateInstrument
              handleClose={handleCloseCreateForm}
              open={openCreateForm}
              defaultAssets={defaultAssets}
              search={searchDA}
              setSearch={setSearchDA}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              cliente={id}
              mutate={mutateCreateClient}
              isFetching={isFetching}
              error={error}
              setError={setError}
              adminPreview
            />
          </Stack>
        </Stack>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {isLoadingAssets
            ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
              </Box>
            )
            : assets?.results?.length ? assets?.results?.map((instrument, index) => (
              <ClientInstrumentInformation
                key={index + instrument?.id}
                instrument={instrument}
                isDeleting={isDeleting}
                mutateDelete={mutateDelete}
                cliente={client?.id}
                defaultAssets={defaultAssets}
                search={searchDA}
                setSearch={setSearchDA}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                mutateEditInstrument={mutateEditInstrument}
                isFetching={isFetching}
                error={error}
                setError={setError}
                editFormState={editFormState}
                handleCloseFormEdit={handleCloseEditForm}
                handleOpenFormEdit={handleOpenEditForm}
              />
            ))
              : <EmptyYet content="instrumento" isMobile={isMobile} />
          }
        </Box>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={assets?.count || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Instrumentos por página"
        />
      </Container>
    </>
  )
}

export default ClientDetailsPage