import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Clock, X, MapPin } from 'lucide-react';

interface AerobicTimerProps {
  duration: number;
  type: string;
  onComplete: (actualMinutes?: number, distance?: number) => void;
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
  const [distance, setDistance] = useState<string>('');
  const [showDistanceInput, setShowDistanceInput] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setShowDistanceInput(true);
      setIsActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, duration, onComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const progress = ((duration * 60 - secondsLeft) / (duration * 60)) * 100;

  const handleComplete = () => {
    const actualMinutes = (duration * 60 - secondsLeft) / 60;
    const distanceNum = distance ? parseFloat(distance) : undefined;
    onComplete(actualMinutes, distanceNum);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-iron-orange" />
            {type}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
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
        
        {showDistanceInput ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Cardio Concluído! 🎯</h3>
              <p className="text-sm text-muted-foreground">
                Informe a distância percorrida (opcional)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distance" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Distância (km)
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                placeholder="Ex: 2.5"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleComplete}>
                Pular
              </Button>
              <Button variant="success" className="flex-1" onClick={handleComplete}>
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
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
              onClick={() => setShowDistanceInput(true)}
            >
              Finalizar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};