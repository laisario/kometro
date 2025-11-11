import { useQuery, useInfiniteQuery } from "react-query";
import { useEffect, useState, useMemo } from "react";
import _, {debounce} from 'lodash';
import { axios } from "../../api";

const useClientAssets = (clientId, table = false, infinite = false) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { 
    data: assets, 
    error: errorAssets, 
    isLoading: isLoadingAssets, 
  } = useQuery({
    queryKey: ['instrumentos', clientId, debouncedSearch, page, rowsPerPage], 
    queryFn: async () => {
      const response = await axios.get(`/instrumentos/`, { 
        params: { 
          page_size: table ? rowsPerPage : 20, 
          client: clientId,  
          page: page + 1,
          search: debouncedSearch, 
      }});
      return response?.data;
    },
    enabled: !!clientId && !infinite,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetchingInfinite,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['instrumentos-infinite', clientId, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get('/instrumentos/', {
        params: {
          page_size: 20,
          client: clientId,
          page: pageParam,
          search: debouncedSearch,
        },
      });
      return response?.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.next) {
        const url = new URL(lastPage.next);
        return parseInt(url.searchParams.get('page'));
      }
      return undefined;
    },
    enabled: !!clientId && infinite,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const allInfiniteAssets = useMemo(() => {
    if (infiniteData) {
      return infiniteData.pages.flatMap((page) => page.results);
    }
    return [];
  }, [infiniteData]);

  const handleSearch = debounce((value) => setDebouncedSearch(value), 500);
  
  useEffect(() => { handleSearch(search) }, [search, handleSearch]);

  return {
    assets: infinite ? { results: allInfiniteAssets, count: infiniteData?.pages[0]?.count } : assets, 
    errorAssets, 
    isLoadingAssets: infinite ? isFetchingInfinite : isLoadingAssets,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    search,
    setSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  }
};

export default useClientAssets;