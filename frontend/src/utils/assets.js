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

/**
 * Flattens sectors from the new normalized tree structure (nodes + rootIds)
 * Works with the structure from SectorTreeContext where nodes are stored in a flat object
 * and relationships are maintained via childIds arrays.
 * 
 * @param {Object} nodes - Object mapping nodeId -> node (with id, label, type, childIds, etc.)
 * @param {Array<string>} rootIds - Array of root node IDs
 * @param {number} depth - Current depth in the tree (for indentation)
 * @returns {Array<{id: string|number, label: string, depth: number, raw: any}>} - Flat array of sector options
 */
export function flattenSectorsFromNodes(nodes, rootIds, depth = 0) {
  if (!nodes || !rootIds || rootIds.length === 0) {
    return [];
  }

  const result = [];
  const indentPrefix = '— '.repeat(depth); // Visual indentation prefix

  function traverse(nodeId, currentDepth = 0) {
    const node = nodes[nodeId];
    if (!node) return;

    // Only include sector nodes (not instruments)
    if (node.type === 'sector') {
      // Use node.label directly - visual indentation is handled by padding in renderOption
      // But we can optionally add a prefix for text-based indentation if needed
      const label = node.label;
      
      result.push({
        id: node.id, // This will be a string from normalizeTree, but we compare as strings
        label: label,
        depth: currentDepth,
        raw: node, // Keep reference to original node
      });

      // Recursively process child sectors
      if (node.childIds && Array.isArray(node.childIds) && node.childIds.length > 0) {
        node.childIds.forEach(childId => {
          traverse(childId, currentDepth + 1);
        });
      }
    }
  }

  // Start traversal from root nodes
  rootIds.forEach(rootId => {
    traverse(rootId, depth);
  });

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
