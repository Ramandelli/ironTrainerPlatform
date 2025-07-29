import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ExerciseForm } from './ExerciseForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Plus, Edit, Trash2, GripVertical, X } from 'lucide-react';
import { WorkoutDay, Exercise } from '../types/workout';

interface WorkoutFormProps {
  workout?: WorkoutDay;
  onSave: (workout: Omit<WorkoutDay, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

const DAYS = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

const AEROBIC_TYPES = [
  { value: 'esteira', label: 'Esteira' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'transport', label: 'Transport' },
  { value: 'rowing', label: 'Remo' }
];

const INTENSITIES = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'intensa', label: 'Intensa' }
];

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  workout,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: workout?.name || '',
    day: workout?.day || '',
    exercises: workout?.exercises || [],
    abdominal: workout?.abdominal || [],
    aerobic: workout?.aerobic || null
  });

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showAbdominalForm, setShowAbdominalForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{ exercise: Exercise; index: number; type: 'main' | 'abdominal' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; type: 'main' | 'abdominal' } | null>(null);
  const [showAerobicForm, setShowAerobicForm] = useState(false);


// Remova a função getWorkoutId existente e substitua pelo seguinte:
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.name.trim() || !formData.day) return;

  // Encontrar o dia selecionado com a label em português
  const selectedDay = DAYS.find(d => d.value === formData.day);
  const dayLabel = selectedDay ? selectedDay.label : formData.day;
  
  // Gerar ID baseado no dia
  const dayMap: Record<string, string> = {
    'Segunda-feira': 'monday',
    'Terça-feira': 'tuesday',
    'Quarta-feira': 'wednesday',
    'Quinta-feira': 'thursday',
    'Sexta-feira': 'friday',
    'Sábado': 'saturday',
    'Domingo': 'sunday'
  };
  
  const baseId = dayMap[dayLabel] || formData.day.toLowerCase();
  const newId = workout?.id || `custom_${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  onSave({
    ...(workout?.id && { id: workout.id }),
    id: newId,
    name: formData.name.trim(),
    day: dayLabel,
    exercises: formData.exercises,
    abdominal: formData.abdominal.length > 0 ? formData.abdominal : undefined,
    aerobic: formData.aerobic
  });
};    
  

  const addExercise = (exerciseData: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>, isAbdominal = false) => {
    const newExercise: Exercise = {
      ...exerciseData,
      id: `${isAbdominal ? 'ab' : 'ex'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      currentSet: 0,
      setData: []
    };

    if (isAbdominal) {
      setFormData(prev => ({
        ...prev,
        abdominal: [...prev.abdominal, newExercise]
      }));
      setShowAbdominalForm(false);
    } else {
      setFormData(prev => ({
        ...prev,
        exercises: [...prev.exercises, newExercise]
      }));
      setShowExerciseForm(false);
    }
  };

  const updateExercise = (exerciseData: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => {
    if (!editingExercise) return;

    const updatedExercise = {
      ...editingExercise.exercise,
      ...exerciseData
    };

    if (editingExercise.type === 'abdominal') {
      setFormData(prev => ({
        ...prev,
        abdominal: prev.abdominal.map((ex, i) => 
          i === editingExercise.index ? updatedExercise : ex
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        exercises: prev.exercises.map((ex, i) => 
          i === editingExercise.index ? updatedExercise : ex
        )
      }));
    }

    setEditingExercise(null);
  };

  const deleteExercise = (index: number, type: 'main' | 'abdominal') => {
    if (type === 'abdominal') {
      setFormData(prev => ({
        ...prev,
        abdominal: prev.abdominal.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index)
      }));
    }
    setDeleteConfirm(null);
  };

  const moveExercise = (fromIndex: number, toIndex: number, type: 'main' | 'abdominal') => {
    const exercises = type === 'abdominal' ? formData.abdominal : formData.exercises;
    const newExercises = [...exercises];
    const [moved] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, moved);

    if (type === 'abdominal') {
      setFormData(prev => ({ ...prev, abdominal: newExercises }));
    } else {
      setFormData(prev => ({ ...prev, exercises: newExercises }));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">
            {workout ? 'Editar Treino' : 'Novo Treino'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Treino *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: PEITO + TRÍCEPS"
                required
              />
            </div>

            <div>
              <Label htmlFor="day">Dia da Semana *</Label>
              <Select
                value={formData.day}
                onValueChange={(value) => setFormData(prev => ({ ...prev, day: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aerobic Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exercício Aeróbico</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAerobicForm(!showAerobicForm)}
                >
                  {formData.aerobic ? 'Editar' : 'Adicionar'} Aeróbico
                </Button>
              </div>

              {formData.aerobic && (
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{formData.aerobic.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.aerobic.duration}min • {formData.aerobic.intensity} • {formData.aerobic.timing}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, aerobic: null }))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showAerobicForm && (
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={formData.aerobic?.type || ''}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            aerobic: { ...prev.aerobic, type: value as any, completed: false }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {AEROBIC_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Duração (min)</Label>
                        <Input
                          type="number"
                          value={formData.aerobic?.duration || 10}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            aerobic: { ...prev.aerobic, duration: parseInt(e.target.value) || 10, completed: false }
                          }))}
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Intensidade</Label>
                        <Select
                          value={formData.aerobic?.intensity || 'moderada'}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            aerobic: { ...prev.aerobic, intensity: value as any, completed: false }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INTENSITIES.map(intensity => (
                              <SelectItem key={intensity.value} value={intensity.value}>
                                {intensity.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Momento</Label>
                        <Select
                          value={formData.aerobic?.timing || 'depois'}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            aerobic: { ...prev.aerobic, timing: value as any, completed: false }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="antes">Antes dos exercícios</SelectItem>
                            <SelectItem value="depois">Depois dos exercícios</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAerobicForm(false)}
                    >
                      Fechar
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                {workout ? 'Salvar Alterações' : 'Criar Treino'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exercícios Principais</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowExerciseForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exercício
          </Button>
        </div>

        {formData.exercises.map((exercise, index) => (
          <Card key={exercise.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{exercise.name}</h4>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{exercise.sets} séries</span>
                    <span>{exercise.targetReps} reps</span>
                    {exercise.suggestedWeight && <span>{exercise.suggestedWeight}kg</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingExercise({ exercise, index, type: 'main' })}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm({ index, type: 'main' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {showExerciseForm && (
          <ExerciseForm
            onSave={(exerciseData) => addExercise(exerciseData, false)}
            onCancel={() => setShowExerciseForm(false)}
          />
        )}
      </div>

      {/* Abdominal Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exercícios Abdominais</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAbdominalForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Abdominal
          </Button>
        </div>

        {formData.abdominal.map((exercise, index) => (
          <Card key={exercise.id} className="border-border border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{exercise.name}</h4>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{exercise.sets} séries</span>
                    <span>{exercise.targetReps}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingExercise({ exercise, index, type: 'abdominal' })}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm({ index, type: 'abdominal' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {showAbdominalForm && (
          <ExerciseForm
            onSave={(exerciseData) => addExercise(exerciseData, true)}
            onCancel={() => setShowAbdominalForm(false)}
          />
        )}
      </div>

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <ExerciseForm
              exercise={editingExercise.exercise}
              onSave={updateExercise}
              onCancel={() => setEditingExercise(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          open={true}
          onOpenChange={() => setDeleteConfirm(null)}
          title="Excluir Exercício"
          description="Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita."
          onConfirm={() => deleteExercise(deleteConfirm.index, deleteConfirm.type)}
        />
      )}
    </div>
  );
};