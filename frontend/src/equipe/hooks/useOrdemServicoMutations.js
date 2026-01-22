import { useMutation, useQueryClient } from 'react-query';
import { axios } from '../../api';
import { enqueueSnackbar } from 'notistack';

const useOrdemServicoMutations = () => {
  const queryClient = useQueryClient();

  const updateOrdemServico = async ({ osId, data }) => {
    const response = await axios.patch(`/ordens-servico/${osId}/`, data);
    return response?.data;
  };

  const { mutate: mutateUpdateOrdemServico, isLoading: isLoadingUpdate } = useMutation(
    updateOrdemServico,
    {
      onSuccess: (data, variables) => {
        // Invalidate related queries
        queryClient.invalidateQueries(['ordens-servico']);
        queryClient.invalidateQueries(['ordem-servico', variables.osId]);
        
        enqueueSnackbar('Ordem de serviço atualizada com sucesso!', {
          variant: 'success'
        });
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.detail || 
                           error?.response?.data?.message || 
                           'Erro ao atualizar ordem de serviço. Tente novamente.';
        enqueueSnackbar(errorMessage, {
          variant: 'error'
        });
      },
    }
  );

  return {
    mutateUpdateOrdemServico,
    isLoadingUpdate,
  };
};

export default useOrdemServicoMutations;
