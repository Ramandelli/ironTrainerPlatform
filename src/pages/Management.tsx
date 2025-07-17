import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ArrowLeft, Plus, Edit, Trash2, Copy, GripVertical, Dumbbell, Clock } from 'lucide-react';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { WorkoutDay, Exercise } from '../types/workout';

interface ManagementProps {
  onBack: () => void;
}

export const Management: React.FC<ManagementProps> = ({ onBack }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDay | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleEditWorkout = (workout: WorkoutDay) => {
    setSelectedWorkout(workout);
    setEditMode(true);
  };

  const handleDuplicateWorkout = (workout: WorkoutDay) => {
    // TODO: Implement workout duplication
    console.log('Duplicating workout:', workout.name);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    // TODO: Implement workout deletion
    console.log('Deleting workout:', workoutId);
  };

  const handleAddExercise = () => {
    // TODO: Implement add exercise
    console.log('Adding new exercise');
  };

  const handleEditExercise = (exercise: Exercise) => {
    // TODO: Implement exercise editing
    console.log('Editing exercise:', exercise.name);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    // TODO: Implement exercise deletion
    console.log('Deleting exercise:', exerciseId);
  };

  // Workout List View
  if (!selectedWorkout || !editMode) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Gerenciar Treinos</h1>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* Add New Workout */}
          <Card className="border-dashed border-2 border-border hover:border-iron-orange/50 transition-colors">
            <CardContent className="p-6 text-center">
              <Plus className="w-8 h-8 text-iron-orange mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Criar Novo Treino</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione um novo dia de treino personalizado
              </p>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Novo Treino
              </Button>
            </CardContent>
          </Card>

          {/* Existing Workouts */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Treinos Existentes</h2>
            
            {WORKOUT_PLAN.map((workout) => (
              <Card key={workout.id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-foreground">{workout.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {workout.day}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {workout.exercises.length} exercícios
                        </span>
                        {workout.aerobic && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.aerobic.duration}min aeróbico
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWorkout(workout)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateWorkout(workout)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkout(workout.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {workout.exercises.slice(0, 3).map((exercise) => (
                      <div key={exercise.id} className="text-sm text-muted-foreground flex justify-between">
                        <span>{exercise.name}</span>
                        <span>{exercise.sets}x{exercise.targetReps}</span>
                      </div>
                    ))
                    }
                    {workout.exercises.length > 3 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{workout.exercises.length - 3} exercícios
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
            }
          </div>
        </div>
      </div>
    );
  }

  // Exercise Edit View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">{selectedWorkout.name}</h1>
            </div>
            <Button variant="default" size="sm">
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Workout Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome do Treino
              </label>
              <Input
                defaultValue={selectedWorkout.name}
                placeholder="Ex: Peito + Abdômen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Dia da Semana
              </label>
              <Input
                defaultValue={selectedWorkout.day}
                placeholder="Ex: Segunda-feira"
              />
            </div>
          </CardContent>
        </Card>

        {/* Aerobic Exercise */}
        {selectedWorkout.aerobic && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Exercício Aeróbico
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedWorkout.aerobic.type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium text-foreground">
                    {selectedWorkout.aerobic.duration} minutos
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Intensidade:</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedWorkout.aerobic.intensity}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timing:</span>
                  <span className="font-medium text-foreground capitalize">
                    {selectedWorkout.aerobic.timing}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Exercícios ({selectedWorkout.exercises.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddExercise}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedWorkout.exercises.map((exercise, index) => (
              <Card key={exercise.id} className="border border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">
                        {exercise.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exercise.sets} séries × {exercise.targetReps} reps
                        {exercise.suggestedWeight && ` • ${exercise.suggestedWeight}kg`}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditExercise(exercise)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            }
          </CardContent>
        </Card>

        {/* Abdominal Exercises */}
        {selectedWorkout.abdominal && selectedWorkout.abdominal.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Exercícios Abdominais ({selectedWorkout.abdominal.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedWorkout.abdominal.map((exercise) => (
                <Card key={exercise.id} className="border border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">
                          {exercise.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {exercise.sets} séries × {exercise.targetReps}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExercise(exercise)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              }
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
