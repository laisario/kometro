import { useQuery } from 'react-query'
import axios from 'axios'
import { useMemo, useState, useEffect, useRef } from 'react';

const regexCep = /^[0-9]{8}$/;

export function validarCEP(value = '') {
  if (!value) return false
  const cep = value.replace(/\D/g, '');

  return regexCep.test(cep)
}

export function formatCEP(value = '') {
  const valid = validarCEP(value)

  if (!valid) return ''

  const cep = value.replace(/\D/g, '');

  const format = cep.replace(
    /(\d{5})(\d{3})/,
    '$1-$2',
  )

  return format
}

const useCEP = (cep, form) => {
  // Debounce: espera 400ms após o usuário parar de digitar
  const [debouncedCep, setDebouncedCep] = useState(cep);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCep(cep);
    }, 400);

    return () => clearTimeout(timer);
  }, [cep]);

  const cleanCep = useMemo(() => debouncedCep?.replace(/\D/g, ''), [debouncedCep]);
  const isValid = useMemo(() => validarCEP(cleanCep), [cleanCep]);

  const { data, isFetching } = useQuery(
    ['cep', cleanCep],
    async () => {
      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { 
        withCredentials: false,
        timeout: 5000
      });
      
      // Verifica se o CEP retornou erro
      if (response?.data?.erro) {
        return null;
      }

      // Preenche o formulário com os dados
      if (formRef.current) {
        formRef.current.setValue("rua", response?.data?.logradouro || '');
        formRef.current.setValue("bairro", response?.data?.bairro || '');
        formRef.current.setValue("cidade", response?.data?.localidade || '');
        formRef.current.setValue("estado", response?.data?.uf || '');
        formRef.current.setValue("CEP", formatCEP(cleanCep));
      }

      return response?.data;
    },
    { 
      enabled: isValid,
      refetchOnReconnect: false, 
      refetchOnWindowFocus: false,
      staleTime: 24 * 60 * 60 * 1000, // Cache por 24 horas (CEP não muda)
      cacheTime: 24 * 60 * 60 * 1000,
      retry: 1,
    }
  );

  return {
    rua: data?.logradouro,
    bairro: data?.bairro,
    cidade: data?.localidade,
    estado: data?.uf,
    isValid,
    isFetching,
    cep: formatCEP(cleanCep)
  }
}

export default useCEP