import { useContext, useEffect, useState } from "react";
import AssetsContext from "../components/context";
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
  const [expandedItems, setExpandedItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [creatingSector, setCreatingSector] = useState(false);

  const { selectNode } = useSectorTreeContext();

  useEffect(() => {
    if (id && idSetor) {
      setSelectedItem({id: `instrument-${id}`, type: 'instrument', parentId: idSetor})
      selectNode(`instrument-${id}`);
      setExpandedItems(prevExpandedItems => {
        const idSetorStr = String(idSetor);
        if (prevExpandedItems?.includes(idSetorStr)) {
          return prevExpandedItems;
        }
        return [...(prevExpandedItems || []), idSetorStr];
      })
    }
  }, [id, idSetor, selectNode])

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
  } = useSectorMutations(setOpenCreateSectorId, setExpandedItems, setSelectedItem, handleCloseCreateSector, setCreatingSector)
  
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
      nome: "Novo setor",
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
    setError,
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
    creatingSector,
    setCreatingSector,
  }
}

export default useAssetsVm