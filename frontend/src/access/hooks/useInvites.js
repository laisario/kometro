import React from 'react'
import { useQuery } from 'react-query';
import { axios } from '../../api';

function useInvites() {
  const { 
      data: invites,
      isFetching,
    } = useQuery({
      queryKey: [
        'convites', 
      ], 
      queryFn: async () => {
        const response = await axios.get('/convites/');
        
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