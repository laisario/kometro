import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { Box, Button, Stack, Tooltip, Typography, CircularProgress, OutlinedInput, InputAdornment, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useSectorTreeContext } from '../contexts/SectorTreeContext';
import { useFlattenedTree } from '../hooks/useFlattenedTree';
import TreeRow from './TreeRow';
import CreateInstrument from './CreateInstrument';
import DeleteSectorDialog from './DeleteSectorDialog';
import useAuth from '../../auth/hooks/useAuth';
import { NO_PERMISSION_ACTION } from '../../utils/messages';

const ITEM_SIZE = 40;
const OVERSCAN_COUNT = 10;

/**
 * Header da árvore com botões de ação
 */
function TreeHeader({
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
}) {
  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
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
  );
}


function VirtualizedSectorTree({
  onEditSetor,
  onDeleteSetor,
  handleCreate,
  defaultAssets,
  search,
  setSearch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  mutate,
  isFetching,
  duplicateInstrument,
  error,
  openFormCreateInstrument,
  setOpenFormCreateInstrument,
  setError,
  handleCloseCreateInstrument,
  openCreateSectorId,
  handleEdit,
  handleCloseCreateSector,
  creatingSector,
  setSelectedItem, // ADICIONAR: para sincronizar com estado externo
}) {
  const { user, hasCreatePermission, hasEditPermission } = useAuth();
  
  const {
    nodes,
    rootIds,
    expandedIds,
    selectedId,
    loadingIds,
    isLoadingTree,
    toggleExpand,
    loadChildren,
    selectNode,
    getSelectedNode,
  } = useSectorTreeContext();
  
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const node = nodes[selectedId];
    if (!node) return null;
    
    return {
      id: selectedId,
      type: node.type === 'sector' ? 'sector' : 'instrument',
      parentId: node.parentId,
    };
  }, [selectedId, nodes]);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [newSectorName, setNewSectorName] = useState('');
  
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);
  
  useEffect(() => {
    if (!creatingSector) {
      setNewSectorName('');
    }
  }, [creatingSector]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  const flatList = useFlattenedTree(nodes, rootIds, expandedIds);
  
  const handleToggle = useCallback(async (id) => {
    const node = nodes[id];
    
    if (!expandedIds.has(id) && node?.hasUnloadedChildren && !loadingIds.has(id)) {
      await loadChildren(id);
    }
    
    toggleExpand(id);
  }, [nodes, expandedIds, loadingIds, loadChildren, toggleExpand]);
  
  const handleSelect = useCallback((id) => {
    selectNode(id);
    
    if (setSelectedItem) {
      const node = nodes[id];
      if (node) {
        setSelectedItem({
          id: id,
          type: node.type === 'sector' ? 'sector' : 'instrument',
          parentId: node.parentId,
        });
      }
    }
  }, [selectNode, nodes, setSelectedItem]);
  
  const handleCreateSubsector = useCallback((id) => {
    handleCreate({ id, type: 'sector' });
  }, [handleCreate]);
  
  const handleEditSector = useCallback((id) => {
    setEditingSectorId(id);
    handleEdit({ id, type: 'sector' });
  }, [handleEdit]);
  
  const handleDeleteSector = useCallback((id) => {
    selectNode(id);
    setDeleteDialogOpen(true);
  }, [selectNode]);
  
  const handleDuplicateInstrument = useCallback((originalId) => {
    duplicateInstrument && duplicateInstrument(originalId);
  }, [duplicateInstrument]);
  
  const handleRename = useCallback((id, newName) => {
    onEditSetor({ id, nome: newName });
    setEditingSectorId(null);
    handleCloseCreateSector && handleCloseCreateSector();
  }, [onEditSetor, handleCloseCreateSector]);
  
  const handleConfirmTopRename = useCallback(() => {
    if (!newSectorName.trim() || !openCreateSectorId) return;
    onEditSetor({ id: openCreateSectorId, nome: newSectorName });
    setNewSectorName('');
  }, [newSectorName, openCreateSectorId, onEditSetor]);
  
  const handleCancelTopCreate = useCallback(() => {
    if (openCreateSectorId) {
      onDeleteSetor({ 
        id: openCreateSectorId, 
        action: 'delete_all' 
      });
    }
    handleCloseCreateSector && handleCloseCreateSector();
    setNewSectorName('');
  }, [openCreateSectorId, onDeleteSetor, handleCloseCreateSector]);
  
  const handleCancelEdit = useCallback(() => {
    setEditingSectorId(null);
  }, []);
  
  const handleConfirmDelete = useCallback((data) => {
    const selectedNode = getSelectedNode();
    if (selectedNode) {
      onDeleteSetor({ id: selectedNode.id, ...data });
      selectNode(null);
      setDeleteDialogOpen(false);
    }
  }, [onDeleteSetor, getSelectedNode, selectNode]);
  
  const Row = useCallback(({ index, style }) => {
    const item = flatList[index];
    if (!item) return null;
    
    return (
      <TreeRow
        key={item.id}
        id={item.id}
        node={item.node}
        depth={item.depth}
        isExpanded={item.isExpanded}
        isSelected={selectedId === item.id}
        isEditing={editingSectorId === item.id}
        isLoading={loadingIds.has(item.id)}
        hasChildren={item.hasChildren}
        onToggle={handleToggle}
        onSelect={handleSelect}
        onCreateSubsector={handleCreateSubsector}
        onEdit={handleEditSector}
        onDelete={handleDeleteSector}
        onDuplicate={handleDuplicateInstrument}
        onRename={handleRename}
        onCancelEdit={handleCancelEdit}
        style={style}
      />
    );
  }, [
    flatList,
    selectedId,
    editingSectorId,
    loadingIds,
    handleToggle,
    handleSelect,
    handleCreateSubsector,
    handleEditSector,
    handleDeleteSector,
    handleDuplicateInstrument,
    handleRename,
    handleCancelEdit,
  ]);
  
  const selectedSectorName = useMemo(() => {
    const node = getSelectedNode();
    return node?.label || '';
  }, [getSelectedNode]);
  
  if (isLoadingTree) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 352 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (flatList.length === 0) {
    return (
      <Box sx={{ height: '100%', minWidth: 300, display: 'flex', flexDirection: 'column' }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography color="text.secondary">
            Nenhum setor encontrado. Clique em "Criar setor" para começar.
          </Typography>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', minHeight: 400, minWidth: 300, display: 'flex', flexDirection: 'column' }}>
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
      
      {creatingSector && openCreateSectorId && (
        <Box sx={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 10, 
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          p: 2,
          mb: 1
        }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            ✨ Novo setor criado - Digite o nome:
          </Typography>
          <OutlinedInput
            autoFocus
            fullWidth
            size="small"
            placeholder="Nome do novo setor"
            value={newSectorName}
            onChange={(e) => setNewSectorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmTopRename();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelTopCreate();
              }
            }}
            onBlur={handleConfirmTopRename}
            endAdornment={
              <InputAdornment position="end">
                <Tooltip title="Confirmar (Enter)">
                  <IconButton size="small" onClick={handleConfirmTopRename} edge="end">
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancelar e deletar (Esc)">
                  <IconButton size="small" onClick={handleCancelTopCreate} edge="end">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            }
            sx={{
              '& .MuiOutlinedInput-input': {
                py: 1
              }
            }}
          />
        </Box>
      )}

      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <FixedSizeList
          height={containerHeight}
          width="100%"
          itemCount={flatList?.length || 0}
          itemSize={ITEM_SIZE}
          overscanCount={OVERSCAN_COUNT}
        >
          {Row}
        </FixedSizeList>
      </Box>
      
      <DeleteSectorDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sectorId={selectedId}
        sectorName={selectedSectorName}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

export default VirtualizedSectorTree;
