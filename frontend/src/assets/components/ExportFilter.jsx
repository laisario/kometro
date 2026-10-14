import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types';
import { 
  Box, 
  Checkbox, 
  FormControlLabel, 
  FormGroup, 
  FormHelperText, 
  FormLabel,
  FormControl,
  DialogTitle,
  DialogActions,
  Dialog,
  Button,
  DialogContent,
  CircularProgress,
  Typography,
  RadioGroup,
  Radio,
  TextField,
  Alert,
  IconButton,
  Collapse,
  InputAdornment,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import { axios } from '../../api';
import InstrumentoTable from './InstrumentoTable';
import InstrumentExportReport, {
  INSTRUMENT_EXPORT_PRINT_PAGE_STYLE,
} from './InstrumentExportReport';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { readString, useCSVDownloader } from "react-papaparse";
import { useReactToPrint } from 'react-to-print';
import { ExpandMore, Search } from "@mui/icons-material";
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import Loading from '../../components/Loading';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { enqueueSnackbar } from 'notistack';
import {
  EXPORT_STATUS_POLL_INTERVAL_MS,
  MAX_EXPORT_ITEMS,
} from '../constants';

const DEFAULT_EXPORT_ERROR = 'Não foi possível exportar os instrumentos. Tente novamente.';
const STORED_EXPORT_JOB_KEY = 'instrument-export-job';
const ACTIVE_EXPORT_STATUSES = new Set(['queued', 'processing']);
const TERMINAL_EXPORT_STATUSES = new Set(['completed', 'failed', 'expired']);

const createRequestId = () => (
  globalThis.crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const loadStoredExportJob = () => {
  try {
    const storedJob = globalThis.sessionStorage?.getItem(STORED_EXPORT_JOB_KEY);
    if (!storedJob) return null;
    const parsedJob = JSON.parse(storedJob);
    if (!ACTIVE_EXPORT_STATUSES.has(parsedJob?.status)) {
      globalThis.sessionStorage?.removeItem(STORED_EXPORT_JOB_KEY);
      return null;
    }
    return parsedJob;
  } catch {
    return null;
  }
};

function FilterAccordion({ title, children, openFilter }) {
  const [open, setOpen] = useState(openFilter || false);

  return (
    <Box>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          px: 2,
          py: 1.5,
        }}
      >
        <IconButton
          size="small"
          sx={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)" ,
            transition: "transform 0.2s",
          }}
        >
          <ExpandMore />
        </IconButton>
        <FilterAltOutlinedIcon color="primary" sx={{ mr: 1 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Refine os instrumentos que serão exibidos para seleção.
          </Typography>
        </Box>
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}

FilterAccordion.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  openFilter: PropTypes.bool,
};



