import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { axios } from '../../api';
import {getErrorMessage} from '../../utils/error'

function useAssetMutations(handleClose, adminPreview) {
  const [error, setError] = useState({});
  const queryClient = useQueryClient();

  const deleteAsset = async (id) => {
    await axios.delete(`/instrumentos/${id}/`);
  };
  
  const { 
    mutate: mutateDelete, 
    isLoading: isDeleting 
  } = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      enqueueSnackbar('Instrumento deletado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar('Ocorreu um erro ao deletar o instrumento. Tente mais tarde!', {
        variant: 'error',
        autoHideDuration: 2000
      });
    },
  })

  const sendCriticalAnalisys = async ({ idCalibration, analiseCliente }) => {
    const patchData = { analiseCritica: analiseCliente?.criticalAnalysis }
    if (analiseCliente?.restrictions?.length) {
      patchData.restricaoAnaliseCritica = analiseCliente?.restrictions
    }
    const response = await axios.patch(`/calibracoes/${idCalibration}/`, patchData);
    return response.data;

  }

  const { 
    mutate: mutateCriticalAnalisys, 
    isLoading: isLoadingCriticalAnalisys, 
  } = useMutation({
    mutationFn: sendCriticalAnalisys,
    onSuccess: () => {
      enqueueSnackbar('Ánalise criada com sucesso!', {
        variant: 'success'
      });
      // queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      queryClient.invalidateQueries({ queryKey: ['calibracoes'] })
      handleClose()
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    },
  })

  const formatedData = (form) => ({
    tag: form?.tag,
    numeroDeSerie: form?.numeroDeSerie,
    dataProximaChecagem: form?.dataProximaChecagem && dayjs(form?.dataProximaChecagem)?.format('YYYY-MM-DD'),
    dataUltimaCalibracao: form?.dataUltimaCalibracao && dayjs(form?.dataUltimaCalibracao)?.format('YYYY-MM-DD'),
    local: form?.local,
    instrumento: {
      maximo: form?.maximo,
      minimo: form?.minimo,
      unidade: form?.unidade,
      precoCalibracaoNoLaboratorio: form?.precoCalibracaoLaboratorio,
      precoCalibracaoNoCliente: form?.precoCalibracaoCliente,
      capacidadeDeMedicao: {
        valor: form?.capacidadeMedicao,
        unidade: form?.unidadeMedicao,
      },
      tipoDeInstrumento: {
        descricao: form?.descricao,
        fabricante: form?.fabricante,
        modelo: form?.modelo,
        resolucao: form?.resolucao,
      },
      tipoDeServico: form?.tipoDeServico,
    },
    procedimentoRelacionado: form?.procedimentoRelacionado,
    precoAlternativoCalibracao: form?.precoAlternativoCalibracao,
    diasUteis: form?.diasUteis,
    pontosDeCalibracao: form?.pontosDeCalibracao?.length ? form?.pontosDeCalibracao?.map(ponto => ({ nome: ponto })) : [],
    posicao: form?.posicao,
    frequencia: form?.frequencia,
    laboratorio: form?.laboratorio,
    observacoes: form?.observacoes,
    cliente: form?.client,
  })

  const createInstrument = async (form) => {
    const data = formatedData(form)

    const response = await axios.post(`/instrumentos/`, data);
    return response;
  }

  const { 
    mutate: mutateCreate, 
    isLoading: isLoadingCreate, 
  } = useMutation({
    mutationFn: createInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      handleCleanCreateForm()
      handleClose()
      enqueueSnackbar('Instrumento criado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar('Falha ao criar instrumento, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const createInstrumentClient = async (data) => {
    const response = await axios.post(`/instrumentos/`, data);
    return response;
  }

  const { 
    mutate: mutateCreateClient, 
    isLoading: isLoadingCreateClient, 
  } = useMutation({
    mutationFn: createInstrumentClient,
    onSuccess: () => {
      const queryKey = adminPreview ? ['instrumentos'] : ['setores'];
      queryClient.invalidateQueries({ queryKey, })
      handleClose('create')
      enqueueSnackbar('Instrumento criado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      const errors = erro?.response?.data;
    
      const mensagemDetalhada =
      errors && typeof errors === "object"
        ? Object.entries(errors)
            .map(([campo, mensagens]) => {
              let nomeFormatado;

              if (campo === "instrumento") {
                nomeFormatado = "Instrumento base";
              } else if (campo === "non_field_errors") {
                return "Você já possui um instrumento com essa Tag. Escolha outra.";
              } else {
                nomeFormatado =
                  campo.charAt(0).toUpperCase() + campo.slice(1);
              }

              return `${nomeFormatado} - ${mensagens.join(", ")}`;
            })
            .join("\n")
        : null;
    
      setError(errors);
    
      enqueueSnackbar(
        mensagemDetalhada || getErrorMessage(erro?.response?.status),
        { variant: 'error', autoHideDuration: 2000 }
      );
    }
  })

  const updateInstrumentClient = async (data) => {
    const response = await axios.patch(`/instrumentos/${data?.id}/`, data);
    return response;
  }

  const { 
    mutate: mutateUpdateClient, 
    isLoading: isLoadingUpdateClient,
  } = useMutation({
    mutationFn: updateInstrumentClient,
    onSuccess: (_data, variables) => {
      enqueueSnackbar('Instrumento atualizado com sucesso!', {
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      
      handleClose('edit')
    },
    onError: (erro) => {
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    }
  })

  
  const { 
    mutate: mutateDeleteClient, 
  } = useMutation({
    mutationFn: async(id) => await axios.delete(`/instrumentos/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      enqueueSnackbar('Instrumento deletado com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    },
  })

  const { 
    mutate: mutateChangePosition, 
  } = useMutation({
    mutationFn: async(data) => await axios.patch(`/instrumentos/${data?.id}/mudar_posicao/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrumentos'] })
      enqueueSnackbar('Mudança posição realizada com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    },
  })


  const { 
    mutate: duplicateInstrument, 
  } = useMutation({
    mutationFn: async(id) => await axios.post(`/instrumentos/${+(id)}/duplicar/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] })
      enqueueSnackbar('Duplicação realizada com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    },
  })


  return {
    mutateDelete,
    isDeleting,
    mutateCriticalAnalisys,
    isLoadingCriticalAnalisys,
    mutateCreate, 
    isLoadingCreate,
    error,
    setError,
    mutateCreateClient,
    isLoadingCreateClient,
    mutateUpdateClient,
    isLoadingUpdateClient,
    mutateDeleteClient,
    mutateChangePosition,
    duplicateInstrument
  }
}

export default useAssetMutations