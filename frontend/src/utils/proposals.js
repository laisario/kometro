export const headCellsAdmin = [
  {
    id: 'numero',
    label: 'Número',
  },
  {
    id: 'data',
    label: 'Data',
  },
  {
    id: 'cliente',
    label: 'Cliente',
  },
  {
    id: 'status',
    label: 'Status',
  },
];

export const headCells = [
  {
    id: 'numero',
    label: 'Número',
  },
  {
    id: 'data',
    label: 'Data',
  },
  {
    id: 'total',
    label: 'Total',
  },
  {
    id: 'status',
    label: 'Status',
  },
];

export const aprovacaoProposta = {
  null: 'Proposta em análise',
  false: 'Proposta negada',
  true: 'Proposta aprovada',
};

export const colorAprovacaoProposta = {
  null: 'info',
  false: 'error',
  true: 'success',
};

export const statusColor = {
  "E": 'info',
  "AA": 'warning',
  "A": 'success',
  "R": 'error',
}

export const statusString = {
  "E": 'Em elaboração',
  "AA": 'Aguardando aprovação',
  "A": 'Aprovada',
  "R": 'Reprovada',
}

export const paymentMethods = {
  CD: 'Débito',
  CC: 'Crédito',
  P: 'Pix',
  D: 'Dinheiro',
  B: 'Boleto',
};

export const statusMessages = (admin) => ({
  "E": admin ? 'Cliente aguardando elaboração da proposta' : 'Aguardando a resposta da equipe Kometro',
  "AA": admin ? 'Aguardando aprovação do cliente' : 'Aguardando sua aprovação',
  "A": admin ? 'Cliente aprovou a proposta' : 'Você aprovou a proposta',
  "R": admin ? 'Cliente não aprovou a proposta' : 'Você reprovou a proposta',
})