import React, { useCallback } from 'react';
import SearchWithDropdown from './SearchWithDropdown';
import { useSectorTreeContext } from '../contexts/SectorTreeContext';

/**
 * Wrapper for SearchWithDropdown that automatically expands the sector tree
 * to reveal the selected instrument's location in the hierarchy.
 */
function SearchWithTreeExpansion({ 
  isFetching, 
  search, 
  setSearch, 
  data, 
  onSelectInstrument 
}) {
  const { expandPathToSector, selectNode } = useSectorTreeContext();
  
  const handleSelect = useCallback((item) => {
    // Extract sector ID from instrument
    const sectorId = item?.setor?.id;
    
    if (sectorId) {
      // Expand all ancestors to reveal the instrument's sector
      expandPathToSector(String(sectorId));
    } else {
      console.warn('[SearchWithTreeExpansion] Instrument has no sector:', item);
    }

    const instrumentNodeId = item?.id != null ? `instrument-${item.id}` : null;
    if (instrumentNodeId) {
      selectNode(instrumentNodeId);
    }

    // Call parent's onSelect handler with formatted item
    if (onSelectInstrument) {
      onSelectInstrument({
        id: `instrument-${item?.id}`,
        type: 'instrument',
        parentId: sectorId
      });
    }
  }, [expandPathToSector, onSelectInstrument, selectNode]);
  
  return (
    <SearchWithDropdown
      isFetching={isFetching}
      search={search}
      setSearch={setSearch}
      data={data}
      onSelect={handleSelect}
    />
  );
}

export default SearchWithTreeExpansion;
