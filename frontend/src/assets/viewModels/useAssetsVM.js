import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSectorTreeContext } from "../contexts/SectorTreeContext";
import useResponsive from '../../theme/hooks/useResponsive';
import useAsset from "../hooks/useAsset";
import useSectorMutations from "../hooks/useSectorMutations";
import useDefaultAssets from "../hooks/useDefaultAssets";
import useAssetMutations from "../hooks/useAssetMutations";
import useAuth from "../../auth/hooks/useAuth";
import useAssets from "../hooks/useAssets";
import { MAX_EXPORT_ITEMS } from "../constants";

const emptyManualSelection = () => ({ mode: 'manual', ids: [] });

const useAssetsVm = (id, idSetor) => {
  const [open, setOpen] = useState(false);
  const [valueCheckbox, setValueCheckbox] = useState({
    tag: true,
    numeroDeSerie: true,
    laboratorio: true,
    setor: true,
    posicaoDoInstrumento: true,
    dataUltimaCalibracao: true,
    dataDaProximaCalibracao: true,
    frequenciaDeCalibracao: true,
    dataUltimaChecagem: true,
    dataDaProximaChecagem: true,
    frequenciaDeChecagem: true,
    normativos: true,
    numeroUltimoCertificado: true,
  });
  const [selection, setSelection] = useState(emptyManualSelection);
  const [selectedItemsById, setSelectedItemsById] = useState(() => new Map());
  const [openCreateSectorId, setOpenCreateSectorId] = useState(null);
  const [creatingSector, setCreatingSector] = useState(false);

  const { nodes, selectedId, selectNode, expandPathToSector } = useSectorTreeContext();
  const selectedItem = useMemo(() => {
    if (!selectedId || !nodes[selectedId]) return null;
    const node = nodes[selectedId];
    return {
      id: selectedId,
      type: node.type === 'sector' ? 'sector' : 'instrument',
      parentId: node.parentId,
    };
  }, [nodes, selectedId]);
  const setSelectedItem = useCallback((item) => {
    selectNode(item?.id ?? null);
  }, [selectNode]);

  useEffect(() => {
    if (id && idSetor) {
      selectNode(`instrument-${id}`);
      expandPathToSector(String(idSetor));
    }
  }, [expandPathToSector, id, idSetor, selectNode])

  const [openFormCreateInstrument, setOpenFormCreateInstrument] = useState({
    status: false,
    type: '',
  });
  const [openPreferenceForm, setOpenPreferenceForm] = useState(false)
  const handleOpenPreferenceForm = () => {
    setOpenPreferenceForm(true);
  };

  const handleClosePreferenceForm = () => {
    setOpenPreferenceForm(false);
  };

  const {user, hasEditPermission} = useAuth()
  const { asset, isLoadingAsset } = useAsset(selectedItem?.type === 'instrument' ? selectedItem?.id?.split("-")[1]  : null);
  const { 
    assets, 
    search, 
    setSearch, 
    assetFilterForm,
    isFetchingAssets,
    hasAssetsError,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    filtersSnapshot,
    filterSignature,
    rawFilterSignature,
    filtersPending,
  } = useAssets();
  const previousRawFilterSignatureRef = useRef(rawFilterSignature);

  const selectAll = selection.mode === 'all_filtered';
  const selectedCount = selectAll
    ? selection.selectedCount
    : selection.ids.length;
  const selected = useMemo(
    () => selection.mode === 'manual'
      ? selection.ids
        .map((selectedId) => selectedItemsById.get(String(selectedId)))
        .filter(Boolean)
      : [],
    [selectedItemsById, selection]
  );
  const selectionHasStaleFilters = selectAll
    && selection.filterSignature !== filterSignature;
  const selectionDisabled = filtersPending
    || isFetchingAssets
    || hasAssetsError
    || selectionHasStaleFilters;

  const clearSelection = useCallback(() => {
    setSelection(emptyManualSelection());
    setSelectedItemsById(new Map());
  }, []);
  
  const handleCloseCreateSector = () => {
    setOpenCreateSectorId(null)
    setCreatingSector(false)
  };

  const {
    mutateDeleteSectors,
    isDeletingSectors,
    mutateUpdateSectors, 
    mutateCreateSectors, 
    isLoadingUpdateSectors, 
    isLoadingCreateSectors,
    errorSectors,
  } = useSectorMutations(setOpenCreateSectorId, setSelectedItem, handleCloseCreateSector, setCreatingSector)
  
  const { 
    defaultAssets, 
    isFetching, 
    search: searchDA, 
    setSearch: setSearchDA, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDefaultAssets();
  
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
    duplicateInstrument
  } = useAssetMutations(handleCloseCreateInstrument, false);

  const handleCreate = (selectedItem) => {
    const params = {
      nome: "",
      cliente: user?.cliente,
    }
    if (selectedItem) {
      params['setorPaiId'] =  selectedItem?.type === 'sector' ? selectedItem?.id : selectedItem?.parentId
    }
    mutateCreateSectors(params)
  };

  const handleEdit = (selectedItem) => {
    setOpenCreateSectorId(selectedItem?.id)
  }


  const isMobile = useResponsive('down', 'md');

  const handleChangeCheckbox = (event) => {
    const { name, checked } = event.target;
    setValueCheckbox({ ...valueCheckbox, [name]: checked });
  };

  useEffect(() => {
    if (previousRawFilterSignatureRef.current !== rawFilterSignature) {
      if (selection.mode === 'all_filtered') clearSelection();
      previousRawFilterSignatureRef.current = rawFilterSignature;
    }
  }, [clearSelection, rawFilterSignature, selection.mode]);

  const handleCheckboxSelectAll = () => {
    if (selectAll) {
      clearSelection();
      return;
    }

    if (selectionDisabled) return;

    const matchedCount = Math.max(0, Number(assets?.count) || 0);
    if (!matchedCount) return;

    setSelectedItemsById(new Map());
    setSelection({
      mode: 'all_filtered',
      filtersSnapshot: { ...filtersSnapshot },
      filterSignature,
      matchedCount,
      selectedCount: Math.min(matchedCount, MAX_EXPORT_ITEMS),
    });
  };

  const handleRowSelect = (idInstrumento, instrumento) => {
    if (selection.mode === 'all_filtered') return;

    const idKey = String(idInstrumento);
    const isSelected = selection.ids.some((id) => String(id) === idKey);

    setSelectedItemsById((currentItems) => {
      const nextItems = new Map(currentItems);
      if (isSelected) nextItems.delete(idKey);
      else nextItems.set(idKey, { id: idInstrumento, instrumento });
      return nextItems;
    });
    setSelection((currentSelection) => {
      if (currentSelection.mode !== 'manual') return currentSelection;
      return {
        mode: 'manual',
        ids: isSelected
          ? currentSelection.ids.filter((id) => String(id) !== idKey)
          : [...currentSelection.ids, idInstrumento],
      };
    });
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setValueCheckbox({
      tag: true,
      numeroDeSerie: true,
      laboratorio: true,
      setor: true,
      posicaoDoInstrumento: true,
      dataUltimaCalibracao: true,
      dataDaProximaCalibracao: true,
      frequenciaDeCalibracao: true,
      dataUltimaChecagem: true,
      dataDaProximaChecagem: true,
      frequenciaDeChecagem: true,
      normativos: true,
      numeroUltimoCertificado: true,
    });
    setError(false);
    clearSelection()
    assetFilterForm.reset()
  };

  return {
    handleClose,
    handleClickOpen,
    handleCheckboxSelectAll,
    handleRowSelect,
    handleChangeCheckbox,
    isMobile,
    open,
    error,
    setError,
    search, 
    setSearch,
    selectAll,
    selection,
    selectedCount,
    selectionDisabled,
    valueCheckbox,
    selected,
    asset, 
    isLoadingAsset,
    mutateDeleteSectors,
    isDeletingSectors,
    mutateUpdateSectors, 
    mutateCreateSectors, 
    isLoadingUpdateSectors, 
    isLoadingCreateSectors,
    errorSectors,
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
    creatingSector,
    setCreatingSector,
  }
}

export default useAssetsVm
