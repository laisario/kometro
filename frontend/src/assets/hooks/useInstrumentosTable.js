import { useQuery } from "react-query";
import { axios } from "../../api";
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

const useInstrumentosTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialExpirado = searchParams.get('expirado');
  const getInitialExpiradoFilter = () => {
    if (initialExpirado === 'true') return 'true';
    if (initialExpirado === 'false') return 'false';
    return 'all';
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expiradoFilter, setExpiradoFilter] = useState(getInitialExpiradoFilter());
  const [tipoInstrumentoFilter, setTipoInstrumentoFilter] = useState('');

  // Fetch instruments with filters
  const { 
    data: instrumentos,
    isFetching: isFetchingInstrumentos,
    refetch: refetchInstrumentos,
  } = useQuery({
    queryKey: [
      'instrumentos-table', 
      debouncedSearch,
      page,
      rowsPerPage,
      expiradoFilter,
      tipoInstrumentoFilter,
    ], 
    queryFn: async ({ signal }) => {
      const params = {
        search: debouncedSearch,
        page: page + 1,
        page_size: rowsPerPage,
      };

      // Add expirado filter
      if (expiradoFilter !== 'all') {
        params.expirado = expiradoFilter;
      }

      // Add tipo_instrumento filter
      if (tipoInstrumentoFilter) {
        params.tipo_instrumento = tipoInstrumentoFilter;
      }

      const response = await axios.get('/instrumentos/', {
        signal,
        params,
      });
      
      return response?.data;
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  // Fetch tipos de instrumento for filter dropdown
  const { 
    data: tiposInstrumento,
    isFetching: isFetchingTipos,
  } = useQuery({
    queryKey: ['tipos-instrumento'], 
    queryFn: async () => {
      const response = await axios.get('/tipos-instrumento/');
      return response?.data;
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
  
  const handleSearch = useMemo(
    () => debounce((value) => setDebouncedSearch(value), 400),
    []
  );

  useEffect(() => {
    handleSearch((search ?? '').trim());
    return () => handleSearch.cancel();
  }, [search, handleSearch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpiradoFilterChange = (event) => {
    setExpiradoFilter(event.target.value);
    setPage(0);
  };

  const handleTipoInstrumentoFilterChange = (event) => {
    setTipoInstrumentoFilter(event.target.value);
    setPage(0);
  };

  const clearFilters = () => {
    setExpiradoFilter('all');
    setTipoInstrumentoFilter('');
    setSearch('');
    setPage(0);
  };

  return {
    instrumentos, 
    search,
    setSearch,
    isFetchingInstrumentos,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    expiradoFilter,
    handleExpiradoFilterChange,
    tipoInstrumentoFilter,
    handleTipoInstrumentoFilterChange,
    tiposInstrumento,
    isFetchingTipos,
    clearFilters,
    refetchInstrumentos,
  }
};

export default useInstrumentosTable;

