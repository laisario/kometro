import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  ClickAwayListener,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';


export default function InstrumentSearch({ data = [], onSelect, search, setSearch, isFetching }) {
  const [open, setOpen] = useState(false);
  const resultsLength = data?.results?.length ?? 0;
  const hasResults = useMemo(() => resultsLength > 0, [resultsLength]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSearch(value || '');
  };

  useEffect(() => {
    setOpen(Boolean(search && hasResults));
  }, [search, hasResults]);

  const handleClickItem = (item) => {
    onSelect(item);
    setSearch('');
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          placeholder="Procure por tag, descrição ou número de série"
          value={search}
          onChange={handleChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {isFetching ? <CircularProgress size={20} /> : <SearchIcon />}
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="small"
        />
        {open && data?.results?.length > 0 && (
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              maxHeight: 300,
              overflowY: 'auto',
            }}
            >
            <List>
              {data?.results?.map((item) => {
                const tipo = item.instrumento?.tipoDeInstrumento?.descricao || 'Tipo desconhecido';
                const tag = item.tag || 'Sem tag';
                return (
                  <ListItemButton key={item.id} onClick={() => handleClickItem(item)}>
                    <ListItemText primary={`${tag} — ${tipo}`} />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
