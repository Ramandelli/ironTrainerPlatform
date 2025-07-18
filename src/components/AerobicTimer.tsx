import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Play, Pause, Square, Clock } from 'lucide-react';

interface AerobicTimerProps {
  duration: number; // in minutes
  type: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const AerobicTimer: React.FC<AerobicTimerProps> = ({
  duration,
  type,
  onComplete,
  onCancel
}) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsCompleted(true);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setIsCompleted(false);
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-scale-in">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl text-green-500">
              ✅ Aeróbico Concluído!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-lg font-semibold">
              {type} - {duration} minutos
            </div>
            <div className="text-sm text-muted-foreground">
              Parabéns! Você completou o exercício aeróbico.
            </div>
            <Button onClick={onComplete} className="w-full">
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-scale-in">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-lg flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-iron-orange" />
            Exercício Aeróbico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise Info */}
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground capitalize">
              {type}
            </div>
            <div className="text-sm text-muted-foreground">
              {duration} minutos
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">
              {formatTime(timeLeft)}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <Button onClick={handlePlay} variant="default" size="lg">
                <Play className="w-5 h-5 mr-2" />
                Iniciar
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="lg">
                <Pause className="w-5 h-5 mr-2" />
                Pausar
              </Button>
            )}
            
            <Button onClick={handleStop} variant="outline" size="lg">
              <Square className="w-5 h-5 mr-2" />
              Parar
            </Button>
          </div>

          {/* Cancel Button */}
          <Button 
            onClick={onCancel} 
            variant="ghost" 
            className="w-full text-muted-foreground"
          >
            Cancelar Aeróbico
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};