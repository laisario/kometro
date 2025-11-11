import React, { useContext, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  List,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useForm, useWatch } from 'react-hook-form';
import Row from './Row'
import useAssetMutations from '../assets/hooks/useAssetMutations';

function AddArrayField({ label, fieldName, form }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const currentValues = form.getValues(fieldName) || [];
    form.setValue(fieldName, [...currentValues, inputValue]);
    setInputValue('');
  };

  const handleRemove = (indexToRemove) => {
    const currentValues = form.getValues(fieldName);
    const newValues = currentValues?.filter((_, index) => index !== indexToRemove);
    form.setValue(fieldName, newValues);
  };

  const values = form.watch(fieldName) || [];

  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Box display="flex" flexDirection="row" width="100%" gap={2}>
        <TextField
          label={label}
          variant="outlined"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          size="small"
          sx={{ width: '80%' }}
        />
        <Button onClick={handleAdd} variant="contained" size="small" sx={{ width: '20%' }}>
          Adicionar
        </Button>
      </Box>
      <List sx={{ mt: 1, overflowX: 'auto' }}>
        {values?.map((value, index) => (
          <Chip
            label={value}
            sx={{ m: 0.5 }}
            onDelete={() => handleRemove(index)}
            key={index}
          />
        ))}
      </List>
    </Box>
  );
}

