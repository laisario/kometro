import { useForm, useWatch } from 'react-hook-form';
import useAuth from '../hooks/useAuth';
import useCEP from '../hooks/useCEP';

function useLocationInfoVM() {
  const { registerLocationMutation, error, setError, verifyError } = useAuth();
  const form = useForm({
    defaultValues: {
      CEP: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      complemento: "",
    },
    mode: "onBlur",
    // reValidateMode: ['onSubmit', 'onBlur'],
  })

  const control = form?.control && form?.control;

  const {
    CEP,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    complemento
  } = useWatch({ control: form.control })

  const { isValid, ...cepInfo } = useCEP(CEP, form);

  const handleSubmit = async (e) => {
    e.preventDefault();
    registerLocationMutation({
      uf: cepInfo?.estado || estado,
      cidade: cepInfo?.cidade || cidade,
      bairro: cepInfo?.bairro || bairro,
      logradouro: cepInfo?.rua || rua,
      numero,
      cep: cepInfo?.cep || CEP,
      complemento,
    });
  };


  return {
    handleSubmit,
    isValid,
    form,
    control,
    error,
    setError,
  }
}

export default useLocationInfoVM;