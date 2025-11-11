import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, List, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import useResponsive from '../../theme/hooks/useResponsive';
import { useForm, useWatch } from 'react-hook-form';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormDefaultAsset from './FormDefaultAsset';
import useNorms from '../hooks/useNorms';
import useClient from '../../clients/hooks/useClient';
import { frequenceCriterion, flattenSectors } from '../../utils/assets';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import VirtualizedInstrumentAutocomplete from './VirtualizedInstrumentAutocomplete';
import AddArrayField from '../../components/AddArrayField';
import FormNorms from '../../components/FormNorms';
import CriteriosDeAceitacao from '../../components/CriteriosDeAceitacao';

const PriceSection = ({form, error, setError}) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
          Preço alternativo
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TextField
          label="Alternativo"
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">R$</InputAdornment>
            ),
          }}
          {...form.register("precoAlternativoCalibracao", {
            onChange: (e) => {if (error?.preco_alternativo_calibracao) setError({})},
          })}
          error={!!error?.preco_alternativo_calibracao}
          helperText={!!error?.preco_alternativo_calibracao && error?.preco_alternativo_calibracao}
        />
      </AccordionDetails>
    </Accordion>
  )
}


function CreateInstrument(props) {
  const {
    handleClose, 
    open, 
    defaultAssets, 
    search,
    setSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    setor, 
    cliente, 
    mutate, 
    asset, 
    error, 
    setError,
    isFetching,
    setores = [],
    adminPreview = false,
  } = props;
  const { client } = useClient(cliente)
  const isMobile = useResponsive('down', 'md');
  const options = useMemo(() => flattenSectors(setores), [setores]);
  
  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState(asset ? {
    descricao: asset?.instrumento?.tipoDeInstrumento?.descricao ? asset?.instrumento?.tipoDeInstrumento?.descricao : '',
    modelo: asset?.instrumento?.tipoDeInstrumento?.modelo ? asset?.instrumento?.tipoDeInstrumento?.modelo : '',
    fabricante: asset?.instrumento?.tipoDeInstrumento?.fabricante ? asset?.instrumento?.tipoDeInstrumento?.fabricante : '',
    procedimentoRelacionado: asset?.instrumento?.procedimentoRelacionado?.codigo ? asset?.instrumento?.procedimentoRelacionado?.codigo :'',
    tipoDeServico: asset?.instrumento?.tipoDeServico ? asset?.instrumento?.tipoDeServico : '',
    minimo:  asset?.instrumento?.minimo ? asset?.instrumento?.minimo : null,
    maximo:  asset?.instrumento?.maximo ? asset?.instrumento?.maximo : null,
    unidade:  asset?.instrumento?.unidade ? asset?.instrumento?.unidade : '',
    resolucao:  asset?.instrumento?.tipoDeInstrumento?.resolucao ? asset?.instrumento?.tipoDeInstrumento?.resolucao : null,
    tipoSinal:  asset?.instrumento?.tipoSinal ? asset?.instrumento?.tipoSinal : '',
    capacidadeMedicao: asset?.instrumento?.capacidadeDeMedicao?.valor ? asset?.instrumento?.capacidadeDeMedicao?.valor : null,
    unidadeCapacidade: asset?.instrumento?.capacidadeDeMedicao?.unidade ? asset?.instrumento?.capacidadeDeMedicao?.unidade : '',
    precoCalibracaoNoLaboratorio: asset?.instrumento?.precoCalibracaoNoLaboratorio ? asset?.instrumento?.precoCalibracaoNoLaboratorio : null,
    precoCalibracaoNoCliente: asset?.instrumento?.precoCalibracaoCliente ? asset?.instrumento?.precoCalibracaoCliente : null,
  } : null);
  const [norms, setNorms] = useState(asset?.normativos?.length ? asset?.normativos : []);
  const [showFormNewAsset, setShowFormNewAsset] = useState(false);
  const [showFormNewNorm, setShowFormNewNorm] = useState(false);
  const [inputNorm, setInputNorm] = useState('');
  const [setorId, setSetorId] = useState(asset?.setor?.id ? asset?.setor?.id : null);
  const { normas } = useNorms(cliente);
  
  const selectedOption = useMemo(() => options?.find((opt) => opt?.id === setorId) || null, [asset?.setor?.id, setorId, options]);

  const form = useForm({
    defaultValues: {
      tag: asset?.tag ? asset.tag : '',
      numeroDeSerie: asset?.numeroDeSerie ? asset.numeroDeSerie : '',
      classe: asset?.classe ? asset.classe : '',
      posicao: asset?.posicao ? asset.posicao : "I",
      observacao: asset?.observacao ? asset.observacao : '',
      frequenciaChecagem: {
        quantidade: asset?.frequenciaChecagem?.quantidade ? asset.frequenciaChecagem.quantidade : null,
        periodo: asset?.frequenciaChecagem?.periodo ? asset.frequenciaChecagem.periodo : 'dia',
      },
      frequenciaCalibracao: {
        quantidade: asset?.frequenciaCalibracao?.quantidade ? asset.frequenciaCalibracao.quantidade : null,
        periodo: asset?.frequenciaCalibracao?.periodo ? asset.frequenciaCalibracao.periodo : 'dia',
      },
      pontosDeCalibracao: asset?.pontosDeCalibracao?.length ? asset?.pontosDeCalibracao?.map((p) => p?.nome) : [],
      dataUltimaCalibracao: asset?.dataUltimaCalibracao ? asset?.dataUltimaCalibracao : null,
      dataUltimaChecagem: asset?.dataUltimaChecagem ? asset?.dataUltimaChecagem : null,
      criteriosAceitacao: asset?.criteriosAceitacao?.length ? asset?.criteriosAceitacao : [],
      criterioFrequencia: asset?.criterioFrequencia || '',
      setor: asset?.setor?.caminhoHierarquia || '',
    }
  });

  const {
    dataUltimaChecagem,
    dataUltimaCalibracao,
  } = useWatch({ control: form?.control })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      cliente,
      instrumento: instrumentoSelecionado?.id,
      normativos: norms,
      dataUltimaChecagem: dataUltimaChecagem && dayjs(dataUltimaChecagem)?.format('YYYY-MM-DD'),
      dataUltimaCalibracao: dataUltimaCalibracao && dayjs(dataUltimaCalibracao)?.format('YYYY-MM-DD')
    };

    if (!payload.frequenciaCalibracao?.quantidade) {
      delete payload.frequenciaCalibracao;
    }
  
    if (!payload.frequenciaChecagem?.quantidade) {
      delete payload.frequenciaChecagem;
    }
    
    
    if (asset?.id) {
      const adminPayload = {
        ...payload,
        id: asset?.id,
      }
      
      const clientPayload = {
        ...payload,
        id: asset?.id,
        setor: setorId,
        previousSetorId: asset?.setor?.id,
      }

      
      const paramEdit = adminPreview ? adminPayload : clientPayload
      mutate(paramEdit);
    } else {
      const paramCreate = adminPreview ? payload : ({
        ...payload,
        previousSetorId: null,
        setor: setor?.type === 'sector' ? Number(setor?.id) : Number(setor?.parentId),
      })
      mutate(paramCreate);
    }
  }

  const {
    posicao,
    criterioFrequencia
  } = useWatch({ control: form?.control })
  

  const podeMostrarCalibracao = useMemo(() =>  criterioFrequencia === 'S' || asset?.criterioFrequencia === "S"
    ? posicao === 'U'
    : !asset?.calibracoes?.length, [posicao, criterioFrequencia])
   

  const podeMostrarChecagem = useMemo(() => criterioFrequencia === 'S' || asset?.criterioFrequencia === "S"
    ? posicao === 'U'
    : !asset?.checagens?.length, [criterioFrequencia, posicao])
  return (
    <Dialog onClose={() => {handleClose()}} open={open} fullScreen={isMobile}>
      <DialogTitle>{asset ? 'Editar instrumento' : 'Crie seu instrumento'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Instrumento base
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!asset?.id && <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Escolha um instrumento base (obrigatório). Preencha os detalhes agora nas seções abaixo ou continue depois.
            </Typography>}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Busque pelo nome do instrumento (ex: paquímetro, balança...)
            </Typography>
            <VirtualizedInstrumentAutocomplete
              options={defaultAssets?.results || []}
              value={instrumentoSelecionado}
              onChange={(newValue) => {
                if (error?.instrumento) setError((prev) => ({ ...prev, instrumento: undefined }));
                setInstrumentoSelecionado(newValue);
              }}
              loading={isFetching}
              error={!!error?.instrumento}
              helperText={error?.instrumento?.[0]}
              label="Instrumento base"
              required
              onSearch={setSearch}
              searchValue={search}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              adminPreview={adminPreview}
              clientId={cliente || null}
              setInstrumentoSelecionado={setInstrumentoSelecionado}
            />
            {asset?.instrumento && (
              <Typography color='warning' variant="body1" sx={{ mt: 1 }}>
                Instrumento escolhido: <strong>{asset?.instrumento?.tipoDeInstrumento?.descricao} {!!asset?.instrumento?.tipoDeInstrumento?.modelo && asset?.instrumento?.tipoDeInstrumento?.modelo} {!!asset?.instrumento?.tipoDeInstrumento?.fabricante && asset?.instrumento?.tipoDeInstrumento?.fabricante}</strong>
              </Typography>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              mt={1}
            >
              Não encontrou o que procura? <Button onClick={() => setShowFormNewAsset(true)} size="small">Criar novo instrumento base</Button>
            </Typography>
            <FormDefaultAsset 
              open={showFormNewAsset}
              onClose={() => setShowFormNewAsset(false)}
              setInstrumentoSelecionado={setInstrumentoSelecionado}
              adminPreview={adminPreview}
              clientId={cliente}
            />
          </AccordionDetails>
        </Accordion>
     
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Identificação do Instrumento
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="TAG"
                  size="small"
                  fullWidth
                  {...form.register('tag', {
                    onChange: (e) => {if (error['non_field_errors']) setError({})},
                  })}
                  error={!!error['non_field_errors']}
                  helperText={!!error['non_field_errors'] && error['non_field_errors'][0]}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Número de Série"
                  size="small"
                  fullWidth
                  {...form.register('numeroDeSerie')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Classe"
                  size="small"
                  fullWidth
                  {...form.register('classe')}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Critérios de Aceitação
            </Typography>
          </AccordionSummary>
          
          <AccordionDetails>
            <Grid container spacing={2}>
              <CriteriosDeAceitacao form={form} fieldName='criteriosAceitacao' />
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Status do Instrumento
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container>
              <Grid item xs={12}>
                <TextField
                  label="Posição"
                  size="small"
                  fullWidth
                  select
                  value={form.watch('posicao')}
                  {...form.register('posicao')}
                >
                  <MenuItem value="U">Em uso</MenuItem>
                  <MenuItem value="E">Em estoque</MenuItem>
                  <MenuItem value="I">Inativo</MenuItem>
                  <MenuItem value="F">Fora de uso</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Frequência
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: !isMobile && 'center'}}>
                  <FormControl sx={{width: isMobile ? '100%' : '50%'}}>
                    <InputLabel id="passagem-tempo-label">
                      Critério de frequência
                    </InputLabel>
                    <Select
                      labelId="passagem-tempo-label"
                      label="Critério de frequência"
                      value={form.watch('criterioFrequencia')}
                      onChange={(e) => form.setValue('criterioFrequencia', e.target.value)}
                    >
                      <MenuItem value="C">Tempo de calendário</MenuItem>
                      <MenuItem value="S">Tempo de serviço</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant='body2' color='secondary'>Preferência atual: {asset?.criterioFrequencia ? frequenceCriterion[asset?.criterioFrequencia] : frequenceCriterion[client?.criterioFrequenciaPadrao]}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Checagem
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        inputProps={{ min: 0, max: 365 }}
                        size="small"
                        fullWidth
                        {...form.register('frequenciaChecagem.quantidade')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Frequência"
                        select
                        size="small"
                        fullWidth
                        value={form.watch('frequenciaChecagem.periodo')}
                        {...form.register('frequenciaChecagem.periodo')}
                      >
                        <MenuItem value="dia">Dia</MenuItem>
                        <MenuItem value="mes">Mês</MenuItem>
                        <MenuItem value="ano">Ano</MenuItem>
                      </TextField>
                    </Grid>
                    {podeMostrarChecagem && (
                      <Grid item xs={12} sm={4}>
                          <DatePicker
                            label="Data última checagem"
                            {...form.register("dataUltimaChecagem")}
                            value={form?.watch('dataUltimaChecagem') ? dayjs(form?.watch('dataUltimaChecagem')) : null}
                            onChange={newValue => form?.setValue("dataUltimaChecagem", newValue)}
                            fullWidth
                            size='small'
                          />
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container alignItems="center"  spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Calibração
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        inputProps={{ min: 0, max: 100 }}
                        size="small"
                        fullWidth
                        {...form.register('frequenciaCalibracao.quantidade')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Frequência"
                        select
                        size="small"
                        fullWidth
                        value={form.watch('frequenciaCalibracao.periodo')}
                        {...form.register('frequenciaCalibracao.periodo')}
                        >
                        <MenuItem value="dia">Dia</MenuItem>
                        <MenuItem value="mes">Mês</MenuItem>
                        <MenuItem value="ano">Ano</MenuItem>
                      </TextField>
                    </Grid>
                    {podeMostrarCalibracao && (
                      <Grid item xs={12} sm={4}>
                        <DatePicker
                          label="Data última calibração"
                          {...form.register("dataUltimaCalibracao")}
                          value={form?.watch('dataUltimaCalibracao') ? dayjs(form?.watch('dataUltimaCalibracao')) : null}
                          onChange={newValue => form?.setValue("dataUltimaCalibracao", newValue)}
                          fullWidth
                          size='small'
                          />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Pontos de Calibração
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddArrayField label="Pontos de Calibração" fieldName="pontosDeCalibracao" form={form} field="nome" />
          </AccordionDetails>
        </Accordion>     
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Normativos legais
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              multiple
              id="norms"
              options={normas || []}
              getOptionLabel={(option) =>  { 
                if (option === 'CRIAR_NOVO') return '';
                return option?.nome || ''
              }}
              filterOptions={(options, state) => {
                const filtered = !!options?.length && options?.filter((opt) =>
                  opt?.nome?.toLowerCase().includes(state.inputValue.toLowerCase())
                );

                return [...filtered, 'CRIAR_NOVO'];
              }}
              renderOption={(props, option) => {
                if (option === 'CRIAR_NOVO') {
                  return (
                    <MenuItem {...props} sx={{ justifyContent: 'center' }}>
                      <Button variant="outlined" size="small">
                        + Criar nova norma
                      </Button>
                    </MenuItem>
                  );
                }
                return <li {...props}>{option.nome}</li>;
              }}
              filterSelectedOptions
              renderTags={() => null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Normativos legais"
                  placeholder="Normativos"
                />
              )}
              onChange={(event, newValue) => {
                const last = newValue[newValue.length - 1];
                if (last === 'CRIAR_NOVO') {
                  setShowFormNewNorm(true);
                  return;
                }

                setNorms(newValue);
              }}
              inputValue={inputNorm}
              onInputChange={(event, newInputValue) => {
                setInputNorm(newInputValue);
              }}
            />
            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
              {!!norms?.length  && norms.map((norma, i) => (
                <Chip
                  key={norma?.id + i}
                  label={norma?.nome}
                  onDelete={() =>
                    setNorms((prev) => prev?.filter((n) => n.id !== norma.id))
                  }
                />
              ))}
            </Box>
           <FormNorms open={showFormNewNorm} setNorms={setNorms} onClose={() => setShowFormNewNorm(false)} />
          </AccordionDetails>
        </Accordion>
        {!!asset?.id && !adminPreview && <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
                Trocar instrumento de setor
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Autocomplete
                options={options}
                value={selectedOption}
                onChange={(event, newValue) => setSetorId(newValue?.id || null)}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField {...params} label="Selecione o setor" variant="outlined" />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pl: option?.depth * 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#555',
                        }}
                      />
                      {option.label}
                    </Box>
                  </li>
                )}
              />
              {asset?.setor?.id && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Setor atual: <strong>{asset?.setor?.nome}</strong>
                </Typography>
              )}
            </AccordionDetails>
        </Accordion>}
        {adminPreview && <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
                Setor
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                label="Setor (Formato: pai/filho)"
                size="small"
                fullWidth
                {...form.register('setor')}
                helperText="Caminho hierárquico completo do setor, separado por '/' (ex: Produção/Qualidade/Controle)"
              />
              {asset?.setor?.id && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Setor atual: <strong>{asset?.setor?.caminhoHierarquia}</strong>
                </Typography>
              )}
            </AccordionDetails>
        </Accordion>}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom mt={2}>
              Observação
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container>
              <Grid item xs={12}>
                <TextField
                  label="Observação"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  {...form.register('observacao')}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
        {adminPreview && <PriceSection form={form} error={error} setError={setError} isMobile={isMobile} />}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={() => {handleClose(); form.reset()}}>Cancelar</Button>
        <Button
          onClick={() => {form.handleSubmit(onSubmit)(); setInstrumentoSelecionado(null)}}  
          variant="contained"
        >
          {asset ? 'Editar instrumento' : 'Criar instrumento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateInstrument