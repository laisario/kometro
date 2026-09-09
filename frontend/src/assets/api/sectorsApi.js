import { axios } from '../../api';

export const SECTORS_QUERY_KEY = 'setores';

export const sectorQueriesKey = () => [SECTORS_QUERY_KEY];

export const sectorQueryKey = (clienteId) => [
  ...sectorQueriesKey(),
  clienteId == null ? null : String(clienteId),
];

/**
 * Carregar hierarquia completa de setores
 * @param {string} clienteId - ID do cliente
 * @returns {Promise} Response data
 */
export async function fetchSectorHierarchy(clienteId) {
  if (clienteId == null) {
    return [];
  }

  const params = { cliente_id: clienteId };
  const response = await axios.get('/setores/hierarquia/', { params });
  return response.data;
}

export function findSectorInHierarchy(hierarchy, sectorId) {
  if (!Array.isArray(hierarchy) || sectorId == null) {
    return null;
  }

  const expectedId = String(sectorId);
  const pending = [...hierarchy];

  while (pending.length > 0) {
    const sector = pending.shift();
    if (String(sector?.id) === expectedId) {
      return sector;
    }
    if (Array.isArray(sector?.subsetores)) {
      pending.push(...sector.subsetores);
    }
  }

  return null;
}
