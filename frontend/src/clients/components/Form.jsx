import { Link, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormLabel, Paper, TextField, Typography, Accordion, AccordionSummary, AccordionDetails, Grid, InputAdornment, MenuItem } from '@mui/material';
import React, { useEffect, useRef } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Row from '../../components/Row';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { truncateString } from '../../utils/formatString';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


function Form(props) {
  const { 
    open, 
    handleClose, 
    create, 
    isMobile, 
    calibration, 
    mutate,
    form,
    isLoadingCreation,
    error,
    setError,
    checagem,
    criterios
  } = props;

  const { fields: anexos, append, remove, } = useFieldArray({
    control: form.control,
    name: "anexos",
  });
  const ref = useRef(null)

  const {
    arquivo,
    numero
  } = useWatch({ control: form.control })

  const handleChangeAnexo = (event) => {
    if (!event.target.files.length) return
    append({ anexo: event.target.files[0] })
  }

  const handleRemoveAttachment = async (index) => {
    remove(index)
  }

  const handleChange = (event) => {
    const { name, files } = event.target;
    if (name === 'arquivo') {
      form.setValue("arquivo", files[0]);
    }
  }


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          const params = {form: form?.watch()}
          if (!create) {
            params.id = calibration?.id
          }
          form?.handleSubmit(() => mutate(params))();
        },
      }}
    >
      <DialogTitle>{checagem ? create ? 'Criar checagem' : 'Editar checagem' : create ? "Criar nova calibração" : "Editar calibração"}</DialogTitle>
      <DialogContent>
        <Row isMobile={isMobile}>
          <TextField
            id="ordemDeServico"
            label="Ordem de serviço"
            sx={{ width: isMobile ? '100%' : '50%' }}
            {...form?.register("ordemDeServico", {
              onChange: (e) => {if (error?.ordem_de_servico) setError({})},
            })}
            error={!!error?.ordem_de_servico}
            helperText={!!error?.ordem_de_servico && error?.ordem_de_servico}
          />
          <TextField
            id="local"
            label="Local"
            sx={{ width: isMobile ? '100%' : '50%' }}
            select
            defaultValue="P"
            {...form?.register("local", {
              onChange: (e) => {if (error?.local) setError({})},
            })}
            error={!!error?.local}
            helperText={!!error?.local && error?.local}
          >
            <MenuItem value="P">Permanente</MenuItem>
            <MenuItem value="C">Cliente</MenuItem>
            <MenuItem value="T">Terceirizado</MenuItem>
          </TextField>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <DatePicker
              label={checagem ? 'Data da checagem' : "Data da calibração"}
              {...form?.register("data")}
              value={form?.watch('data') ? dayjs(form?.watch('data')) : null}
              onChange={newValue => form?.setValue("data", newValue)}
              sx={{ width: isMobile ? '100%' : '50%' }}
            />
          </LocalizationProvider>
        </Row>
        <TextField
          autoFocus
          id="observacoes"
          label="Observações"
          fullWidth
          multiline
          rows={1}
          {...form?.register("observacoes", {
            onChange: (e) => {if (error?.observacoes) setError({})},
          })}
          error={!!error?.observacoes}
          helperText={!!error?.observacoes && error?.observacoes}
        />
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Resultado por Critério de Aceitação
            </ Typography>
          </AccordionSummary>
          <AccordionDetails>
          {criterios?.length ? (
            <Row>
             <TextField
                id="criterio"
                label="Critério de aceitação"
                fullWidth
                select
                {...form?.register("criterio", {
                  onChange: (e) => {if (error?.criterio) setError({})},
                })}
                defaultValue={calibration?.resultados?.[0]?.criterio?.id || ""}
                error={!!error?.criterio}
                helperText={!!error?.criterio && error?.criterio}
                SelectProps={{
                  renderValue: (selectedId) => {
                    const selected = criterios.find(c => c.id === selectedId);
                    return selected ? selected.tipo : "";
                  }
                }}
              > 
                {criterios?.map((criterio) => (
                  <MenuItem key={criterio?.id} value={criterio?.id}>
                    <div>
                      <strong>{criterio?.tipo}</strong>: {criterio.criterioDeAceitacao} {criterio.unidade} <br/>
                      <small>{criterio?.referenciaDoCriterio} - {criterio?.observacaoCriterioAceitacao}</small>
                    </div>
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                autoFocus
                id="maiorErro"
                label="Maior erro"
                fullWidth
                {...form?.register("maiorErro", {
                  valueAsNumber: true,
                  onChange: (e) => {if (error?.maior_erro) setError({})},
                })}
                error={!!error?.maior_erro}
                helperText={!!error?.maior_erro && error?.maior_erro}
              />
              {!checagem && <TextField
                autoFocus
                id="incerteza"
                label="Incerteza"
                fullWidth
                {...form?.register("incerteza", {
                  onChange: (e) => {if (error?.incerteza) setError({})},
                })}
                error={!!error?.incerteza}
                helperText={!!error?.incerteza && error?.incerteza}
              />}
            </Row>
          ) : <Typography color='info'  variant="body2">Este instrumento ainda não possui nenhum critério registrado. Por favor, edite o instrumento e adicione ao menos um critério.</Typography> }
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Fornecedor
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Preço"
                  type="number"
                  size="small"
                  inputProps={{
                    step: 0.01,
                    inputMode: 'decimal',
                    min: 0,
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  fullWidth
                  {...form?.register("preco", {
                    onChange: (e) => {if (error?.preco) setError({})},
                    valueAsNumber: true
                  })}
                  error={!!error?.preco}
                  helperText={!!error?.preco && error?.preco}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Laboratório"
                  size="small"
                  fullWidth
                  {...form?.register("laboratorio", {
                    onChange: (e) => {if (error?.laboratorio) setError({})},
                  })}
                  error={!!error?.laboratorio}
                  helperText={!!error?.laboratorio && error?.laboratorio}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  label="Observação do Fornecedor"
                  size="small"
                  fullWidth
                  {...form?.register("observacaoFornecedor", {
                    onChange: (e) => {if (error?.observacaoFornecedor) setError({})},
                  })}
                  error={!!error?.observacaoFornecedor}
                  helperText={!!error?.observacaoFornecedor && error?.observacaoFornecedor}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              {checagem ? 'Documento' : 'Certificado'}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!checagem && <TextField
              autoFocus
              margin="dense"
              id="numeroCertificado"
              label="Número do certificado"
              fullWidth
              {...form?.register("numero")}
            />}
            <Box my={1}>
              <FormLabel sx={{ marginRight: 1 }} id="upload-btn">{checagem ? 'Documento' : 'Certificado'}</FormLabel>
              <Button component="label" size="small" variant="contained" startIcon={<CloudUploadIcon />}>
              {checagem ? ' Enviar Documento' : 'Enviar Certificado'}
                <input
                  style={{ display: 'none' }}
                  id="upload-btn"
                  name="arquivo"
                  type="file"
                  {...form?.register("arquivo")}
                  onChange={handleChange}
                />
              </Button>
              {!!arquivo &&
                <Button
                  component="a"
                  size="small"
                  href={
                    !!arquivo && arquivo instanceof File
                      ? URL.createObjectURL(arquivo)
                      : arquivo
                  }
                  target="_blank"
                >
                  Ver arquivo: {arquivo?.name}
                </Button>
              }
            </Box>
            {arquivo && (
              <>
                <Typography>Anexos</Typography>
                <Box display="flex" gap={2} sx={{width: '100%', overflow: 'auto'}}>
                  <Paper onClick={() => ref?.current?.click()} sx={{ cursor: 'pointer', display: 'flex', flexShrink: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 100, width: 100 }} elevation={4}>
                    <Typography color="gray" fontSize={72} lineHeight={0.75} mb={0} fontWeight={300}>+</Typography>
                    <Typography color="gray" variant='caption'>Novo anexo</Typography>
                    <input
                      style={{ display: 'none' }}
                      id="upload-btn"
                      name="anexos"
                      type="file"
                      ref={ref}
                      onChange={handleChangeAnexo}
                    />
                  </Paper>
                  {anexos?.map((anexo, i) => (
                    <Paper key={anexo + i + 1} sx={{ textDecoration: "none", display: 'flex', flexShrink: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 100, width: 100 }} elevation={4}>
                      <Link
                        href={
                            !!anexo?.anexo && anexo?.anexo instanceof File
                                ? URL.createObjectURL(anexo?.anexo)
                                : anexo?.anexo
                        }
                        target="_blank"
                        rel='noreferrer'
                        style={{
                          textDecoration: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <DescriptionIcon color='gray' fontSize="large" />
                        <Typography color="gray" variant='caption'>
                          {truncateString(anexo?.anexo?.name, 12)}
                        </Typography>
                      </Link>
                      <CloseIcon fontSize='small' color='gray' onClick={() => handleRemoveAttachment(i)} />
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" type="submit">{isLoadingCreation ? <CircularProgress /> : create ? 'Salvar' : 'Editar'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default Form