import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ExerciseForm } from './ExerciseForm';
import { Exercise } from '../types/workout';

interface AddExerciseDuringWorkoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exercise: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => void;
}

export const AddExerciseDuringWorkout: React.FC<AddExerciseDuringWorkoutProps> = ({
  open,
  onOpenChange,
  onAdd
}) => {
  const handleSave = (exercise: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => {
    onAdd(exercise);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ADICIONAR EXERCÍCIO</DialogTitle>
        </DialogHeader>
        <ExerciseForm
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
