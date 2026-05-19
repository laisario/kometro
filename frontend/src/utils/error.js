export const verifyError = (field, error, setError) => {
  if (error) {
    setError((prevError) => ({...prevError, [field]: ''}));
  }
}


const errorMessages = {
  400: "Requisição inválida. Verifique os dados enviados.",
  401: "Não autorizado. Faça login para continuar.",
  403: "Proibido. Você não tem permissão para executar esta ação.",
  404: "Não encontrado. O recurso solicitado não foi localizado.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
  502: "Gateway inválido. O servidor recebeu uma resposta inválida.",
  503: "Serviço indisponível. Tente novamente mais tarde.",
  504: "Tempo de resposta esgotado. O servidor demorou muito para responder."
};

export function getErrorMessage(status) {
  return errorMessages[status] || `Erro inesperado (status ${status}). Tente novamente.`;
}

function getApiMessage(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;

  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue)) return firstValue.join(' ');
  if (typeof firstValue === 'string') return firstValue;

  return null;
}

export function getErrorStatus(error) {
  return error?.response?.status || error?.status;
}

export function getApiErrorMessage(error, fallbackMessage = 'Erro inesperado. Tente novamente.') {
  const status = getErrorStatus(error);
  const apiMessage = getApiMessage(error?.response?.data);

  if (status === 400) return apiMessage || errorMessages[400];
  if (status === 401) return 'Sessão expirada ou token inválido. Faça login novamente.';
  if (status === 403) return 'Você não tem permissão para excluir estes clientes.';
  if (status === 404) return 'Cliente não encontrado.';
  if (status) return apiMessage || getErrorMessage(status);

  return error?.message || fallbackMessage;
}
