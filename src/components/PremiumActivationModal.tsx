import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Crown, Copy, MessageCircle, Check, Smartphone, RefreshCw, Loader2 } from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { getDeviceId, abrirWhatsApp } from '../utils/deviceId';
import { toast } from '@/hooks/use-toast';

export const PremiumActivationModal: React.FC = () => {
  const { showPremiumModal, closePremiumModal, revalidate, status } = usePremium();
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (showPremiumModal) {
      getDeviceId().then(setDeviceId);
      setCopied(false);
    }
  }, [showPremiumModal]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Erro ao copiar', description: 'Copie manualmente o código acima.' });
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    const ok = await revalidate();
    setChecking(false);
    if (ok) {
      toast({ title: '🚀 Premium ativado!', description: 'Todas as funcionalidades foram desbloqueadas.' });
      closePremiumModal();
    } else if (status === 'revoked') {
      toast({ title: 'Acesso revogado', description: 'Entre em contato pelo WhatsApp.', variant: 'destructive' });
    } else {
      toast({ title: 'Ainda não liberado', description: 'Conclua o pagamento e tente novamente em alguns instantes.' });
    }
  };

  return (
    <Dialog open={showPremiumModal} onOpenChange={closePremiumModal}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Crown className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl">Ativar Iron Trainer Premium</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Device ID */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Seu DeviceID</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-center text-lg font-mono font-bold tracking-widest text-foreground bg-background rounded px-3 py-2 select-all">
                {deviceId || '...'}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Payment notice */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              Premium é <strong className="text-foreground">vitalício</strong> e liberado após confirmação do pagamento. 1 licença = 1 DeviceID.
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <p className="text-xs text-amber-200 leading-relaxed text-center">
              ⚠️ Anote seu DeviceID. Se formatar o celular ou trocar de aparelho, envie pelo WhatsApp para reassociação.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              'Geração de treino por IA',
              'Estatísticas completas',
              'Conquistas',
              'Dropsets & Rest-Pause',
              'Funcional & Abdominal',
              'Múltiplos treinos/dia',
              'Edição durante treino',
              'Progressão automática',
            ].map((f) => (
              <div key={f} className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <Crown className="w-3 h-3 text-primary shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>

          {/* WhatsApp */}
          <Button
            className="w-full bg-[#25D366] hover:bg-[#1da851] text-white"
            size="lg"
            onClick={() => abrirWhatsApp(deviceId)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Solicitar ativação via WhatsApp
          </Button>

          {/* Já paguei / Validar agora */}
          <Button className="w-full" size="lg" onClick={handleCheck} disabled={checking || !deviceId}>
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Já paguei — Validar agora
              </>
            )}
          </Button>

          <Button variant="ghost" className="w-full text-xs" onClick={closePremiumModal}>
            Continuar com versão gratuita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
