import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { axios } from '../../api'
import { enqueueSnackbar } from 'notistack';
import { getErrorMessage } from '../../utils/error';

function useClientMutations(handleClose) {
    const queryClient = useQueryClient();
    const closeFn = typeof handleClose === 'function' ? handleClose : () => {};
  
    const { 
      mutate: updateCriterion, 

    } = useMutation({
      mutationFn: async(data) => await axios.patch(`/clientes/${data?.id}/atualizar_criterio_frequencia_padrao/`, {
        criterioFrequencia: data?.criterion
      }),
      onSuccess: () => {
        enqueueSnackbar('Preferência configurada com sucesso!', {
          variant: 'success',
          autoHideDuration: 2000
        })
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        handleClose()
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error?.status), {
          variant: 'error',
          autoHideDuration: 2000
        })
      }
    })

    const { 
      mutate: deleteClients, 
      isLoading: isDeleting 
    } = useMutation({
      mutationFn: async (ids) => Promise.all(ids?.map((id) => axios.delete(`/clientes/${id}/`))),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        enqueueSnackbar('Cliente deletado com sucesso!', {
          variant: 'success'
        });
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error?.status), {
          variant: 'error',
          autoHideDuration: 2000
        });
      }
    })

    const {
      mutate: removeUser,
      isLoading: isRemovingUser,
    } = useMutation({
      mutationFn: async ({ clienteId, userId }) => {
        await axios.delete(`/clientes/${clienteId}/usuarios/${userId}/`);
      },
      onSuccess: (_, { clienteId, userId }) => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        enqueueSnackbar('Usuário excluído', {
          variant: 'success',
          autoHideDuration: 2000
        });
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error?.status), {
          variant: 'error',
          autoHideDuration: 2000
        });
      }
    });
  
  return {
    updateCriterion,
    deleteClients,
    isDeleting,
    removeUser,
    isRemovingUser
  }
}

export default useClientMutations