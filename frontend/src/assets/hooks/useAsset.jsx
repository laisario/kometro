import { useQuery } from "react-query";
import { axios } from "../../api";

const useAsset = (id) => {
  const { 
    data: asset, 
    error: errorAsset, 
    isFetching: isLoadingAsset, 
    refetch: refetchAsset 
  } = useQuery({
    queryKey: ['instrumentos', id], 
    queryFn: async () => {
      const response = await axios.get(`/instrumentos/${id}/`);
      return response?.data;
    },
    enabled: !!id,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    asset, 
    errorAsset, 
    isLoadingAsset, 
    refetchAsset,
  }
};

export default useAsset;