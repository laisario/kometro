import React from 'react'
import { useQuery } from 'react-query';
import { axios } from '../../api';

function useInvites(clienteId) {
  const queryKey = clienteId 
    ? ['convites', clienteId] 
    : ['convites'];
  
  const params = clienteId 
    ? { cliente: clienteId } 
    : {};

  const { 
      data: invites,
      isFetching,
    } = useQuery({
      queryKey, 
      queryFn: async () => {
        const response = await axios.get('/convites/', { params });
        
        return response?.data;
      },
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
  });
  return {
    invites,
    isFetching
  }
}

export default useInvites