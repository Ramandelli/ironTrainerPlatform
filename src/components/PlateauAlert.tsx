import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, RefreshCw, Repeat, Zap, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { detectPlateau, PlateauResult, PlateauSuggestion } from '../utils/plateauDetector';

interface PlateauAlertProps {
  exerciseName: string;
  isCompleted?: boolean;
  onApplyDropset?: () => void;
  onApplyRestPause?: () => void;
}

const suggestionIcons: Record<PlateauSuggestion['type'], React.ReactNode> = {
  'swap-exercise': <RefreshCw className="w-4 h-4" />,
  'change-reps': <Repeat className="w-4 h-4" />,
  'add-technique': <Zap className="w-4 h-4" />,
};

export const PlateauAlert: React.FC<PlateauAlertProps> = ({
  exerciseName,
  isCompleted,
  onApplyDropset,
  onApplyRestPause,
}) => {
  const [result, setResult] = useState<PlateauResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isCompleted) {
      detectPlateau(exerciseName).then(setResult).catch(() => {});
    }
  }, [exerciseName, isCompleted]);

  if (!result?.plateauDetected || isCompleted || dismissed) return null;

  return (
    <>
      <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 mt-2">
        <TrendingDown className="w-4 h-4 text-warning shrink-0" />
        <span className="text-xs text-warning font-medium flex-1">
          Possível estagnação detectada
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-warning hover:text-foreground"
          onClick={() => setShowSuggestions(true)}
        >
          Ver sugestões
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Estagnação Detectada
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Nas últimas {result.sessionsAnalyzed} sessões de <strong>{exerciseName}</strong>, não
            houve progressão de carga ou repetições. Veja algumas sugestões:
          </p>

          <div className="space-y-3 mt-2">
            {result.suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="mt-0.5 text-iron-orange">
                  {suggestionIcons[s.type]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>

                  {s.type === 'add-technique' && (onApplyDropset || onApplyRestPause) && (
                    <div className="flex gap-2 mt-2">
                      {onApplyDropset && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            onApplyDropset();
                            setShowSuggestions(false);
                          }}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Ativar Drop-set
                        </Button>
                      )}
                      {onApplyRestPause && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            onApplyRestPause();
                            setShowSuggestions(false);
                          }}
                        >
                          <Repeat className="w-3 h-3 mr-1" />
                          Ativar Rest-pause
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
