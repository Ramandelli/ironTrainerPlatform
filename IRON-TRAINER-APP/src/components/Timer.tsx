import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Pause, Play, X } from 'lucide-react';
import { TimerState } from '../types/workout';
import { storage } from '../utils/storage';
import { hapticTimerEnd } from '../utils/haptics';

// Create audio context for generating beep sounds
const createBeepSound = (frequency: number = 800, duration: number = 200, volume: number = 0.5): void => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
    
    // Cleanup
    setTimeout(() => {
      audioContext.close();
    }, duration + 100);
  } catch (error) {
    console.error('Error playing beep sound:', error);
  }
};

// Play completion sound (3 beeps)
const playCompletionSound = (): void => {
  createBeepSound(880, 150, 0.6); // First beep
  setTimeout(() => createBeepSound(880, 150, 0.6), 200); // Second beep
  setTimeout(() => createBeepSound(1100, 300, 0.7), 400); // Third beep (higher pitch)
};

interface TimerProps {
  initialTime: number; 
  type: 'rest-between-sets' | 'rest-between-exercises';
  exerciseId?: string;
  setIndex?: number;
  endAt?: number;
  totalTime?: number;
  pausedLeft?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  type,
  exerciseId,
  setIndex,
  endAt: initialEndAt,
  totalTime,
  pausedLeft: initialPausedLeft,
  onComplete,
  onCancel
}) => {
  // Contagem baseada no relógio real (endAt): continua correta mesmo com o app
  // em segundo plano ou se o Android recarregar a tela.
  const total = totalTime || initialTime;
  const endAtRef = useRef<number>(initialEndAt ?? Date.now() + initialTime * 1000);
  const [isPaused, setIsPaused] = useState<boolean>(initialPausedLeft != null);
  const pausedLeftRef = useRef<number | null>(initialPausedLeft ?? null);
  const calc = () => pausedLeftRef.current != null
    ? pausedLeftRef.current
    : Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
  const [timeLeft, setTimeLeft] = useState<number>(calc);
  const [isActive, setIsActive] = useState(true);
  const doneRef = useRef(false);

  const persist = () => {
    const state: TimerState = {
      isActive: true,
      timeLeft: calc(),
      type,
      exerciseId,
      setIndex,
      endAt: endAtRef.current,
      totalTime: total,
      pausedLeft: pausedLeftRef.current ?? undefined,
    };
    storage.saveTimerState(state).catch(() => {});
  };

  useEffect(() => { persist(); }, []);

  useEffect(() => {
    if (!isActive) return;
    const tick = () => {
      const left = calc();
      setTimeLeft(left);
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true;
        handleComplete();
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
  }, [isActive, isPaused]);

  const handleComplete = async () => {
    setIsActive(false);
    playCompletionSound();
    hapticTimerEnd();
    try {
      await storage.clearTimerState();
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
    onComplete?.();
  };

  const handleCancel = async () => {
    setIsActive(false);
    doneRef.current = true;
    try {
      await storage.clearTimerState();
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
    onCancel?.();
  };

  const togglePause = () => {
    if (isPaused) {
      endAtRef.current = Date.now() + (pausedLeftRef.current ?? 0) * 1000;
      pausedLeftRef.current = null;
      setIsPaused(false);
    } else {
      pausedLeftRef.current = calc();
      setIsPaused(true);
    }
    persist();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerTitle = () => {
    return type === 'rest-between-sets' 
      ? 'Descanso entre séries' 
      : 'Descanso entre exercícios';
  };

  const progress = ((total - timeLeft) / total) * 100;

  return (
    <Card className="fixed inset-4 z-50 bg-card/95 backdrop-blur-lg border-2 border-iron-orange shadow-timer flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          {getTimerTitle()}
        </h2>
        
        <div className="relative w-48 h-48 mx-auto">
          {/* Progress circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="hsl(var(--border))"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="hsl(var(--iron-orange))"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-iron-orange">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            variant="timer"
            size="lg"
            onClick={togglePause}
            className="w-16 h-16"
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={handleCancel}
            className="w-16 h-16"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {isPaused ? 'Timer pausado' : 'Timer ativo'}
        </div>
      </div>
    </Card>
  );
};