import { useQuery } from "react-query";
import { axios } from "../../api";
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import _, {debounce} from 'lodash';

const useClients = (user) => { 
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const formFilter = useForm({defaultValues: { search: "" }});

  const {
    search,
  } = useWatch({ control: formFilter.control });

  const handleSearch = debounce((search) => setDebouncedSearch(search), 1500);

  useEffect(() => { handleSearch(search) }, [search, handleSearch]);

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
        enabled: user?.admin,
        staleTime: 15 * 60 * 1000,
        cacheTime: 60 * 60 * 1000,
        refetchOnMount: false,
        refetchInterval: false,
  });

  return {
      clients,
      errorClients,
      isLoadingClients,
      formFilter,
      handleChangePage,
      handleChangeRowsPerPage,
      rowsPerPage,
      page,
      debouncedSearch
  }
}

export default useClients;