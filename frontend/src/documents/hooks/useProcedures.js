import { useQuery } from 'react-query';
import { axios } from '../../api';

const useProcedures = (id) => {
  const { data, error, isLoading } = useQuery(['procedimentos', id], async () => {
    if (id) {
      const response = await axios.get(`/procedimentos/${id}/`, { params: { page_size: 9999 } });
      return response?.data;
    }
    const response = await axios.get('/procedimentos/', { params: { page_size: 9999 } });
    return response?.data?.results;
  }, {refetchOnReconnect: false,
    refetchOnWindowFocus: false});

  return {
    procedures: data, 
    error, 
    isLoading, 
  }

}

export default useProcedures;