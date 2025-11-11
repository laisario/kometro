import { useQuery } from "react-query";
import { axios } from "../../api";
import _, {debounce} from 'lodash';
import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router';

const useProposals = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('')
  const [error, setError] = useState({});
  const [open, setOpen] = useState(false);

  const [searchParams] = useSearchParams();

  const statusParam = searchParams.get('status');
  
  const formFilter = useForm({
    defaultValues: {
      search: "",
      status: "",
      dateStart: "",
      dateStop: "",
      filterByDate: false,
    }
  })
  
  const {
    search,
    status,
    dateStart,
    dateStop,
    filterByDate,
  } = useWatch({ control: formFilter.control })
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formCreateProposal = useForm({
    defaultValues: {
      cliente: '',
      informacoesAdicionais: '',
      instrumentos: [],
    }
  })
  
  const {
    cliente,
    informacoesAdicionais,
    instrumentos,
  } = useWatch({ control: formCreateProposal.control })
  

  
  const handleSearchFilter = debounce((value) => setDebouncedSearchFilter(value), 2000);
  
  useEffect(() => { handleSearchFilter(search) }, [search, handleSearchFilter])
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const { 
    data: allProposals, 
    error: errorProposals, 
    isFetching: isLoadingProposals 
  } = useQuery([
    'propostas', 
    page, 
    rowsPerPage, 
    debouncedSearchFilter, 
    status, 
    statusParam,
    filterByDate
    ], async () => {
      const response = await axios.get('/propostas/',
      {
        params:
        {
        page_size: rowsPerPage,
        page: page + 1,
        search: debouncedSearchFilter,
        data_criacao_after: dateStart ? dayjs(dateStart).format('YYYY-MM-DD') : null,
        data_criacao_before: dateStop ? dayjs(dateStop).format('YYYY-MM-DD') : null,
        status: statusParam ? statusParam : status
        }
      });
      return response?.data;
    }, {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false
    });
  
  return {
    allProposals,
    errorProposals,
    isLoadingProposals,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    formFilter,
    error,
    setError,
    open,
    setOpen,
    search,
    dateStart,
    dateStop,
    filterByDate,
    status,
    cliente,
    informacoesAdicionais,
    instrumentos,
    formCreateProposal,
    handleOpen,
    handleClose,
    handleSearchFilter,
  }

}

export default useProposals;