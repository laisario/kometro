import { useQuery } from 'react-query';
import { axios } from '../../api';

function useClient(id) {
  const { 
    data: client, 
    error: errorClient, 
    isLoading: isLoadingClient, 
  } = useQuery({
    queryKey: ['clientes', id], 
    queryFn: async () => {
      const response = await axios.get(`/clientes/${id}/`);
      return response?.data;
    },
    enabled: !!id,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchInterval: false,
  });
 
  return {
    client, 
    errorClient, 
    isLoadingClient,
  }
}

export default useClient