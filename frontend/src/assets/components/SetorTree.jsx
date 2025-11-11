import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import useAuth from '../../auth/hooks/useAuth';
import CreateInstrument from './CreateInstrument';
import CustomTreeItem from './CustomTreeItem';
import { NO_PERMISSION_ACTION } from "../../utils/messages";

const TreeHeader = (props) => {
  const {
    handleCreate,
    openFormCreateInstrument, 
    setOpenFormCreateInstrument,
    defaultAssets,
    search,
    setSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    cliente,
    mutate,
    selectedItem,
    isFetching,
    error,
    setError,
    handleCloseCreateInstrument,
    hasCreatePermission,
    hasEditPermission,
  } = props;

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1}>
        <CreateInstrument 
          handleClose={() => handleCloseCreateInstrument("create")}
          open={openFormCreateInstrument?.type === 'create' && openFormCreateInstrument?.status}
          defaultAssets={defaultAssets}
          search={search}
          setSearch={setSearch}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          setor={selectedItem}
          cliente={cliente}
          mutate={mutate}
          isFetching={isFetching}
          error={error}
          setError={setError}
        />
        <Typography sx={{ flexGrow: 1 }}>Setores</Typography>
        <Tooltip placement="top" title={!hasEditPermission && NO_PERMISSION_ACTION}>
          <span>
            <Button size="small" disabled={!hasEditPermission} onClick={handleCreate}>
              Criar setor
            </Button>
          </span>
        </Tooltip>
        {selectedItem && (
          <Tooltip placement="top" title={!hasCreatePermission && NO_PERMISSION_ACTION}>
            <span>
              <Button 
                variant='contained' 
                onClick={() => setOpenFormCreateInstrument({status: true, type: 'create'})} 
                color='info' 
                size="small"
                disabled={!hasCreatePermission}
              >
                Criar instrumento
              </Button>
            </span>
          </Tooltip>
        )}  
      </Stack>
    </>
  )
}


function SetorTree(props) {
  const { 
    setores, 
    onEditSetor, 
    onDeleteSetor,
    openCreateSectorId,
    handleCreate,
    defaultAssets,
    search,
    setSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    mutate,
    expandedItems,
    setExpandedItems,
    selectedItem,
    setSelectedItem,
    handleEdit,
    handleCloseCreateSector,
    isFetching,
    duplicateInstrument,
    error,
    openFormCreateInstrument, 
    setOpenFormCreateInstrument,
    setError,
    handleCloseCreateInstrument
  } = props;
  const { user, hasCreatePermission, hasEditPermission } = useAuth();

  const handleSubmit = (sectorName, id) => {
    onEditSetor({id, nome: sectorName })
    handleCloseCreateSector()
  }
  
  const handleItemSelection = (event, id) => {
    event?.preventDefault()

    const findItemById = (id, items) => {
      for (let item of items) {
        if (String(item?.id) === String(id)) return item
        if (item?.children?.length) {
          const found = findItemById(id, item.children);
          if (found) return found;
        }
      }
    }
    const sector = findItemById(id, setores)
    setSelectedItem({id, type: sector?.itemType, parentId: sector?.parentId})
    setExpandedItems(oldExpandedItems => oldExpandedItems?.includes(id) ? oldExpandedItems?.filter((item) => Number(item) !== Number(id)) : [...oldExpandedItems, id])
  };

  return (
    <Box sx={{ minHeight: 352, minWidth: 300 }}>
      <TreeHeader
        handleCreate={handleCreate}
        openFormCreateInstrument={openFormCreateInstrument}
        setOpenFormCreateInstrument={setOpenFormCreateInstrument}
        defaultAssets={defaultAssets}
        search={search}
        setSearch={setSearch}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        cliente={user?.cliente}
        mutate={mutate}
        selectedItem={selectedItem}
        isFetching={isFetching}
        error={error}
        setError={setError}
        handleCloseCreateInstrument={handleCloseCreateInstrument}
        hasCreatePermission={hasCreatePermission}
        hasEditPermission={hasEditPermission}
      />
      <RichTreeView
        items={setores}
        onSelectedItemsChange={handleItemSelection}
        expandedItems={expandedItems}
        selectedItems={selectedItem ? [selectedItem?.id] : []}
        slots={{
          item:(props) => (
            <CustomTreeItem 
              setSelectedItem={setSelectedItem} 
              onDeleteSetor={onDeleteSetor} 
              handleEditSector={onEditSetor} 
              selectedItem={selectedItem} 
              handleCreate={handleCreate}
              handleEdit={handleEdit}
              handleCloseCreateSector={handleCloseCreateSector}
              {...props} 
              handleSubmit={(sectorName) => handleSubmit(sectorName, props?.itemId)} 
              isEditing={Number(props?.itemId) === Number(openCreateSectorId)}
              duplicateInstrument={duplicateInstrument}
              hasCreatePermission={hasCreatePermission}
            />
        )}}
      />
    </Box>
  );
}


export default SetorTree;