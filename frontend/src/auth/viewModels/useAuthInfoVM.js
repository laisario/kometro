import React, { useState } from 'react'
import useAuth from '../hooks/useAuth';

function useAuthInfoVM() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { 
    registerAuthMutation, 
    error, 
    setError, 
    verifyError 
  } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);

    if (!termsAccepted) {
      setError((prevErrors) => ({
        ...prevErrors,
        terms: 'Você deve aceitar os termos e condições para continuar',
      }));
      return;
    }

    if (isEmailValid) {
      registerAuthMutation({ email, password, name, termsAccepted})
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(email)) {
      setError((prevErrors) => ({
        ...prevErrors,
        email: "Por favor, insira um email válido.",
      }));
      return false;
    }
    verifyError('email', error, setError)
    return true;
  };


  const handlePasswordChange = (e) => {
    verifyError('password')
    const value = e.target.value;
    setPassword(value, error, setError);
  }

  return {
    setEmail,
    setPassword,
    showPassword,
    setShowPassword,
    handleSubmit,
    error,
    setError,
    email,
    password,
    handlePasswordChange,
    verifyError,
    name,
    setName,
    termsAccepted,
    setTermsAccepted
  }
}

export default useAuthInfoVM