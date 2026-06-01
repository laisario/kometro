import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async';
import { Box, Button, Container, Stack, Typography, Tabs, Tab } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TableChartIcon from '@mui/icons-material/TableChart';
import ExportFilter from '../components/ExportFilter';
import SectorTreeView from '../components/SectorTreeView';
import SearchWithTreeExpansion from '../components/SearchWithTreeExpansion';
import ButtonTooltip from '../../components/ButtonTooltip';
import SettingsIcon from '@mui/icons-material/Settings';
import PreferencesForm from '../components/PreferencesForm';
import InstrumentosTable from '../components/InstrumentosTable';
import { NO_PERMISSION_ACTION } from '../../utils/messages';
import useAssetsVm from '../viewModels/useAssetsVM';
import { useParams, useSearchParams } from 'react-router';

function AssetsPage() {
  const { id, idSetor } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'tree');
  const selectedCalibrationId = searchParams.get('calibracaoId');

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

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <Helmet>
        <title> Instrumentos | Kometro </title>
      </Helmet>

      <Container
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            mb={3}
            flexShrink={0}
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
                <SearchWithTreeExpansion
                  isFetching={isFetchingAssets}
                  search={search}
                  setSearch={setSearch}
                  data={assets}
                  onSelectInstrument={setSelectedItem}
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

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, flexShrink: 0 }}>
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

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
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
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                <SectorTreeView
                  isMobile={isMobile}
                  asset={asset}
                  selectedItem={selectedItem}
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
                  mutateUpdateClient={mutateUpdateClient}
                  mutateCreateClient={mutateCreateClient}
                  isLoadingUpdateClient={isLoadingUpdateClient}
                  mutateDeleteClient={mutateDeleteClient}
                  mutateChangePosition={mutateChangePosition}
                  selectedCalibrationId={selectedCalibrationId}
                />
                </Box>
            )}

            {currentTab === 'table' && (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <InstrumentosTable />
              </Box>
            )}
          </Box>
      </Container>
    </Box>
  )
}

export default AssetsPage
