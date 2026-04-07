import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Crown, Copy, MessageCircle, Check, KeyRound, Smartphone } from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { getDeviceId, validarCodigoPremium, abrirWhatsApp } from '../utils/deviceId';
import { toast } from '@/hooks/use-toast';

export const PremiumActivationModal: React.FC = () => {
  const { showPremiumModal, closePremiumModal, activatePremium } = usePremium();
  const [deviceId, setDeviceId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showPremiumModal) {
      getDeviceId().then(setDeviceId);
      setCodigo('');
      setError('');
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

  const handleActivate = () => {
    if (!codigo.trim()) {
      setError('Digite o código de ativação.');
      return;
    }
    if (validarCodigoPremium(codigo, deviceId)) {
      activatePremium();
      closePremiumModal();
      toast({ title: '🚀 Premium ativado com sucesso!', description: 'Todas as funcionalidades foram desbloqueadas.' });
    } else {
      setError('Código inválido. Verifique e tente novamente.');
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
              <span>Seu código de ativação</span>
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
              O acesso Premium é <strong className="text-foreground">pago</strong> e liberado após confirmação do pagamento.
            </p>
          </div>

          {/* Premium features grid */}
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              'Geração de treino por IA',
              'Estatísticas completas',
              'Conquistas',
              'Dropsets & Rest-Pause',
              'Importar/Exportar',
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

          {/* WhatsApp button */}
          <Button
            className="w-full bg-[#25D366] hover:bg-[#1da851] text-white"
            size="lg"
            onClick={() => abrirWhatsApp(deviceId)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Solicitar ativação via WhatsApp
          </Button>

          {/* Activation input */}
          <div className="space-y-2 pt-1 border-t border-border">
            <label className="flex items-center gap-1.5 text-sm font-medium pt-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Digite seu código de ativação
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="IRON-XXXXXX-XXXX"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value); setError(''); }}
                className="font-mono uppercase"
              />
              <Button onClick={handleActivate} className="shrink-0">
                Ativar
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button variant="ghost" className="w-full text-xs" onClick={closePremiumModal}>
            Continuar com versão gratuita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
