import { useQuery } from "react-query";
import { axios } from "../../api";
import _, {debounce} from 'lodash';
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const useAssets = () => {
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearchNormaFilter, setDebouncedSearchNormaFilter] = useState('')
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const assetFilterForm = useForm({
    defaultValues: {
      status: 'all',
      dateStart: "",
      dateStop: "",
      filterByDate: false,
      norma: '',
    }
  })

  const {
    dateStart,
    dateStop,
    filterByDate,
    status,
    norma,
  } = useWatch({ control: assetFilterForm.control })
  
  const { 
    data: assets,
    isFetching: isFetchingAssets,
  } = useQuery({
    queryKey: [
      'instrumentos', 
      debouncedSearchFilter,
      dateStart,
      dateStop,
      filterByDate,
      status,
      debouncedSearchNormaFilter,
      page,
      rowsPerPage,
    ], 
    queryFn: async () => {
      const response = await axios.get('/instrumentos/', {
        params: {
          search: debouncedSearchFilter,
          dateStart,
          dateStop,
          filterByDate,
          status,
          norma: debouncedSearchNormaFilter,
          page: page + 1,
          page_size: rowsPerPage === -1 ? undefined : rowsPerPage, // -1 means "all"
        }
      });
      
      return response?.data;
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  
  const handleSearchFilter = debounce((value) => setDebouncedSearchFilter(value), 1500);
  const handleSearchNormaFilter = debounce((value) => setDebouncedSearchNormaFilter(value), 1500);

  useEffect(() => { handleSearchFilter(search) }, [search, handleSearchFilter])
  useEffect(() => { handleSearchNormaFilter(norma) }, [norma, handleSearchNormaFilter])

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return {
    assets, 
    search,
    setSearch,
    assetFilterForm,
    isFetchingAssets,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  }
};

export default useAssets;