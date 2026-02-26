import { useMemo } from 'react';

/**
 * Gera lista flat da árvore para virtualização
 * @param {Object} nodes - Objeto com todos os nós normalizados
 * @param {Array} rootIds - IDs dos nós raiz
 * @param {Set} expandedIds - Set de IDs expandidos
 * @returns {Array} Lista flat com { id, depth, node }
 */
export function flattenTree(nodes, rootIds, expandedIds) {
  const flat = [];
  
  function addNode(id, depth = 0) {
    const node = nodes[id];
    if (!node) return;
    
    // Adicionar nó à lista flat
    flat.push({ 
      id, 
      depth, 
      node,
      isExpanded: expandedIds.has(id),
      hasChildren: (node.childIds?.length > 0) || (node.instrumentIds?.length > 0)
    });
    
    // Se expandido, adicionar filhos
    if (expandedIds.has(id)) {
      // Subsetores primeiro
      if (node.childIds && node.childIds.length > 0) {
        node.childIds.forEach(childId => addNode(childId, depth + 1));
      }
      
      // Instrumentos depois
      if (node.instrumentIds && node.instrumentIds.length > 0) {
        node.instrumentIds.forEach(instrId => addNode(instrId, depth + 1));
      }
    }
  }
  
  // Processar raízes
  if (rootIds && rootIds.length > 0) {
    rootIds.forEach(id => addNode(id, 0));
  }
  
  return flat;
}

/**
 * Hook para gerar lista flat com memoização
 */
export function useFlattenedTree(nodes, rootIds, expandedIds) {
  return useMemo(() => {
    return flattenTree(nodes, rootIds, expandedIds);
  }, [nodes, rootIds, expandedIds]);
}

export default useFlattenedTree;