function ExportFilter(props) {
  const { 
    open, 
    handleClose, 
    selected,
    selection,
    selectedCount,
    selectionDisabled,
    handleChangeCheckbox, 
    valueCheckbox, 
    error, 
    setError, 
    assets,
    handleCheckboxSelectAll,
    assetFilterForm,
    isFetchingAssets,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    handleRowSelect,
  } = props;

  const [csvContent, setCsvContent] = useState(null)
  const [parsedCsv, setParsedCsv] = React.useState(null)
  const [loading, setLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [asyncJob, setAsyncJob] = useState(loadStoredExportJob)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)
  const exportRequestInFlight = useRef(false)
  const exportRequestId = useRef(null)
  const previousJobStatus = useRef(asyncJob?.status)
  const printAfterParsing = useRef(false)
  const { CSVDownloader } = useCSVDownloader()
  const status = assetFilterForm?.watch('status')
  const selectedFieldsCount = Object.values(valueCheckbox).filter(Boolean).length
  const selectedInstrumentsCount = selectedCount
  const foundInstrumentsCount = assets?.count || 0
  const selectionReachedLimit = selection.mode === 'all_filtered' && foundInstrumentsCount > MAX_EXPORT_ITEMS

  useEffect(() => {
    try {
      if (asyncJob && ACTIVE_EXPORT_STATUSES.has(asyncJob.status)) {
        globalThis.sessionStorage?.setItem(
          STORED_EXPORT_JOB_KEY,
          JSON.stringify(asyncJob)
        );
      } else {
        globalThis.sessionStorage?.removeItem(STORED_EXPORT_JOB_KEY);
      }
    } catch {
      // Polling still works when session storage is unavailable.
    }
  }, [asyncJob]);

  useEffect(() => {
    const statusChanged = previousJobStatus.current !== asyncJob?.status;
    if (statusChanged && asyncJob?.status === 'completed') {
      enqueueSnackbar('Relatório pronto para download.', { variant: 'success' });
    } else if (statusChanged && asyncJob?.status === 'failed') {
      enqueueSnackbar('Não foi possível gerar o relatório.', { variant: 'error' });
    } else if (statusChanged && asyncJob?.status === 'expired') {
      enqueueSnackbar('O relatório expirou.', { variant: 'warning' });
    }
    previousJobStatus.current = asyncJob?.status;
  }, [asyncJob?.status]);

  useEffect(() => {
    if (
      !asyncJob?.statusUrl
      || TERMINAL_EXPORT_STATUSES.has(asyncJob.status)
    ) return undefined;

    let cancelled = false;
    let timer;
    const pollStatus = async () => {
      try {
        const statusResponse = await axios.get(asyncJob.statusUrl);
        if (cancelled) return;
        setAsyncJob(statusResponse.data);
        if (!TERMINAL_EXPORT_STATUSES.has(statusResponse.data.status)) {
          timer = setTimeout(pollStatus, EXPORT_STATUS_POLL_INTERVAL_MS);
        }
      } catch (pollError) {
        if (cancelled) return;
        if ([401, 403, 404, 410].includes(pollError?.response?.status)) {
          setAsyncJob((currentJob) => ({
            ...currentJob,
            status: 'expired',
          }));
          return;
        }
        setExportError('Não foi possível atualizar o estado do relatório. Tentaremos novamente.');
        timer = setTimeout(pollStatus, EXPORT_STATUS_POLL_INTERVAL_MS);
      }
    };

    timer = setTimeout(pollStatus, EXPORT_STATUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [asyncJob?.jobId, asyncJob?.status, asyncJob?.statusUrl]);

  const resetAsyncExport = () => {
    setAsyncJob(null);
    setExportError('');
    exportRequestId.current = null;
  };

  const closeExportDialog = () => {
    setCsvContent(null);
    setExportError('');
    if (asyncJob && TERMINAL_EXPORT_STATUSES.has(asyncJob.status)) {
      resetAsyncExport();
    }
    handleClose();
  };

  const downloadAsyncExport = async () => {
    if (!asyncJob?.downloadUrl || isDownloading) return;
    setIsDownloading(true);
    setExportError('');
    try {
      const downloadResponse = await axios.get(asyncJob.downloadUrl, {
        responseType: 'blob',
      });
      const objectUrl = window.URL.createObjectURL(
        new Blob([downloadResponse.data], { type: 'text/csv' })
      );
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', 'instrumentos_exportados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      setExportError('Não foi possível baixar o relatório. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  const prepareAsyncPrint = async () => {
    if (!asyncJob?.downloadUrl || isPreparingPrint) return;
    setIsPreparingPrint(true);
    setExportError('');
    try {
      const reportResponse = await axios.get(asyncJob.downloadUrl, {
        responseType: 'text',
      });
      printAfterParsing.current = true;
      setCsvContent(reportResponse.data);
    } catch {
      setExportError('Não foi possível preparar o relatório para impressão. Tente novamente.');
    } finally {
      setIsPreparingPrint(false);
    }
  };

  useEffect(() => {
    if (!csvContent) {
      setParsedCsv(null);
      return;
    }
    readString(csvContent, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results?.errors?.length) console.log("deu ruim")
        setParsedCsv(results?.data)
      }
    })
  }, [csvContent])
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Instrumentos',
    removeAfterPrint: true,
    pageStyle: INSTRUMENT_EXPORT_PRINT_PAGE_STYLE,
  });

  useEffect(() => {
    if (!parsedCsv || !printAfterParsing.current) return;
    printAfterParsing.current = false;
    handlePrint();
  }, [handlePrint, parsedCsv]);
  return (
    <Dialog
      open={open}
      fullScreen
      onClose={closeExportDialog}
      PaperProps={{
        component: 'form',
        sx: {
          height: '100dvh',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: { xs: 'auto', md: 'hidden' },
          overflowX: 'hidden',
        },
        onSubmit: async (event) => {
          event.preventDefault();
          if (exportRequestInFlight.current || selectionDisabled) return;

          if (!Object.values(valueCheckbox).includes(true)) {
            setError(true);
            return;
          }

          const selectedData = {
            requestId: exportRequestId.current || createRequestId(),
            selection: selection.mode === 'all_filtered'
              ? {
                mode: 'all_filtered',
                filters: selection.filtersSnapshot,
              }
              : {
                mode: 'manual',
                ids: selection.ids,
              },
            camposSelecionados: Object.entries(valueCheckbox).filter(([,value]) => !!value).map(([key]) => key)
          };
          exportRequestId.current = selectedData.requestId;

          exportRequestInFlight.current = true;
          setExportError('');
          setError(false);
          setLoading(true)
          try {
            const resposta = await axios.post('/instrumentos/exportar/', selectedData);
            if (resposta.status === 200) {
              setCsvContent(resposta?.data)
              exportRequestId.current = null;
            } else if (resposta.status === 202) {
              setAsyncJob(resposta.data)
            } else {
              setExportError(DEFAULT_EXPORT_ERROR)
            }
          } catch (error) {
            console.error('Erro ao enviar dados para o backend:', error);
            const responseDetail = error?.response?.data?.detail;
            setExportError(
              typeof responseDetail === 'string'
                ? responseDetail
                : DEFAULT_EXPORT_ERROR
            )
          } finally {
            exportRequestInFlight.current = false;
            setLoading(false)
          }
        },
      }}
    >
      <DialogTitle sx={{ flexShrink: 0, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <TableRowsOutlinedIcon color="primary" />
          <Box>
            <Typography variant="h5">Exportar instrumentos</Typography>
            <Typography variant="body2" color="text.secondary">
              Filtre, selecione e personalize as informações do relatório.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      {csvContent && 
        <Alert severity="warning" sx={{ flexShrink: 0 }}>
          Este relatório está em <strong>formato CSV</strong>. Para abrir corretamente no <strong>Excel</strong>, é preciso converter para <strong>XLSX</strong> ou usar a opção “Texto para colunas”. Também pode ser aberto no <strong>LibreOffice</strong> ou <strong>Google Planilhas</strong>.
        </Alert>
      }
      {exportError && (
        <Alert severity="error" sx={{ flexShrink: 0 }}>
          {exportError}
        </Alert>
      )}
      {asyncJob && ['queued', 'processing'].includes(asyncJob.status) && (
        <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ flexShrink: 0 }}>
          Preparando relatório de {asyncJob.exportedCount?.toLocaleString('pt-BR')} instrumentos...
          {asyncJob.limitApplied && ` Limite aplicado sobre ${asyncJob.matchedCount?.toLocaleString('pt-BR')} encontrados.`}
        </Alert>
      )}
      {asyncJob?.status === 'completed' && (
        <Alert severity="success" sx={{ flexShrink: 0 }}>
          Relatório de {asyncJob.exportedCount?.toLocaleString('pt-BR')} instrumentos pronto para download.
        </Alert>
      )}
      {asyncJob?.status === 'failed' && (
        <Alert severity="error" sx={{ flexShrink: 0 }}>
          {asyncJob.error || DEFAULT_EXPORT_ERROR}
        </Alert>
      )}
      {asyncJob?.status === 'expired' && (
        <Alert severity="warning" sx={{ flexShrink: 0 }}>
          Este relatório expirou. Solicite uma nova exportação.
        </Alert>
      )}
      <DialogContent
        sx={{
          flex: { xs: '0 0 auto', md: 1 },
          minHeight: { xs: 'auto', md: 0 },
          overflow: { xs: 'visible', md: 'hidden' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          py: 2,
        }}
      >
        {!csvContent && (
          <Paper variant="outlined" sx={{ flexShrink: 0, overflow: 'hidden' }}>
            <FilterAccordion title="Filtros" openFilter>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.35fr) minmax(0, 0.8fr)' },
                  gap: 2,
                }}
              >
                <FormControl component="fieldset">
                  <FormLabel component="legend">Instrumentos</FormLabel>
                  <RadioGroup row sx={{ mt: 0.5 }}>
                    <FormControlLabel
                      value="expired"
                      control={<Radio checked={status === "expired"} {...assetFilterForm.register("status")} />}
                      label="Vencidos"
                    />
                    <FormControlLabel
                      value="expiringSoon"
                      control={<Radio checked={status === "expiringSoon"} {...assetFilterForm.register("status")} />}
                      label="Vencerão em 1 mês"
                    />
                    <FormControlLabel
                      value="all"
                      control={<Radio checked={status === "all"} {...assetFilterForm.register("status")} />}
                      label="Todos"
                    />
                  </RadioGroup>
                </FormControl>

                <FormControl component="fieldset">
                  <FormLabel component="legend">Período de expiração</FormLabel>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
                      <DatePicker
                        label="Data inicial"
                        {...assetFilterForm.register("dateStart")}
                        value={assetFilterForm?.watch('dateStart') ? dayjs(assetFilterForm?.watch('dateStart')) : null}
                        onChange={newValue => assetFilterForm?.setValue("dateStart", newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                      <DatePicker
                        label="Data final"
                        {...assetFilterForm.register("dateStop")}
                        value={assetFilterForm?.watch('dateStop') ? dayjs(assetFilterForm?.watch('dateStop')) : null}
                        onChange={newValue => assetFilterForm?.setValue("dateStop", newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Stack>
                  </LocalizationProvider>
                </FormControl>

                <FormControl component="fieldset">
                  <FormLabel component="legend">Buscar por norma</FormLabel>
                  <TextField
                    size="small"
                    label="Norma"
                    {...assetFilterForm.register("norma")}
                    sx={{ mt: 1 }}
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position="end"><Search /></InputAdornment>,
                      },
                    }}
                  />
                </FormControl>
              </Box>
            </FilterAccordion>
          </Paper>
        )}

        <Box
          sx={{
            flex: { xs: '0 0 auto', md: 1 },
            minHeight: { xs: 'auto', md: 0 },
            minWidth: 0,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            overflow: { xs: 'visible', md: 'hidden' },
          }}
        >
          {isFetchingAssets ? (
            <Paper
              variant="outlined"
              sx={{
                flex: { xs: '0 0 auto', md: 1 },
                minHeight: { xs: 'auto', md: 0 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                order: { xs: 2, md: 1 },
              }}
            >
              <Loading />
            </Paper>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                flex: { xs: '0 0 auto', md: 1 },
                minWidth: 0,
                minHeight: { xs: 'auto', md: 0 },
                display: 'flex',
                flexDirection: 'column',
                overflow: { xs: 'visible', md: 'hidden' },
                order: { xs: 2, md: 1 },
              }}
            >
              {csvContent ? (
                <InstrumentExportReport ref={printRef} rows={parsedCsv || []} />
              ) : (
                <InstrumentoTable
                  instrumentos={assets?.results}
                  valueCheckbox={valueCheckbox}
                  selected={selected}
                  selectedIds={selection.mode === 'manual' ? selection.ids : []}
                  selectedCount={selectedCount}
                  selectionMode={selection.mode}
                  handleCheckboxSelectAll={handleCheckboxSelectAll}
                  handleRowSelect={handleRowSelect}
                  selectionDisabled={selectionDisabled}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  handleChangePage={handleChangePage}
                  handleChangeRowsPerPage={handleChangeRowsPerPage}
                  count={assets?.count}
                />
              )}
            </Paper>
          )}

          {!csvContent && (
            <Paper
              variant="outlined"
              sx={{
                flex: { xs: '0 0 auto', md: '0 1 340px' },
                minWidth: { md: 280 },
                maxWidth: { md: 380 },
                width: { xs: '100%', md: 'auto' },
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: { xs: 'visible', md: 'hidden' },
                borderColor: 'primary.light',
                bgcolor: 'action.hover',
                order: { xs: 1, md: 2 },
              }}
            >
              <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ViewColumnOutlinedIcon color="primary" />
                    <Typography variant="h6">Personalizar relatório</Typography>
                  </Stack>
                  <Chip size="small" color="primary" label={`${selectedFieldsCount} campos`} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Escolha quais informações serão incluídas.
                </Typography>
              </Box>

              <Box sx={{ px: 2, pb: 2, overflowY: { xs: 'visible', md: 'auto' }, minHeight: 0 }}>
                <FormControl component="fieldset" variant="standard" fullWidth>
                  <FormGroup
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: '1fr' },
                      columnGap: 1,
                    }}
                  >
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.tag} onChange={handleChangeCheckbox} name="tag" />}
                      label="Tag"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.numeroDeSerie} onChange={handleChangeCheckbox} name="numeroDeSerie" />}
                      label="Número de Série"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.laboratorio} onChange={handleChangeCheckbox} name="laboratorio" />}
                      label="Laboratório"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.setor} onChange={handleChangeCheckbox} name="setor" />}
                      label="Setor"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.posicaoDoInstrumento} onChange={handleChangeCheckbox} name="posicaoDoInstrumento" />}
                      label="Posição do Instrumento"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.dataUltimaCalibracao} onChange={handleChangeCheckbox} name="dataUltimaCalibracao" />}
                      label="Última Calibração"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.dataDaProximaCalibracao} onChange={handleChangeCheckbox} name="dataDaProximaCalibracao" />}
                      label="Próxima Calibração"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.frequenciaDeCalibracao} onChange={handleChangeCheckbox} name="frequenciaDeCalibracao" />}
                      label="Frequência de Calibração"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.dataUltimaChecagem} onChange={handleChangeCheckbox} name="dataUltimaChecagem" />}
                      label="Última Checagem"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.dataDaProximaChecagem} onChange={handleChangeCheckbox} name="dataDaProximaChecagem" />}
                      label="Próxima Checagem"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.frequenciaDeChecagem} onChange={handleChangeCheckbox} name="frequenciaDeChecagem" />}
                      label="Frequência de Checagem"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.normativos} onChange={handleChangeCheckbox} name="normativos" />}
                      label="Normativos"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={valueCheckbox?.numeroUltimoCertificado} onChange={handleChangeCheckbox} name="numeroUltimoCertificado" />}
                      label="Número do último certificado"
                    />
                  </FormGroup>
                  {error && !Object.values(valueCheckbox).includes(true) &&
                    <FormHelperText error={error && !Object.values(valueCheckbox).includes(true)}>
                      Por favor, marque pelo menos uma opção.
                    </FormHelperText>
                  }
                </FormControl>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
          px: 3,
          py: 1.5,
          bgcolor: 'background.paper',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1, sm: 0 },
          '& > :not(style) ~ :not(style)': {
            ml: { xs: 0, sm: 1 },
          },
        }}
      >
        {!csvContent && (
          <Box sx={{ width: { xs: '100%', sm: 'auto' }, mr: { sm: 'auto' } }}>
            <Typography variant="body2" fontWeight={600}>
              {selectionReachedLimit
                ? `${selectedInstrumentsCount.toLocaleString('pt-BR')} de ${foundInstrumentsCount.toLocaleString('pt-BR')} resultados selecionados — limite de exportação`
                : `${selectedInstrumentsCount.toLocaleString('pt-BR')} instrumento${selectedInstrumentsCount === 1 ? '' : 's'} selecionado${selectedInstrumentsCount === 1 ? '' : 's'}`
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {foundInstrumentsCount} encontrado{foundInstrumentsCount === 1 ? '' : 's'} com os filtros atuais
            </Typography>
          </Box>
        )}
        <Button variant="outlined" disabled={loading || isDownloading || isPreparingPrint} onClick={closeExportDialog}>{asyncJob ? 'Fechar' : 'Cancelar'}</Button>
        {!csvContent && !asyncJob && (loading ? <CircularProgress size={28} sx={{ mx: 2 }} /> : <Button variant="contained" disabled={selectedCount < 1 || selectionDisabled} type="submit">Exportar</Button>)}
        {asyncJob?.status === 'completed' && !csvContent && <Button variant="outlined" disabled={isPreparingPrint || isDownloading} startIcon={isPreparingPrint ? <CircularProgress size={16} /> : <PrintIcon />} onClick={prepareAsyncPrint}>Imprimir relatório</Button>}
        {asyncJob?.status === 'completed' && !csvContent && <Button variant="contained" disabled={isDownloading || isPreparingPrint} startIcon={isDownloading ? <CircularProgress size={16} /> : <DownloadIcon />} onClick={downloadAsyncExport}>Baixar relatório</Button>}
        {asyncJob && ['failed', 'expired'].includes(asyncJob.status) && <Button variant="contained" onClick={resetAsyncExport}>Tentar novamente</Button>}
        {csvContent && <Button className='button' variant='outlined' endIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>}
        {csvContent && <CSVDownloader style={{ background: 'transparent', border: 0 }} variant="contained" type="button" filename="meus_instrumentos" bom data={parsedCsv}><Button variant='contained' endIcon={<DownloadIcon />}>Download</Button></CSVDownloader>}
      </DialogActions>
    </Dialog >
  )
}

