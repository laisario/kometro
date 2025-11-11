import { useState } from 'react';
import useAuth from '../hooks/useAuth';

function useLoginVM() {
  const { 
    mutateLogin, 
    isLoadingLogin, 
    errorLogin, 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    mutateLogin({email, password});
  };

  return {
    isLoadingLogin,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleSubmit,
    errorLogin,
  }
}

export default useLoginVM