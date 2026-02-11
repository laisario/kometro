import React, { createContext, useContext } from 'react';
import useSectorTree from '../hooks/useSectorTree';

const SectorContext = createContext(null);

export const SectorProvider = ({ children }) => {
  const { sectors, isLoadingSectors, hasSectors } = useSectorTree()

  return (
    <SectorContext.Provider value={{ sectors, isLoadingSectors, hasSectors }}>
      {children}
    </SectorContext.Provider>
  );
};

// Hook seguro que retorna null se não estiver no Provider (para uso opcional)
export const useSectors = () => {
  return useContext(SectorContext);
};

// Hook que lança erro se não estiver no Provider (para uso obrigatório)
export const useSectorsRequired = () => {
  const context = useContext(SectorContext);
  if (context === null) {
    throw new Error('useSectorsRequired must be used within SectorProvider');
  }
  return context;
};

export default SectorContext;
