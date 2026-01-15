import React from 'react';
import { Progress } from './ui/progress';
import { CheckCircle, Flame, Dumbbell, Target } from 'lucide-react';

interface WorkoutProgressBarProps {
  currentPhase: 'warmup' | 'aerobic-before' | 'exercises' | 'abdominal' | 'aerobic-after' | 'finished' | 'none';
  exercisesCompleted: number;
  totalExercises: number;
  warmupCompleted: boolean;
  hasWarmup: boolean;
  hasAbdominal: boolean;
  abdominalCompleted: boolean;
  hasAerobic: boolean;
  aerobicTiming?: 'antes' | 'depois';
  aerobicCompleted: boolean;
}

export const WorkoutProgressBar: React.FC<WorkoutProgressBarProps> = ({
  currentPhase,
  exercisesCompleted,
  totalExercises,
  warmupCompleted,
  hasWarmup,
  hasAbdominal,
  abdominalCompleted,
  hasAerobic,
  aerobicTiming,
  aerobicCompleted
}) => {
  // Calculate overall progress
  const calculateProgress = (): number => {
    let totalSteps = 0;
    let completedSteps = 0;

    // Warmup
    if (hasWarmup) {
      totalSteps += 1;
      if (warmupCompleted) completedSteps += 1;
    }

    // Aerobic before
    if (hasAerobic && aerobicTiming === 'antes') {
      totalSteps += 1;
      if (aerobicCompleted || currentPhase !== 'aerobic-before') completedSteps += 1;
    }

    // Main exercises
    totalSteps += totalExercises;
    completedSteps += exercisesCompleted;

    // Abdominal
    if (hasAbdominal) {
      totalSteps += 1;
      if (abdominalCompleted) completedSteps += 1;
    }

    // Aerobic after
    if (hasAerobic && aerobicTiming === 'depois') {
      totalSteps += 1;
      if (aerobicCompleted) completedSteps += 1;
    }

    if (totalSteps === 0) return 0;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const progress = calculateProgress();

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'warmup':
        return 'Aquecimento';
      case 'aerobic-before':
        return 'Cardio';
      case 'exercises':
        return `Exercício ${Math.min(exercisesCompleted + 1, totalExercises)}/${totalExercises}`;
      case 'abdominal':
        return 'Abdominais';
      case 'aerobic-after':
        return 'Cardio Final';
      case 'finished':
        return 'Concluído!';
      case 'none':
      default:
        return 'Preparando...';
    }
  };

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'warmup':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'aerobic-before':
      case 'aerobic-after':
        return <Target className="w-4 h-4 text-iron-orange" />;
      case 'exercises':
        return <Dumbbell className="w-4 h-4 text-iron-orange" />;
      case 'abdominal':
        return <Target className="w-4 h-4 text-iron-orange" />;
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-success" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {getPhaseIcon()}
          <span className="font-medium text-foreground">{getPhaseLabel()}</span>
        </div>
        <span className="text-muted-foreground font-medium">{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-muted"
      />
    </div>
  );
};
