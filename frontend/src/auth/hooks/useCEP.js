import { useQuery } from 'react-query'
import axios from 'axios'
import { useMemo } from 'react';

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
  const isValid = useMemo(() =>  validarCEP(cep), [cep]);

  const { data } = useQuery(['cep', cep], async () => {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`, { withCredentials: false })
    
    if (form) {
      form.setValue("rua", response?.data?.logradouro)
      form.setValue("bairro", response?.data?.bairro)
      form.setValue("cidade", response?.data?.localidade)
      form.setValue("estado", response?.data?.uf)
      form.setValue("CEP", formatCEP(cep))
    }

    return response?.data

    },
    { enabled: isValid, refetchOnReconnect: false, refetchOnWindowFocus: false }
  )

  return {
    rua: data?.logradouro,
    bairro: data?.bairro,
    cidade: data?.localidade,
    estado: data?.uf,
    isValid,
    cep: formatCEP(cep)
  }
}

export default useCEP