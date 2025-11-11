import React from 'react'
import { useQuery } from 'react-query';
import { axios } from '../../api';

function useNorms(id) {
  const { 
    data, 
  } = useQuery({
    queryKey: ['normas', id], 
    queryFn: async () => {
      const response = await axios.get(`/normativos/`, {params: { cliente: id || null }});
      return response?.data;
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchInterval: false,
  });
  return {
    normas: data,
  }
}

export default useNorms