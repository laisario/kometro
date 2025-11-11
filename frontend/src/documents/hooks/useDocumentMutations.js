import { useMutation, useQueryClient } from "react-query";
import { axios, axiosForFiles } from "../../api";
import { enqueueSnackbar } from "notistack";

const useDocumentMutations = (handleClose, setError) => {
  const queryClient = useQueryClient();
  
  const create = async (form) => {
    const formData = new FormData()
    const response = await axios.post('/documentos/', form);
    if (response?.data?.id && form?.arquivo) {
      formData.append("arquivo", form?.arquivo)
      await axiosForFiles.patch(`/documentos/${response?.data?.id}/anexar/`, formData)
    }
    return response?.data
  }

  const { 
  mutate: mutateCreate, 
  isLoading: isCreating, 
  isSuccess: isSuccessCreate, 
  error: errorCreate 
  } = useMutation({
  mutationFn: create,
  onSuccess: () => {
    enqueueSnackbar('Documento criada com sucesso!', {
    variant: 'success'
    });
    queryClient.invalidateQueries({ queryKey: ['documentos'] });
    handleClose();
  },
  onError: (error) => {
    const erros = error?.response?.data
    setError(erros)
    enqueueSnackbar(errorMessage(error?.response?.status), {
    variant: 'error'
    });
  }
  })

  const { 
  mutate: deleteDocumentos, 
  isLoading: isDeleting 
  } = useMutation(async (ids) => Promise.all(ids?.map((id) => axios.delete(`/documentos/${id}/`))), {
  onSuccess: () => {
    enqueueSnackbar('Documento deletado com sucesso!', {
    variant: 'success'
    });
    queryClient.invalidateQueries({ queryKey: ['documentos'] })
  },
  onError: () => {
    enqueueSnackbar('Falha ao deletar o documento, tente novamente!', {
    variant: 'error'
    });
  }
  })


  return {
    mutateCreate,
    isCreating,
    isSuccessCreate,
    errorCreate,
    deleteDocumentos,
    isDeleting,
  }
}

export default useDocumentMutations;