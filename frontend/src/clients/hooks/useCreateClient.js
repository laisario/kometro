import { useMutation, useQueryClient } from 'react-query';
import { axios } from '../../api';
import { enqueueSnackbar } from 'notistack';

function useCreateClient(handleClose) {
  const queryClient = useQueryClient();

  const createClient = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/clientes/', data);
      return response.data;
    },
    onSuccess: () => {
      enqueueSnackbar('Cliente criado com sucesso!', {
        variant: 'success',
        autoHideDuration: 2000
      });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      if (handleClose) handleClose();
    },
    onError: (error) => {
      const message = error?.response?.data?.detail 
        || error?.response?.data?.empresa?.__all__?.[0]
        || error?.response?.data?.non_field_errors?.[0]
        || 'Erro ao criar cliente';
      enqueueSnackbar(message, {
        variant: 'error',
        autoHideDuration: 4000
      });
      return Promise.reject(error);
    }
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.patch(`/clientes/${id}/`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      enqueueSnackbar('Cliente atualizado com sucesso!', {
        variant: 'success',
        autoHideDuration: 2000
      });
      queryClient.invalidateQueries({ queryKey: ['clientes', id] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      if (handleClose) handleClose();
    },
    onError: (error) => {
      const message = error?.response?.data?.detail 
        || error?.response?.data?.empresa?.__all__?.[0]
        || error?.response?.data?.non_field_errors?.[0]
        || 'Erro ao atualizar cliente';
      enqueueSnackbar(message, {
        variant: 'error',
        autoHideDuration: 4000
      });
      return Promise.reject(error);
    }
  });

  return { createClient, updateClient };
}

export default useCreateClient;