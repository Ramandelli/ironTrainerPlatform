import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, Pause, RotateCcw, CheckCircle, Timer, Pencil, SkipForward } from 'lucide-react';
import { Exercise, SetData } from '../types/workout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { AbdominalForm } from './AbdominalForm';
import { hapticSkip } from '../utils/haptics';

interface AbdominalTimerProps {
  exercise: Exercise;
  onSetComplete: (setIndex: number, setData: SetData) => void;
  onExerciseComplete: () => void;
  onExerciseSkip?: () => void;
  onExerciseUpdate?: (updates: Partial<Exercise>) => void;
  isActive?: boolean;
}

export const AbdominalTimer: React.FC<AbdominalTimerProps> = ({
  exercise,
  onSetComplete,
  onExerciseComplete,
  onExerciseSkip,
  onExerciseUpdate,
  isActive = false
}) => {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exercise.timePerSet || 30);
  const [currentSide, setCurrentSide] = useState<'left' | 'right' | 'both'>('both');
  const [sideProgress, setSideProgress] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false
  });
  const [showEditDialog, setShowEditDialog] = useState(false);

  const currentSetData = exercise.setData[exercise.currentSet];
  const isCurrentSetCompleted = currentSetData?.completed;
  const isBilateral = exercise.isBilateral;
  const timePerSet = exercise.timePerSet || 30;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimeComplete = () => {
    setIsRunning(false);
    
    if (isBilateral) {
      if (currentSide === 'left') {
        setSideProgress(prev => ({ ...prev, left: true }));
        setCurrentSide('right');
        setTimeLeft(timePerSet);
      } else if (currentSide === 'right') {
        setSideProgress(prev => ({ ...prev, right: true }));
        handleSetComplete();
      }
    } else {
      handleSetComplete();
    }
  };

  const handleSetComplete = () => {
    const setData: SetData = {
      completed: true,
      timeCompleted: timePerSet,
      leftSideCompleted: !isBilateral || sideProgress.left,
      rightSideCompleted: !isBilateral || sideProgress.right,
      restStartTime: Date.now()
    };

    onSetComplete(exercise.currentSet, setData);
    
    
    setTimeLeft(timePerSet);
    setCurrentSide(isBilateral ? 'left' : 'both');
    setSideProgress({ left: false, right: false });
  };

  const startTimer = () => {
    if (!isBilateral) {
      setIsRunning(true);
    } else if (currentSide === 'both') {
      setCurrentSide('left');
      setIsRunning(true);
    } else {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(timePerSet);
    if (isBilateral) {
      setCurrentSide('left');
      setSideProgress({ left: false, right: false });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedSets = exercise.setData.filter(set => set.completed).length;
  const allSetsCompleted = completedSets === exercise.sets;

  const handleEditSave = (updates: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => {
    if (onExerciseUpdate) {
      onExerciseUpdate(updates);
    }
    setShowEditDialog(false);
    
    // Update time if changed
    if (updates.timePerSet && updates.timePerSet !== exercise.timePerSet) {
      setTimeLeft(updates.timePerSet);
    }
  };

  const getCurrentSideLabel = () => {
    if (!isBilateral) return '';
    if (currentSide === 'left') return ' - Lado Esquerdo';
    if (currentSide === 'right') return ' - Lado Direito';
    return '';
  };

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Abdominal</DialogTitle>
          </DialogHeader>
          <AbdominalForm
            exercise={exercise}
            onSave={handleEditSave}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    <Card className={`${isActive ? 'border-iron-orange shadow-primary bg-card/80' : 'border-border'} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
        <CardTitle className="text-lg font-semibold text-foreground pr-2 uppercase">
          {exercise.name}{getCurrentSideLabel()}
        </CardTitle>
            {onExerciseUpdate && !exercise.completed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="h-7 px-2"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          {exercise.completed ? (
            <Badge variant="outline" className="bg-success/20 text-success border-success">
              <CheckCircle className="w-3 h-3 mr-1" />
              Concluído
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {completedSets}/{exercise.sets} séries
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Meta: {exercise.timePerSet}s{exercise.isBilateral ? ' cada lado' : ''}
          </p>
          {exercise.notes && (
            <p className="text-sm text-muted-foreground">
              Observações: {exercise.notes}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-primary mb-4">
            {formatTime(timeLeft)}
          </div>
          
          {isBilateral && (
            <div className="flex justify-center gap-4 mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                sideProgress.left ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {sideProgress.left ? <CheckCircle className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                Esquerdo
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                sideProgress.right ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {sideProgress.right ? <CheckCircle className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                Direito
              </div>
            </div>
          )}
        </div>

        {/* Sets Progress */}
        <div className="grid grid-cols-1 gap-2">
          {Array.from({ length: exercise.sets }).map((_, index) => {
            const setData = exercise.setData[index];
            const isCurrentSet = index === exercise.currentSet && !exercise.completed;
            const isCompleted = setData?.completed;

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isCurrentSet 
                    ? 'border-iron-orange bg-iron-orange/10' 
                    : isCompleted
                    ? 'border-success bg-success/10'
                    : 'border-border bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Timer className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Série {index + 1}</span>
                </div>
                
                {isCompleted ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{timePerSet}s{isBilateral ? ' cada lado' : ''}</span>
                  </div>
                ) : isCurrentSet ? (
                  <span className="text-sm font-medium text-iron-orange">Em andamento</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Aguardando...</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Control Buttons */}
        {!exercise.completed && exercise.currentSet < exercise.sets && !isCurrentSetCompleted && (
          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                variant="workout"
                onClick={startTimer}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                {timeLeft === timePerSet ? 'Iniciar' : 'Continuar'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={pauseTimer}
                className="flex-1"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={resetTimer}
              size="icon"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        )}

        {allSetsCompleted && !exercise.completed && (
          <Button
            variant="success"
            onClick={onExerciseComplete}
            className="w-full"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como Concluído
          </Button>
        )}

        {/* Skip Exercise Button */}
        {!exercise.completed && onExerciseSkip && (
          <Button
            variant="ghost"
            onClick={() => setShowSkipConfirm(true)}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Pular Exercício
          </Button>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pular exercício?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja pular "{exercise.name}"? 
            {completedSets > 0 
              ? ` Você já completou ${completedSets} de ${exercise.sets} séries. As séries feitas serão mantidas.`
              : ' Nenhuma série será registrada para este exercício.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              hapticSkip();
              onExerciseSkip();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Pular Exercício
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};