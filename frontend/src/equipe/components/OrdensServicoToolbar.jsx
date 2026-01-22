import React, { useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  Badge,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import debounce from 'lodash/debounce';

function OrdensServicoToolbar({ 
  search, 
  onSearchChange, 
  filters, 
  onFilterToggle,
  ordensServico = [],
  isLoading 
}) {
  const debouncedSearch = useMemo(
    () => debounce((value) => onSearchChange(value), 400),
    [onSearchChange]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!ordensServico) return { total: 0, semResponsavel: 0, semExpiracao: 0, aVencer: 0 };
    
    const total = ordensServico.length;
    const semResponsavel = ordensServico.filter(os => !os.responsavel).length;
    const semExpiracao = ordensServico.filter(os => !os.dataExpiracao).length;
    
    // Calculate "a vencer" (expiring in 7 days)
    const hoje = new Date();
    const em7Dias = new Date();
    em7Dias.setDate(hoje.getDate() + 7);
    
    const aVencer = ordensServico.filter(os => {
      if (!os.dataExpiracao) return false;
      const dataExp = new Date(os.dataExpiracao);
      return dataExp >= hoje && dataExp <= em7Dias;
    }).length;

    return { total, semResponsavel, semExpiracao, aVencer };
  }, [ordensServico]);

  return (
    <Box>
      {/* Header with Title and Search */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">
          Ordens de Serviço
        </Typography>
        <TextField
          placeholder="Buscar por número, cliente ou proposta..."
          size="small"
          sx={{ minWidth: 300, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={handleSearchChange}
          disabled={isLoading}
        />
      </Box>

      {/* Statistics Badges */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <Badge badgeContent={stats.total} color="primary" showZero>
          <Chip label="Total" variant="outlined" />
        </Badge>
        {stats.semResponsavel > 0 && (
          <Badge badgeContent={stats.semResponsavel} color="warning" showZero>
            <Chip label="Sem responsável" variant="outlined" />
          </Badge>
        )}
        {stats.semExpiracao > 0 && (
          <Badge badgeContent={stats.semExpiracao} color="info" showZero>
            <Chip label="Sem expiração" variant="outlined" />
          </Badge>
        )}
        {stats.aVencer > 0 && (
          <Badge badgeContent={stats.aVencer} color="error" showZero>
            <Chip label="A vencer (7d)" variant="outlined" />
          </Badge>
        )}
      </Box>

      {/* Quick Filters */}
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
        <Chip
          label="Sem responsável"
          onClick={() => onFilterToggle('semResponsavel')}
          color={filters.semResponsavel ? 'primary' : 'default'}
          variant={filters.semResponsavel ? 'filled' : 'outlined'}
          size="small"
        />
        <Chip
          label="Sem expiração"
          onClick={() => onFilterToggle('semExpiracao')}
          color={filters.semExpiracao ? 'primary' : 'default'}
          variant={filters.semExpiracao ? 'filled' : 'outlined'}
          size="small"
        />
        <Chip
          label="A vencer (7d)"
          onClick={() => onFilterToggle('aVencer')}
          color={filters.aVencer ? 'primary' : 'default'}
          variant={filters.aVencer ? 'filled' : 'outlined'}
          size="small"
        />
      </Stack>
    </Box>
  );
}

export default OrdensServicoToolbar;
