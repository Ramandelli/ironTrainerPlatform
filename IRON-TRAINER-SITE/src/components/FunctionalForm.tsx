import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { X } from 'lucide-react';
import { Exercise } from '../types/workout';
import { ExercisePicker, SimilarExerciseConfirm, resolveExercise } from './ExercisePicker';
import { LibraryExercise } from '../utils/exerciseLibrary';

interface FunctionalFormProps {
  exercise?: Exercise;
  onSave: (exercise: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => void;
  onCancel: () => void;
}

export const FunctionalForm: React.FC<FunctionalFormProps> = ({
  exercise,
  onSave,
  onCancel
}) => {
  const [picked, setPicked] = useState<{ name: string; exerciseId?: string }>({ name: exercise?.name || '', exerciseId: exercise?.exerciseId });
  const [similar, setSimilar] = useState<LibraryExercise[]>([]);
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    sets: exercise?.sets || 3,
    targetReps: exercise?.targetReps || '15',
    restTime: exercise?.restTime || 60,
    notes: exercise?.notes || '',
    isTimeBased: exercise?.isTimeBased || false,
    timePerSet: exercise?.timePerSet || 30,
    isBilateral: exercise?.isBilateral || false
  });

  const handleSubmit = (e?: React.FormEvent, forceCreate = false, useEntry?: LibraryExercise) => {
    e?.preventDefault();
    if (!picked.name.trim()) return;
    const value = useEntry ? { name: useEntry.name, exerciseId: useEntry.id } : picked;
    resolveExercise(value, 'functional', forceCreate, { isTimeBased: (formData as any).isTimeBased, isBilateral: (formData as any).isBilateral }).then((res) => {
      if ('similar' in res) { setSimilar(res.similar); return; }
      setSimilar([]);
      doSave(res.id, res.name);
    });
  };

  const doSave = (exerciseId: string, name: string) => {
    onSave({
      exerciseId,
      name,
      sets: formData.sets,
      targetReps: formData.isTimeBased
        ? `${formData.timePerSet}s${formData.isBilateral ? ' cada lado' : ''}`
        : formData.targetReps,
      restTime: formData.restTime,
      notes: formData.notes || undefined,
      isTimeBased: formData.isTimeBased,
      timePerSet: formData.isTimeBased ? formData.timePerSet : undefined,
      isBilateral: formData.isTimeBased ? formData.isBilateral : undefined
    });
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {exercise ? 'Editar Funcional' : 'Novo Funcional'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ExercisePicker
            value={picked}
            onChange={(v) => { setPicked(v); setSimilar([]); }}
            category="functional"
            onPickExisting={(entry) => {
              if (entry.isTimeBased !== undefined) setFormData(prev => ({ ...prev, isTimeBased: !!entry.isTimeBased, isBilateral: !!entry.isBilateral } as typeof prev));
            }}
          />
          {similar.length > 0 && (
            <SimilarExerciseConfirm
              name={picked.name}
              matches={similar}
              onUse={(m) => { setPicked({ name: m.name, exerciseId: m.id }); handleSubmit(undefined, false, m); }}
              onCreate={() => handleSubmit(undefined, true)}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sets">Séries *</Label>
              <Input
                id="sets"
                type="number"
                value={formData.sets}
                onChange={(e) => handleChange('sets', parseInt(e.target.value) || 3)}
                min="1"
                max="10"
                required
              />
            </div>
            <div>
              <Label htmlFor="restTime">Descanso (segundos)</Label>
              <Input
                id="restTime"
                type="number"
                value={formData.restTime}
                onChange={(e) => handleChange('restTime', parseInt(e.target.value) || 60)}
                min="0"
                step="15"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isTimeBased"
                checked={formData.isTimeBased}
                onCheckedChange={(checked) => handleChange('isTimeBased', checked)}
              />
              <Label htmlFor="isTimeBased">Exercício por tempo</Label>
            </div>

            {formData.isTimeBased ? (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timePerSet">Tempo por série (segundos) *</Label>
                    <Input
                      id="timePerSet"
                      type="number"
                      value={formData.timePerSet}
                      onChange={(e) => handleChange('timePerSet', parseInt(e.target.value) || 30)}
                      min="5"
                      max="600"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isBilateral"
                        checked={formData.isBilateral}
                        onCheckedChange={(checked) => handleChange('isBilateral', checked)}
                      />
                      <Label htmlFor="isBilateral">Ambos os lados</Label>
                    </div>
                  </div>
                </div>
                {formData.isBilateral && (
                  <p className="text-sm text-muted-foreground">
                    O cronômetro será executado {formData.timePerSet}s para cada lado em cada série.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="targetReps">Repetições Alvo *</Label>
                <Input
                  id="targetReps"
                  value={formData.targetReps}
                  onChange={(e) => handleChange('targetReps', e.target.value)}
                  placeholder="Ex: 15, 10-12, 20"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Postura, respiração, variações, equipamento..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {exercise ? 'Salvar Alterações' : 'Adicionar Funcional'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
