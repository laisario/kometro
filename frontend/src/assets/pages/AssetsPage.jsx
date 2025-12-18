import React, { useMemo, useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async';
import { Box, Button, Card, CardContent, Container, Grid, Stack, Typography, Tabs, Tab } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableChartIcon from '@mui/icons-material/TableChart';
import ExportFilter from '../components/ExportFilter';
import Loading from '../../components/Loading';
import EmptyYet from '../../components/EmptyYet';
import SetorTree from '../components/SetorTree';
import InstrumentDetails from '../components/InstrumentDetails';
import RecordList from '../components/RecordList';
import SearchWithDropdown from '../components/SearchWithDropdown';
import ButtonTooltip from '../../components/ButtonTooltip';
import SettingsIcon from '@mui/icons-material/Settings';
import PreferencesForm from '../components/PreferencesForm';
import InstrumentosTable from '../components/InstrumentosTable';
import { NO_PERMISSION_ACTION } from '../../utils/messages';
import useAssetsVm from '../viewModels/useAssetsVM';
import { useParams, useSearchParams } from 'react-router';
import useSectorTree from '../hooks/useSectorTree';

function AssetsPage() {
  const { id, idSetor } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'tree');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'tree' || tabParam === 'table')) {
      setCurrentTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSearchParams({ tab: newValue });
  };

  const {
    handleClose,
    handleClickOpen,
    handleCheckboxSelectAll,
    handleChangeCheckbox,
    isMobile,
    open,
    error,
    selectAll,
    valueCheckbox,
    setError,
    setSelected,
    selected,
    asset, 
    mutateDeleteSectors,
    mutateUpdateSectors, 
    openCreateSectorId,
    handleCreate,
    handleCloseCreateSector,
    defaultAssets,
    searchDA,
    setSearchDA,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    mutateCreateClient,
    expandedItems,
    setExpandedItems,
    selectedItem,
    setSelectedItem,
    handleEdit,
    mutateUpdateClient,
    isLoadingUpdateClient,
    mutateDeleteClient,
    assets,
    isFetching,
    assetFilterForm,
    mutateChangePosition,
    duplicateInstrument,
    openFormCreateInstrument, 
    setOpenFormCreateInstrument,
    handleCloseCreateInstrument,
    isFetchingAssets,
    openPreferenceForm,
    handleOpenPreferenceForm,
    handleClosePreferenceForm,
    hasEditPermission,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    search,
    setSearch,
    creatingSector,
  } = useAssetsVm(id, idSetor);

  const { sectors, isLoadingSectors } = useSectorTree();

  const hasSectors = useMemo(() => !!sectors?.length, [sectors])

  return (
    <>
      <Helmet>
        <title> Instrumentos | Kometro </title>
      </Helmet>

      <Container>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          mb={3}
        >
          <Typography variant="h4" gutterBottom>
            Meus Instrumentos
          </Typography>
          <Box 
            sx={{ 
              display: "flex", 
              flexDirection: "row", 
              alignItems: 'center', 
              gap: 2,
            }}
          >
            {currentTab === 'tree' && (
              <SearchWithDropdown 
                isFetching={isFetchingAssets}
                search={search}
                setSearch={setSearch}
                data={assets} 
                onSelect={(item) =>  { setSelectedItem({id: `instrument-${item?.id}`, type: 'instrument', parentId: item?.setor?.id}); setExpandedItems(prevState => [...prevState, String(item?.setor?.id)])}} 
              />
            )}
            <Button
              variant="contained" 
              onClick={handleClickOpen}
              endIcon={<GetAppIcon />}
            >
              Exportar
            </Button>
            <ButtonTooltip 
              title={hasEditPermission ? "Preferências" : NO_PERMISSION_ACTION} 
              disabled={!hasEditPermission} 
              action={handleOpenPreferenceForm} 
              icon={<SettingsIcon />}   
            />
            <PreferencesForm 
              open={openPreferenceForm} 
              handleClose={handleClosePreferenceForm}
            />
          </Box>
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            aria-label="Visualização de instrumentos"
          >
            <Tab 
              icon={<AccountTreeIcon />} 
              iconPosition="start" 
              label="Por Setor" 
              value="tree" 
            />
            <Tab 
              icon={<TableChartIcon />} 
              iconPosition="start" 
              label="Tabela" 
              value="table" 
            />
          </Tabs>
        </Box>

        <Box>
          <ExportFilter
            handleClose={handleClose}
            open={open}
            selected={selected}
            setSelected={setSelected}
            handleChangeCheckbox={handleChangeCheckbox}
            handleCheckboxSelectAll={handleCheckboxSelectAll}
            valueCheckbox={valueCheckbox}
            error={error}
            setError={setError}
            selectAll={selectAll}
            assets={assets}
            assetFilterForm={assetFilterForm}
            isFetchingAssets={isFetchingAssets}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
          />
          {currentTab === 'tree' && (
            isLoadingSectors
              ? <Loading />
              : (hasSectors
                ? (
                  <Grid container sx={{ height: 'calc(100vh - 250px)' }} spacing={4}>
                    <Grid
                      item
                      xs={12}
                      md={4}
                      sx={{
                        borderRight: { md: '1px solid #ddd' },
                        height: { xs: 'auto', md: '100%' },
                        overflowY: 'auto',
                        pr: 1
                      }}
                    >
                      <SetorTree
                        setores={sectors}
                        onEditSetor={mutateUpdateSectors}
                        onDeleteSetor={mutateDeleteSectors}
                        openCreateSectorId={openCreateSectorId}
                        handleCreate={handleCreate}
                        handleEdit={handleEdit}
                        defaultAssets={defaultAssets}
                        search={searchDA}
                        setSearch={setSearchDA}
                        fetchNextPage={fetchNextPage}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        mutate={mutateCreateClient}
                        expandedItems={expandedItems}
                        setExpandedItems={setExpandedItems}
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        handleCloseCreateSector={handleCloseCreateSector}
                        isFetching={isFetching}
                        duplicateInstrument={duplicateInstrument}
                        error={error}
                        openFormCreateInstrument={openFormCreateInstrument}
                        setOpenFormCreateInstrument={setOpenFormCreateInstrument}
                        handleCloseCreateInstrument={handleCloseCreateInstrument}
                        setError={setError}
                        creatingSector={creatingSector}
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                      md={8}
                      sx={{
                        overflowY: 'hidden',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <Box 
                        sx={{
                          flex: '1 1 50%',
                          overflowY: 'auto',
                        }}
                      >
                        <InstrumentDetails
                          instrumento={asset}
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
                          setores={sectors}
                          mutateChangePosition={mutateChangePosition}
                          openFormCreateInstrument={openFormCreateInstrument}
                          setOpenFormCreateInstrument={setOpenFormCreateInstrument}
                          handleCloseCreateInstrument={handleCloseCreateInstrument}
                        />
                      </Box>

                      {selectedItem?.type === 'instrument' && (
                        <Box 
                          sx={{
                            flex: '1 1 50%',
                            overflowY: 'auto',
                          }}
                        >
                          <Card >
                            <CardContent sx={{ padding: 2 }}>
                              <RecordList asset={asset} />
                            </CardContent>
                          </Card>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                )
                : <EmptyYet isMobile={isMobile} content="setor" onCreate={handleCreate} />
              )
          )}

          {/* Table View Tab Content */}
          {currentTab === 'table' && (
            <Box sx={{ height: 'calc(100vh - 250px)' }}>
              <InstrumentosTable />
            </Box>
          )}
        </Box>
      </Container>
    </>
  )
}

export default AssetsPage