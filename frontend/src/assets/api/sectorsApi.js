import { axios } from '../../api';

/**
 * API para operações com setores
 * Suporta lazy loading quando o backend permitir
 */

/**
 * Carregar hierarquia completa de setores
 * @param {string} clienteId - ID do cliente
 * @returns {Promise} Response data
 */
export async function fetchSectorHierarchy(clienteId) {
  const params = { cliente_id: clienteId };
  const response = await axios.get('/setores/hierarquia/', { params });
  return response.data;
}

/**
 * Carregar apenas setores raiz (primeiro nível)
 * Fallback: usa /setores/hierarquia/ e filtra apenas raízes
 * @param {string} clienteId - ID do cliente
 * @returns {Promise} Response data
 */
export async function fetchRootSectors(clienteId) {
  try {
    // Tentar endpoint específico se existir
    const response = await axios.get('/setores/raizes/', { 
      params: { cliente_id: clienteId } 
    });
    return response.data;
  } catch (error) {
    // Fallback: carregar tudo e filtrar raízes
    if (error.response?.status === 404) {
      const allData = await fetchSectorHierarchy(clienteId);
      // Retornar apenas o primeiro nível (sem processar filhos)
      return allData.map(root => ({
        ...root,
        subsetores: root.subsetores?.map(sub => ({ 
          id: sub.id, 
          nome: sub.nome,
          hasChildren: !!(sub.subsetores?.length || sub.instrumentos?.length)
        })) || [],
        instrumentos: root.instrumentos?.map(inst => ({ 
          id: inst.id, 
          tag: inst.tag,
          numeroDeSerie: inst.numeroDeSerie 
        })) || []
      }));
    }
    throw error;
  }
}

/**
 * Carregar filhos de um setor específico
 * Fallback: usa cache local se já carregou hierarquia completa
 * @param {string} sectorId - ID do setor pai
 * @param {string} clienteId - ID do cliente
 * @returns {Promise} Response data
 */
export async function fetchSectorChildren(sectorId, clienteId) {
  try {
    // Tentar endpoint específico se existir
    const response = await axios.get(`/setores/${sectorId}/filhos/`, {
      params: { cliente_id: clienteId }
    });
    return response.data;
  } catch (error) {
    // Fallback: não suportado, retorna vazio
    // (assumindo que já foi carregado na hierarquia inicial)
    if (error.response?.status === 404) {
      console.warn('Lazy loading não suportado pelo backend - usando dados pré-carregados');
      return null;
    }
    throw error;
  }
}

/**
 * Carregar instrumentos de um setor específico
 * @param {string} sectorId - ID do setor
 * @param {string} clienteId - ID do cliente
 * @returns {Promise} Response data
 */
export async function fetchSectorInstruments(sectorId, clienteId) {
  const params = { 
    setor_id: sectorId,
    cliente_id: clienteId 
  };
  const response = await axios.get('/instrumentos/', { params });
  return response.data;
}

/**
 * Criar novo setor
 * @param {Object} data - Dados do setor
 * @returns {Promise} Response data
 */
export async function createSector(data) {
  const response = await axios.post('/setores/', data);
  return response.data;
}

/**
 * Atualizar setor existente
 * @param {string} sectorId - ID do setor
 * @param {Object} data - Dados atualizados
 * @returns {Promise} Response data
 */
export async function updateSector(sectorId, data) {
  const response = await axios.patch(`/setores/${sectorId}/`, data);
  return response.data;
}

/**
 * Deletar setor
 * @param {string} sectorId - ID do setor
 * @param {Object} options - Opções de deleção (mover instrumentos, etc.)
 * @returns {Promise} Response data
 */
export async function deleteSector(sectorId, options = {}) {
  const response = await axios.delete(`/setores/${sectorId}/`, {
    data: options
  });
  return response.data;
}

export default {
  fetchSectorHierarchy,
  fetchRootSectors,
  fetchSectorChildren,
  fetchSectorInstruments,
  createSector,
  updateSector,
  deleteSector,
};
