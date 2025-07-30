import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Clock, X } from 'lucide-react';

interface AerobicTimerProps {
  duration: number;
  type: string;
  onComplete: (actualMinutes?: number) => void;
  onCancel: () => void;
}

export const AerobicTimer: React.FC<AerobicTimerProps> = ({ 
  duration, 
  type, 
  onComplete,
  onCancel
}) => {
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      onComplete(duration);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, duration, onComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const progress = ((duration * 60 - secondsLeft) / (duration * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-iron-orange" />
            {type}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => {
            onComplete(0); // Passa 0 minutos ao cancelar
            onCancel();
          }}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <p className="text-muted-foreground">
            Tempo restante
          </p>
        </div>
        
        <Progress value={progress} className="h-3" />
        
        <div className="flex gap-3">
          <Button 
            variant={isActive ? "destructive" : "outline"} 
            className="flex-1"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? "Pausar" : "Continuar"}
          </Button>
          <Button 
            variant="success" 
            className="flex-1"
            onClick={() => {
              const actualMinutes = duration - (secondsLeft / 60);
              onComplete(actualMinutes);
            }}
          >
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
};