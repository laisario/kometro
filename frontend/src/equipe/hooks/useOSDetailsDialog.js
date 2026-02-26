import { useState } from 'react';

/**
 * Hook to manage OS details dialog state
 * Provides reusable dialog state management for OS details
 */
function useOSDetailsDialog() {
  const [selectedOS, setSelectedOS] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = (os) => {
    setSelectedOS(os);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    // Clear selected OS after a short delay to allow dialog close animation
    setTimeout(() => {
      setSelectedOS(null);
    }, 200);
  };

  return {
    selectedOS,
    isOpen,
    openDialog,
    closeDialog,
  };
}

export default useOSDetailsDialog;
