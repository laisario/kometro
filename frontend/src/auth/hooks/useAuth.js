import { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import  AuthContext from '../context'
import { axios } from '../../api';
import { useMutation } from 'react-query';
import { enqueueSnackbar } from 'notistack';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router';
import { verifyError } from '../../utils/error';


const errorMessagesLogin = {
  400: 'Email e senha são obrigatórios.',
  404: 'Usuário não encontrado.',
  401: 'Email ou senha incorretos.',
  500: 'Erro no servidor. Tente novamente mais tarde.',
};

const errorMessagesRegister = {
  409: 'Este email já está em uso.',
  500: 'Erro no servidor. Tente novamente mais tarde.',
}

const creationPermissionGroups = ['gerente', 'registrador']

export default function useAuth() {
  const { user, setUser, clienteId, setClienteId } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState({});

  const handleErrorLogin = (err) => {
    if (!err?.response) {
      return 'Sem resposta do servidor.';
    }
    return errorMessagesLogin[err?.status] || 'Erro desconhecido. Tente novamente mais tarde.';
  };

  const handleErrorRegister = (err) => {
    if (!err?.response) {
      return 'Sem resposta do servidor.';
    }
    return errorMessagesRegister[err?.status];
  };
  

  const login = async({email, password}) => {
    const response = await axios.post('/login/', {
      username: email,
      password,
    });
    return response;
  };
  
  const { mutate: mutateLogin, isLoading: isLoadingLogin, error: errorLogin, isError: isErrorLogin } = useMutation(login,
    {
      onSuccess: (data) => {
        const token = data?.data?.access;
        const decoded = jwtDecode(token);
        window.localStorage.setItem('token', token);
        const user = { token, nome: decoded?.nome, id: decoded?.user_id, admin: decoded?.admin, cliente: decoded?.cliente }
        setUser(user);
        window.localStorage.setItem('user', JSON.stringify(user));
        
        const redirectPath = decoded?.admin ? '/admin' : '/dashboard';
        navigate(redirectPath, { replace: true });
      },
      onError: (error) => {
        const errMsg = handleErrorLogin(error);
        enqueueSnackbar(errMsg, {
          variant: 'error'
        });
        
      },
    }
  );
  
  const errorMsgLogin = useMemo(() => errorMessagesLogin[errorLogin?.status], [errorLogin?.status])
  
  const registerBasics = async ({ empresa, razaoSocial, cnpj, ie, nomeFantasia, filial }) => {
    const payload = { empresa, razaoSocial, cnpj, ie, nomeFantasia, filial }

    const response = await axios.post('/register/basics/', payload);
    window.localStorage.setItem('clienteId', response?.data);
    setClienteId(response?.data);
    return response;
  }

  const { mutate: registerBasicsMutation, isLoading: isLoadingRegisterBasics} = useMutation(registerBasics,
    {
      onSuccess: (data) => {
        navigate('/register/location', { replace: true })
      },
      onError: (error) => {
        const erros = error?.response?.data
        setError(erros)

        const errMsg = handleErrorRegister(error);
        enqueueSnackbar(errMsg, {
          variant: 'error'
        });
      },
    }
  );

  const registerLocation = async ({ uf, cidade, bairro, logradouro, numero, cep }) => {
      const payload = { clienteId, uf, cidade, bairro, logradouro, numero, cep };
      const response = await axios.post('/register/location/', payload);
      return response;
  };

  const { 
    mutate: registerLocationMutation, 
    isLoading: isLoadingRegisterLocation 
  } = useMutation(registerLocation,
    {
      onSuccess: (data) => {
        navigate('/register/auth', { replace: true })
      },
      onError: (error) => {
        const erros = error?.response?.data
        setError(erros)

        const errMsg = handleErrorRegister(error);
        enqueueSnackbar(errMsg, {
          variant: 'error'
        });
      },
    }
  );


  const registerAuth = async ({ password, email, name, termsAccepted }) => {
    const payload = { clienteId, password, username: email, firstName: name, termsAccepted: termsAccepted };
    const response = await axios.post('/register/auth/', payload);
    return response;
  };

  const { 
    mutate:registerAuthMutation, 
    isLoading: isLoadingRegisterAuth
  } = useMutation(registerAuth,
    {
      onSuccess: (data) => {
        navigate('/login', { replace: true, state: { msg: 'Conta criada com sucesso! Faça login!'} });
        enqueueSnackbar('Conta criada com sucesso! Faça login!', {
          variant: 'success'
        });
      },
      onError: (error) => {
        const erros = error?.response?.data
        setError(erros)

        const errMsg = handleErrorRegister(error);
        enqueueSnackbar(getErrorMessage(error?.response?.status), {
          variant: 'error'
        });
      },
    }
  );

  const logout = () => {
    window.localStorage.removeItem('token');
    setUser(null);
  };

  const roles = user?.roles?.map((role) => role?.name)

  const hasCreatePermission = useMemo(() => roles?.some((role) => creationPermissionGroups?.includes(role)), [roles])
  const hasDeletePermission =  useMemo(() => roles?.includes('gerente'), [roles])
  const hasEditPermission =  useMemo(() => roles?.includes('gerente'), [roles])

  const isManager = useMemo(() => roles?.includes('gerente'), [roles])

  return { 
    user,
    cliente: clienteId,
    logout, 
    mutateLogin,
    errorLogin,
    isErrorLogin,
    isLoadingLogin, 
    registerBasicsMutation, 
    isLoadingRegisterBasics, 
    registerLocationMutation,
    isLoadingRegisterLocation,
    registerAuthMutation,
    isLoadingRegisterAuth,
    errorMsgLogin,
    error,
    setError,
    verifyError,
    hasCreatePermission,
    hasDeletePermission,
    hasEditPermission,
    isManager,
  };
};
