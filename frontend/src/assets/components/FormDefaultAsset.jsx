import React from 'react';
import {
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
  DialogTitle,
  InputAdornment,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import useDefaultAssetMutations from '../hooks/useDefaultAssetMutations';

function FormDefaultAsset({open, onClose, setInstrumentoSelecionado, adminPreview, asset, clientId}) {
  const form = useForm({ defaultValues: {
    descricao: asset?.tipoDeInstrumento?.descricao || '',
    modelo: asset?.tipoDeInstrumento?.modelo || '',
    fabricante: asset?.tipoDeInstrumento?.fabricante || '',
    procedimentoRelacionado: asset?.procedimentoRelacionado?.codigo || '',
    tipoDeServico: asset?.tipoDeServico || '',
    minimo: asset?.minimo || null,
    maximo: asset?.maximo || null,
    unidade: asset?.unidade || '',
    resolucao: asset?.tipoDeInstrumento?.resolucao || null,
    tipoSinal: asset?.tipoSinal || '',
    capacidadeMedicao: asset?.capacidadeDeMedicao?.valor || null,
    unidadeCapacidade: asset?.capacidadeDeMedicao?.unidade || '',
    precoCalibracaoNoCliente: adminPreview ? asset?.precoCalibracaoNoCliente || null : null,
    precoCalibracaoNoLaboratorio: adminPreview ? asset?.precoCalibracaoNoLaboratorio || null : null,
  }});
  const { 
    mutateCreateDefaultAsset, 
    errorDefaultAsset, 
    setError, 
    mutateUpdateDefaultAsset,
  } = useDefaultAssetMutations(onClose, form, setInstrumentoSelecionado)
  const onSubmit = (data) => {
    const payload = adminPreview ? { ...data, cliente: clientId } : data
    if (asset?.id) {
      mutateUpdateDefaultAsset({ id: asset?.id, data: payload })
    } else {
      mutateCreateDefaultAsset(payload)
    }
  }
  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>{asset?.id ? 'Editar Instrumento' : 'Cadastrar Novo Instrumento'}</DialogTitle>
      <DialogContent>
        <TextField
          sx={{ mt: 1 }}
          label="Descrição"
          fullWidth
          required
          {...form.register("descricao", {
            onChange: () => {
              if (errorDefaultAsset?.descricao) setError({});
            },
          })}
          error={!!errorDefaultAsset?.descricao}
          helperText={!!errorDefaultAsset?.descricao && errorDefaultAsset?.descricao[0]}
        />

        <Stack direction='row' gap={2} my={2}>
          <TextField label="Modelo" fullWidth {...form.register("modelo")} />
          <TextField label="Fabricante" fullWidth {...form.register("fabricante")} />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
          <TextField label="Procedimento Relacionado" fullWidth {...form.register("procedimentoRelacionado")} />
          <TextField
            label="Tipo de Serviço"
            select
            fullWidth
            value={form.watch("tipoDeServico") || ''}
            {...form.register("tipoDeServico", {
              onChange: (e) => {
                if (errorDefaultAsset?.tipo_de_servico) setError({});
              }
            })}
            error={!!errorDefaultAsset?.tipo_de_servico}
            helperText={!!errorDefaultAsset?.tipo_de_servico && errorDefaultAsset?.tipo_de_servico[0]}
          >
            <MenuItem value="A">Acreditado</MenuItem>
            <MenuItem value="NA">Não Acreditado</MenuItem>
            <MenuItem value="I">Interna</MenuItem>
          </TextField>
        </Stack>

        <Typography variant="subtitle1" mt={3} mb={2}>Característica Metrológica</Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
          <TextField
            label="Valor Mínimo"
            type="number"
            inputProps={{ step: "any" }}
            fullWidth
            {...form.register("minimo", {
              onChange: () => {
                if (errorDefaultAsset?.minimo) setError({});
              },
            })}
            error={!!errorDefaultAsset?.minimo}
            helperText={!!errorDefaultAsset?.minimo && errorDefaultAsset?.minimo[0]}
          />

          <TextField
            label="Valor Máximo"
            type="number"
            inputProps={{ step: "any" }}
            fullWidth
            {...form.register("maximo", {
              onChange: () => {
                if (errorDefaultAsset?.maximo) setError({});
              },
            })}
            error={!!errorDefaultAsset?.maximo}
            helperText={!!errorDefaultAsset?.maximo && errorDefaultAsset?.maximo[0]}
          />

          <TextField
            label="Unidade"
            fullWidth
            {...form.register("unidade", {
              onChange: () => {
                if (errorDefaultAsset?.unidade) setError({});
              },
            })}
            error={!!errorDefaultAsset?.unidade}
            helperText={!!errorDefaultAsset?.unidade && errorDefaultAsset?.unidade[0]}
          />
        </Stack>

        <Stack direction='row' gap={2} mb={2}>
          <TextField
            label="Resolução"
            type="number"
            inputProps={{ step: "any" }}
            fullWidth
            {...form.register("resolucao")}
          />
          <TextField
            label="Tipo de Sinal"
            select
            fullWidth
            value={form.watch("tipoSinal") || ''}
            {...form.register("tipoSinal", {
              onChange: (e) => {
                if (errorDefaultAsset?.tipo_sinal) setError({});
              }
            })}
            error={!!errorDefaultAsset?.tipo_sinal}
            helperText={!!errorDefaultAsset?.tipo_sinal && errorDefaultAsset?.tipo_sinal[0]}
          >
            <MenuItem value="A">Analógico</MenuItem>
            <MenuItem value="D">Digital</MenuItem>
          </TextField>
        </Stack>

        <Typography variant="subtitle1" mt={3} mb={2}>Capacidade de Medição</Typography>

        <Stack direction='row' gap={2}>
          <TextField
            label="Capacidade"
            type="number"
            inputProps={{ step: "any" }}
            fullWidth
            {...form.register("capacidadeMedicao")}
          />
          <TextField
            label="Unidade"
            fullWidth
            {...form.register("unidadeCapacidade")}
          />
        </Stack>

        {adminPreview && <>
          <Typography variant="subtitle1" mt={3} mb={2}>Preços calibração</Typography>

          <Stack direction='row' gap={2}>
            <TextField
              label="No cliente"
              InputProps={{
                startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                ),
              }}
              fullWidth
              {...form.register("precoCalibracaoNoCliente")}
            />
            <TextField
              label="No laboratório"
              InputProps={{
                startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                ),
              }}
              fullWidth
              {...form.register("precoCalibracaoNoLaboratorio")}
            />
          </Stack>
        </>}
      </DialogContent>
    
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={() => {form.handleSubmit(onSubmit)();}} variant="contained">{asset?.id ? 'Editar Instrumento' : 'Criar Instrumento'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FormDefaultAsset