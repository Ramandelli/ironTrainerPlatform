import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X } from 'lucide-react';
import { AerobicExercise } from '../types/workout';

interface AerobicFormProps {
  aerobic?: AerobicExercise;
  onSave: (aerobic: Omit<AerobicExercise, 'completed' | 'actualDuration' | 'skipped'>) => void;
  onCancel: () => void;
}

export const AerobicForm: React.FC<AerobicFormProps> = ({
  aerobic,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    type: aerobic?.type || 'esteira' as 'esteira' | 'bicicleta' | 'transport' | 'rowing',
    duration: aerobic?.duration || 15,
    intensity: aerobic?.intensity || 'moderada' as 'leve' | 'moderada' | 'intensa',
    timing: aerobic?.timing || 'depois' as 'antes' | 'depois'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {aerobic ? 'EDITAR CARDIO' : 'NOVO CARDIO'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">TIPO DE EXERCÍCIO *</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esteira">ESTEIRA</SelectItem>
                <SelectItem value="bicicleta">BICICLETA</SelectItem>
                <SelectItem value="transport">TRANSPORT</SelectItem>
                <SelectItem value="rowing">REMADA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">DURAÇÃO (MINUTOS) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange('duration', parseInt(e.target.value) || 15)}
              min="1"
              max="120"
              required
            />
          </div>

          <div>
            <Label htmlFor="intensity">INTENSIDADE *</Label>
            <Select value={formData.intensity} onValueChange={(value) => handleChange('intensity', value)}>
              <SelectTrigger id="intensity">
                <SelectValue placeholder="Selecione a intensidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leve">LEVE</SelectItem>
                <SelectItem value="moderada">MODERADA</SelectItem>
                <SelectItem value="intensa">INTENSA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timing">QUANDO FAZER *</Label>
            <Select value={formData.timing} onValueChange={(value) => handleChange('timing', value)}>
              <SelectTrigger id="timing">
                <SelectValue placeholder="Selecione quando" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="antes">ANTES DOS EXERCÍCIOS</SelectItem>
                <SelectItem value="depois">DEPOIS DOS EXERCÍCIOS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {aerobic ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR CARDIO'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              CANCELAR
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
