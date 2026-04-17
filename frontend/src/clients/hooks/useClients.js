import { useQuery, useInfiniteQuery } from "react-query";
import { axios } from "../../api";
import { useEffect, useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { debounce } from 'lodash';

const useClients = (user, infinite = false) => {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectSearch, setSelectSearch] = useState('');

  const formFilter = useForm({defaultValues: { search: "" }});

  const {
    search: formSearch,
  } = useWatch({ control: formFilter.control });

  // Debounce for table filter (non-infinite)
  const handleTableSearch = useMemo(
    () => debounce((s) => setDebouncedSearch(s), 1500),
    []
  );

  useEffect(() => {
    if (infinite) return;
    handleTableSearch(formSearch);
    return () => handleTableSearch.cancel();
  }, [formSearch, handleTableSearch, infinite]);

  // Debounce for select search (infinite)
  const handleSelectSearch = useMemo(
    () => debounce((s) => setDebouncedSearch(s), 500),
    []
  );

  useEffect(() => {
    if (!infinite) return;
    handleSelectSearch(selectSearch);
    return () => handleSelectSearch.cancel();
  }, [selectSearch, handleSelectSearch, infinite]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const {
      data: clients,
      error: errorClients,
      isFetching: isLoadingClients,
  } = useQuery(
      ['clientes', page, rowsPerPage, debouncedSearch], async () => {
        const response = await axios.get('/clientes/', { params: { page: page + 1, page_size: rowsPerPage, search: debouncedSearch } });
        return response?.data;
      }, {
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        enabled: !infinite && !!user?.admin,
        staleTime: 15 * 60 * 1000,
        cacheTime: 60 * 60 * 1000,
        refetchOnMount: false,
        refetchInterval: false,
  });

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetching: isFetchingInfinite,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['clientes-infinite', debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get('/clientes/', {
        params: { page_size: 10, page: pageParam, search: debouncedSearch },
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
    enabled: infinite && !!user?.admin,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const infiniteClients = useMemo(
    () => (infiniteData ? infiniteData.pages.flatMap((p) => p.results) : []),
    [infiniteData]
  );

  return {
      clients: infinite ? infiniteClients : clients,
      errorClients,
      isLoadingClients: infinite ? isFetchingInfinite : isLoadingClients,
      formFilter,
      handleChangePage,
      handleChangeRowsPerPage,
      rowsPerPage,
      page,
      debouncedSearch,
      // infinite scroll
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      search: selectSearch,
      setSearch: setSelectSearch,
  }
}

export default useClients;