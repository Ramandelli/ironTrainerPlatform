import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Clock, X, MapPin, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { AerobicForm } from './AerobicForm';
import { AerobicExercise } from '../types/workout';

interface AerobicTimerProps {
  duration: number;
  type: string;
  onComplete: (actualMinutes?: number, distance?: number) => void;
  onCancel: () => void;
  onUpdate?: (updates: Partial<AerobicExercise>) => void;
}

export const AerobicTimer: React.FC<AerobicTimerProps> = ({ 
  duration, 
  type, 
  onComplete,
  onCancel,
  onUpdate
}) => {
  // Estado salvo com base no relógio real: sobrevive a segundo plano e recarga do app.
  const key = `aerobic_timer_${type}`;
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d.savedStartTime || Date.now() - d.savedStartTime > 6 * 60 * 60 * 1000) return null;
      return d as { savedStartTime: number; endAt?: number; pausedLeft?: number | null; savedDistance?: string; savedShowDistanceInput?: boolean };
    } catch { return null; }
  };
  const initial = useRef(loadSaved()).current;
  const startTime = useRef<number>(initial?.savedStartTime ?? Date.now()).current;
  const endAtRef = useRef<number>(
    initial?.endAt ?? (initial ? initial.savedStartTime + duration * 60 * 1000 : Date.now() + duration * 60 * 1000)
  );
  const pausedLeftRef = useRef<number | null>(initial?.pausedLeft ?? null);
  const calc = () => pausedLeftRef.current != null
    ? pausedLeftRef.current
    : Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState<number>(calc);
  const [isActive, setIsActiveState] = useState<boolean>(pausedLeftRef.current == null && !initial?.savedShowDistanceInput);
  const [distance, setDistance] = useState<string>(initial?.savedDistance || '');
  const [showDistanceInput, setShowDistanceInput] = useState<boolean>(!!initial?.savedShowDistanceInput || calc() <= 0);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const setIsActive = (active: boolean) => {
    if (active && pausedLeftRef.current != null) {
      endAtRef.current = Date.now() + pausedLeftRef.current * 1000;
      pausedLeftRef.current = null;
    } else if (!active && pausedLeftRef.current == null) {
      pausedLeftRef.current = calc();
    }
    setIsActiveState(active);
  };

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({
        savedStartTime: startTime,
        endAt: endAtRef.current,
        pausedLeft: pausedLeftRef.current,
        savedDistance: distance,
        savedShowDistanceInput: showDistanceInput,
      }));
    } catch (error) {
      console.error('Error saving aerobic timer state:', error);
    }
  }, [isActive, distance, showDistanceInput, key, startTime]);

  useEffect(() => {
    if (!isActive) return;
    const tick = () => {
      const left = calc();
      setSecondsLeft(left);
      if (left <= 0) {
        pausedLeftRef.current = 0;
        setShowDistanceInput(true);
        setIsActiveState(false);
      }
    };
    tick();
    const interval: ReturnType<typeof setInterval> = setInterval(tick, 500);
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [isActive]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const progress = ((duration * 60 - secondsLeft) / (duration * 60)) * 100;

  const handleFinish = () => {
    setIsActive(false);
    setSecondsLeft(calc());
    setShowDistanceInput(true);
  };

  const handleComplete = () => {
    const actualMinutes = (duration * 60 - secondsLeft) / 60;
    const distanceNum = distance ? parseFloat(distance) : undefined;
    
    try {
      localStorage.removeItem(`aerobic_timer_${type}`);
    } catch (error) {
      console.error('Error clearing aerobic timer state:', error);
    }
    
    onComplete(actualMinutes, distanceNum);
  };

  const handleCancel = () => {
    try {
      localStorage.removeItem(`aerobic_timer_${type}`);
    } catch (error) {
      console.error('Error clearing aerobic timer state on cancel:', error);
    }
    onCancel();
  };

  const handleEditSave = (aerobic: Omit<AerobicExercise, 'completed' | 'actualDuration' | 'skipped'>) => {
    if (onUpdate) {
      onUpdate(aerobic);
    }
    setShowEditDialog(false);
  };

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>EDITAR CARDIO</DialogTitle>
          </DialogHeader>
          <AerobicForm
            aerobic={{
              type: type as 'esteira' | 'bicicleta',
              duration,
              intensity: 'moderada',
              timing: 'depois',
              completed: false
            }}
            onSave={handleEditSave}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    <div className="fixed inset-0 bg-background/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2 uppercase">
            <Clock className="w-6 h-6 text-iron-orange" />
            {type}
          </h2>
          <div className="flex gap-2">
            {onUpdate && !showDistanceInput && (
              <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
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
              onClick={handleFinish}
            >
              Finalizar
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};