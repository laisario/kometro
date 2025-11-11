import { useState } from 'react';
import useAuth from '../hooks/useAuth';
import useCNPJ from '../hooks/useCNPJ';
import useCPF from '../hooks/useCPF';

function useBasicInfoVM() {
  const [CNPJ, setCNPJ] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [IE, setIE] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [filial, setFilial] = useState('');
  const { registerBasicsMutation, error, setError, verifyError } = useAuth();
  const {
    cnpj: cnpjFormatado,
    isValid: cnpjValido,
  } = useCNPJ(CNPJ);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    registerBasicsMutation({
      razaoSocial,
      cnpj: CNPJ,
      ie: IE || null,
      empresa: true,
      nomeFantasia: nomeFantasia || null,
      filial: filial || null,
    });
  };
  
  
  return {
    handleSubmit,
    CNPJ,
    razaoSocial,
    IE,
    setCNPJ,
    setRazaoSocial,
    setIE,
    setNomeFantasia,
    nomeFantasia,
    filial,
    setFilial,
    setError,
    cnpjFormatado,
    cnpjValido,
    nomeFantasia,
    filial,
    error,
    verifyError
  }
}

export default useBasicInfoVM