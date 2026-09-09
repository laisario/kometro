import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import useAuth from '../../auth/hooks/useAuth';
import { normalizeTree } from '../hooks/useNormalizedTree';
import { fetchSectorHierarchy, sectorQueryKey } from '../api/sectorsApi';

const SectorTreeContext = createContext(null);

/**
 * Provider para gerenciar estado da árvore de setores de forma otimizada
 */
export function SectorTreeProvider({ children }) {
  const { user } = useAuth();
  const clienteId = user?.cliente ?? null;
  
  // Estado de UI (não derivado de dados)
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [loadingIds, setLoadingIds] = useState(new Set());
  
  // Carregar árvore inicial do backend
  const { 
    data: hierarchicalData,
    isLoading: isLoadingTree,
    isFetching: isFetchingTree,
    isSuccess: querySuccess,
    dataUpdatedAt,
    refetch: queryRefetchSectors,
  } = useQuery(
    sectorQueryKey(clienteId),
    () => fetchSectorHierarchy(clienteId),
    {
      enabled: clienteId != null,
      staleTime: 0,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    }
  );

  // React Query normalmente mantém `refetch` estável, mas o contexto é consumido por
  // efeitos críticos. Esta fachada garante identidade estável mesmo se a implementação
  // da biblioteca mudar a referência retornada em algum render.
  const queryRefetchSectorsRef = useRef(queryRefetchSectors);
  queryRefetchSectorsRef.current = queryRefetchSectors;
  const refetchSectors = useCallback(
    (...args) => queryRefetchSectorsRef.current(...args),
    [],
  );

  useEffect(() => {
    setExpandedIds(new Set());
    setSelectedId(null);
    setLoadingIds(new Set());
  }, [clienteId]);
  
  // ✅ FIX: Derivar nodes/rootIds/nodesMap DIRETAMENTE de hierarchicalData (síncrono!)
  // Isso garante que setQueryData → hierarchicalData muda → normalização roda → UI atualiza
  // TUDO no mesmo render cycle, sem async setState!
  // Importante: criar NOVAS referências sempre que hierarchicalData muda
  const { nodes, rootIds, nodesMap } = useMemo(() => {
    if (Array.isArray(hierarchicalData) && hierarchicalData.length > 0) {
      const normalized = normalizeTree(hierarchicalData);
      // Criar novos objetos/arrays para garantir que React detecta mudanças
      return {
        nodes: { ...normalized.nodes }, // Nova referência!
        rootIds: [...normalized.rootIds], // Nova referência!
        nodesMap: new Map(normalized.nodesMap) // Nova referência!
      };
    }
    // Estado vazio se não há dados
    return { nodes: {}, rootIds: [], nodesMap: new Map() };
  }, [hierarchicalData]);
  
  // ✅ Derivar loadedIds de nodes (também síncrono)
  const loadedIds = useMemo(() => {
    return new Set(Object.keys(nodes));
  }, [nodes]);
  
  // ✅ hasLoadedTree: simples - se query teve sucesso, tree "carregou"
  const hasLoadedTree = querySuccess;

  useEffect(() => {
    if (!isFetchingTree && querySuccess && selectedId && !nodes[selectedId]) {
      setSelectedId(null);
    }
  }, [isFetchingTree, nodes, querySuccess, selectedId]);
  
  // Lazy loading de filhos de um setor específico
  const loadChildren = useCallback(async (sectorId) => {
    if (loadedIds.has(sectorId) || loadingIds.has(sectorId)) {
      return; // Já carregado ou carregando
    }
    
    setLoadingIds(prev => new Set(prev).add(sectorId));
    
    try {
      // Por enquanto, não fazemos lazy load real - dados já vem completos
      // Para implementar lazy load com a nova arquitetura:
      // 1. Fetch children data
      // 2. Merge com hierarchicalData usando setQueryData
      // 3. useMemo vai recalcular automaticamente nodes/rootIds/nodesMap
      
      // Placeholder: await axios.get(`/setores/${sectorId}/filhos/`);
      console.warn('[SectorTreeContext] loadChildren called but lazy loading not implemented in optimistic architecture');
    } catch (error) {
      console.error('Erro ao carregar filhos:', error);
    } finally {
      setLoadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectorId);
        return newSet;
      });
    }
  }, [loadedIds, loadingIds]);
  
  // Toggle expand/collapse
  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  // Expand path to a specific sector (reveals sector in tree by expanding all ancestors)
  const expandPathToSector = useCallback((sectorId) => {
    if (!sectorId || !nodes[sectorId]) {
      console.warn('[SectorTreeContext] expandPathToSector: sector not found', sectorId);
      return;
    }
    
    const ancestorIds = [];
    let currentId = sectorId;
    
    // Walk up the parent chain until we reach root (no parentId)
    while (currentId) {
      const node = nodes[currentId];
      if (!node) break;
      
      ancestorIds.push(currentId);
      currentId = node.parentId;
    }
    
    // Expand all ancestors (except the instrument itself if it's in the path)
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      ancestorIds.forEach(id => {
        const node = nodes[id];
        // Only expand if it's a sector (not an instrument)
        if (node && node.type === 'sector') {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [nodes]);
  
  // Selecionar nó
  const selectNode = useCallback((id) => {
    setSelectedId(id);
  }, []);
  
  // Helpers
  const getRootIds = useCallback(() => rootIds, [rootIds]);
  
  const getChildIds = useCallback((parentId) => {
    const node = nodes[parentId];
    return node ? [...(node.childIds || []), ...(node.instrumentIds || [])] : [];
  }, [nodes]);
  
  const isLoaded = useCallback((id) => loadedIds.has(id), [loadedIds]);
  
  const isExpanded = useCallback((id) => expandedIds.has(id), [expandedIds]);
  
  const isLoading = useCallback((id) => loadingIds.has(id), [loadingIds]);
  
  const getSelectedNode = useCallback(() => {
    return selectedId ? nodes[selectedId] : null;
  }, [selectedId, nodes]);

  
  // Valor do contexto
  const value = useMemo(() => ({
    // Dados
    nodes,
    rootIds,
    nodesMap,
    
    // Estado UI
    expandedIds,
    loadedIds,
    selectedId,
    loadingIds,
    
    // Status
    isLoadingTree,
    isFetchingTree,
    hasLoadedTree,
    hasSectors: rootIds.length > 0,
    dataUpdatedAt,
    clienteId,
    sectorQueryKey: sectorQueryKey(clienteId),
    
    // Actions
    toggleExpand,
    expandPathToSector,
    loadChildren,
    selectNode,
    refetchSectors,
    
    // Helpers
    getRootIds,
    getChildIds,
    isLoaded,
    isExpanded,
    isLoading,
    getSelectedNode,
  }), [
    nodes,
    rootIds,
    nodesMap,
    expandedIds,
    loadedIds,
    selectedId,
    loadingIds,
    isLoadingTree,
    isFetchingTree,
    hasLoadedTree,
    dataUpdatedAt,
    clienteId,
    toggleExpand,
    expandPathToSector,
    loadChildren,
    selectNode,
    refetchSectors,
    getRootIds,
    getChildIds,
    isLoaded,
    isExpanded,
    isLoading,
    getSelectedNode,
  ]);
  
  return (
    <SectorTreeContext.Provider value={value}>
      {children}
    </SectorTreeContext.Provider>
  );
}

/**
 * Hook para acessar contexto da árvore (lança erro se fora do Provider)
 * O contexto está sempre disponível para componentes renderizados dentro de CommonLayout
 */
export function useSectorTreeContext() {
  const context = useContext(SectorTreeContext);
  if (!context) {
    throw new Error(
      'useSectorTreeContext must be used within SectorTreeProvider. ' +
      'Certifique-se de que o componente está renderizado dentro de <SectorTreeProvider>. ' +
      'O provider está disponível no CommonLayout para todas as rotas /dashboard/* e /admin/*.'
    );
  }
  return context;
}

export default SectorTreeContext;
