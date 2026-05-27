import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getInitialPremiumState,
  refreshPremium,
  clearPremium,
  type PremiumStatus,
} from '../services/PremiumService';

interface PremiumContextType {
  isPremium: boolean;
  status: PremiumStatus | 'unknown';
  loading: boolean;
  showPremiumModal: boolean;
  premiumFeature: string;
  openPremiumModal: (feature: string) => void;
  closePremiumModal: () => void;
  /** Revalida online (usado pelo botão "Já paguei / Validar agora"). */
  revalidate: () => Promise<boolean>;
  /** Remove token local (debug / logout premium). */
  resetPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  status: 'unknown',
  loading: true,
  showPremiumModal: false,
  premiumFeature: '',
  openPremiumModal: () => {},
  closePremiumModal: () => {},
  revalidate: async () => false,
  resetPremium: async () => {},
});

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState<PremiumStatus | 'unknown'>('unknown');
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');

  // Boot: validação offline imediata + revalidação online em background.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const offline = await getInitialPremiumState();
      if (!mounted) return;
      setIsPremium(offline.premium);
      setStatus(offline.status);
      setLoading(false);

      // Revalida online silenciosamente.
      const online = await refreshPremium();
      if (!mounted) return;
      setIsPremium(online.premium);
      setStatus(online.status);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openPremiumModal = useCallback((feature: string) => {
    setPremiumFeature(feature);
    setShowPremiumModal(true);
  }, []);

  const closePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
    setPremiumFeature('');
  }, []);

  const revalidate = useCallback(async () => {
    const result = await refreshPremium();
    setIsPremium(result.premium);
    setStatus(result.status);
    return result.premium;
  }, []);

  const resetPremium = useCallback(async () => {
    await clearPremium();
    setIsPremium(false);
    setStatus('inactive');
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        status,
        loading,
        showPremiumModal,
        premiumFeature,
        openPremiumModal,
        closePremiumModal,
        revalidate,
        resetPremium,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};
