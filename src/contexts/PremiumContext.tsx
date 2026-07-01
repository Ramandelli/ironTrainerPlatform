import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  getInitialPremiumState,
  refreshPremium,
  clearPremium,
  type PremiumStatus,
} from '../services/PremiumService';
import { toast } from '@/hooks/use-toast';

interface PremiumContextType {
  isPremium: boolean;
  status: PremiumStatus | 'unknown';
  loading: boolean;
  needsRenewal: boolean;
  daysUntilRevoke?: number;
  expiresAt?: number;
  showPremiumModal: boolean;
  premiumFeature: string;
  openPremiumModal: (feature: string) => void;
  closePremiumModal: () => void;
  revalidate: () => Promise<boolean>;
  resetPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  status: 'unknown',
  loading: true,
  needsRenewal: false,
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
  const [needsRenewal, setNeedsRenewal] = useState(false);
  const [daysUntilRevoke, setDaysUntilRevoke] = useState<number | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState<number | undefined>(undefined);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');
  const renewalToastShown = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const offline = await getInitialPremiumState();
      if (!mounted) return;
      setIsPremium(offline.premium);
      setStatus(offline.status);
      setNeedsRenewal(!!offline.needsRenewal);
      setDaysUntilRevoke(offline.daysUntilRevoke);
      setExpiresAt(offline.expiresAt);
      setLoading(false);

      // Se precisa renovar (janela de refresh ou grace), tenta online.
      // Fora da janela, revalida silenciosamente também para pegar revogações.
      const online = await refreshPremium();
      if (!mounted) return;
      setIsPremium(online.premium);
      setStatus(online.status);
      setNeedsRenewal(!!online.needsRenewal);
      setDaysUntilRevoke(online.daysUntilRevoke);
      setExpiresAt(online.expiresAt);

      // Aviso ao usuário quando estiver em grace period (sem conseguir renovar).
      if (
        online.premium &&
        online.status === 'grace' &&
        !renewalToastShown.current
      ) {
        renewalToastShown.current = true;
        const dias = online.daysUntilRevoke ?? GRACE_FALLBACK;
        toast({
          title: 'Acesse o app conectado à internet',
          description: `Renove seu Premium automaticamente. Acesso será revogado em ${dias} dia${dias === 1 ? '' : 's'}.`,
          duration: 8000,
        });
      }
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
    setNeedsRenewal(!!result.needsRenewal);
    setDaysUntilRevoke(result.daysUntilRevoke);
    setExpiresAt(result.expiresAt);
    return result.premium;
  }, []);

  const resetPremium = useCallback(async () => {
    await clearPremium();
    setIsPremium(false);
    setStatus('inactive');
    setNeedsRenewal(false);
    setDaysUntilRevoke(undefined);
    setExpiresAt(undefined);
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        status,
        loading,
        needsRenewal,
        daysUntilRevoke,
        expiresAt,
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

const GRACE_FALLBACK = 4;
