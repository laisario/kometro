import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query';
import 'dayjs/locale/pt-br';
import { axios } from '../../api';
import {getErrorMessage} from '../../utils/error'
import { buildTreeItems } from './useSectorTree';

function useSectorMutations(setOpenCreateSectorId, setExpandedItems, setSelectedItem, handleCloseCreateSector) {
  const [error, setError] = useState({});
  const queryClient = useQueryClient();

  const insertChildByParentId = (tree, parentId, child) => {
    if (!parentId) {
      return [...tree, child];
    }
    return tree.map((node) => {
      if (String(node.id) === String(parentId)) {
        return {
          ...node,
          children: [...(node.children || []), child],
        };
      }
  
      if (node.children?.length) {
        return {
          ...node,
          children: insertChildByParentId(node.children, parentId, child),
        };
      }
  
      return node;
    });
  }

  function updateLabelById(treeData, targetId, newLabel) {
    return treeData.map((item) => {
      if (item.id === targetId) {
        return { ...item, label: newLabel };
      }
  
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: updateLabelById(item.children, targetId, newLabel),
        };
      }
  
      return item;
    });
  }

  function removeItemById(treeData, targetId) {
    return treeData
      .filter((item) => item.id !== targetId)
      .map((item) => {
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: removeItemById(item.children, targetId),
          };
        }
        return item;
      });
  }

  const deleteSector = async (data) => {
    await axios.delete(`/setores/${Number(data?.id)}/`);
  };
  
  const { 
    mutate: mutateDelete, 
    isLoading: isDeleting 
  } = useMutation({
    mutationFn: deleteSector,
    onMutate: async (sectorToDelete) => {
      await queryClient.cancelQueries({ queryKey: ['setores'] });
      const previousSectors = queryClient.getQueryData(['setores']);

      const updatedTree = removeItemById(previousSectors, sectorToDelete?.id)

      queryClient.setQueryData(['setores'], updatedTree);
  
      return { previousSectors };
    },

    onError: (erro) => {
      if (context?.previousSectors) {
        queryClient.setQueryData(['setores'], context.previousSectors);
      }
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000,
      });
    },
  })

  const updateSector = async (data) => {
    const response = await axios.patch(`/setores/${data?.id}/`, data);
    return response;
  }

  const { 
    mutate: mutateUpdate, 
    isLoading: isLoadingUpdate, 
  } = useMutation({
    mutationFn: updateSector,
    onMutate: async (newSector) => {
      await queryClient.cancelQueries({ queryKey: ['setores'] });
      const previousSectors = queryClient.getQueryData(['setores']);
      const optimisticSector = buildTreeItems(newSector);

      const updatedTree = updateLabelById(previousSectors, optimisticSector?.id, optimisticSector?.label);
      queryClient.setQueryData(['setores'], updatedTree);
  
      return { previousSectors };
    },
    onSuccess: () => {
      handleCloseCreateSector()
    },
    onError: (erro) => {
      if (context?.previousSectors) {
        queryClient.setQueryData(['setores'], context.previousSectors);
      }

      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000,
      });
    }
  })

  const createSector = async (data) => {
    let response
    if (data.id) {
      response = await axios.patch(`/setores/${data.id}/`, data);
    } else {
      response = await axios.post(`/setores/`, data);
    }
    return response
  }


  const {
    mutate: mutateCreate,
    isLoading: isLoadingCreate,
  } = useMutation({
    mutationFn: createSector,
    onMutate: async (newSector) => {
      await queryClient.cancelQueries({ queryKey: ['setores'] });
  
      const previousSectors = queryClient.getQueryData(['setores']);
      const optimisticSector = buildTreeItems({
        ...newSector,
        id: 999,
        subsetores: [],
      });

      const updatedSectors = insertChildByParentId(
        previousSectors || [],
        newSector?.setorPaiId,
        optimisticSector
      );

      queryClient.setQueryData(['setores'], updatedSectors);
  
      return { previousSectors };
    },
  
    onError: (err, _newSector, context) => {
      if (context?.previousSectors) {
        queryClient.setQueryData(['setores'], context.previousSectors);
      }
  
      setError(err?.response?.data);
      enqueueSnackbar(getErrorMessage(err?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000,
      });
    },
  
    onSuccess: (res, newSector, context) => {
      const sector = buildTreeItems(res?.data)
      const updatedSectors = insertChildByParentId(
        context.previousSectors || [],
        newSector?.setorPaiId,
        sector,
      );
      queryClient.setQueryData(['setores'], updatedSectors);
      setOpenCreateSectorId(sector?.id)
      setSelectedItem({id: sector?.id, type: sector?.itemType, parentId: sector?.parentId})
      setExpandedItems(expandedItems => [...expandedItems, newSector?.setorPaiId])
    },
  });

  return {
    mutateDeleteSectors: mutateDelete,
    isDeletingSectors :isDeleting,
    mutateUpdateSectors: mutateUpdate, 
    mutateCreateSectors: mutateCreate, 
    isLoadingUpdateSectors: isLoadingUpdate, 
    isLoadingCreateSectors: isLoadingCreate,
    errorSectors: error,
  }
}

export default useSectorMutations