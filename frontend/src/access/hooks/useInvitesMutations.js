import React from 'react'
import { useMutation, useQueryClient } from 'react-query';
import useAuth from '../../auth/hooks/useAuth';
import { enqueueSnackbar } from 'notistack';
import { getErrorMessage } from '../../utils/error';
import { axios } from '../../api';

function useInvitesMutations(grupo, setConviteUrl) {
  const queryClient = useQueryClient();
  const { user } = useAuth()

  const createInvite = async () => {
    return await axios.post("invites/create/", {
      grupo,
      cliente: user?.cliente,
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