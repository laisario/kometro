import React, { useState } from 'react'
import { useQueryClient } from 'react-query';
import { axios } from '../../api';

function useNormsMutation() {
  const [error, setError] = useState({});
  const queryClient = useQueryClient();

  const createNorms = async (data) => {
    const response = await axios.post(`/normativos/`, data);
    return response
  }

  const { 
    mutate: mutateCreate, 
  } = useMutation({
    mutationFn: createNorms,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normativos'] })
      enqueueSnackbar('Norma criada com sucesso!', {
        variant: 'success'
      });
    },
    onError: (erro) => {
      setError(erro?.response?.data)
      enqueueSnackbar('Falha ao criar norma, tente novamente!', {
        variant: 'error'
      });
    }
  })

  return {
    mutateCreateNorm: mutateCreate,
  }
}

export default useNormsMutation