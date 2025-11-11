import { axios } from '../../api';
import { useQuery } from 'react-query';


const useProposal = (id, cliente) => {
  const { 
    data: proposal, 
    error: errorProposal, 
    isFetching: isLoadingProposal, 
  } = useQuery({
    queryKey: ['propostas', id], 
    queryFn: async () => {
      let params = { page_size: 9999}
      if (cliente !== null) {
        params = { ...params, cliente, }
      }
      const response = await axios.get(`/propostas/${id}/`, { params });

      return response?.data;
    },
    enabled: !!id,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  });

  return {
    proposal, 
    errorProposal, 
    isLoadingProposal, 
  }
}

export default useProposal