import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, List, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import useResponsive from '../../theme/hooks/useResponsive';
import { useForm, useWatch } from 'react-hook-form';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormDefaultAsset from './FormDefaultAsset';
import useNorms from '../hooks/useNorms';
import useClient from '../../clients/hooks/useClient';
import { frequenceCriterion, flattenSectors } from '../../utils/assets';
import { useSectorTreeContext } from '../contexts/SectorTreeContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import VirtualizedInstrumentAutocomplete from './VirtualizedInstrumentAutocomplete';
import AddArrayField from '../../components/AddArrayField';
import FormNorms from '../../components/FormNorms';
import CriteriosDeAceitacao from '../../components/CriteriosDeAceitacao';
import { useQuery } from 'react-query';
import { axios } from '../../api';

const PriceSection = ({ form, error, setError }) => {
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
            onChange: (e) => { if (error?.preco_alternativo_calibracao) setError({}) },
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
    tableViewCreate = false, // New prop: when true, shows sector selector for creating instruments from table view
  } = props;
  const { client } = useClient(cliente)
  const isMobile = useResponsive('down', 'md');

  // Tentar usar o contexto se disponível, senão usar setores da prop (para tableViewCreate)
  let sectors = setores;
  try {
    const context = useSectorTreeContext();
    if (context && context.nodes) {
      // Converter nodes para formato hierárquico simplificado para flattenSectors
      const rootIds = context.rootIds || [];
      sectors = rootIds.map(id => {
        const node = context.nodes[id];
        return node ? {
          id: node.id,
          nome: node.label,
          subsetores: (node.childIds || []).map(childId => context.nodes[childId]).filter(Boolean)
        } : null;
      }).filter(Boolean);
    }
  } catch (e) {
    // Context não disponível, usar setores da prop
  }
  
  const options = useMemo(() => flattenSectors(sectors), [sectors]);

  // Buscar instrumento atualizado quando o formulário estiver aberto (para edição)
  // Isso aproveita o cache do React Query e atualiza automaticamente após invalidateQueries
  const { data: updatedAsset } = useQuery({
    queryKey: ['instrumentos', asset?.id],
    queryFn: async () => {
      const response = await axios.get(`/instrumentos/${asset?.id}/`);
      return response?.data;
    },
    enabled: !!asset?.id && open, // Só busca quando está editando e o diálogo está aberto
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Usar o asset atualizado da query se disponível, senão usar o prop
  const currentAsset = updatedAsset || asset;

  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState(currentAsset ? {
    descricao: currentAsset?.instrumento?.tipoDeInstrumento?.descricao ? currentAsset?.instrumento?.tipoDeInstrumento?.descricao : '',
    modelo: currentAsset?.instrumento?.tipoDeInstrumento?.modelo ? currentAsset?.instrumento?.tipoDeInstrumento?.modelo : '',
    fabricante: currentAsset?.instrumento?.tipoDeInstrumento?.fabricante ? currentAsset?.instrumento?.tipoDeInstrumento?.fabricante : '',
    procedimentoRelacionado: currentAsset?.instrumento?.procedimentoRelacionado?.codigo ? currentAsset?.instrumento?.procedimentoRelacionado?.codigo : '',
    tipoDeServico: currentAsset?.instrumento?.tipoDeServico ? currentAsset?.instrumento?.tipoDeServico : '',
    minimo: currentAsset?.instrumento?.minimo ? currentAsset?.instrumento?.minimo : null,
    maximo: currentAsset?.instrumento?.maximo ? currentAsset?.instrumento?.maximo : null,
    unidade: currentAsset?.instrumento?.unidade ? currentAsset?.instrumento?.unidade : '',
    resolucao: currentAsset?.instrumento?.tipoDeInstrumento?.resolucao ? currentAsset?.instrumento?.tipoDeInstrumento?.resolucao : null,
    tipoSinal: currentAsset?.instrumento?.tipoSinal ? currentAsset?.instrumento?.tipoSinal : '',
    capacidadeMedicao: currentAsset?.instrumento?.capacidadeDeMedicao?.valor ? currentAsset?.instrumento?.capacidadeDeMedicao?.valor : null,
    unidadeCapacidade: currentAsset?.instrumento?.capacidadeDeMedicao?.unidade ? currentAsset?.instrumento?.capacidadeDeMedicao?.unidade : '',
    precoCalibracaoNoLaboratorio: currentAsset?.instrumento?.precoCalibracaoNoLaboratorio ? currentAsset?.instrumento?.precoCalibracaoNoLaboratorio : null,
    precoCalibracaoNoCliente: currentAsset?.instrumento?.precoCalibracaoCliente ? currentAsset?.instrumento?.precoCalibracaoCliente : null,
  } : null);
  const [norms, setNorms] = useState(currentAsset?.normativos?.length ? currentAsset?.normativos : []);
  const [showFormNewAsset, setShowFormNewAsset] = useState(false);
  const [showFormNewNorm, setShowFormNewNorm] = useState(false);
  const [inputNorm, setInputNorm] = useState('');
  const [setorId, setSetorId] = useState(currentAsset?.setor?.id ? currentAsset?.setor?.id : null);
  const { normas } = useNorms(cliente);

  const selectedOption = useMemo(() => options?.find((opt) => opt?.id === setorId) || null, [currentAsset?.setor?.id, setorId, options]);

  const form = useForm({
    defaultValues: {
      tag: currentAsset?.tag ? currentAsset.tag : '',
      numeroDeSerie: currentAsset?.numeroDeSerie ? currentAsset.numeroDeSerie : '',
      classe: currentAsset?.classe ? currentAsset.classe : '',
      posicao: currentAsset?.posicao ? currentAsset.posicao : "I",
      observacao: currentAsset?.observacao ? currentAsset.observacao : '',
      frequenciaChecagem: {
        quantidade: currentAsset?.frequenciaChecagem?.quantidade ? currentAsset.frequenciaChecagem.quantidade : null,
        periodo: currentAsset?.frequenciaChecagem?.periodo ? currentAsset.frequenciaChecagem.periodo : 'dia',
      },
      frequenciaCalibracao: {
        quantidade: currentAsset?.frequenciaCalibracao?.quantidade ? currentAsset.frequenciaCalibracao.quantidade : null,
        periodo: currentAsset?.frequenciaCalibracao?.periodo ? currentAsset.frequenciaCalibracao.periodo : 'dia',
      },
      pontosDeCalibracao: currentAsset?.pontosDeCalibracao?.length ? currentAsset?.pontosDeCalibracao?.map((p) => p?.nome) : [],
      dataUltimaCalibracao: currentAsset?.dataUltimaCalibracao ? currentAsset?.dataUltimaCalibracao : null,
      dataUltimaChecagem: currentAsset?.dataUltimaChecagem ? currentAsset?.dataUltimaChecagem : null,
      criteriosAceitacao: currentAsset?.criteriosAceitacao?.length ? currentAsset?.criteriosAceitacao : [],
      criterioFrequencia: currentAsset?.criterioFrequencia || '',
      setor: currentAsset?.setor?.caminhoHierarquia || '',
    }
  });

  const {
    dataUltimaChecagem,
    dataUltimaCalibracao,
  } = useWatch({ control: form?.control })

  useEffect(() => {
    if (currentAsset && open) {
      form.reset({
        tag: currentAsset?.tag ? currentAsset.tag : '',
        numeroDeSerie: currentAsset?.numeroDeSerie ? currentAsset.numeroDeSerie : '',
        classe: currentAsset?.classe ? currentAsset.classe : '',
        posicao: currentAsset?.posicao ? currentAsset.posicao : "I",
        observacao: currentAsset?.observacao ? currentAsset.observacao : '',
        frequenciaChecagem: {
          quantidade: currentAsset?.frequenciaChecagem?.quantidade ? currentAsset.frequenciaChecagem.quantidade : null,
          periodo: currentAsset?.frequenciaChecagem?.periodo ? currentAsset.frequenciaChecagem.periodo : 'dia',
        },
        frequenciaCalibracao: {
          quantidade: currentAsset?.frequenciaCalibracao?.quantidade ? currentAsset.frequenciaCalibracao.quantidade : null,
          periodo: currentAsset?.frequenciaCalibracao?.periodo ? currentAsset.frequenciaCalibracao.periodo : 'dia',
        },
        pontosDeCalibracao: currentAsset?.pontosDeCalibracao?.length ? currentAsset?.pontosDeCalibracao?.map((p) => p?.nome) : [],
        dataUltimaCalibracao: currentAsset?.dataUltimaCalibracao ? currentAsset?.dataUltimaCalibracao : null,
        dataUltimaChecagem: currentAsset?.dataUltimaChecagem ? currentAsset?.dataUltimaChecagem : null,
        criteriosAceitacao: currentAsset?.criteriosAceitacao?.length ? currentAsset?.criteriosAceitacao : [],
        criterioFrequencia: currentAsset?.criterioFrequencia || '',
        setor: currentAsset?.setor?.caminhoHierarquia || '',
      });

      if (currentAsset?.instrumento) {
        setInstrumentoSelecionado({
          id: currentAsset.instrumento.id,
          ...currentAsset.instrumento,
        });
      } else {
        setInstrumentoSelecionado(null);
      }

      if (currentAsset?.normativos?.length) {
        setNorms(currentAsset.normativos);
      }

      if (currentAsset?.setor?.id) {
        setSetorId(currentAsset.setor.id);
      }
    }
  }, [currentAsset, open]);

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


    if (currentAsset?.id) {
      const adminPayload = {
        ...payload,
        id: currentAsset?.id,
      }

      const clientPayload = {
        ...payload,
        id: currentAsset?.id,
        setor: setorId,
        previousSetorId: currentAsset?.setor?.id,
      }


      const paramEdit = adminPreview ? adminPayload : clientPayload
      mutate(paramEdit);
    } else {
      // When creating from table view, use the selected setorId (can be null/optional)
      // Otherwise, use the setor prop from the sector tree selection
      const paramCreate = adminPreview ? payload : ({
        ...payload,
        previousSetorId: null,
        setor: tableViewCreate
          ? (setorId ? Number(setorId) : null)
          : (setor?.type === 'sector' ? Number(setor?.id) : Number(setor?.parentId)),
      })
      mutate(paramCreate);
    }
  }

  const {
    posicao,
    criterioFrequencia
  } = useWatch({ control: form?.control })


  const podeMostrarCalibracao = useMemo(() => criterioFrequencia === 'S' || currentAsset?.criterioFrequencia === "S"
    ? posicao === 'U'
    : !currentAsset?.calibracoes?.length, [posicao, criterioFrequencia, currentAsset])


  const podeMostrarChecagem = useMemo(() => criterioFrequencia === 'S' || currentAsset?.criterioFrequencia === "S"
    ? posicao === 'U'
    : !currentAsset?.checagens?.length, [criterioFrequencia, posicao, currentAsset])
  return (
    <Dialog onClose={() => { handleClose() }} open={open} fullScreen={isMobile}>
      <DialogTitle>{currentAsset ? 'Editar instrumento' : 'Crie seu instrumento'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary">
              Instrumento base
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {!currentAsset?.id && <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Escolha um instrumento base (obrigatório). Preencha os detalhes agora nas seções abaixo ou continue depois.
            </Typography>}
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
            {currentAsset?.instrumento && !instrumentoSelecionado && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}
              >
                Instrumento atual: <strong>
                  {currentAsset?.instrumento?.tipoDeInstrumento?.descricao}
                  {currentAsset?.instrumento?.tipoDeInstrumento?.modelo && ` ${currentAsset?.instrumento?.tipoDeInstrumento?.modelo}`}
                  {currentAsset?.instrumento?.tipoDeInstrumento?.fabricante && ` / ${currentAsset?.instrumento?.tipoDeInstrumento?.fabricante}`}
                </strong>
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
                    onChange: (e) => { if (error['non_field_errors']) setError({}) },
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
            <Typography variant="subtitle1" color="text.secondary">
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
            <Typography variant="subtitle1" color="text.secondary">
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
            <Typography variant="subtitle1" color="text.secondary">
              Frequência
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: !isMobile && 'center' }}>
                  <FormControl sx={{ width: isMobile ? '100%' : '50%' }}>
                    <InputLabel id="passagem-tempo-label">
                      Critério de frequência
                    </InputLabel>
                    <Select
                      labelId="passagem-tempo-label"
                      label="Critério de frequência"
                      size='small'
                      value={form.watch('criterioFrequencia')}
                      onChange={(e) => form.setValue('criterioFrequencia', e.target.value)}
                    >
                      <MenuItem value="C">Tempo de calendário</MenuItem>
                      <MenuItem value="S">Tempo de serviço</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant='body2' color='secondary'>Preferência atual: {currentAsset?.criterioFrequencia ? frequenceCriterion[currentAsset?.criterioFrequencia] : frequenceCriterion[client?.criterioFrequenciaPadrao]}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary" >
                        Checagem
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        size='small'
                        inputProps={{ min: 0, max: 365 }}
                        fullWidth
                        {...form.register('frequenciaChecagem.quantidade')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Frequência"
                        select
                        fullWidth
                        size='small'
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
                          slotProps={{
                            textField: {
                              size: 'small',
                            },
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="subtitle2" color="text.secondary" >
                        Calibração
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        size='small'
                        inputProps={{ min: 0, max: 100 }}
                        fullWidth
                        {...form.register('frequenciaCalibracao.quantidade')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Frequência"
                        select
                        fullWidth
                        size='small'
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
                          slotProps={{
                            textField: {
                              size: 'small',
                            },
                          }}
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
            <Typography variant="subtitle1" color="text.secondary">
              Pontos de Calibração
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AddArrayField label="Pontos de Calibração" fieldName="pontosDeCalibracao" form={form} field="nome" />
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary">
              Normativos legais
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Autocomplete
              multiple
              id="norms"
              options={normas || []}
              getOptionLabel={(option) => {
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
              {!!norms?.length && norms.map((norma, i) => (
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
        {/* Setor Accordion - shows for editing OR creating from table view */}
        {((!!currentAsset?.id) || (tableViewCreate && !currentAsset?.id)) && !adminPreview && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" color="text.secondary">
                {currentAsset?.id ? 'Trocar instrumento de setor' : 'Setor'}
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
                  <TextField
                    {...params}
                    label="Selecione o setor"
                    variant="outlined"
                    helperText={!currentAsset?.id ? 'Deixe em branco para criar instrumento sem setor' : undefined}
                  />
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
              {currentAsset?.setor?.id && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Setor atual: <strong>{currentAsset?.setor?.nome}</strong>
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        )}
        {adminPreview && <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary">
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
            {currentAsset?.setor?.id && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Setor atual: <strong>{currentAsset?.setor?.caminhoHierarquia}</strong>
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="text.secondary">
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
        <Button onClick={() => { handleClose(); form.reset() }}>Cancelar</Button>
        <Button
          onClick={() => { form.handleSubmit(onSubmit)(); setInstrumentoSelecionado(null) }}
          variant="contained"
        >
          {asset ? 'Editar instrumento' : 'Criar instrumento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateInstrument