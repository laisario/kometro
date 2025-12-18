import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  CardActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router';
import { fDate } from '../../utils/formatTime';
import { dateDistanceText, findDateStatusColor } from '../../utils/date';
import useInstrumentosTable from '../hooks/useInstrumentosTable';
import useDefaultAssets from '../hooks/useDefaultAssets';
import useAssetMutations from '../hooks/useAssetMutations';
import useSectorTree from '../hooks/useSectorTree';
import useAuth from '../../auth/hooks/useAuth';
import CreateInstrument from './CreateInstrument';

const InstrumentosTable = () => {
  const navigate = useNavigate();
  const { user, hasCreatePermission } = useAuth();
  const [openCreateForm, setOpenCreateForm] = useState(false);
  
  const {
    instrumentos,
    search,
    setSearch,
    isFetchingInstrumentos,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    expiradoFilter,
    handleExpiradoFilterChange,
    tipoInstrumentoFilter,
    handleTipoInstrumentoFilterChange,
    tiposInstrumento,
    isFetchingTipos,
    clearFilters,
  } = useInstrumentosTable();

  // Hooks for creating instruments
  const { sectors } = useSectorTree();
  const {
    defaultAssets,
    search: searchDefaultAssets,
    setSearch: setSearchDefaultAssets,
    isFetching: isFetchingDefaultAssets,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDefaultAssets();
  
  const handleCloseCreateForm = () => {
    setOpenCreateForm(false);
  };

  const {
    mutateCreateClient,
    error,
    setError,
  } = useAssetMutations(handleCloseCreateForm);

  const handleRowClick = (instrumento) => {
    navigate(`/dashboard/instrumento/${instrumento.id}`);
  };

  const hasActiveFilters = expiradoFilter !== 'all' || tipoInstrumentoFilter !== '' || search !== '';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden', minHeight: 0 }}>
        {/* Filters */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          mb={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          flexShrink={0}
        >
          <TextField
            size="small"
            placeholder="Buscar por tag, descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={expiradoFilter}
              label="Status"
              onChange={handleExpiradoFilterChange}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="false">Em dia</MenuItem>
              <MenuItem value="true">Vencidos</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Tipo de Instrumento</InputLabel>
            <Select
              value={tipoInstrumentoFilter}
              label="Tipo de Instrumento"
              onChange={handleTipoInstrumentoFilterChange}
              disabled={isFetchingTipos}
            >
              <MenuItem value="">Todos</MenuItem>
              {tiposInstrumento?.map((tipo) => (
                <MenuItem key={tipo.id} value={tipo.id}>
                  {tipo.descricao}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="info"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateForm(true)}
            disabled={!hasCreatePermission}
          >
            Criar Instrumento
          </Button>
        </Stack>

        {/* Table */}
        <TableContainer 
          component={Paper} 
          variant="outlined"
          sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}
        >
          {isFetchingInstrumentos ? (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: 300 
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tag</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Setor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Próxima Calibração</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instrumentos?.results?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Nenhum instrumento encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  instrumentos?.results?.map((instrumento) => (
                    <TableRow
                      key={instrumento.id}
                      hover
                      onClick={() => handleRowClick(instrumento)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {instrumento.tag || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {instrumento?.instrumento?.tipoDeInstrumento?.descricao || '-'}
                        </Typography>
                        {instrumento?.instrumento?.tipoDeInstrumento?.modelo && (
                          <Typography variant="caption" color="text.secondary">
                            {instrumento?.instrumento?.tipoDeInstrumento?.modelo}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {instrumento.setor?.nome || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {instrumento.dataProximaCalibracao ? (
                          <>
                            <Typography variant="body2">
                              {fDate(instrumento.dataProximaCalibracao)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dateDistanceText(instrumento.dataProximaCalibracao)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {instrumento.dataProximaCalibracao ? (
                          <Chip
                            label={instrumento.expirado ? 'Atrasado' : 'Em dia'}
                            size="small"
                            color={findDateStatusColor(instrumento.dataProximaCalibracao)}
                            sx={{ 
                              fontWeight: 500,
                              color: '#fff',
                            }}
                          />
                        ) : (
                          <Chip
                            label="Sem data"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </CardContent>
      <CardActions sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider', justifyContent: 'flex-end' }}>
        <TablePagination
          component="div"
          count={instrumentos?.count || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </CardActions>

      {/* Create Instrument Dialog */}
      <CreateInstrument
        handleClose={handleCloseCreateForm}
        open={openCreateForm}
        defaultAssets={defaultAssets}
        search={searchDefaultAssets}
        setSearch={setSearchDefaultAssets}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        cliente={user?.cliente}
        mutate={mutateCreateClient}
        error={error || {}}
        setError={setError}
        isFetching={isFetchingDefaultAssets}
        setores={sectors || []}
        tableViewCreate={true}
      />
    </Card>
  );
};

export default InstrumentosTable;

