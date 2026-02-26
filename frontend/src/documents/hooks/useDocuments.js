import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query';
import { useForm, useWatch } from 'react-hook-form';
import _, {debounce} from 'lodash';
import { axios } from '../../api';
import { useSearchParams } from 'react-router';

const useDocuments = () => {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [error, setError] = useState({});
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const vencidoParam = searchParams.get('vencido');

  const formFilter = useForm({
    defaultValues: {
      search: "",
      status: "",
      vencido: vencidoParam || "",
    }
  })

  const form = useForm({
    defaultValues: {
      codigo: null,
      identificador: '',
      titulo: '',
      status: "V",
      elaborador: '',
      frequencia: null,
      arquivo: null,
      dataValidade: null,
    }
  })

  const {
    search,
    status: statusFilter,
    vencido: vencidoFilter,
  } = useWatch({ control: formFilter.control })


  const { data, isFetching, } = useQuery(
    ['documentos', page, rowsPerPage, debouncedSearch, statusFilter, vencidoFilter],
    async () => {
      let params = {
        page: page + 1, 
        page_size: rowsPerPage, 
        search: debouncedSearch, 
        status: statusFilter, 
      }

      if (vencidoFilter) {
        params.vencido = vencidoFilter;
      }

      const response = await axios.get('/documentos/', { params });
      return response?.data
  }, {refetchOnReconnect: false,
    refetchOnWindowFocus: false});

  const handleSearch = useMemo(
    () => debounce((value) => setDebouncedSearch(value), 1500),
    []
  );

  useEffect(() => {
    handleSearch(search);
    return () => handleSearch.cancel();
  }, [search, handleSearch]);

  return {
    data,
    isFetching,
    page,
    rowsPerPage,
    error,
    formFilter,
    form,
    handleSearch,
    vencidoFilter,
    debouncedSearch,
    setDebouncedSearch,
    setPage,
    setRowsPerPage,
    setError,
    setOpen,
    searchParams,
    search,
    statusFilter,
    open,
  }
}

export default useDocuments;