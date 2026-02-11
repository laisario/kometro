import React from 'react';
import { Box, Card, CardContent, Grid } from '@mui/material';
import Loading from '../../components/Loading';
import EmptyYet from '../../components/EmptyYet';
import VirtualizedSectorTree from './VirtualizedSectorTree';
import InstrumentDetails from './InstrumentDetails';
import RecordList from './RecordList';
import { useSectorTreeContext } from '../contexts/SectorTreeContext';

function SectorTreeView({
  isMobile,
  asset,
  selectedItem,
  // VirtualizedSectorTree props
  onEditSetor,
  onDeleteSetor,
  openCreateSectorId,
  handleCreate,
  handleEdit,
  defaultAssets,
  search,
  setSearch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  mutate,
  expandedItems,
  setExpandedItems,
  setSelectedItem,
  handleCloseCreateSector,
  isFetching,
  duplicateInstrument,
  error,
  openFormCreateInstrument,
  setOpenFormCreateInstrument,
  handleCloseCreateInstrument,
  setError,
  creatingSector,
  // InstrumentDetails props
  mutateUpdateClient,
  mutateCreateClient,
  isLoadingUpdateClient,
  mutateDeleteClient,
  setores,
  mutateChangePosition,
}) {
  const { isLoadingTree, hasLoadedTree, hasSectors } = useSectorTreeContext();
  
  // Show loading only while initial fetch is in progress
  if (isLoadingTree && !hasLoadedTree) {
    return <Loading />;
  }

  if (hasLoadedTree && !hasSectors) {
    return <EmptyYet isMobile={isMobile} content="setor" onCreate={handleCreate} />;
  }

  return (
      <Grid container sx={{ height: 'calc(100vh - 250px)' }} spacing={4}>
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            borderRight: { md: '1px solid #ddd' },
            height: { xs: 'auto', md: '100%' },
            overflowY: 'hidden',
            pr: 1
          }}
        >
          <VirtualizedSectorTree
            onEditSetor={onEditSetor}
            onDeleteSetor={onDeleteSetor}
            openCreateSectorId={openCreateSectorId}
            handleCreate={handleCreate}
            handleEdit={handleEdit}
            defaultAssets={defaultAssets}
            search={search}
            setSearch={setSearch}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            mutate={mutate}
            isFetching={isFetching}
            duplicateInstrument={duplicateInstrument}
            error={error}
            openFormCreateInstrument={openFormCreateInstrument}
            setOpenFormCreateInstrument={setOpenFormCreateInstrument}
            handleCloseCreateInstrument={handleCloseCreateInstrument}
            setError={setError}
            creatingSector={creatingSector}
            handleCloseCreateSector={handleCloseCreateSector}
            setSelectedItem={setSelectedItem}
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
              search={search}
              setSearch={setSearch}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              selectedItem={selectedItem}
              mutateDeleteClient={mutateDeleteClient}
              setSelectedItem={setSelectedItem}
              error={error}
              setError={setError}
              isFetching={isFetching}
              setores={setores}
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
              <Card>
                <CardContent sx={{ padding: 2 }}>
                  <RecordList asset={asset} />
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>
  );
}

export default SectorTreeView;
