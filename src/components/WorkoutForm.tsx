import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ExerciseForm } from './ExerciseForm';
import { AbdominalForm } from './AbdominalForm';
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
  { value: 'bicicleta', label: 'Bicicleta' }
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
  
  const mapDayToSelectValue = (dayName: string) => {
    const dayMapping: Record<string, string> = {
      'Segunda-feira': 'monday',
      'Segunda': 'monday',
      'Terça-feira': 'tuesday', 
      'Terça': 'tuesday',
      'Quarta-feira': 'wednesday',
      'Quarta': 'wednesday',
      'Quinta-feira': 'thursday',
      'Quinta': 'thursday',
      'Sexta-feira': 'friday',
      'Sexta': 'friday',
      'Sábado': 'saturday',
      'Domingo': 'sunday'
    };
    return dayMapping[dayName] || dayName.toLowerCase();
  };

  const [formData, setFormData] = useState({
    name: workout?.name || '',
    day: workout?.day ? mapDayToSelectValue(workout.day) : '',
    exercises: workout?.exercises || [],
    abdominal: workout?.abdominal || [],
    aerobic: workout?.aerobic || null,
    warmup: workout?.warmup || ''
  });

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showAbdominalForm, setShowAbdominalForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{ exercise: Exercise; index: number; type: 'main' | 'abdominal' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; type: 'main' | 'abdominal' } | null>(null);
  const [showAerobicForm, setShowAerobicForm] = useState(false);
  const [aerobicDraft, setAerobicDraft] = useState<{
    type?: 'esteira' | 'bicicleta';
    duration?: string; // manter como string para validar vazio
    intensity?: 'leve' | 'moderada' | 'intensa';
    timing?: 'antes' | 'depois';
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.day) return;

    const dayMap: Record<string, string> = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira',
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };

    const dayValue = formData.day.toLowerCase();
    const dayLabel = dayMap[dayValue] || formData.day;
    
    
    const baseId = dayValue.replace(/\s+/g, '_').toLowerCase();
    const newId = workout?.id || `custom_${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    onSave({
      ...(workout?.id && { id: workout.id }),
      id: newId,
      name: formData.name.trim(),
      day: dayLabel,
      exercises: formData.exercises,
      abdominal: formData.abdominal.length > 0 ? formData.abdominal : undefined,
      aerobic: formData.aerobic,
      warmup: formData.warmup.trim() || undefined
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
                placeholder="Ex: TREINO PEITO + TRÍCEPS"
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

            {/* Warmup Section */}
            <div>
              <Label htmlFor="warmup">Aquecimento (opcional)</Label>
              <textarea
                id="warmup"
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={formData.warmup}
                onChange={(e) => setFormData(prev => ({ ...prev, warmup: e.target.value }))}
                placeholder="Descreva o aquecimento para este treino (ex: 5min de caminhada, alongamentos dinâmicos, articulação dos ombros...)"
              />
            </div>

            {/* Aerobic Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exercício Aeróbico</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAerobicDraft({});
                    setShowAerobicForm(true);
                  }}
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
                          value={aerobicDraft.type || ''}
                          onValueChange={(value) => setAerobicDraft(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
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
                          placeholder="Ex: 20"
                          value={aerobicDraft.duration || ''}
                          onChange={(e) => setAerobicDraft(prev => ({ ...prev, duration: e.target.value }))}
                          min="1"
                          max="180"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Intensidade</Label>
                        <Select
                          value={aerobicDraft.intensity || ''}
                          onValueChange={(value) => setAerobicDraft(prev => ({ ...prev, intensity: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
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
                          value={aerobicDraft.timing || ''}
                          onValueChange={(value) => setAerobicDraft(prev => ({ ...prev, timing: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="antes">Antes dos exercícios</SelectItem>
                            <SelectItem value="depois">Depois dos exercícios</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => {
                          if (!aerobicDraft.type || !aerobicDraft.duration || !aerobicDraft.intensity || !aerobicDraft.timing) return;
                          setFormData(prev => ({
                            ...prev,
                            aerobic: {
                              type: aerobicDraft.type as any,
                              duration: parseInt(aerobicDraft.duration),
                              intensity: aerobicDraft.intensity as any,
                              timing: aerobicDraft.timing as any,
                              completed: false
                            }
                          }));
                          setShowAerobicForm(false);
                          setAerobicDraft({});
                        }}
                        disabled={!aerobicDraft.type || !aerobicDraft.duration || !aerobicDraft.intensity || !aerobicDraft.timing}
                      >
                        Adicionar Exercício
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setShowAerobicForm(false); setAerobicDraft({}); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
          <AbdominalForm
            onSave={(exerciseData) => addExercise(exerciseData, true)}
            onCancel={() => setShowAbdominalForm(false)}
          />
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} className="flex-1">
          {workout ? 'Salvar Alterações' : 'Criar Treino'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            {editingExercise.type === 'abdominal' ? (
              <AbdominalForm
                exercise={editingExercise.exercise}
                onSave={updateExercise}
                onCancel={() => setEditingExercise(null)}
              />
            ) : (
              <ExerciseForm
                exercise={editingExercise.exercise}
                onSave={updateExercise}
                onCancel={() => setEditingExercise(null)}
              />
            )}
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