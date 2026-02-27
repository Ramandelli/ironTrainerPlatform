import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { toast } from '@/hooks/use-toast';

// 🔧 Flag global de pagamento — mudar para true quando integrar Play Store
export const PAYMENT_ENABLED = false;

const PREMIUM_STATUS_KEY = 'iron_trainer_premium_status';

interface PremiumContextType {
  isPremium: boolean;
  showPremiumModal: boolean;
  premiumFeature: string;
  openPremiumModal: (feature: string) => void;
  closePremiumModal: () => void;
  startPremiumPurchase: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  showPremiumModal: false,
  premiumFeature: '',
  openPremiumModal: () => {},
  closePremiumModal: () => {},
  startPremiumPurchase: async () => {},
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');

  // Carregar status premium ao iniciar
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

  const startPremiumPurchase = useCallback(async () => {
    if (!PAYMENT_ENABLED) {
      toast({
        title: '⏳ Em breve!',
        description: 'A compra estará disponível em breve. Esta versão é demonstrativa.',
      });
      return;
    }

    // Placeholder para compra via Play Store
    // Quando PAYMENT_ENABLED = true, aqui será integrado o billing real.
    // Por ora, simula compra bem-sucedida:
    try {
      await Preferences.set({ key: PREMIUM_STATUS_KEY, value: 'true' });
      setIsPremium(true);
      toast({
        title: '🎉 Premium ativado!',
        description: 'Todas as funcionalidades foram desbloqueadas.',
      });
    } catch (error) {
      console.error('Falha ao ativar premium:', error);
    }
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, showPremiumModal, premiumFeature, openPremiumModal, closePremiumModal, startPremiumPurchase }}>
      {children}
    </PremiumContext.Provider>
  );
};
