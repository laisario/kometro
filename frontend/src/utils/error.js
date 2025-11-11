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