function EditAsset(props) {
  const { 
    handleClose, 
    open, 
    instrument, 
    isMobile, 
    create, 
    clientId 
  } = props;
  
  
  const form = useForm({
    defaultValues: {
      tag: instrument?.tag ? instrument?.tlocal: instrument?.numeroDeSerie ? instrument?.numeroDeSerie : '',
      dataUltimaCalibracao: instrument?.dataUltimaCalibracao ? instrument?.dataUltimaCalibracao : null,
      dataProximaChecagem: instrument?.dataProximaChecagem ? instrument?.dataProximaChecagem : null,
      precoAlternativoCalibracao: instrument?.precoAlternativoCalibracao ? instrument?.precoAlternativoCalibracao : '',
      diasUteis: instrument?.diasUteis ? instrument?.diasUteis : null,
      capacidadeMedicao: instrument?.instrumento?.capacidadeDeMedicao?.valor ? instrument?.instrumento?.capacidadeDeMedicao?.valor : 0,
      unidadeMedicao: instrument?.instrumento?.capacidadeDeMedicao?.unidade ? instrument?.instrumento?.capacidadeDeMedicao?.unidade : '',
      local: instrument?.local ? instrument?.local : "P",
      precoCalibracaoLaboratorio: instrument?.instrumento?.precoCalibracaoNoLaboratorio || null,
      precoCalibracaoCliente: instrument?.instrumento?.precoCalibracaoNoCliente || null,
      pontosDeCalibracao: instrument?.pontosDeCalibracao?.length ? instrument?.pontosDeCalibracao?.map(ponto => ponto?.nome) : [],
      minimo: instrument?.instrumento?.minimo ? instrument?.instrumento?.minimo : null,
      maximo: instrument?.instrumento?.maximo ? instrument?.instrumento?.maximo : null,
      unidade: instrument?.instrumento?.unidade ? instrument?.instrumento?.unidade : null,
      posicao: instrument?.posicao ? instrument?.posicao : 'U',
      laboratorio: instrument?.laboratorio ? instrument?.laboratorio : '',
      frequencia: instrument?.frequencia ? instrument.frequencia : 0,
      observacoes: instrument?.observacoes ? instrument?.observacoes : '',
      tipoDeServico: instrument?.instrumento?.tipoDeServico ? instrument?.instrumento?.tipoDeServico : 'A',
      procedimentoRelacionado: instrument?.instrumento?.procedimentoRelacionado?.codigo ? instrument?.instrumento?.procedimentoRelacionado?.codigo : null,
      descricao: instrument?.instrumento?.tipoDeInstrumento?.descricao ? instrument?.instrumento?.tipoDeInstrumento?.descricao : '',
      modelo: instrument?.instrumento?.tipoDeInstrumento?.modelo ? instrument?.instrumento?.tipoDeInstrumento?.modelo : '',
      fabricante: instrument?.instrumento?.tipoDeInstrumento?.fabricante ? instrument?.instrumento?.tipoDeInstrumento?.fabricante : '',
      resolucao: instrument?.instrumento?.tipoDeInstrumento?.resolucao ? instrument?.instrumento?.tipoDeInstrumento?.resolucao : 0,
    }
  })

  const handleCleanCreateForm = () => {
    form?.reset()
  };

  const { 
    mutateUpdate, 
    mutateCreate,
    isLoadingUpdate, 
    isLoadingCreate,
    error,
    setError,
  } = useAssetMutations(handleCleanCreateForm, handleClose);
  
  const {
    dataUltimaCalibracao,
    local,
    posicao,
    dataProximaChecagem,
    tipoDeServico,
    laboratorio
  } = useWatch({ control: form?.control })

  const { handleSubmit } = form;

  const saveChanges = () => {
    if (create) {
      handleSubmit((data) => mutateCreate({...data, client: clientId}))()
    } else {
      handleSubmit((data) => mutateUpdate({...data, instrumento: instrument?.id}))()
    }
  }


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Dialog onClose={handleClose} open={open} fullScreen={isMobile}>
        <DialogTitle>{create ? 'Adicionar novo instrumento:' : 'Editar instrumento:'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
          <form onSubmit={saveChanges}>
            <Row>
              <TextField
                id="descricao"
                label="Descrição"
                name="descricao"
                variant="outlined"
                sx={{ width: '60%' }}
                {...form.register("descricao", {
                  onChange: (e) => {if (error?.instrumento?.tipo_de_instrumento?.descricao) setError({})},
                })}
                error={!!error?.instrumento?.tipo_de_instrumento?.descricao}
                helperText={!!error?.instrumento?.tipo_de_instrumento?.descricao && error?.instrumento?.tipo_de_instrumento?.descricao}
                size="small"
                required
              />
              <TextField
                id="modelo"
                label="Modelo"
                name="modelo"
                variant="outlined"
                sx={{ width: '40%' }}
                {...form.register("modelo", {
                  onChange: (e) => {if (error?.instrumento?.tipo_de_instrumento?.modelo) setError({})},
                })}
                error={!!error?.instrumento?.tipo_de_instrumento?.modelo}
                helperText={!!error?.instrumento?.tipo_de_instrumento?.modelo && error?.instrumento?.tipo_de_instrumento?.modelo}
                size="small"
              />
            </Row>
            <Row >
              <TextField
                id="fabricante"
                label="Fabricante"
                name="fabricante"
                variant="outlined"
                sx={{ width: '40%' }}
                {...form.register("fabricante", {
                  onChange: (e) => {if (error?.instrumento?.tipo_de_instrumento?.fabricante) setError({})},
                })}
                error={!!error?.instrumento?.tipo_de_instrumento?.fabricante}
                helperText={!!error?.instrumento?.tipo_de_instrumento?.fabricante && error?.instrumento?.tipo_de_instrumento?.fabricante}
                size="small"
              />
              <TextField
                id="resolucao"
                label="Resolução"
                name="resolucao"
                variant="outlined"
                sx={{ width: '30%' }}
                {...form.register("resolucao", {
                  onChange: (e) => {if (error?.instrumento?.tipo_de_instrumento?.resolucao) setError({})},
                })}
                error={!!error?.instrumento?.tipo_de_instrumento?.resolucao}
                helperText={!!error?.instrumento?.tipo_de_instrumento?.resolucao && error?.instrumento?.tipo_de_instrumento?.resolucao}
                size="small"
                type='number'
              />
              <TextField
                id="tag"
                label="Tag"
                name="tag"
                variant="outlined"
                sx={{ width: '30%' }}
                {...form.register("tag", {
                  onChange: (e) => {if (error?.tag) setError({})},
                })}
                error={!!error?.tag}
                helperText={!!error?.tag && error?.tag}
                size="small"
              />
            </Row>
            <Row>
              <TextField
                id="numeroDeSerie"
                label="Número de série"
                name="numeroDeSerie"
                variant="outlined"
                sx={{ width: isMobile ? '45%' : '50%' }}
                {...form.register("numeroDeSerie", {
                  onChange: (e) => {if (error?.numero_de_serie) setError({})},
                })}
                error={!!error?.numero_de_serie}
                helperText={!!error?.numero_de_serie && error?.numero_de_serie}
                size="small"
              />
              <TextField
                label="Procedimento relacionado"
                variant="outlined"
                sx={{ width: isMobile ? '55%' : '50%' }}
                {...form.register("procedimentoRelacionado", {
                  onChange: (e) => {if (error?.procedimento_relacionado) setError({})},
                })}
                placeholder="Procedimento relacionado"
                size="small"
                error={!!error?.procedimento_relacionado}
                helperText={!!error?.procedimento_relacionado && error?.procedimento_relacionado}
              />
            </Row>
            <Row>
              <DatePicker
                label="Próxima checagem"
                {...form.register("dataProximaChecagem")}
                value={dataProximaChecagem ? dayjs(dataProximaChecagem) : null}
                onChange={newValue => form.setValue("dataProximaChecagem", newValue)}
                sx={{ width: '50%' }}
              />
              <DatePicker
                label="Última calibração"
                {...form.register("dataUltimaCalibracao")}
                value={dataUltimaCalibracao ? dayjs(dataUltimaCalibracao) : null}
                onChange={newValue => form.setValue("dataUltimaCalibracao", newValue)}
                sx={{ width: '50%' }}
              />
            </Row>
            <Row>
              <FormControl sx={{ width: local === "T" ? '40%' : '50%' }}>
                <InputLabel>Local</InputLabel>
                <Select
                  {...form.register("local", {
                    onChange: (e) => {if (error?.local) setError({})},
                  })}
                  error={!!error?.local}
                  helperText={!!error?.local && error?.local}
                  label="Local"
                  value={local}
                >
                  <MenuItem value="P">Instalações Permanente</MenuItem>
                  <MenuItem value="C">Instalações Clientes</MenuItem>
                  <MenuItem value="T">Terceirizada</MenuItem>
                </Select>
              </FormControl>
              {local === "T" && <TextField
                id="diasUteis"
                label="Dias Úteis"
                type="number"
                variant="outlined"
                sx={{ width: isMobile ? '100%' : '20%' }}
                {...form.register("diasUteis", {
                  onChange: (e) => {if (error?.dias_uteis) setError({})},
                })}
                error={!!error?.dias_uteis}
                helperText={!!error?.dias_uteis && error?.dias_uteis}
              />}
              <TextField
                label="Laboratorio"
                variant="outlined"
                sx={{ width: laboratorio === "T" ? '40%' : '50%' }}
                {...form.register("laboratorio", {
                  onChange: (e) => {if (error?.laboratorio) setError({})},
                })}
                error={!!error?.laboratorio}
                helperText={!!error?.laboratorio && error?.laboratorio}
              />
            </Row>
            <Row>
              <TextField
                id="capacidadeMedicao"
                label="Capacidade de medição"
                name="capacidadeMedicao"
                variant="outlined"
                {...form.register("capacidadeMedicao", {
                  onChange: (e) => {if (error?.instrumento?.capacidade_de_medicao?.valor) setError({})},
                })}
                error={!!error?.instrumento?.capacidade_de_medicao?.valor}
                helperText={!!error?.instrumento?.capacidade_de_medicao?.valor && error?.instrumento?.capacidade_de_medicao?.valor}
                size="small"
                sx={{ width: isMobile ? '70%' : '50%' }}
              />
              <TextField
                label="Unidade"
                variant="outlined"
                sx={{ width: isMobile ? '30%' : '50%' }}
                {...form.register("unidadeMedicao", {
                  onChange: (e) => {if (error?.instrumento?.capacidade_de_medicao?.unidade) setError({})},
                })}
                error={!!error?.instrumento?.capacidade_de_medicao?.unidade}
                helperText={!!error?.instrumento?.capacidade_de_medicao?.unidade && error?.instrumento?.capacidade_de_medicao?.unidade}
                placeholder="Unidade de medição"
                size="small"
              />
            </Row>
            <Row>
              <FormControl sx={{ width: posicao === 'U' ? '35%' : '50%' }}>
                <InputLabel>Tipo de servico</InputLabel>
                <Select
                    {...form.register("tipoDeServico", {
                    onChange: (e) => {if (error?.instrumento?.tipo_de_servico) setError({})},
                  })}
                  error={!!error?.instrumento?.tipo_de_servico}
                  helperText={!!error?.instrumento?.tipo_de_servico && error?.instrumento?.tipo_de_servico}
                  label="Tipo de servico"
                  value={tipoDeServico}
                >
                  <MenuItem value="A">Acreditado</MenuItem>
                  <MenuItem value="NA">Nao Acreditado</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ width: posicao === 'U' ? '35%' : '50%' }}>
                <InputLabel>Posição</InputLabel>
                <Select
                  {...form.register("posicao", {
                    onChange: (e) => {if (error?.posicao) setError({})},
                  })}
                  error={!!error?.posicao}
                  helperText={!!error?.posicao && error?.posicao}
                  label="Posição"
                  value={posicao}
                >
                  <MenuItem value="U">Em uso</MenuItem>
                  <MenuItem value="E">Em estoque</MenuItem>
                  <MenuItem value="I">Inativo</MenuItem>
                  <MenuItem value="F">Fora de uso</MenuItem>
                </Select>
              </FormControl>
              {posicao === 'U' && (
                <TextField
                  autoFocus
                  id="frequencia"
                  name="frequencia"
                  label="Frequência"
                  type='number'
                  {...form.register("frequencia", {
                    onChange: (e) => {if (error?.frequencia) setError({})},
                  })}
                  error={!!error?.frequencia}
                  helperText={error?.frequencia ? error?.frequencia : "Em meses"}
                  sx={{ width: '30%' }}
                />
              )}
            </Row>
            <Row>
              <AddArrayField label="Pontos de Calibração" fieldName="pontosDeCalibracao" form={form} field="nome" />
            </Row>
            <Row>
              <DialogContentText>Faixa atendida:</DialogContentText>
            </Row>
            <Row>
              <TextField
                id="minimo"
                label="Mínimo"
                name="minimo"
                variant="outlined"
                {...form.register("minimo", {
                  onChange: (e) => {if (error?.instrumento?.minimo) setError({})},
                })}
                error={!!error?.instrumento?.minimo}
                helperText={!!error?.instrumento?.minimo && error?.instrumento?.minimo}
                size="small"
                type="number"
                sx={{ width: isMobile ? '30%' : '50%' }}
              />
              <TextField
                id="maximo"
                label="Máximo"
                name="maximo"
                variant="outlined"
                type='number'
                {...form.register("maximo", {
                  onChange: (e) => {if (error?.instrumento?.maximo) setError({})},
                })}
                error={!!error?.instrumento?.maximo}
                helperText={!!error?.instrumento?.maximo && error?.instrumento?.maximo}
                size="small"
                sx={{ width: isMobile ? '30%' : '50%' }}
              />
              <TextField
                label="Unidade"
                variant="outlined"
                sx={{ width: isMobile ? '30%' : '50%' }}
                {...form.register("unidade", {
                  onChange: (e) => {if (error?.instrumento?.unidade) setError({})},
                })}
                error={!!error?.instrumento?.unidade}
                helperText={!!error?.instrumento?.unidade && error?.instrumento?.unidade}
                placeholder="Unidade"
                size="small"
              />
            </Row>
            <Row>
              <DialogContentText>Preços calibração:</DialogContentText>
            </Row>
            <Row>
              <TextField
                label="Laboratório"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                sx={{ width: isMobile ? '100%' : '40%' }}
                {...form.register("precoCalibracaoLaboratorio", {
                  onChange: (e) => {if (error?.instrumento?.preco_calibracao_no_laboratorio) setError({})},
                })}
                error={!!error?.instrumento?.preco_calibracao_no_laboratorio}
                helperText={!!error?.instrumento?.preco_calibracao_no_laboratorio && error?.instrumento?.preco_calibracao_no_laboratorio}
                size="small"
              />
              <TextField
                label="Cliente"
                variant="outlined"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                    ),
                }}
                sx={{ width: isMobile ? '100%' : '40%' }}
                {...form.register("precoCalibracaoCliente", {
                  onChange: (e) => {if (error?.instrumento?.preco_calibracao_no_cliente) setError({})},
                })}
                error={!!error?.instrumento?.preco_calibracao_no_cliente}
                helperText={!!error?.instrumento?.preco_calibracao_no_cliente && error?.instrumento?.preco_calibracao_no_cliente}
                size="small"
              />
              <TextField
                label="Alternativo"
                variant="outlined"
                sx={{ width: isMobile ? '100%' : '40%' }}
                {...form.register("precoAlternativoCalibracao", {
                  onChange: (e) => {if (error?.preco_alternativo_calibracao) setError({})},
                })}
                error={!!error?.preco_alternativo_calibracao}
                helperText={!!error?.preco_alternativo_calibracao && error?.preco_alternativo_calibracao}
                size="small"
                InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                }}
              />
            </Row>
            <Row>
              <TextField
                label="Observações"
                variant="outlined"
                {...form.register("observacoes", {
                  onChange: (e) => {if (error?.observacoes) setError({})},
                })}
                error={!!error?.observacoes}
                helperText={!!error?.observacoes && error?.observacoes}
                placeholder="Observaçoes"
                fullWidth
                multiline
                rows={3}
              />
            </Row>
          </form>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => {handleClose(); setError({})}}>Cancelar</Button>
          {isLoadingUpdate || isLoadingCreate 
            ? <CircularProgress /> 
            : <Button variant='contained' onClick={saveChanges}>{create ? 'Criar' : 'Salvar mudanças'}</Button>
          }
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default EditAsset;