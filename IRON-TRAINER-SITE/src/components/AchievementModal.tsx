import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { UnlockedAchievement } from '../types/achievement';
import { Trophy } from 'lucide-react';

interface AchievementModalProps {
  achievements: UnlockedAchievement[];
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievements, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(achievements.length > 0);

  useEffect(() => {
    setIsOpen(achievements.length > 0);
    setCurrentIndex(0);
  }, [achievements]);

  if (achievements.length === 0) return null;

  const currentAchievement = achievements[currentIndex];
  const hasMore = currentIndex < achievements.length - 1;

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Trophy className="w-5 h-5 text-iron-orange" />
            Conquista Desbloqueada!
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="text-7xl animate-bounce">
            {currentAchievement.icon}
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {currentAchievement.title}
            </h3>
            <DialogDescription className="text-base">
              {currentAchievement.description}
            </DialogDescription>
          </div>

          {achievements.length > 1 && (
            <div className="text-sm text-muted-foreground">
              {currentIndex + 1} de {achievements.length}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Fechar
          </Button>
          <Button
            className="flex-1"
            onClick={handleNext}
          >
            {hasMore ? 'Próxima' : 'Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
