import { useQuery } from 'react-query';
import { axios } from '../../api';


const useCalibration = (id, debouncedSearch, instrumento, checagem) => {
  const { data, isLoading: isLoadingCalibrations  } = useQuery(
    ['calibracoes', debouncedSearch, instrumento, id, checagem], async () => {
      if (id) {
        const response = await axios.get(`/calibracoes/${id}/`, { params: { page_size: 9999 } });
        return response?.data;
      }
      
      const response = await axios.get('/calibracoes/', { params: { page_size: 9999, ordem_de_servico: debouncedSearch, instrumento, checagem } });
      return response?.data?.results;
    }, { 
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      enabled: !!instrumento,
    });

  return {
    data,
    isLoadingCalibrations
  }
};

export default useCalibration;