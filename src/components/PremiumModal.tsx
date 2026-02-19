import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Lock, Crown, Zap, BarChart3, Trophy, Dumbbell } from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Estatísticas Completas': <BarChart3 className="w-5 h-5" />,
  'Conquistas': <Trophy className="w-5 h-5" />,
  'Dropsets': <Zap className="w-5 h-5" />,
  'default': <Crown className="w-5 h-5" />,
};

export const PremiumModal: React.FC = () => {
  const { showPremiumModal, premiumFeature, closePremiumModal } = usePremium();

  const icon = FEATURE_ICONS[premiumFeature] || FEATURE_ICONS['default'];

  return (
    <Dialog open={showPremiumModal} onOpenChange={closePremiumModal}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Lock className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl">Recurso Premium</DialogTitle>
            <DialogDescription className="text-base space-y-3">
              <span className="block font-semibold text-foreground">
                {premiumFeature}
              </span>
              <span className="block text-muted-foreground">
                Este recurso faz parte do <strong className="text-primary">Iron Trainer Premium</strong>.
              </span>
              <span className="block text-muted-foreground text-sm">
                Desbloqueie todas as funcionalidades avançadas por:
              </span>
              <span className="block text-2xl font-bold text-primary">
                R$ 19,90
              </span>
              <span className="block text-xs text-muted-foreground">
                Pagamento único • Acesso vitalício
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              'Estatísticas completas',
              'Aba de conquistas',
              'Sugestão de carga',
              'Dropsets',
              'Abdominais separados',
              'Importar/Exportar',
              'Múltiplos treinos/dia',
              'Edição durante treino',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Crown className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button className="w-full" size="lg" disabled>
            <Crown className="w-4 h-4 mr-2" />
            Em breve
          </Button>
          <Button variant="ghost" className="w-full" onClick={closePremiumModal}>
            Continuar com versão gratuita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
