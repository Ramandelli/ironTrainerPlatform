import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, Check } from 'lucide-react';
import { DropsetData } from '../types/workout';

interface DropsetInputProps {
  onComplete: (dropsetData: DropsetData[]) => void;
  onCancel: () => void;
  exerciseName: string;
}

export const DropsetInput: React.FC<DropsetInputProps> = ({
  onComplete,
  onCancel,
  exerciseName
}) => {
  const [dropsets, setDropsets] = useState<Array<{ weight: string; reps: string }>>([
    { weight: '', reps: '' }
  ]);

  const addDropset = () => {
    setDropsets(prev => [...prev, { weight: '', reps: '' }]);
  };

  const removeDropset = (index: number) => {
    if (dropsets.length > 1) {
      setDropsets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateDropset = (index: number, field: 'weight' | 'reps', value: string) => {
    setDropsets(prev => prev.map((dropset, i) => 
      i === index ? { ...dropset, [field]: value } : dropset
    ));
  };

  const handleComplete = () => {
    const validDropsets = dropsets
      .filter(d => parseFloat(d.weight) > 0 && parseInt(d.reps) > 0)
      .map(d => ({
        weight: parseFloat(d.weight),
        reps: parseInt(d.reps)
      }));

    if (validDropsets.length > 0) {
      onComplete(validDropsets);
    }
  };

  const canComplete = dropsets.some(d => parseFloat(d.weight) > 0 && parseInt(d.reps) > 0);

  return (
    <Card className="border-iron-orange bg-iron-orange/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Dropset - {exerciseName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Adicione o peso e repetições de cada dropset realizado na última série
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {dropsets.map((dropset, index) => (
          <div key={index} className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
            <Label className="text-sm font-medium min-w-[60px]">
              Drop {index + 1}:
            </Label>
            
            <Input
              type="number"
              placeholder="Peso (kg)"
              value={dropset.weight}
              onChange={(e) => updateDropset(index, 'weight', e.target.value)}
              className="w-24 h-8 text-sm"
              step="0.5"
              min="0"
            />
            
            <Input
              type="number"
              placeholder="Reps"
              value={dropset.reps}
              onChange={(e) => updateDropset(index, 'reps', e.target.value)}
              className="w-20 h-8 text-sm"
              min="1"
            />
            
            {dropsets.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDropset(index)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addDropset}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Dropset
        </Button>
        
        <div className="flex gap-2 pt-2">
          <Button
            variant="workout"
            onClick={handleComplete}
            disabled={!canComplete}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Finalizar Dropset
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};