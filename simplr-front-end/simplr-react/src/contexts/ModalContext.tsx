import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalContextType {
  openModals: Set<string>;
  registerModal: (modalId: string) => void;
  unregisterModal: (modalId: string) => void;
  isAnyModalOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: React.ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const registerModal = useCallback((modalId: string) => {
    setOpenModals(prev => new Set(prev).add(modalId));
  }, []);

  const unregisterModal = useCallback((modalId: string) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(modalId);
      return newSet;
    });
  }, []);

  const isAnyModalOpen = openModals.size > 0;

  const value: ModalContextType = {
    openModals,
    registerModal,
    unregisterModal,
    isAnyModalOpen,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Hook for modal components to register/unregister themselves
export function useModalState(modalId: string, isOpen: boolean) {
  const { registerModal, unregisterModal } = useModal();

  React.useEffect(() => {
    if (isOpen) {
      registerModal(modalId);
    } else {
      unregisterModal(modalId);
    }

    // Cleanup on unmount
    return () => {
      unregisterModal(modalId);
    };
  }, [modalId, isOpen, registerModal, unregisterModal]);
}