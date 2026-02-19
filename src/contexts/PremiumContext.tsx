import React, { createContext, useContext, useState, useCallback } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  showPremiumModal: boolean;
  premiumFeature: string;
  openPremiumModal: (feature: string) => void;
  closePremiumModal: () => void;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  showPremiumModal: false,
  premiumFeature: '',
  openPremiumModal: () => {},
  closePremiumModal: () => {},
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toggle this to true to enable all premium features
  const isPremium = false;

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');

  const openPremiumModal = useCallback((feature: string) => {
    setPremiumFeature(feature);
    setShowPremiumModal(true);
  }, []);

  const closePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
    setPremiumFeature('');
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, showPremiumModal, premiumFeature, openPremiumModal, closePremiumModal }}>
      {children}
    </PremiumContext.Provider>
  );
};
