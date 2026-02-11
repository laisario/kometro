import { useMemo } from 'react';

/**
 * Normaliza dados hierárquicos em estrutura flat para otimização de memória
 * @param {Array} hierarchicalData - Dados hierárquicos do backend
 * @returns {{ nodes: Object, rootIds: Array, nodesMap: Map }} - Estrutura normalizada
 */
export function normalizeTree(hierarchicalData) {
  if (!hierarchicalData || hierarchicalData.length === 0) {
    return { nodes: {}, rootIds: [], nodesMap: new Map() };
  }

  const nodes = {};
  const rootIds = [];
  
  function traverse(item, parentId = null, depth = 0) {
    const nodeId = String(item.id);
    const childIds = [];
    const instrumentIds = [];
    
    // Processar subsetores
    if (item.subsetores && Array.isArray(item.subsetores)) {
      item.subsetores.forEach(sub => {
        const subId = String(sub.id);
        childIds.push(subId);
        
        // Criar stub para subsetor (será expandido depois se necessário)
        nodes[subId] = {
          id: subId,
          label: sub.nome,
          type: 'sector',
          parentId: nodeId,
          hasUnloadedChildren: !!(sub.subsetores?.length || sub.instrumentos?.length),
          childIds: [],
          instrumentIds: [],
          depth: depth + 1
        };
        
        // Processar recursivamente
        traverse(sub, nodeId, depth + 1);
      });
    }
    
    // Processar instrumentos
    if (item.instrumentos && Array.isArray(item.instrumentos)) {
      item.instrumentos.forEach(instr => {
        const instrId = `instrument-${instr.id}`;
        instrumentIds.push(instrId);
        
        nodes[instrId] = {
          id: instrId,
          label: instr.tag || instr.numeroDeSerie || 'Instrumento',
          type: 'instrument',
          parentId: nodeId,
          depth: depth + 1,
          // Manter apenas dados essenciais
          originalId: instr.id
        };
      });
    }
    
    // Criar/atualizar nó do setor
    nodes[nodeId] = {
      ...nodes[nodeId], // Merge com stub existente se houver
      id: nodeId,
      label: item.nome,
      type: 'sector',
      parentId,
      childIds,
      instrumentIds,
      hasUnloadedChildren: childIds.length > 0 || instrumentIds.length > 0,
      depth
    };
    
    return nodeId;
  }
  
  // Processar raízes
  hierarchicalData.forEach(root => {
    const id = traverse(root, null, 0);
    rootIds.push(id);
  });
  
  // Criar Map para lookup O(1)
  const nodesMap = new Map(Object.entries(nodes));
  
  return { nodes, rootIds, nodesMap };
}

/**
 * Hook para normalizar dados da árvore com memoização
 */
export function useNormalizedTree(hierarchicalData) {
  return useMemo(() => {
    return normalizeTree(hierarchicalData);
  }, [hierarchicalData]);
}

export default useNormalizedTree;
