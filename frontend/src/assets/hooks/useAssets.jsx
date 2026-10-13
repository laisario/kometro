import { useQuery } from "react-query";
import { axios } from "../../api";
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

export const buildAssetsParams = ({
  search,
  date_start: dateStart,
  date_stop: dateStop,
  filter_by_date: filterByDate,
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
  page_size: pageSize,
});

const normalizeDateFilter = (value) => {
  if (!value) return null;
  if (typeof value.format === 'function') return value.format('YYYY-MM-DD');
  return String(value).slice(0, 10);
};

const buildFilterSignature = (filters) => JSON.stringify(filters);

const useAssets = () => {
  const [debouncedSearchFilter, setDebouncedSearchFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearchNormaFilter, setDebouncedSearchNormaFilter] = useState('')
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const previousRawFilterSignatureRef = useRef(null);

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

  const filtersSnapshot = useMemo(() => ({
    search: debouncedSearchFilter,
    date_start: normalizeDateFilter(dateStart),
    date_stop: normalizeDateFilter(dateStop),
    filter_by_date: Boolean(filterByDate),
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

  const rawFilters = useMemo(() => ({
    search: (search ?? '').trim(),
    date_start: normalizeDateFilter(dateStart),
    date_stop: normalizeDateFilter(dateStop),
    filter_by_date: Boolean(filterByDate),
    status,
    norma: (norma ?? '').trim(),
  }), [dateStart, dateStop, filterByDate, norma, search, status]);

  const filterSignature = useMemo(
    () => buildFilterSignature(filtersSnapshot),
    [filtersSnapshot]
  );
  const rawFilterSignature = useMemo(
    () => buildFilterSignature(rawFilters),
    [rawFilters]
  );
  const filtersPending = rawFilterSignature !== filterSignature;

  useEffect(() => {
    if (previousRawFilterSignatureRef.current === null) {
      previousRawFilterSignatureRef.current = rawFilterSignature;
      return;
    }

    if (previousRawFilterSignatureRef.current !== rawFilterSignature) {
      setPage(0);
      previousRawFilterSignatureRef.current = rawFilterSignature;
    }
  }, [rawFilterSignature]);

  const queryFilterValues = useMemo(() => [
    dateStart,
    dateStop,
    debouncedSearchFilter,
    debouncedSearchNormaFilter,
    filterByDate,
    status,
  ], [dateStart, dateStop, debouncedSearchFilter, debouncedSearchNormaFilter, filterByDate, status]);
  
  const { 
    data: assets,
    isFetching: isFetchingAssets,
    isError: hasAssetsError,
  } = useQuery({
    queryKey: [
      'instrumentos', 
      ...queryFilterValues,
      page,
      rowsPerPage,
    ], 
    queryFn: async ({ signal }) => {
      const response = await axios.get('/instrumentos/', {
        signal,
        params: buildAssetsParams({
          ...filtersSnapshot,
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    const requestedPageSize = parseInt(event.target.value, 10);
    setRowsPerPage(
      [25, 50, 100].includes(requestedPageSize) ? requestedPageSize : 25
    );
    setPage(0);
  };

  return {
    assets, 
    search,
    setSearch,
    assetFilterForm,
    isFetchingAssets,
    hasAssetsError,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    filtersSnapshot,
    filterSignature,
    rawFilterSignature,
    filtersPending,
  }
};

export default useAssets;
