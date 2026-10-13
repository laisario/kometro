import { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Checkbox, Box, TablePagination, TableContainer,
  FormControlLabel, Stack, Typography, Chip,
  IconButton, Tooltip
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { positionLabels } from '../../utils/assets';
import { fDate } from '../../utils/formatTime';
import { MAX_EXPORT_ITEMS } from '../constants';

const InstrumentoTable = forwardRef(function InstrumentoTable({
  csvContent, 
  selectionMode,
  instrumentos, 
  valueCheckbox, 
  selected, 
  selectedIds,
  selectedCount,
  handleCheckboxSelectAll,
  handleRowSelect,
  selectionDisabled,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  count,
}, ref) {
  const fieldMap = {
    tag: { label: 'Tag', path: 'tag' },
    numeroDeSerie: { label: 'Número de Série', path: 'numeroDeSerie' },
    laboratorio: { label: 'Laboratório', path: 'laboratorio' },
    setor: { label: 'Setor', path: 'setor.nome' },
    posicaoDoInstrumento: { label: 'Posição do Instrumento', path: 'posicao' },
    dataUltimaCalibracao: { label: 'Data Última Calibração', path: 'dataUltimaCalibracao' },
    dataDaProximaCalibracao: { label: 'Data da Próxima Calibração', path: 'dataProximaCalibracao' },
    frequenciaDeCalibracao: { label: 'Frequência de Calibração' },
    dataUltimaChecagem: { label: 'Data Última Checagem', path: 'dataUltimaChecagem' },
    dataDaProximaChecagem: { label: 'Data da Próxima Checagem', path: 'dataProximaChecagem' },
    frequenciaDeChecagem: { label: 'Frequência de Checagem' },
    normativos: { label: 'Normativos' },
    numeroUltimoCertificado: {
      label: 'Número do último certificado',
      path: 'numeroUltimoCertificado',
    },
  };

  const activeFields = Object.keys(valueCheckbox).filter((key) => valueCheckbox[key]);
  const selectAll = selectionMode === 'all_filtered';
  const foundCount = count ?? instrumentos?.length ?? 0;
  const selectionActionDisabled = foundCount === 0
    || (!selectAll && selectionDisabled);
  const selectionReachedLimit = selectAll && foundCount > MAX_EXPORT_ITEMS;
  const selectedIdSet = useMemo(
    () => new Set(selectedIds.map((id) => String(id))),
    [selectedIds]
  );
  const selectedLabel = selectionReachedLimit
    ? `${selectedCount.toLocaleString('pt-BR')} de ${foundCount.toLocaleString('pt-BR')} resultados selecionados — limite de exportação`
    : `${selectedCount.toLocaleString('pt-BR')} selecionado${selectedCount === 1 ? '' : 's'}`;

  const getValue = (item, path) => {
    return path?.split('.')?.reduce((acc, part) => acc?.[part], item) ?? '';
  };

  const list = useMemo(() => {
    if (csvContent && !!selected?.length) {
      return selected?.map((inst) => inst?.instrumento)
    }
    return instrumentos
  }, [csvContent, instrumentos, selected])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: { xs: 'auto', md: '100%' },
        minHeight: { xs: 'auto', md: 0 },
        minWidth: 0,
        overflow: { xs: 'visible', md: 'hidden' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {csvContent ? 'Pré-visualização do relatório' : 'Instrumentos encontrados'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Chip size="small" variant="outlined" label={`${foundCount.toLocaleString('pt-BR')} encontrado${foundCount === 1 ? '' : 's'}`} />
            {!csvContent && (
              <Chip size="small" color={selectedCount ? 'primary' : 'default'} label={selectedLabel} />
            )}
          </Stack>
        </Box>

        {!csvContent && (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <FormControlLabel
              sx={{ m: 0 }}
              control={(
                <Checkbox
                  size="small"
                  checked={selectAll}
                  indeterminate={!selectAll && selectedCount > 0}
                  onChange={handleCheckboxSelectAll}
                  disabled={selectionActionDisabled}
                />
              )}
              label={(
                <Typography variant="body2" fontWeight={600} color={selectionActionDisabled ? 'text.secondary' : 'text.primary'}>
                  {selectAll
                    ? 'Limpar seleção'
                    : `Selecionar todos os ${foundCount.toLocaleString('pt-BR')} resultados`}
                </Typography>
              )}
              disabled={selectionActionDisabled}
            />
            <Tooltip title={`É possível exportar até ${MAX_EXPORT_ITEMS.toLocaleString('pt-BR')} instrumentos por vez.`}>
              <IconButton size="small" aria-label="Limite de exportação">
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <TableContainer
        sx={{
          flex: { xs: '0 0 auto', md: 1 },
          minHeight: { xs: 'auto', md: 0 },
          minWidth: 0,
          overflowX: 'auto',
          overflowY: { xs: 'visible', md: 'auto' },
        }}
      >
        <Table ref={ref} size="small" stickyHeader sx={{ minWidth: 'max-content', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                {!csvContent && <Typography variant="caption" color="text.secondary">Selecionar</Typography>}
              </TableCell>
              {activeFields.map((fieldKey) => (
                <TableCell key={fieldKey}>
                  {fieldMap[fieldKey]?.label || fieldKey}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {list?.map((inst) => (
              <TableRow key={inst.id} hover>
                <TableCell padding="checkbox">
                  {!csvContent && <Checkbox
                    size="small"
                    checked={selectAll || selectedIdSet.has(String(inst.id))}
                    onChange={() => handleRowSelect(inst.id, inst)}
                    disabled={selectAll}
                  />}
                </TableCell>
                {activeFields.map((fieldKey) => {
                  const field = fieldMap[fieldKey];
                  if (fieldKey === 'frequenciaDeCalibracao') {
                    const freq = inst?.frequenciaCalibracao;
                    return (
                      <TableCell key={fieldKey}>
                        {freq
                          ? `${freq.quantidade} ${freq.periodo}`
                          : ''}
                      </TableCell>
                    );
                  }

                  if (fieldKey === 'frequenciaDeChecagem') {
                    const freq = inst?.frequenciaChecagem;
                    return (
                      <TableCell key={fieldKey}>
                        {freq
                          ? `${freq.quantidade} ${freq.periodo}`
                          : ''}
                      </TableCell>
                    );
                  }

                  if (fieldKey === 'posicaoDoInstrumento') {
                    const posicao = inst?.posicao;
                    return (
                      <TableCell key={fieldKey}>
                        {positionLabels[posicao]}
                      </TableCell>
                    );
                  }

                  if (fieldKey.includes("data")) {
                    return (
                      <TableCell key={fieldKey}>
                        {fDate(inst[field?.path], 'dd/MM/yyyy')}
                      </TableCell>
                    );
                  }

                  if (fieldKey === 'normativos') {
                    const lastNorm = inst?.normativos?.length - 1
                    return (
                      <TableCell key={fieldKey}>
                        {inst?.normativos?.map((n, i) => `${n?.nome} ${i == lastNorm ? '.' : ','} `)}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={fieldKey}>
                      {getValue(inst, field?.path)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!csvContent && page !== undefined && (
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={count || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
          sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider' }}
        />
      )}
    </Box>
  );
});

InstrumentoTable.propTypes = {
  csvContent: PropTypes.string,
  selectionMode: PropTypes.oneOf(['manual', 'all_filtered']).isRequired,
  instrumentos: PropTypes.arrayOf(PropTypes.object),
  valueCheckbox: PropTypes.objectOf(PropTypes.bool).isRequired,
  selected: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    instrumento: PropTypes.object,
  })).isRequired,
  selectedIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ).isRequired,
  selectedCount: PropTypes.number.isRequired,
  handleCheckboxSelectAll: PropTypes.func.isRequired,
  handleRowSelect: PropTypes.func.isRequired,
  selectionDisabled: PropTypes.bool.isRequired,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  handleChangePage: PropTypes.func,
  handleChangeRowsPerPage: PropTypes.func,
  count: PropTypes.number,
};

export default InstrumentoTable;
