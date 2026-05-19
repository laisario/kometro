import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { axios } from '../../api'
import { enqueueSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../utils/error';

function normalizeIds(ids) {
  return Array.isArray(ids) ? ids.filter((id) => id !== undefined && id !== null) : [];
}

function buildDeleteSummary(results) {
  const deleted = results.filter((result) => result.status === 'fulfilled');
  const failed = results.filter((result) => result.status === 'rejected');

  return {
    deletedCount: deleted.length,
    failedCount: failed.length,
    firstError: failed[0]?.reason,
  };
}

function buildDeleteClientsError(summary) {
  const error = new Error(
    summary.deletedCount > 0
      ? `${summary.deletedCount} cliente(s) excluído(s), ${summary.failedCount} falharam.`
      : 'Não foi possível excluir os clientes selecionados.'
  );
  error.deleteSummary = summary;
  error.response = summary.firstError?.response;
  error.status = summary.firstError?.response?.status || summary.firstError?.status;
  return error;
}

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
        closeFn()
      },
      onError: (error) => {
        console.error('[CLIENTS_UPDATE_CRITERION_ERROR]', error);
        enqueueSnackbar(getApiErrorMessage(error), {
          variant: 'error',
          autoHideDuration: 2000
        })
      }
    })

    const { 
      mutate: deleteClients, 
      isLoading: isDeleting 
    } = useMutation({
      mutationFn: async (ids) => {
        const clientIds = normalizeIds(ids);
        console.debug('[CLIENTS_DELETE_MUTATION_START]', { ids: clientIds });

        if (!clientIds.length) {
          const error = new Error('Nenhum cliente selecionado para exclusão.');
          console.error('[CLIENTS_DELETE_MUTATION_STOPPED]', { ids });
          throw error;
        }

        const results = await Promise.allSettled(
          clientIds.map((id) => {
            console.debug('[CLIENTS_DELETE_REQUEST]', { id, url: `/clientes/${id}/` });
            return axios.delete(`/clientes/${id}/`);
          })
        );
        const summary = buildDeleteSummary(results);
        console.debug('[CLIENTS_DELETE_MUTATION_RESULT]', summary);

        if (summary.failedCount > 0) {
          throw buildDeleteClientsError(summary);
        }

        return summary;
      },
      onSuccess: (summary) => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        queryClient.invalidateQueries({ queryKey: ['clientes-infinite'] });
        enqueueSnackbar(
          summary.deletedCount > 1
            ? `${summary.deletedCount} clientes excluídos com sucesso!`
            : 'Cliente excluído com sucesso!',
          {
            variant: 'success'
          }
        );
      },
      onError: (error) => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        queryClient.invalidateQueries({ queryKey: ['clientes-infinite'] });
        console.error('[CLIENTS_DELETE_ERROR]', error);

        const summary = error?.deleteSummary;
        const message = summary?.deletedCount > 0
          ? `${summary.deletedCount} cliente(s) excluído(s), ${summary.failedCount} falharam. ${getApiErrorMessage(error)}`
          : getApiErrorMessage(error, 'Não foi possível excluir os clientes selecionados.');

        enqueueSnackbar(message, {
          variant: summary?.deletedCount > 0 ? 'warning' : 'error',
          autoHideDuration: 4000
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
        enqueueSnackbar('Acesso do usuário removido', {
          variant: 'success',
          autoHideDuration: 2000
        });
      },
      onError: (error) => {
        enqueueSnackbar(getApiErrorMessage(error, 'Não foi possível remover o acesso do usuário.'), {
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
