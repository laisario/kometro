import React, { useEffect, useState, useMemo } from 'react'
import { axios } from "../../api";
import {debounce} from 'lodash';
import { useInfiniteQuery } from "react-query";

function useDefaultAssets(cliente_id = null) {
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [search, setSearch] = useState('')
  
  const { 
    data, 
    error,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['instrumentos-empresa', debouncedSearch, cliente_id], 
    queryFn: async ({ pageParam = 1, signal }) => {
      const params = { 
        page: pageParam,
        page_size: 20,  
        search: debouncedSearch 
      };
      
      // Add cliente_id to params if provided
      if (cliente_id) {
        params.cliente_id = cliente_id;
      }
      
      const response = await axios.get(`/instrumentos-empresa/`, { 
        params,
        signal 
      });
      return response?.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return url.searchParams.get('page');
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const handleSearch = useMemo(
    () => debounce((value) => setDebouncedSearch(value), 400),
    []
  );

  useEffect(() => {
    handleSearch((search ?? '').trim());
    return () => handleSearch.cancel();
  }, [search, handleSearch]);
  
  const allResults = useMemo(
    () => data?.pages?.flatMap(page => page.results) || [],
    [data?.pages]
  );

  return {
    defaultAssets: { results: allResults, count: data?.pages?.[0]?.count || 0 },
    errorDefaultAssets: error,
    search,
    setSearch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  }
}

export default useDefaultAssets


