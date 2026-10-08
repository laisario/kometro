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
import { MAX_EXPORT_ITEMS } from '../constants';

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
    handleChangeCheckbox, 
    valueCheckbox, 
    error, 
    setError, 
    selectAll, 
    assets,
    handleCheckboxSelectAll,
    assetFilterForm,
    isFetchingAssets,
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    handleRowSelect,
    isSelectingAll,
  } = props;

  const [csvContent, setCsvContent] = useState(null)
  const [parsedCsv, setParsedCsv] = React.useState(null)
  const [loading, setLoading] = useState(false)
  const { CSVDownloader } = useCSVDownloader()
  const status = assetFilterForm?.watch('status')
  const selectedFieldsCount = Object.values(valueCheckbox).filter(Boolean).length
  const selectedInstrumentsCount = selected?.length || 0
  const foundInstrumentsCount = assets?.count || 0
  const selectionReachedLimit = selectAll && foundInstrumentsCount > MAX_EXPORT_ITEMS

  useEffect(() => {
    if (!csvContent) return
    readString(csvContent, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results?.errors?.length) console.log("deu ruim")
        setParsedCsv(results?.data)
      }
    })
  }, [csvContent, selected])
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Instrumentos',
    removeAfterPrint: true,
  });
  return (
    <Dialog
      open={open}
      fullScreen
      onClose={() => { setCsvContent(null); handleClose() }}
      PaperProps={{
        component: 'form',
        sx: {
          height: '100dvh',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        onSubmit: async (event) => {
          event.preventDefault();
          if (!Object.values(valueCheckbox).includes(true)) {
            setError(true);
            return;
          }
          
          const selectedData = {
            instrumentosSelecionados: selected.map(({ id }) => ({ id })),
            camposSelecionados: Object.entries(valueCheckbox).filter(([,value]) => !!value).map(([key]) => key)
          };

          try {
            setLoading(true)
            const resposta = await axios.post('/instrumentos/exportar/', selectedData);
            setLoading(false)
            if (resposta.status === 200) {
              setCsvContent(resposta?.data)
            } else {
              setError(true)
            }
          } catch (error) {
            console.error('Erro ao enviar dados para o backend:', error);
            setError(true)
          }

          setError(false);
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
      <DialogContent
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
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
                  maxHeight: { xs: '24vh', md: 'none' },
                  overflowY: { xs: 'auto', md: 'visible' },
                  pr: { xs: 1, md: 0 },
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
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            overflow: 'hidden',
          }}
        >
          {isFetchingAssets ? (
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                minHeight: 0,
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
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                order: { xs: 2, md: 1 },
              }}
            >
              <InstrumentoTable
                instrumentos={assets?.results}
                valueCheckbox={valueCheckbox}
                selected={selected}
                selectAll={selectAll}
                handleCheckboxSelectAll={handleCheckboxSelectAll}
                handleRowSelect={handleRowSelect}
                isSelectingAll={isSelectingAll}
                csvContent={csvContent}
                ref={printRef}
                page={page}
                rowsPerPage={rowsPerPage}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                count={assets?.count}
              />
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
                maxHeight: { xs: 190, md: 'none' },
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
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

              <Box sx={{ px: 2, pb: 2, overflowY: 'auto', minHeight: 0 }}>
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
        }}
      >
        {!csvContent && (
          <Box sx={{ mr: 'auto' }}>
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
        <Button variant="outlined" onClick={() => { setCsvContent(null); handleClose() }}>Cancelar</Button>
        {!csvContent  && (loading ? <CircularProgress size={28} sx={{ mx: 2 }} /> : <Button variant="contained" disabled={!selected?.length} type="submit">Exportar</Button>)}
        {csvContent && <Button className='button' variant='outlined' endIcon={<PrintIcon />} onClick={handlePrint}>Imprimir</Button>}
        {csvContent && <CSVDownloader style={{ background: 'transparent', border: 0 }} variant="contained" type="button" filename="meus_instrumentos" bom data={parsedCsv}><Button variant='contained' endIcon={<DownloadIcon />}>Download</Button></CSVDownloader>}
      </DialogActions>
      <style>
        {`
          @media print {
            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 1;
            }

            #print-content {
              width: 100%;
              margin: 0;
              padding: 0;
            }

            button, .no-print, .MuiDialog-root, header, footer {
              display: none !important;
            }
          }
        `}
      </style>
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
  handleChangeCheckbox: PropTypes.func.isRequired,
  valueCheckbox: PropTypes.objectOf(PropTypes.bool).isRequired,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  setError: PropTypes.func.isRequired,
  selectAll: PropTypes.bool.isRequired,
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
  isSelectingAll: PropTypes.bool.isRequired,
};

export default ExportFilter
