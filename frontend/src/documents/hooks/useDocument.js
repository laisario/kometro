import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { axios, axiosForFiles } from "../../api";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import useAuth from "../../auth/hooks/useAuth";

export const useDocument = (id) => {
  const [openFormReview, setOpenFormReview] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const admin = user?.admin ? 'admin' : 'dashboard'

  const formReview = useForm({
    defaultValues: {
      arquivo: null,
      alteracao: '',
      aprovadores: [],
      tipo: '',
    }
  })
  
  const { 
    data: document, 
    error: errorDocument, 
    isLoading: isLoadingDocument, 
  } = useQuery({
    queryKey: ['documentos', id], 
    queryFn: async () => {
      const response = await axios.get(`/documentos/${id}/`);
      return response?.data;
    },
    enabled: !!id,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  });

  const handleCloseReview = () => {
    formReview.reset();
    setOpenFormReview(false);
  };

  
  const createReview = async () => {
    const response =  await axios.post(`/documentos/${id}/revisar/`, {
      alteracao: formReview.watch('alteracao'),
      aprovadores: formReview.watch('aprovadores'),
      tipo: formReview.watch('tipo'),
    });
    if (formReview.watch('tipo') === "revisar" && response?.data?.revisaoId) {
      const formData = new FormData()
      formData.append("arquivo", formReview.watch('arquivo'))
      await axiosForFiles.patch(`/documentos/${id}/alterar_anexo/`, formData)
    }
    return response
  }

  const { 
    mutate: mutateCreateReview, 
    isLoading: isCreatingReview, 
    isError: isErrorCreateReview, 
    error: errorCreateReview 
  } = useMutation({
    mutationFn: createReview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      formReview.reset();
      setOpenFormReview(false);
      navigate(`/${admin}/documento/${id}/${data?.data?.revisaoId}`, { replace: true });
      enqueueSnackbar(`${data?.data?.revisao?.tipo === 'revalidar' ? 'Revalidação criada com sucesso!' : 'Revisão criada com sucesso!'}`, {
        variant: 'success'
      });
    },
    onError: (error) => {
      setError(error?.response?.data)
      enqueueSnackbar('Falha na criação, tente novamente!', {
        variant: 'error'
      });
    }
  })

  const createApproveReview = ({revisao, userApproved}) => {
    return axios.post(`/documentos/${id}/aprovar/`, {
      revisaoId: revisao?.id,
      delete: userApproved,
    })
  }
  
  const { 
    mutate: mutateApproveReview, 
    isLoading: isLoadingApproveReview, 
  } = useMutation({
    mutationFn: createApproveReview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      enqueueSnackbar(data?.data?.deleted ? 'Aprovação retirada com sucesso!' : 'Aprovada com sucesso!', {
        variant: 'success'
      });
    },
    onError: (error) => {
      setError(error?.response?.data)
      enqueueSnackbar(error?.response?.data?.error, {
        variant: 'error'
      });
    }
  })

  return {
    document,
    errorDocument,
    isLoadingDocument,
    openFormReview,
    setOpenFormReview,
    mutateCreateReview, 
    isCreatingReview, 
    isErrorCreateReview, 
    errorCreateReview: errorCreateReview?.response?.data,
    formReview,
    handleCloseReview,
    error,
    setError,
    mutateApproveReview, 
    isLoadingApproveReview, 
  }
}
