import { useState } from 'react';
import { useQuery } from 'react-query';

import { axios } from '../../api';
import useAuth from '../../auth/hooks/useAuth';

export default function useFileAccessRequests() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['solicitacoes-arquivos', page, rowsPerPage],
    queryFn: async () => {
      const response = await axios.get('/solicitacoes-arquivos/', {
        params: {
          page: page + 1,
          page_size: rowsPerPage,
        },
      });
      return response?.data;
    },
    enabled: Boolean(user?.admin),
    keepPreviousData: true,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    requests: data || {
      count: 0,
      next: null,
      previous: null,
      results: [],
    },
    error,
    isFetching,
    refetch,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  };
}
