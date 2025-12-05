import { useQuery } from 'react-query';
import {axios} from '../../api'

const useUsers = (id, options = {}) => {
  const { isStaff } = options;
  
  const { 
    data: users, 
    erro: errorUsers, 
    isLoading: isLoadingUsers, 
  } = useQuery(['users', id, isStaff], async () => {
    const params = { page_size: 9999 };
    
    // Adiciona filtro de staff se especificado
    if (isStaff !== undefined) {
      params.is_staff = isStaff;
    }
    
    if (id) {
      const response = await axios.get(`/users/${id}/`, { params });
      return response?.data;
    }
    const response = await axios.get('/users/', { params });
    return response?.data?.results;
  }, { 
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchInterval: false,
  });

  return {
    users, 
    errorUsers, 
    isLoadingUsers, 
  }
}

export default useUsers;