import React from 'react'
import { useMutation, useQueryClient } from 'react-query';
import useAuth from '../../auth/hooks/useAuth';
import { enqueueSnackbar } from 'notistack';
import { getErrorMessage } from '../../utils/error';
import { axios } from '../../api';

function useInvitesMutations(grupo, setConviteUrl, overrideClienteId) {
  const queryClient = useQueryClient();
  const { user } = useAuth()

  const createInvite = async () => {
    const clienteId = overrideClienteId || user?.cliente;
    return await axios.post("invites/create/", {
      grupo,
      ...(user?.admin ? {} : { cliente: user?.cliente }),
      cliente: clienteId,
    });
  };
  
  const { 
    mutate: createInviteMutation, 
    isLoading: isLoading, 
  } = useMutation({
    mutationFn: createInvite,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['convites'] })
      setConviteUrl(res?.data?.conviteUrl);
    },
    onError: (erro) => {
      enqueueSnackbar(getErrorMessage(erro?.response?.status), {
        variant: 'error',
        autoHideDuration: 2000
      });
    },
  })

  return {
    createInviteMutation,
    isLoading,
    
  }
}

export default useInvitesMutations