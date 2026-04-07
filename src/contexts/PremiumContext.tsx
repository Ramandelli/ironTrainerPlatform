import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { toast } from '@/hooks/use-toast';

const PREMIUM_STATUS_KEY = 'iron_trainer_premium_status';

interface PremiumContextType {
  isPremium: boolean;
  showPremiumModal: boolean;
  premiumFeature: string;
  openPremiumModal: (feature: string) => void;
  closePremiumModal: () => void;
  activatePremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  showPremiumModal: false,
  premiumFeature: '',
  openPremiumModal: () => {},
  closePremiumModal: () => {},
  activatePremium: async () => {},
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');

  useEffect(() => {
    Preferences.get({ key: PREMIUM_STATUS_KEY }).then(({ value }) => {
      if (value === 'true') setIsPremium(true);
    }).catch(() => {});
  }, []);

  const openPremiumModal = useCallback((feature: string) => {
    setPremiumFeature(feature);
    setShowPremiumModal(true);
  }, []);

  const closePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
    setPremiumFeature('');
  }, []);

  const activatePremium = useCallback(async () => {
    try {
      await Preferences.set({ key: PREMIUM_STATUS_KEY, value: 'true' });
      setIsPremium(true);
    } catch (error) {
      console.error('Falha ao ativar premium:', error);
    }
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, showPremiumModal, premiumFeature, openPremiumModal, closePremiumModal, activatePremium }}>
      {children}
    </PremiumContext.Provider>
  );
};
