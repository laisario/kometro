import React, { useRef, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Chip, 
  Checkbox,
  CircularProgress,
  Box,
} from '@mui/material';
import useClientAssets from '../../assets/hooks/useClientAsset';

const VirtualizedInstrumentAutocomplete = ({
  clientId,
  value,
  onChange,
  error,
  helperText,
  label,
  placeholder,
  ...other
}) => {
  const {
    assets,
    isLoadingAssets,
    search,
    setSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClientAssets(clientId, false, true);

  const listboxRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const innerRef = useRef(null);

    useEffect(() => {
      // Restore scroll position after render
      if (innerRef.current && scrollPositionRef.current > 0) {
        innerRef.current.scrollTop = scrollPositionRef.current;
      }
    });

    const handleScroll = (event) => {
      const listEl = event.currentTarget;
      const scrollTop = listEl.scrollTop;
      const scrollHeight = listEl.scrollHeight;
      const clientHeight = listEl.clientHeight;

      // Save scroll position
      scrollPositionRef.current = scrollTop;

      // Trigger fetch when user scrolls to 80% of the list
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    const combinedRef = (node) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <ul 
        {...props} 
        {...other}
        ref={combinedRef}
        onScroll={handleScroll}
        style={{ 
          maxHeight: '40vh', 
          overflow: 'auto',
          padding: 0,
        }}
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
      multiple
      autoHighlight
      options={assets?.results || []}
      value={value || []}
      onChange={onChange}
      loading={isLoadingAssets}
      disableCloseOnSelect
      disableListWrap
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      getOptionLabel={(instrument) =>
        `${instrument?.instrumento?.tipoDeInstrumento?.descricao} - ${instrument?.instrumento?.minimo} - ${instrument?.instrumento?.maximo} ${instrument?.instrumento?.unidade}${
          instrument?.tag ? ` | ${instrument?.tag}` : ''
        }${instrument?.numeroDeSerie ? ` | ${instrument?.numeroDeSerie}` : ''}`
      }
      renderTags={(value, getTagProps) =>
        value?.map((tag, index) => (
          <Chip
            {...getTagProps({ index })}
            key={tag?.id || index}
            label={tag?.tag}
          />
        ))
      }
      ListboxComponent={ListboxComponent}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          error={error}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoadingAssets ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, instrumento, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Checkbox style={{ marginRight: 8 }} checked={selected} />
            {instrumento?.instrumento?.tipoDeInstrumento?.descricao} -{' '}
            {instrumento?.instrumento?.minimo} - {instrumento?.instrumento?.maximo}{' '}
            {instrumento?.instrumento?.unidade}
            {instrumento?.tag && ` | ${instrumento?.tag}`}
            {instrumento?.numeroDeSerie && ` | ${instrumento?.numeroDeSerie}`}
          </li>
        );
      }}
      loadingText="Carregando..."
      noOptionsText="Sem resultados"
      {...other}
    />
  );
};

export default VirtualizedInstrumentAutocomplete;

