import React, { useEffect, useRef, useState } from 'react'
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
  Divider,
  Alert,
  IconButton,
  Collapse,
  InputAdornment,
} from '@mui/material';
import { axios } from '../../api';
import InstrumentoTable from './InstrumentoTable';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import { readString, useCSVDownloader } from "react-papaparse";
import { useReactToPrint } from 'react-to-print';
import { ExpandMore, Search } from "@mui/icons-material";
import Loading from '../../components/Loading';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function FilterAccordion({ title, children, openFilter }) {
  const [open, setOpen] = useState(openFilter || false);

  return (
    <Box sx={{ py: 1 }}>
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
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
        <Typography variant="subtitle1">{title}</Typography>
      </Box>

      <Collapse in={open}>
        <Box sx={{ pl: 5, pt: 1 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}



function ExportFilter(props) {
  const { 
    open, 
    handleClose, 
    selected,
    setSelected,
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
  } = props;

  const [csvContent, setCsvContent] = useState(null)
  const [parsedCsv, setParsedCsv] = React.useState(null)
  const [loading, setLoading] = useState(false)
  const { CSVDownloader } = useCSVDownloader()
  const status = assetFilterForm?.watch('status')

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
        onSubmit: async (event) => {
          event.preventDefault();
          if (!Object.values(valueCheckbox).includes(true)) {
            setError(true);
            return;
          }
          
          const selectedData = {
            instrumentosSelecionados: selected,
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
      <DialogTitle>Exporte informações dos instrumentos</DialogTitle>
      {csvContent && 
        <Alert severity="warning">
          Este relatório está em <strong>formato CSV</strong>. Para abrir corretamente no <strong>Excel</strong>, é preciso converter para <strong>XLSX</strong> ou usar a opção “Texto para colunas”. Também pode ser aberto no <strong>LibreOffice</strong> ou <strong>Google Planilhas</strong>.
        </Alert>
      }
      <DialogContent sx={{ display: 'flex', flexDirection: "row", alignContent: 'center' }}>
        {!csvContent && (
          <>
            <Box sx={{ display: 'flex', flexDirection: "column" }}>
              <FilterAccordion title='Instrumentos' openFilter>
                <FormControl component="fieldset">
                  <RadioGroup>
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
              </FilterAccordion>
              <FilterAccordion title='Expiração'>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                  <DatePicker
                    label="Data inicial"
                    {...assetFilterForm.register("dateStart")}
                    value={assetFilterForm?.watch('dateStart') ? dayjs(assetFilterForm?.watch('dateStart')) : null}
                    onChange={newValue => assetFilterForm?.setValue("dateStart", newValue)}
                    sx={{ my: 1 }}
                  />
                  <DatePicker
                    label="Data final"
                    {...assetFilterForm.register("dateStop")}
                    value={assetFilterForm?.watch('dateStop') ? dayjs(assetFilterForm?.watch('dateStop')) : null}
                    onChange={newValue => assetFilterForm?.setValue("dateStop", newValue)}
                    sx={{ my: 1 }}
                  />
                </LocalizationProvider>
              </FilterAccordion>
              <FilterAccordion title='Personalizar relatório'>
                <FormControl sx={{ m: 2 }} component="fieldset" variant="standard">
                  <FormLabel component="legend">Escolha quais informações deseja incluir no relatório:</FormLabel>
                  <FormGroup>
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
                  </FormGroup>
                  {error && !Object.values(valueCheckbox).includes(true) &&
                    <FormHelperText error={error && !Object.values(valueCheckbox).includes(true)}>
                      Por favor, marque pelo menos uma opção.
                    </FormHelperText>
                  }
                </FormControl>
              </FilterAccordion>
              <FilterAccordion title='Buscar por Norma'>
                <TextField
                  label="Norma"
                  {...assetFilterForm.register("norma")}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end"><Search /></InputAdornment>,
                    },
                  }}
                />
              </FilterAccordion>
            </Box>
            <Divider sx={{ml: 2, mr: 2}} orientation='vertical' />
          </>
        )}
        {isFetchingAssets ? <Loading /> : (
          <InstrumentoTable 
            instrumentos={assets?.results} 
            valueCheckbox={valueCheckbox}
            selected={selected}
            setSelected={setSelected}
            selectAll={selectAll}
            handleCheckboxSelectAll={handleCheckboxSelectAll}
            csvContent={csvContent}
            ref={printRef}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            count={assets?.count}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setCsvContent(null); handleClose() }}>Cancelar</Button>
        {!csvContent  && (loading ? <CircularProgress /> : <Button disabled={!selected?.length} type="submit">Exportar</Button>)}
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

export default ExportFilter