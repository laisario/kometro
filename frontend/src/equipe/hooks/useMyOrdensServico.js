import { useQuery } from 'react-query';
import { axios } from '../../api';

const useMyOrdensServico = (options = {}) => {
  const { limit, enabled = true } = options;
  
  const { 
    data: ordensServico, 
    error: errorOrdensServico, 
    isLoading: isLoadingOrdensServico,
    refetch,
  } = useQuery(
    ['ordens-servico', 'minhas', limit], 
    async () => {
      const params = {};
      if (limit) {
        params.limit = limit;
      }
      
      const response = await axios.get('/ordens-servico/minhas/', { params });
      return response?.data || [];
    }, 
    { 
      enabled,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: 15 * 60 * 1000,
      cacheTime: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchInterval: false,
    }
  );

  return {
    ordensServico, 
    errorOrdensServico, 
    isLoadingOrdensServico,
    refetch,
  };
};

export default useMyOrdensServico;
