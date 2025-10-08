import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { X, Lock, Trophy, Calendar } from 'lucide-react';
import { ACHIEVEMENTS } from '../utils/achievements';
import { achievementManager } from '../utils/achievements';
import { UnlockedAchievement } from '../types/achievement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface AchievementsProps {
  onBack: () => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ onBack }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<UnlockedAchievement | null>(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const unlocked = await achievementManager.getUnlockedAchievements();
    setUnlockedAchievements(unlocked);
  };

  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(a => a.id === achievementId);
  };

  const getUnlockedData = (achievementId: string) => {
    return unlockedAchievements.find(a => a.id === achievementId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-6 h-6 text-iron-orange" />
                Conquistas
              </h1>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} de {totalCount} conquistas desbloqueadas
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            const unlockedData = getUnlockedData(achievement.id);

            return (
              <Card
                key={achievement.id}
                className={`border-border transition-all ${
                  unlocked
                    ? 'cursor-pointer hover:shadow-lg hover:border-iron-orange'
                    : 'opacity-60'
                }`}
                onClick={() => {
                  if (unlocked && unlockedData) {
                    setSelectedAchievement(unlockedData);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`text-4xl ${
                        unlocked ? 'grayscale-0' : 'grayscale opacity-50'
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {achievement.title}
                        {!unlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                {unlocked && unlockedData && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-xs text-iron-orange">
                      <Calendar className="w-3 h-3" />
                      Desbloqueada em {formatDate(unlockedData.unlockedAt)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {unlockedCount === 0 && (
          <Card className="border-border">
            <CardContent className="py-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Complete treinos para desbloquear suas primeiras conquistas!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl">{selectedAchievement?.icon}</span>
              <span>{selectedAchievement?.title}</span>
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-base">{selectedAchievement?.description}</p>
              {selectedAchievement?.unlockedAt && (
                <div className="flex items-center gap-2 text-iron-orange">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Desbloqueada em {formatDate(selectedAchievement.unlockedAt)}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};