ExportFilter.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  selected: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    instrumento: PropTypes.object,
  })).isRequired,
  selection: PropTypes.oneOfType([
    PropTypes.shape({
      mode: PropTypes.oneOf(['manual']).isRequired,
      ids: PropTypes.array.isRequired,
    }),
    PropTypes.shape({
      mode: PropTypes.oneOf(['all_filtered']).isRequired,
      filtersSnapshot: PropTypes.object.isRequired,
      matchedCount: PropTypes.number.isRequired,
      selectedCount: PropTypes.number.isRequired,
    }),
  ]).isRequired,
  selectedCount: PropTypes.number.isRequired,
  selectionDisabled: PropTypes.bool.isRequired,
  handleChangeCheckbox: PropTypes.func.isRequired,
  valueCheckbox: PropTypes.objectOf(PropTypes.bool).isRequired,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  setError: PropTypes.func.isRequired,
  assets: PropTypes.shape({
    count: PropTypes.number,
    results: PropTypes.arrayOf(PropTypes.object),
  }),
  handleCheckboxSelectAll: PropTypes.func.isRequired,
  assetFilterForm: PropTypes.shape({
    register: PropTypes.func.isRequired,
    reset: PropTypes.func,
    setValue: PropTypes.func.isRequired,
    watch: PropTypes.func.isRequired,
  }).isRequired,
  isFetchingAssets: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  handleChangePage: PropTypes.func.isRequired,
  handleChangeRowsPerPage: PropTypes.func.isRequired,
  handleRowSelect: PropTypes.func.isRequired,
};

export default ExportFilter
