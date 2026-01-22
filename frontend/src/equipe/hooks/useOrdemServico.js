import { useQuery } from 'react-query';
import { axios } from '../../api';

const useOrdemServico = (osId, options = {}) => {
  const { enabled = true } = options;
  
  const { 
    data: ordemServico, 
    error: errorOrdemServico, 
    isLoading: isLoadingOrdemServico,
    refetch,
  } = useQuery(
    ['ordem-servico', osId], 
    async () => {
      const response = await axios.get(`/ordens-servico/${osId}/`);
      return response?.data;
    }, 
    { 
      enabled: enabled && !!osId,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: 15 * 60 * 1000,
      cacheTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchInterval: false,
    }
  );

  return {
    ordemServico, 
    errorOrdemServico, 
    isLoadingOrdemServico,
    refetch,
  };
};

export default useOrdemServico;
