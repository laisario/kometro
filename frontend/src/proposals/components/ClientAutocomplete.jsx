import React, { useRef, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
} from '@mui/material';
import useClients from '../../clients/hooks/useClients';

const ClientAutocomplete = ({ user, value, onChange, error, helperText, ...other }) => {
  const {
    clients,
    isLoadingClients,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    setSearch,
  } = useClients(user, true);

  const scrollPositionRef = useRef(0);

  const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...rest } = props;
    const innerRef = useRef(null);

    useEffect(() => {
      if (innerRef.current && scrollPositionRef.current > 0) {
        innerRef.current.scrollTop = scrollPositionRef.current;
      }
    });

    const handleScroll = (event) => {
      const el = event.currentTarget;
      scrollPositionRef.current = el.scrollTop;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.8 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    return (
      <ul
        {...props}
        {...rest}
        ref={combinedRef}
        onScroll={handleScroll}
        style={{ maxHeight: '40vh', overflow: 'auto', padding: 0 }}
      >
        {children}
        {isFetchingNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </ul>
    );
  });

  return (
    <Autocomplete
      autoHighlight
      options={clients || []}
      value={value || null}
      onChange={onChange}
      loading={isLoadingClients}
      isOptionEqualToValue={(option, val) => option?.id === val?.id}
      getOptionLabel={(client) => client?.empresa || ''}
      filterOptions={(x) => x}
      ListboxComponent={ListboxComponent}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Cliente"
          placeholder="Pesquisar cliente"
          helperText={helperText}
          error={error}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      loadingText="Carregando..."
      noOptionsText="Sem resultados"
      {...other}
    />
  );
};

export default ClientAutocomplete;
