import { useQuery } from 'react-query';
import { axios } from '../../api';

function useUsers(clienteId, isAdmin) {
  const queryKey = isAdmin 
    ? ['usuarios-staff'] 
    : clienteId 
      ? ['clientes', clienteId]
      : ['usuarios-staff'];

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isAdmin) {
        const response = await axios.get('/users/', { 
          params: { is_staff: true } 
        });
        return response?.data?.results || [];
      } else if (clienteId) {
        const response = await axios.get(`/clientes/${clienteId}/`);
        return response?.data?.usuarios || [];
      }
      return [];
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: isAdmin || !!clienteId,
  });

  return {
    users: data,
    isFetching
  };
}

export default useUsers;