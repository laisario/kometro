import { useQuery } from 'react-query';
import { axios } from '../../api';

const useOrdensServico = (responsavelId, options = {}) => {
  const { enabled = true, fetchAll = false } = options;
  
  const { 
    data: ordensServico, 
    error: errorOrdensServico, 
    isLoading: isLoadingOrdensServico,
    refetch,
  } = useQuery(
    ['ordens-servico', responsavelId, fetchAll], 
    async () => {
      const params = { page_size: 9999 };
      
      if (responsavelId && !fetchAll) {
        params.responsavel = responsavelId;
      }
      
      const response = await axios.get('/ordens-servico/', { params });
      return response?.data?.results || [];
    }, 
    { 
      enabled: enabled && (fetchAll || !!responsavelId),
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

export default useOrdensServico;
