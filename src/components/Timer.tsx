import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Pause, Play, X } from 'lucide-react';
import { TimerState } from '../types/workout';
import { storage } from '../utils/storage';

interface TimerProps {
  initialTime: number; // seconds
  type: 'rest-between-sets' | 'rest-between-exercises';
  exerciseId?: string;
  setIndex?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  type,
  exerciseId,
  setIndex,
  onComplete,
  onCancel
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = () => {
      try {
        const timerKey = exerciseId ? `${type}_${exerciseId}_${setIndex}` : type;
        const saved = localStorage.getItem(`timer_${timerKey}`);
        if (saved) {
          const { savedTimeLeft, savedIsActive, savedIsPaused, savedStartTime } = JSON.parse(saved);
          
          if (savedStartTime) {
            // Calculate elapsed time and adjust timeLeft only if timer was active
            if (savedIsActive && !savedIsPaused) {
              const elapsedSeconds = Math.floor((Date.now() - savedStartTime) / 1000);
              const adjustedTimeLeft = Math.max(0, initialTime - elapsedSeconds);
              setTimeLeft(adjustedTimeLeft);
              setIsActive(adjustedTimeLeft > 0);
            } else {
              setTimeLeft(savedTimeLeft);
              setIsActive(savedIsActive);
            }
            setIsPaused(savedIsPaused);
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };

    loadSavedState();
  }, [initialTime, type, exerciseId, setIndex]);

  // Save timer state whenever it changes
  useEffect(() => {
    try {
      const timerKey = exerciseId ? `${type}_${exerciseId}_${setIndex}` : type;
      const stateToSave = {
        savedTimeLeft: timeLeft,
        savedIsActive: isActive,
        savedIsPaused: isPaused,
        savedStartTime: startTime
      };
      
      localStorage.setItem(`timer_${timerKey}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, [timeLeft, isActive, isPaused, startTime, type, exerciseId, setIndex]);

  useEffect(() => {
    // Save timer state constantly
    const saveState = async () => {
      const timerState: TimerState = {
        isActive,
        timeLeft,
        type,
        exerciseId,
        setIndex
      };
      await storage.saveTimerState(timerState);
    };

    saveState();
  }, [timeLeft, isActive, type, exerciseId, setIndex]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            handleComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    try {
      const timerKey = exerciseId ? `${type}_${exerciseId}_${setIndex}` : type;
      localStorage.removeItem(`timer_${timerKey}`);
      await storage.clearTimerState();
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
    onComplete?.();
  };

  const handleCancel = async () => {
    setIsActive(false);
    try {
      const timerKey = exerciseId ? `${type}_${exerciseId}_${setIndex}` : type;
      localStorage.removeItem(`timer_${timerKey}`);
      await storage.clearTimerState();
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
    onCancel?.();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
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

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

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