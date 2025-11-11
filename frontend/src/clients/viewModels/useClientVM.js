import React, { useState } from 'react';
import useClient from '../hooks/useClient';
import useResponsive from '../../theme/hooks/useResponsive';
import useClientAssets from '../../assets/hooks/useClientAsset';
import useAssetMutations from '../../assets/hooks/useAssetMutations';
import useDefaultAssets from '../../assets/hooks/useDefaultAssets';

function useClientVM(id) {
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [editFormState, setEditFormState] = useState({ open: false, instrument: null });

  const {
    client, 
    errorClient, 
    isLoadingClient, 
  } = useClient(id);

  const {
    assets, 
    isLoadingAssets, 
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    search,
    setSearch,
  } = useClientAssets(id, true);

  const { 
    isDeleting,
    mutateDelete,
  } = useAssetMutations();

  const { 
    defaultAssets, 
    isFetching, 
    search: searchDA, 
    setSearch: setSearchDA, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDefaultAssets(id);

  const handleCloseCreateForm = () => setOpenCreateForm(false);
  const handleCloseEditForm = () => {
    setEditFormState({ open: false, instrument: null });
  };

  const handleClose = (type) => {
    if (type === 'edit') {
      handleCloseEditForm();
    } else {
      handleCloseCreateForm();
    }
  };

  const { 
    mutateCreateClient,
    mutateUpdateClient,
    isLoadingUpdateClient,
    mutateDeleteClient,
    error,
    setError,
  } = useAssetMutations(handleClose, true);
  
  const isMobile = useResponsive('down', 'md');
  
  const handleOpenCreateForm = () => setOpenCreateForm(true);
  const handleOpenEditForm = (instrument) => {
    setEditFormState({ open: true, instrument });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    client, 
    errorClient, 
    isLoadingClient,
    isMobile,
    handleOpenCreateForm,
    handleCloseCreateForm,
    handleOpenEditForm,
    handleCloseEditForm,
    handleChangePage,
    handleChangeRowsPerPage,
    search,
    setSearch,
    isDeleting,
    mutateDelete,
    openCreateForm,
    editFormState,
    assets,
    isLoadingAssets,
    rowsPerPage,
    page,
    defaultAssets, 
    isFetching, 
    searchDA, 
    setSearchDA, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    mutateCreateClient,
    mutateUpdateClient,
    isLoadingUpdateClient,
    mutateDeleteClient,
    error,
    setError,
  }
}

export default useClientVM