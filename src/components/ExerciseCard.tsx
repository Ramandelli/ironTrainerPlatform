import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { CheckCircle, Circle, Timer, Weight, RotateCcw, Zap } from 'lucide-react';
import { Exercise, SetData, DropsetData } from '../types/workout';
import { DropsetInput } from './DropsetInput';

interface ExerciseCardProps {
  exercise: Exercise;
  onSetComplete: (setIndex: number, setData: SetData) => void;
  onExerciseComplete: () => void;
  isActive?: boolean;
  hideWeightInputs?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onSetComplete,
  onExerciseComplete,
  isActive = false,
  hideWeightInputs = false
}) => {
  const [currentSetInputs, setCurrentSetInputs] = useState<{ weight: string; reps: string }>({
    weight: '',
    reps: ''
  });
  const [showDropsetInput, setShowDropsetInput] = useState(false);

  const [mainSetData, setMainSetData] = useState<{ weight: number; reps: number } | null>(null);

  const handleSetComplete = () => {
    const weight = parseFloat(currentSetInputs.weight) || 0;
    const reps = parseInt(currentSetInputs.reps);
    
    if (reps > 0) {
      // Se é a última série e tem dropset, salvar dados e mostrar input de dropset
      const isLastSet = exercise.currentSet === exercise.sets - 1;
      if (isLastSet && exercise.hasDropset) {
        setMainSetData({ weight, reps });
        setShowDropsetInput(true);
        setCurrentSetInputs({ weight: '', reps: '' });
        return;
      }

      const setData: SetData = {
        weight: weight > 0 ? weight : undefined,
        reps,
        completed: true,
        restStartTime: Date.now()
      };
      
      onSetComplete(exercise.currentSet, setData);
      
      // Clear inputs
      setCurrentSetInputs({ weight: '', reps: '' });
    }
  };

  const handleDropsetComplete = (dropsetData: DropsetData[]) => {
    if (!mainSetData) return;
    
    const setData: SetData = {
      weight: mainSetData.weight > 0 ? mainSetData.weight : undefined,
      reps: mainSetData.reps,
      completed: true,
      restStartTime: Date.now(),
      dropsetData
    };
    
    onSetComplete(exercise.currentSet, setData);
    setShowDropsetInput(false);
    setMainSetData(null);
    setCurrentSetInputs({ weight: '', reps: '' });
  };

  const handleDropsetCancel = () => {
    setShowDropsetInput(false);
    setMainSetData(null);
    // Restaurar os valores dos inputs
    if (mainSetData) {
      setCurrentSetInputs({ 
        weight: mainSetData.weight.toString(), 
        reps: mainSetData.reps.toString() 
      });
    }
  };

  const canCompleteSet = () => {
    const reps = parseInt(currentSetInputs.reps);
    return reps > 0 && exercise.currentSet < exercise.sets;
  };

  const completedSets = exercise.setData.filter(set => set.completed).length;
  const allSetsCompleted = completedSets === exercise.sets;

  // Se está mostrando o input de dropset, renderizar apenas ele
  if (showDropsetInput) {
    return (
      <DropsetInput
        onComplete={handleDropsetComplete}
        onCancel={handleDropsetCancel}
        exerciseName={exercise.name}
      />
    );
  }

  return (
    <Card className={`${isActive ? 'border-iron-orange shadow-primary bg-card/80' : 'border-border'} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-foreground pr-2">
              {exercise.name}
            </CardTitle>
            {exercise.hasDropset && (
              <Badge variant="outline" className="bg-iron-orange/20 text-iron-orange border-iron-orange">
                <Zap className="w-3 h-3 mr-1" />
                Dropset
              </Badge>
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
          {exercise.targetReps && (
            <p className="text-sm text-muted-foreground">
              Meta: {exercise.targetReps} repetições
            </p>
          )}
          {exercise.suggestedWeight && (
            <p className="text-sm text-muted-foreground">
              Carga sugerida: {exercise.suggestedWeight}kg
            </p>
          )}
          {exercise.notes && (
            <p className="text-sm text-muted-foreground">
              Observações: {exercise.notes}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Série {index + 1}</span>
                </div>
                
                {isCompleted ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {setData.weight && (
                        <span className="flex items-center gap-1">
                          <Weight className="w-4 h-4" />
                          {setData.weight}kg
                        </span>
                      )}
                      <span>{setData.reps} reps</span>
                    </div>
                    {setData.dropsetData && setData.dropsetData.length > 0 && (
                      <div className="text-xs text-iron-orange">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Dropsets: {setData.dropsetData.map(drop => `${drop.weight}kg×${drop.reps}`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : isCurrentSet ? (
                  <div className="flex items-center gap-2">
                  {(!exercise.isTimeBased && !hideWeightInputs) && (
                    <Input
                      type="number"
                      placeholder="Peso"
                      value={currentSetInputs.weight}
                      onChange={(e) => setCurrentSetInputs(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-20 h-8 text-sm"
                      step="0.5"
                      min="0"
                    />
                  )}
                  <Input
                      type="number"
                      placeholder="Reps"
                      value={currentSetInputs.reps}
                      onChange={(e) => setCurrentSetInputs(prev => ({ ...prev, reps: e.target.value }))}
                      className="w-20 h-8 text-sm"
                      min="1"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Aguardando...</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!exercise.completed && exercise.currentSet < exercise.sets && (
            <Button
              variant="workout"
              onClick={handleSetComplete}
              disabled={!canCompleteSet()}
              className="flex-1"
            >
              <Timer className="w-4 h-4 mr-2" />
              Finalizar Série
            </Button>
          )}
          
          {allSetsCompleted && !exercise.completed && (
            <Button
              variant="success"
              onClick={onExerciseComplete}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como Concluído
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};