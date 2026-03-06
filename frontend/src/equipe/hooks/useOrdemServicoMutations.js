import { useMutation, useQueryClient } from 'react-query';
import { axios } from '../../api';
import { enqueueSnackbar } from 'notistack';

const useOrdemServicoMutations = () => {
  const queryClient = useQueryClient();

  // Update OS fields
  const updateOS = async ({ id, osId, data }) => {
    const osIdToUse = id || osId;
    const response = await axios.patch(`/ordens-servico/${osIdToUse}/`, data);
    return response.data;
  };

  const {
    mutate: mutateUpdateOS,
    mutateAsync: mutateUpdateOSAsync,
    isLoading: isLoadingUpdateOS,
  } = useMutation({
    mutationFn: updateOS,
    onSuccess: (data, variables) => {
      const osIdToUse = variables.id || variables.osId;
      if (osIdToUse) {
        queryClient.invalidateQueries({ queryKey: ['ordem-servico', osIdToUse] });
      }
      queryClient.invalidateQueries({ queryKey: ['ordem-servico'] });
      enqueueSnackbar('Ordem de serviço atualizada com sucesso!', {
        variant: 'success',
      });
    },
    onError: (error) => {
      const errors = error?.response?.data;
      const errorMessage = errors?.detail || 
        (typeof errors === 'object' && errors !== null
          ? Object.entries(errors)
              .map(([field, messages]) => {
                const fieldName = field === 'non_field_errors' 
                  ? 'Erro' 
                  : field.charAt(0).toUpperCase() + field.slice(1);
                return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
              })
              .join('\n')
          : 'Falha ao atualizar ordem de serviço. Tente novamente!');
      
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 4000,
      });
    },
  });

  // Update OS status
  const updateStatus = async ({ id, status }) => {
    const response = await axios.patch(`/ordens-servico/${id}/`, { status });
    return response.data;
  };

  const {
    mutate: mutateUpdateStatus,
    isLoading: isLoadingUpdateStatus,
  } = useMutation({
    mutationFn: updateStatus,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico'] });
      enqueueSnackbar('Status atualizado com sucesso!', {
        variant: 'success',
      });
    },
    onError: (error) => {
      const errors = error?.response?.data;
      const errorMessage = errors?.detail || 
        (errors?.status ? errors.status.join(', ') : 'Falha ao atualizar status. Tente novamente!');
      
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 4000,
      });
    },
  });

  // Create OS (if needed)
  const createOS = async (data) => {
    const response = await axios.post('/ordens-servico/', data);
    return response.data;
  };

  const {
    mutate: mutateCreateOS,
    isLoading: isLoadingCreateOS,
  } = useMutation({
    mutationFn: createOS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico'] });
      enqueueSnackbar('Ordem de serviço criada com sucesso!', {
        variant: 'success',
      });
    },
    onError: (error) => {
      const errors = error?.response?.data;
      const errorMessage = errors?.detail || 
        (typeof errors === 'object' && errors !== null
          ? Object.entries(errors)
              .map(([field, messages]) => {
                const fieldName = field === 'non_field_errors' 
                  ? 'Erro' 
                  : field.charAt(0).toUpperCase() + field.slice(1);
                return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
              })
              .join('\n')
          : 'Falha ao criar ordem de serviço. Tente novamente!');
      
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 4000,
      });
    },
  });

  // Preview certificate number (read-only, doesn't persist)
  const previewCertificado = async ({ osId, instrumentoId }) => {
    const response = await axios.get(
      `/ordens-servico/${osId}/preview_certificado/`,
      { params: { instrumento_id: instrumentoId } }
    );
    return response.data;
  };

  // Generate certificate for an instrument (persists to database)
  const gerarCertificado = async ({ osId, instrumentoId }) => {
    const response = await axios.post(
      `/ordens-servico/${osId}/gerar_certificado/`,
      { instrumento_id: instrumentoId }
    );
    return response.data;
  };

  const {
    mutate: mutateGerarCertificado,
    mutateAsync: mutateGerarCertificadoAsync,
    isLoading: isLoadingGerarCertificado,
  } = useMutation({
    mutationFn: gerarCertificado,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', variables.osId] });
      queryClient.invalidateQueries({ queryKey: ['ordem-servico'] });
      enqueueSnackbar('Número de certificado gerado e atribuído com sucesso!', {
        variant: 'success',
      });
    },
    onError: (error) => {
      const errors = error?.response?.data;
      const errorMessage = errors?.detail || 'Falha ao gerar número de certificado. Tente novamente!';
      
      enqueueSnackbar(errorMessage, {
        variant: 'error',
        autoHideDuration: 4000,
      });
    },
  });

  return {
    mutateUpdateOS,
    mutateUpdateOSAsync,
    isLoadingUpdateOS,
    // Alias for backward compatibility
    mutateUpdateOrdemServico: mutateUpdateOS,
    mutateUpdateStatus,
    isLoadingUpdateStatus,
    mutateCreateOS,
    isLoadingCreateOS,
    previewCertificado,
    mutateGerarCertificado,
    mutateGerarCertificadoAsync,
    isLoadingGerarCertificado,
  };
};

export default useOrdemServicoMutations;
