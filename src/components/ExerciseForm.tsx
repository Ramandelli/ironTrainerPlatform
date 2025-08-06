import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { X } from 'lucide-react';
import { Exercise } from '../types/workout';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSave: (exercise: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => void;
  onCancel: () => void;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  exercise,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    sets: exercise?.sets || 3,
    targetReps: exercise?.targetReps || '10',
    suggestedWeight: exercise?.suggestedWeight || 0,
    restTime: exercise?.restTime || 90,
    notes: exercise?.notes || '',
    hasDropset: exercise?.hasDropset || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      name: formData.name.trim(),
      sets: formData.sets,
      targetReps: formData.targetReps,
      suggestedWeight: formData.suggestedWeight || undefined,
      restTime: formData.restTime,
      notes: formData.notes || undefined,
      hasDropset: formData.hasDropset
    });
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {exercise ? 'Editar Exercício' : 'Novo Exercício'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Exercício *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Supino reto"
              required
            />
          </div>

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
              <Label htmlFor="targetReps">Repetições Alvo *</Label>
              <Input
                id="targetReps"
                value={formData.targetReps}
                onChange={(e) => handleChange('targetReps', e.target.value)}
                placeholder="Ex: 8-10, 12, 30s"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="suggestedWeight">Carga Sugerida (kg)</Label>
              <Input
                id="suggestedWeight"
                type="number"
                value={formData.suggestedWeight}
                onChange={(e) => handleChange('suggestedWeight', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="restTime">Descanso (segundos)</Label>
              <Input
                id="restTime"
                type="number"
                value={formData.restTime}
                onChange={(e) => handleChange('restTime', parseInt(e.target.value) || 90)}
                min="0"
                step="15"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Pegada pronada, técnica especial, etc..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDropset"
              checked={formData.hasDropset}
              onCheckedChange={(checked) => handleChange('hasDropset', checked)}
            />
            <Label htmlFor="hasDropset" className="text-sm font-medium">
              Tem dropset na última série
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {exercise ? 'Salvar Alterações' : 'Adicionar Exercício'}
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