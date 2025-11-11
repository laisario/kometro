export const localLabels = {
  "P": "Instalações permanentes",
  "C": "Instalações cliente",
  "T": "Terceirizado"
}

export const positionLabels = {
  "U": "Em uso",
  "E": "Em estoque",
  "I": "Inativo",
  "F": "Fora de uso"
}

export const colorPositionInstrument = {
  U: 'success',
  E: 'secondary',
  I: 'info',
  F: 'warning',
};

export const frequenceCriterion = {
  S: 'Tempo de serviço',
  C: 'Tempo de calendário'
}

export const tipoSinalMap = {
  A: 'Analógico',
  D: 'Digital',
};

export const tipoServicoMap = {
  A: 'Acreditado',
  NA: 'Não acreditado',
  I: 'Interno',
};



export function flattenSectors(data, depth = 0) {
  let result = [];

  for (const item of data) {
    if (item.itemType === "sector") {
      result.push({
        id: item.id,
        label: item.label,
        depth,
      });

      const childSectors = item.children?.filter(child => child.itemType === "sector") || [];
      if (childSectors.length > 0) {
        result = result.concat(flattenSectors(childSectors, depth + 1));
      }
    }
  }

  return result;
}




export const getInstrumentoLabel = (instrumento) => {
  if (!instrumento || typeof instrumento !== 'object') return '';

  const tipo = instrumento.tipoDeInstrumento || {};
  const descricao = tipo.descricao || '';
  const modelo = tipo.modelo || '';
  const fabricante = tipo.fabricante || '';
  const minimo = instrumento.minimo;
  const maximo = instrumento.maximo;
  const unidade = instrumento.unidade || '';

  let faixa = '';
  if (minimo != null && maximo != null && unidade) {
    faixa = ` (${minimo} – ${maximo} ${unidade})`;
  }

  const partes = [descricao, modelo, fabricante].filter(Boolean);
  const info = partes.join(' | ');

  return info ? `${info}${faixa}` : '';
};
