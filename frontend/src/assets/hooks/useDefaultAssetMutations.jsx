import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query';
import 'dayjs/locale/pt-br';
import { axios } from '../../api';
import { getErrorMessage } from '../../utils/error';

function useDefaultAssetMutations(onClose, form, setInstrumentoSelecionado) {
  const [error, setError] = useState({});
  const queryClient = useQueryClient();

  const createBaseInstrument = async (data) => {
    const response = await axios.post(`/instrumentos-empresa/`, data);
    return response
  }

  const updateBaseInstrument = async ({ id, data, cliente_id }) => {
    const url = cliente_id 
      ? `/instrumentos-empresa/${id}/?cliente_id=${cliente_id}`
      : `/instrumentos-empresa/${id}/`;
    const response = await axios.patch(url, data);
    return response
  }

  const deleteBaseInstrument = async ({ id, clientId }) => {
    const url = clientId 
      ? `/instrumentos-empresa/${id}/?cliente_id=${clientId}`
      : `/instrumentos-empresa/${id}/`;
    const response = await axios.delete(url);
    return response
  }

  const removeFromClient = async ({id, cliente}) => {
    const response = await axios.post(`/instrumentos-empresa/${id}/remove_from_client/`, { cliente, id, });
    return response
  }

  const assignToClient = async ({ id, cliente_id }) => {
    const response = await axios.post(`/instrumentos-empresa/${id}/assign_to_client/`, { cliente_id });
    return response
  }

  const unassignFromClient = async ({ id, cliente_id }) => {
    const response = await axios.delete(`/instrumentos-empresa/${id}/unassign_from_client/`, { data: { cliente_id } });
    return response
  }


  const { 
    mutate: mutateCreate, 
    isLoading: isLoadingCreate, 
  } = useMutation({
    mutationFn: createBaseInstrument,
    onSuccess: (novoInstrumento) => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos-empresa'] })
      form.reset()
      setInstrumentoSelecionado(novoInstrumento?.data);
      onClose()
      enqueueSnackbar('Instrumento criado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error'
      });
    }
  })

  const { 
    mutate: mutateUpdate, 
    isLoading: isLoadingUpdate, 
  } = useMutation({
    mutationFn: updateBaseInstrument,
    onSuccess: (instrumentoAtualizado) => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos-empresa'] })
      form.reset()
      setInstrumentoSelecionado(instrumentoAtualizado?.data);
      onClose()
      enqueueSnackbar('Instrumento atualizado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error'
      });
    }
  })

  const { 
    mutate: mutateDelete, 
    isLoading: isLoadingDelete, 
  } = useMutation({
    mutationFn: deleteBaseInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos-empresa'] })
      form.reset()
      setInstrumentoSelecionado(null);
      onClose()
      enqueueSnackbar('Instrumento excluído com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error'
      });
    }
  })

  const { 
    mutate: mutateRemoveFromClient, 
    isLoading: isLoadingRemove, 
  } = useMutation({
    mutationFn: removeFromClient,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos-empresa'] })
      onClose()
      enqueueSnackbar('Instrumento removido da sua lista!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error'
      });
    }
  })

  const { 
    mutate: mutateAssignToClient, 
    isLoading: isLoadingAssign, 
  } = useMutation({
    mutationFn: assignToClient,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos-empresa'] })
      enqueueSnackbar(response?.data?.detail || 'Instrumento atribuído ao cliente com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error'
      });
    }
  })

  const { 
    mutate: mutateUnassignFromClient, 
    isLoading: isLoadingUnassign, 
  } = useMutation({
    mutationFn: unassignFromClient,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos-empresa'] })
      enqueueSnackbar(response?.data?.detail || 'Instrumento desatribuído do cliente com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error'
      });
    }
  })

  return {
    mutateCreateDefaultAsset: mutateCreate,
    isLoadingCreateDefaultAsset: isLoadingCreate,
    mutateUpdateDefaultAsset: mutateUpdate,
    isLoadingUpdateDefaultAsset: isLoadingUpdate,
    mutateDeleteDefaultAsset: mutateDelete,
    isLoadingDeleteDefaultAsset: isLoadingDelete,
    mutateRemoveFromClient: mutateRemoveFromClient,
    isLoadingRemoveFromClient: isLoadingRemove,
    mutateAssignToClient: mutateAssignToClient,
    isLoadingAssignToClient: isLoadingAssign,
    mutateUnassignFromClient: mutateUnassignFromClient,
    isLoadingUnassignFromClient: isLoadingUnassign,
    errorDefaultAsset: error,
    setError,
  }
}

export default useDefaultAssetMutations