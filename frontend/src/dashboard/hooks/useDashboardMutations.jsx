import { enqueueSnackbar } from 'notistack';
import { useMutation, useQueryClient } from 'react-query';
import { axios } from '../../api';
import { getErrorMessage } from '../../utils/error';

function useDashboardMutations() {
  const queryClient = useQueryClient();

  const updateStats = async () => {
    const response = await axios.post('/dashboard/update_stats/');
    return response.data;
  };

  const { 
    mutate: mutateUpdateStats, 
    isLoading: isLoadingUpdateStats,
    data: updateStatsData,
    error: updateStatsError
  } = useMutation({
    mutationFn: updateStats,
    onSuccess: (data) => {
      enqueueSnackbar('Atualização iniciada! Os dados serão atualizados.', {
        variant: 'success'
      });

      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error?.response?.status) || 'Erro ao iniciar atualização', {
        variant: 'error'
      });
    }
  });

  return {
    mutateUpdateStats,
    isLoadingUpdateStats,
    updateStatsData,
    updateStatsError
  };
}

export default useDashboardMutations;
