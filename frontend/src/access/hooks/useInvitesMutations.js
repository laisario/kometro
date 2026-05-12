import React from 'react'
import { useMutation, useQueryClient } from 'react-query';
import useAuth from '../../auth/hooks/useAuth';
import { enqueueSnackbar } from 'notistack';
import { getErrorMessage } from '../../utils/error';
import { axios } from '../../api';

function useInvitesMutations(grupo, setConviteUrl, overrideClienteId, origin = "access_page") {
  const queryClient = useQueryClient();
  const { user } = useAuth()

  const createInvite = async () => {
    const payload = { grupo, origin };
    if (!user?.admin) {
      const clienteId = overrideClienteId || user?.cliente;
      if (clienteId) {
        payload.cliente = clienteId;
      }
    } else if (origin === "client_page") {
      if (overrideClienteId) {
        payload.cliente = overrideClienteId;
      }
    }
    return await axios.post("invites/create/", payload);
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