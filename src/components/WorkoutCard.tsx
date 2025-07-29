import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Dumbbell, Target, Calendar } from 'lucide-react';
import { WorkoutDay } from '../types/workout';

interface WorkoutCardProps {
  workoutDay: WorkoutDay;
  onStartWorkout: () => void;
  isToday?: boolean;
  averageTime?: number;
  isCompleted?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workoutDay,
  onStartWorkout,
  isToday = false,
  averageTime,
  isCompleted = false
}) => {
  const totalExercises = workoutDay.exercises.length + (workoutDay.abdominal?.length || 0);
  const hasAerobic = !!workoutDay.aerobic;

  return (
    <Card className={`${isToday ? 'border-iron-orange shadow-primary' : 'border-border'} hover:shadow-card transition-all duration-300 transform hover:scale-102`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" />
              {workoutDay.day}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {workoutDay.name}
            </p>
          </div>
          {isToday && (
            <Badge variant="outline" className="bg-iron-orange/20 text-iron-orange border-iron-orange">
              Hoje
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dumbbell className="w-4 h-4" />
            <span>{totalExercises} exercícios</span>
          </div>
          {averageTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>~{averageTime}min</span>
            </div>
          )}
        </div>

        {hasAerobic && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>
              {workoutDay.aerobic?.type} - {workoutDay.aerobic?.duration}min ({workoutDay.aerobic?.timing})
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Exercícios principais:</h4>
          <div className="space-y-1">
            {workoutDay.exercises.slice(0, 3).map((exercise, index) => (
              <div key={exercise.id} className="text-sm text-muted-foreground">
                • {exercise.name}
              </div>
            ))}
            {workoutDay.exercises.length > 3 && (
              <div className="text-sm text-muted-foreground">
                ... e mais {workoutDay.exercises.length - 3} exercícios
              </div>
            )}
          </div>
        </div>

        {isToday && isCompleted ? (
          <Button 
            variant="success" 
            className="w-full"
            disabled
          >
            TREINO DO DIA FINALIZADO ✅
          </Button>
        ) : (
          <Button 
            variant={isToday ? "workout" : "exercise"}
            className="w-full"
            onClick={onStartWorkout}
          >
            {isToday ? "Iniciar Treino de Hoje" : "Visualizar Treino"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};