import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useQuery } from 'react-query';
import axios from 'axios';
import useResponsive from '../../theme/hooks/useResponsive';
import useCreateClient from '../hooks/useCreateClient';
import { validarCEP, formatCEP } from '../../auth/hooks/useCEP';

const frequencyOptions = [
  { value: 'C', label: 'Tempo de calendário' },
  { value: 'S', label: 'Tempo de serviço' }
];

function getDefaultValues(clientData) {
  console.log(clientData)
  if (clientData?.empresa) {
    return {
      razaoSocial: clientData.empresa.razaoSocial || '',
      cnpj: clientData.empresa.cnpj || '',
      ie: clientData.empresa.ie || '',
      nomeFantasia: clientData.empresa.nomeFantasia || clientData.empresa.nomeFantasia || '',
      filial: clientData.empresa.filial || '',
      isento: clientData.empresa.isento || false,
      uf: clientData.endereco?.uf || '',
      cidade: clientData.endereco?.cidade || '',
      bairro: clientData.endereco?.bairro || '',
      logradouro: clientData.endereco?.logradouro || '',
      numero: clientData.endereco?.numero?.toString() || '',
      complemento: clientData.endereco?.complemento || '',
      cep: clientData.endereco?.cep || '',
      criterioFrequenciaPadrao: clientData.criterioFrequenciaPadrao || clientData.criterioFrequenciaPadrao || 'C'
    };
  }
  return {
    razaoSocial: '',
    cnpj: '',
    ie: '',
    nomeFantasia: '',
    filial: '',
    isento: false,
    uf: '',
    cidade: '',
    bairro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    cep: '',
    criterioFrequenciaPadrao: 'C'
  };
}

function CreateClient({ open, onClose, clientData }) {
  const { createClient, updateClient } = useCreateClient(onClose);
  const [expanded, setExpanded] = useState('empresa');
  const [cepError, setCepError] = useState('');

  const isEditMode = !!clientData?.id;

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: getDefaultValues(clientData)
  });

  const isento = useWatch({ control, name: 'isento' });
  const cepValue = useWatch({ control, name: 'cep' });

  const cleanCep = useMemo(() => cepValue?.replace(/\D/g, ''), [cepValue]);
  const isValidCep = useMemo(() => validarCEP(cleanCep), [cleanCep]);

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(clientData));
    }
  }, [open, clientData]);

  const { isFetching: cepLoading } = useQuery(
    ['cep', cleanCep],
    async () => {
      setCepError('');
      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        withCredentials: false,
        timeout: 5000
      });

      if (response?.data?.erro) {
        setCepError('CEP não encontrado');
        return null;
      }

      setValue('logradouro', response?.data?.logradouro || '');
      setValue('bairro', response?.data?.bairro || '');
      setValue('cidade', response?.data?.localidade || '');
      setValue('uf', response?.data?.uf || '');
      setValue('cep', formatCEP(cleanCep));

      return response?.data;
    },
    {
      enabled: isValidCep && !!cleanCep && cleanCep.length === 8,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: 24 * 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
      retry: 1,
      onError: () => {
        setCepError('Erro ao buscar CEP');
      }
    }
  );

  const handleCepChange = (e) => {
    const value = e.target.value;
    setValue('cep', value);
    setCepError('');
  };

  const handleExpandedChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : '');
  };

  const onSubmit = (data) => {
    console.log(data, "ENDERECO")
    const payload = {
      empresa: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        ie: data.isento ? null : (data.ie || null),
        nomeFantasia: data.nomeFantasia || null,
        filial: data.filial || null,
        isento: data.isento || false
      },
      endereco: {
        uf: data.uf,
        cidade: data.cidade,
        bairro: data.bairro,
        logradouro: data.logradouro,
        numero: parseInt(data.numero, 10),
        complemento: data.complemento || '',
        cep: data.cep
      },
      criterioFrequenciaPadrao: data.criterioFrequenciaPadrao
    };

    if (isEditMode) {
      return updateClient.mutateAsync({ id: clientData.id, data: payload });
    }
    return createClient.mutateAsync(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Editar cliente' : 'Criar cliente'}
      </DialogTitle>
      <DialogContent>
        <Accordion
          expanded={expanded === 'empresa'}
          onChange={handleExpandedChange('empresa')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Empresa</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="razaoSocial"
                  control={control}
                  rules={{ required: 'Razão social é obrigatória' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Razão social"
                      error={!!errors.razaoSocial}
                      helperText={errors.razaoSocial?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="nomeFantasia"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Nome fantasia" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="cnpj"
                  control={control}
                  rules={{ required: 'CNPJ é obrigatório' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CNPJ"
                      error={!!errors.cnpj}
                      helperText={errors.cnpj?.message}
                      inputProps={{ maxLength: 18 }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="filial"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Filial" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="isento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Isento de IE"
                      value={field.value ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                      <MenuItem value="false">Não</MenuItem>
                      <MenuItem value="true">Sim</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              {!isento && (
                <Grid item xs={12} md={4}>
                  <Controller
                    name="ie"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Inscrição Estadual" />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <Controller
                  name="criterioFrequenciaPadrao"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth select label="Critério de frequência">
                      {frequencyOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded === 'endereco'}
          onChange={handleExpandedChange('endereco')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>Endereço</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="cep"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CEP"
                      onChange={(e) => {
                        field.onChange(e);
                        handleCepChange(e);
                      }}
                      error={!!cepError}
                      helperText={cepError}
                    />
                  )}
                />
              </Grid>
              {cepLoading && (
                <Grid item xs={12} md={4}>
                  <CircularProgress />
                </Grid>
              )}
              <Grid item xs={12} md={4}>
                <Controller
                  name="uf"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="UF"
                      inputProps={{ maxLength: 2 }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="cidade"
                  control={control}
                  rules={{ required: 'Cidade é obrigatória' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cidade"
                      error={!!errors.cidade}
                      helperText={errors.cidade?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="bairro"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Bairro" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="logradouro"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Logradouro" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="numero"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Número"
                      type="number"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="complemento"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Complemento" />
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          variant="contained"
        >
          {isSubmitting ? (
            <CircularProgress size={20} />
          ) : isEditMode ? (
            'Salvar'
          ) : (
            'Criar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateClient;