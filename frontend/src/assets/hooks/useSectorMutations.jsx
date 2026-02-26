import { enqueueSnackbar } from 'notistack';
import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from 'react-query';
import 'dayjs/locale/pt-br';
import { axios } from '../../api';
import {getErrorMessage} from '../../utils/error'
import { buildTreeItems } from './useSectorTree';

function useSectorMutations(setOpenCreateSectorId, setExpandedItems, setSelectedItem, handleCloseCreateSector, setCreatingSector) {
  const [error, setError] = useState({});
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);

  // Track mount/unmount to prevent setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const deleteSector = async (data) => {
    await axios.delete(`/setores/${Number(data?.id)}/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        action: data?.action,
        instrumentsToMove: data?.instrumentsToMove || [],
        instrumentsToDelete: data?.instrumentsToDelete || [],
        targetSetorId: data?.targetSetorId || null,
        newSetorName: data?.newSetorName || null,
      }
    });
  };
  
  const { 
    mutate: mutateDelete, 
    isLoading: isDeleting 
  } = useMutation({
    mutationFn: deleteSector,
    
    onSuccess: (_, variables) => {
      // ✅ Nova estratégia: invalidate para forçar refetch
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] });
      
      const actionMessages = {
        'delete_all': 'Setor e instrumentos excluídos com sucesso!',
        'transfer_existing': 'Setor excluído e instrumentos transferidos com sucesso!',
        'transfer_new': 'Setor excluído e instrumentos transferidos para novo setor com sucesso!',
      };
      const message = actionMessages[variables?.action] || 'Setor excluído com sucesso!';
      
      enqueueSnackbar(message, {
        variant: 'success',
        autoHideDuration: 3000,
      });
    },

    onError: (erro) => {
      if (mountedRef.current) {
        setError(erro?.response?.data)
        const errorMessage = erro?.response?.data?.detail || getErrorMessage(erro?.response?.status);
        enqueueSnackbar(errorMessage, {
          variant: 'error',
          autoHideDuration: 2000,
        });
      }
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
    
    onSuccess: () => {
      // ✅ Nova estratégia: invalidate para forçar refetch
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      
      if (mountedRef.current) {
        handleCloseCreateSector()
      }
    },
    
    onError: (erro) => {
      if (mountedRef.current) {
        setError(erro?.response?.data)
        enqueueSnackbar(getErrorMessage(erro?.response?.status), {
          variant: 'error',
          autoHideDuration: 2000,
        });
      }
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
    
    onSuccess: (res) => {
      if (!mountedRef.current) return;

      const realSector = buildTreeItems(res?.data);
      if (!realSector) {
        console.error('[useSectorMutations] Failed to build tree items from response:', res?.data);
        return;
      }
      
      // ✅ Nova estratégia: invalidate para refetch + mostrar input de rename no topo
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      
      if (mountedRef.current) {
        // Salvar ID do setor criado para renomear depois
        setOpenCreateSectorId(realSector?.id);
        setSelectedItem({id: realSector?.id, type: realSector?.itemType, parentId: realSector?.parentId});
        
        // Ativar modo de criação (mostra input de rename no topo)
        setCreatingSector(true);
      }
    },
    
    onError: (err) => {
      if (mountedRef.current) {
        setError(err?.response?.data);
        enqueueSnackbar(getErrorMessage(err?.response?.status), {
          variant: 'error',
          autoHideDuration: 2000,
        });
      }
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