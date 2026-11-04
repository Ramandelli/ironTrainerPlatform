import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface ApplyChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApplyChangesDialog: React.FC<ApplyChangesDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aplicar alterações permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Você fez alterações em alguns exercícios durante este treino. Deseja aplicar essas alterações permanentemente ao treino base?
            <br /><br />
            Se confirmar, o treino base será atualizado com as novas configurações.
            <br />
            Se não, as alterações serão mantidas apenas no histórico deste treino.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Não</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Sim, aplicar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
