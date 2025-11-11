import { useMutation, useQueryClient } from "react-query";
import { axios } from "../../api";
import { enqueueSnackbar } from "notistack";
import dayjs from 'dayjs';

const useProposalMutations = (formCreateProposal, handleClose, setError, id) => {
  const queryClient = useQueryClient();

  const createProposal = async (data) => {
    await axios.post('/propostas/', { 
      instrumentos: data?.instrumentos?.length ? data?.instrumentos?.map(instrumento => instrumento?.id) : null, 
      cliente: data?.cliente?.id ? data?.cliente?.id : null, 
      informacoesAdicionais: data?.informacoesAdicionais
    });
  }

  const { 
    mutate: mutateCreateProposal, 
    isLoading: isLoadingCreateProposal
  } = useMutation({
    mutationFn: createProposal,
    onSuccess: () => {
      enqueueSnackbar('Proposta criada com sucesso!', {
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      handleClose()
      formCreateProposal.reset()

    },
    onError: (error) => {
      const erros = error?.response?.data
      setError(erros)
      enqueueSnackbar('Falha ao criar a proposta, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const { mutate: deleteOrder, isLoading: isDeleting } = useMutation({
    mutationFn: async (ids) => Promise.all(ids?.map((id) => axios.delete(`/propostas/${id}/`))), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      enqueueSnackbar('Proposta deletada com sucesso!', {
        variant: 'success'
      });
    },
    onError: (error) => {
      enqueueSnackbar('Falha ao deletar a proposta, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const removeInstrument = async (instrumentId) => {
    await axios.post(`/propostas/${id}/remover_instrumento/`, { instrumento_id: instrumentId });
  }

  const { mutate: removeInstrumentProposal, isLoading: isRemoving } = useMutation({
    mutationFn: removeInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      enqueueSnackbar('Instrumento removido com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao remover instrumento, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const addInstrument = async (instruments) => {
    const proposalAssets = proposal?.instrumentos?.map(({ id }) => id);
    await axios.post(
      `/propostas/${proposal?.id}/adicionar_instrumento/`,
      { instrumentos: [...proposalAssets, ...instruments?.map(instrument => instrument?.id)]}
    );
  }

  const { mutate: addInstrumentProposal, isLoading: isLoadingAdd } = useMutation({
    mutationFn: addInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      enqueueSnackbar('Instrumento adicionado com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao adicionar instrumento, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const { mutate: sendProposalToEmail, isLoading: isLoadingSendProposal } = useMutation({
    mutationFn: async(data) => await axios.post(`/propostas/${id}/enviar_email/`, data),
    onSuccess: () => {
      enqueueSnackbar('Proposta enviada com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao enviar proposta, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const { mutate: aproveProposal, isLoading: isLoadingAproveProposal } = useMutation({
    mutationFn: async() => await axios.post(`/propostas/${id}/aprovar/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      enqueueSnackbar('Proposta aprovada com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao aprovar proposta, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const { mutate: refuseProposal, isLoading: isLoadingRefuseProposal } = useMutation({
    mutationFn: async() => await axios.post(`/propostas/${id}/reprovar/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      enqueueSnackbar('Proposta recusada com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao recusar proposta, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const { mutate: approveBilling, isLoading: isApprovingBilling } = useMutation({
    mutationFn: async (data) =>  await axios.patch(`/propostas/${id}/liberar_para_faturamento/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      enqueueSnackbar('Faturamento aprovado com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao aprovar faturamento, tente novamente!', {
        variant: 'error'
      });
    }
  });

  const elaborate = async ({ addressClient, data }) => {
    const formValues = data;
    const formatDayjs = (date) => dayjs.isDayjs(date) ? date.format('YYYY-MM-DD') : null;
    const commonData = {
      total: formValues?.total || 0,
      condicaoDePagamento: formValues?.condicaoDePagamento || null,
      transporte: formValues?.transporte || null,
      numero: formValues?.numeroProposta || '',
      validade: formatDayjs(formValues?.validade),
      status: formValues?.status || null,
      responsavel: formValues?.responsavel || null,
      diasUteis: formValues?.diasUteis || null,
      descontoPercentual: formValues?.descontoPercentual || null,
      local: formValues?.local || null,
    };

    if (formValues?.enderecoDeEntrega === 'enderecoCadastrado') {
      return axios.patch(`/propostas/${id}/elaborar/`, {
        ...commonData,
        enderecoDeEntrega: addressClient || null,
      });
    }
    return axios.patch(`/propostas/${id}/elaborar/`, {
      ...commonData,
      enderecoDeEntregaAdd: {
        cep: formValues?.CEP || null,
        numero: formValues?.numero || null,
        logradouro: formValues?.rua || null,
        bairro: formValues?.bairro || null,
        cidade: formValues?.cidade || null,
        estado: formValues?.estado || null,
        complemento: formValues?.complemento || null,
      } || null,
    });
  };

  const { 
    mutate: elaborateProposal, 
    isLoading: isLoadingElaborateProposal,
    isSuccess: isSuccessElaborate,
  } = useMutation({
    mutationFn: elaborate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] })
      enqueueSnackbar('Proposta elaborada com sucesso!', {
        variant: 'success'
      });
    },
    onError: () => {
      enqueueSnackbar('Falha ao elaborar proposta, tente novamente!', {
        variant: 'error'
      });
    },
  })


  return {
    deleteOrder,
    isDeleting,
    mutateCreateProposal,
    isLoadingCreateProposal,
    removeInstrumentProposal,
    isRemoving,
    addInstrumentProposal,
    isLoadingAdd,
    sendProposalToEmail,
    isLoadingSendProposal,
    aproveProposal,
    isLoadingAproveProposal,
    refuseProposal,
    isLoadingRefuseProposal,
    approveBilling,
    isApprovingBilling,
    elaborateProposal,
    isLoadingElaborateProposal,
    isSuccessElaborate,
  }
}

export default useProposalMutations;