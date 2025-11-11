import { useQuery } from 'react-query';
import {axios} from '../../api'

const useUsers = (id) => {
  const { 
    data: users, 
    erro: errorUsers, 
    isLoading: isLoadingUsers, 
  } = useQuery(['users', id], async () => {
    if (id) {
      const response = await axios.get(`/users/${id}/`, { params: { page_size: 9999 } });
      return response?.data;
    }
    const response = await axios.get('/users/', { params: { page_size: 9999 } });
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