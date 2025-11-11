import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { axios } from '../../api'
import { enqueueSnackbar } from 'notistack';

function useClientMutations(handleClose) {
    const queryClient = useQueryClient();
  
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
  
  return {
    updateCriterion,
    deleteClients,
    isDeleting
  }
}

export default useClientMutations