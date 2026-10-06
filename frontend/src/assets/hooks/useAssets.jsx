import { useQuery } from "react-query";
import { axios } from "../../api";
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { MAX_EXPORT_ITEMS } from "../constants";

export const buildAssetsParams = ({
  search,
  dateStart,
  dateStop,
  filterByDate,
  status,
  norma,
  page,
  pageSize,
}) => ({
  search,
  dateStart,
  dateStop,
  filterByDate,
  status,
  norma,
  page,
  page_size: pageSize === -1 ? undefined : pageSize,
});

const filterValue = (value) => {
  if (!value) return '';
  if (typeof value.valueOf === 'function') return String(value.valueOf());
  return String(value);
};

const useAssets = () => {
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearchNormaFilter, setDebouncedSearchNormaFilter] = useState('')
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const selectionRequestInFlight = useRef(false);

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

  const currentFilters = useMemo(() => ({
    search: debouncedSearchFilter,
    dateStart,
    dateStop,
    filterByDate,
    status,
    norma: debouncedSearchNormaFilter,
  }), [
    dateStart,
    dateStop,
    debouncedSearchFilter,
    debouncedSearchNormaFilter,
    filterByDate,
    status,
  ]);

  const filterSignature = useMemo(() => JSON.stringify([
    debouncedSearchFilter,
    filterValue(dateStart),
    filterValue(dateStop),
    Boolean(filterByDate),
    status,
    debouncedSearchNormaFilter,
  ]), [
    dateStart,
    dateStop,
    debouncedSearchFilter,
    debouncedSearchNormaFilter,
    filterByDate,
    status,
  ]);
  
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
    queryFn: async ({ signal }) => {
      const response = await axios.get('/instrumentos/', {
        signal,
        params: buildAssetsParams({
          ...currentFilters,
          page: page + 1,
          pageSize: rowsPerPage,
        }),
      });
      
      return response?.data;
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
  
  const handleSearchFilter = useMemo(
    () => debounce((value) => setDebouncedSearchFilter(value), 400),
    []
  );
  const handleSearchNormaFilter = useMemo(
    () => debounce((value) => setDebouncedSearchNormaFilter(value), 400),
    []
  );

  useEffect(() => {
    handleSearchFilter((search ?? '').trim());
    return () => handleSearchFilter.cancel();
  }, [search, handleSearchFilter]);
  useEffect(() => {
    handleSearchNormaFilter((norma ?? '').trim());
    return () => handleSearchNormaFilter.cancel();
  }, [norma, handleSearchNormaFilter]);

  const fetchAllMatchingAssets = useCallback(async (total) => {
    if (selectionRequestInFlight.current) return null;

    const normalizedTotal = Math.max(0, Number(total) || 0);
    if (normalizedTotal === 0) {
      return { count: 0, results: [], filterSignature };
    }

    selectionRequestInFlight.current = true;
    setIsSelectingAll(true);

    try {
      const response = await axios.get('/instrumentos/', {
        params: buildAssetsParams({
          ...currentFilters,
          page: 1,
          pageSize: Math.min(normalizedTotal, MAX_EXPORT_ITEMS),
        }),
      });

      return {
        ...response?.data,
        filterSignature,
      };
    } finally {
      selectionRequestInFlight.current = false;
      setIsSelectingAll(false);
    }
  }, [currentFilters, filterSignature]);

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
    fetchAllMatchingAssets,
    filterSignature,
    isSelectingAll,
  }
};

export default useAssets;
