import React from 'react'
import { useQuery } from 'react-query';
import { axios } from '../../api';

function useGroups() {
  const { 
      data: groups,
      isFetching
    } = useQuery({
      queryKey: [
        'grupos', 
      ], 
      queryFn: async () => {
        const response = await axios.get('/grupos/');
        
        return response?.data;
      },
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  return {
    groups,
    isFetching
  }
}

export default useGroups