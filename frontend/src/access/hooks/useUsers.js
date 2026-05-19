import { useState } from 'react';
import { useQuery } from 'react-query';
import { axios } from '../../api';
import { enqueueSnackbar } from 'notistack';
import { getApiErrorMessage } from '../../utils/error';

function useUsers(clienteId, isAdmin) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const queryKey = isAdmin 
    ? ['access-users', 'staff', page, rowsPerPage] 
    : clienteId 
      ? ['access-users', 'cliente', clienteId, page, rowsPerPage]
      : ['access-users', 'staff', page, rowsPerPage];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { data, isFetching, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isAdmin) {
        const response = await axios.get('/users/', { 
          params: { is_staff: true, page: page + 1, page_size: rowsPerPage } 
        });
        if (Array.isArray(response?.data)) {
          return {
            count: response.data.length,
            next: null,
            previous: null,
            results: response.data,
          };
        }
        return response?.data;
      } else if (clienteId) {
        const response = await axios.get(`/clientes/${clienteId}/`);
        const usuarios = response?.data?.usuarios || [];
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;

        return {
          count: usuarios.length,
          next: end < usuarios.length ? true : null,
          previous: page > 0 ? true : null,
          results: usuarios.slice(start, end),
        };
      }
      return { count: 0, next: null, previous: null, results: [] };
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: isAdmin || !!clienteId,
    keepPreviousData: true,
    onError: (queryError) => {
      console.error('[ACCESS_USERS_FETCH_ERROR]', queryError);
      enqueueSnackbar(getApiErrorMessage(queryError, 'Não foi possível carregar os usuários com acesso.'), {
        variant: 'error',
        autoHideDuration: 4000,
      });
    },
  });

  return {
    users: data || { count: 0, next: null, previous: null, results: [] },
    errorUsers: error,
    isFetching,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setPage,
  };
}

export default useUsers;
