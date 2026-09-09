import { useCallback, useEffect, useMemo, useState } from "react";
import { useSectorTreeContext } from "../contexts/SectorTreeContext";
import useResponsive from '../../theme/hooks/useResponsive';
import useAsset from "../hooks/useAsset";
import useSectorMutations from "../hooks/useSectorMutations";
import useDefaultAssets from "../hooks/useDefaultAssets";
import useAssetMutations from "../hooks/useAssetMutations";
import useAuth from "../../auth/hooks/useAuth";
import useAssets from "../hooks/useAssets";

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
  });
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
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
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useAssets();
  
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
    if (selectAll) {
      setSelected(assets?.results?.map((intrument) => ({id: intrument?.id, instrumento: intrument})))
    } else {
      setSelected([])
    }
  }, [selectAll])

  const handleCheckboxSelectAll = () => {
    setSelectAll((oldSelectAll) => !oldSelectAll)
  }

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
    });
    setError(false);
    setSelectAll(false)
    assetFilterForm.reset()
  };

  return {
    handleClose,
    handleClickOpen,
    handleCheckboxSelectAll,
    handleChangeCheckbox,
    isMobile,
    open,
    error,
    setError,
    search, 
    setSearch,
    selectAll,
    valueCheckbox,
    selected,
    setSelected,
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
