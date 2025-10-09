import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Lock, Trophy, Calendar } from 'lucide-react';
import { ACHIEVEMENTS } from '../utils/achievements';
import { achievementManager } from '../utils/achievements';
import { UnlockedAchievement } from '../types/achievement';
import { storage } from '../utils/storage';
import { WorkoutSession } from '../types/workout';
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
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);

  useEffect(() => {
    loadAchievements();
    loadHistory();
  }, []);

  const loadAchievements = async () => {
    const unlocked = await achievementManager.getUnlockedAchievements();
    setUnlockedAchievements(unlocked);
  };

  const loadHistory = async () => {
    const workoutHistory = await storage.loadWorkoutHistory();
    setHistory(workoutHistory);
    calculateCurrentStats(workoutHistory);
  };

  const calculateCurrentStats = (workoutHistory: WorkoutSession[]) => {
    const totalWorkouts = workoutHistory.length;
    const totalVolume = workoutHistory.reduce((sum, session) => sum + (session.totalVolume || 0), 0);
    const totalTimeSeconds = workoutHistory.reduce((sum, session) => {
      if (session.endTime && session.startTime) {
        return sum + Math.floor((session.endTime - session.startTime) / 1000);
      }
      return sum;
    }, 0);
    
    // Calculate consecutive days
    const sortedWorkouts = [...workoutHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let consecutiveDays = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;
    
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      
      if (!lastDate) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          break;
        }
      }
      
      consecutiveDays = Math.max(consecutiveDays, currentStreak);
      lastDate = workoutDate;
    }

    // Calculate abdominal stats
    const totalAbdominalSets = workoutHistory.reduce((sum, session) => {
      return sum + (session.abdominal?.length || 0);
    }, 0);

    // Calculate cardio stats
    const totalCardioMinutes = workoutHistory.reduce((sum, session) => {
      if (session.aerobic) {
        // actualDuration is already in minutes, duration is in seconds
        return sum + (session.aerobic.actualDuration || session.aerobic.duration / 60);
      }
      return sum;
    }, 0);

    const totalCardioKm = workoutHistory.reduce((sum, session) => {
      if (session.aerobic) {
        return sum + (session.aerobic.distance || 0);
      }
      return sum;
    }, 0);

    // Calculate total sets and reps
    const totalSets = workoutHistory.reduce((sum, session) => {
      return sum + (session.exercises?.reduce((exSum, ex) => exSum + ex.sets, 0) || 0);
    }, 0);

    const totalReps = workoutHistory.reduce((sum, session) => {
      return sum + (session.exercises?.reduce((exSum, ex) => {
        return exSum + (ex.setData?.reduce((setSum, set) => setSum + (set.reps || 0), 0) || 0);
      }, 0) || 0);
    }, 0);

    setCurrentStats({
      totalWorkouts,
      totalVolume,
      totalTimeSeconds,
      consecutiveDays,
      totalAbdominalSets,
      totalCardioMinutes,
      totalCardioKm,
      totalSets,
      totalReps,
      history: workoutHistory
    });
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

  const getProgressText = (achievement: any): string | null => {
    if (!currentStats || isUnlocked(achievement.id)) return null;

    try {
      // Map achievement IDs to their progress
      const progressMap: { [key: string]: string } = {
        'first_workout': `(atual ${currentStats.totalWorkouts})`,
        'workout_5': `(atual ${currentStats.totalWorkouts})`,
        'workout_10': `(atual ${currentStats.totalWorkouts})`,
        'workout_25': `(atual ${currentStats.totalWorkouts})`,
        'workout_50': `(atual ${currentStats.totalWorkouts})`,
        'workout_100': `(atual ${currentStats.totalWorkouts})`,
        'workout_250': `(atual ${currentStats.totalWorkouts})`,
        'workout_500': `(atual ${currentStats.totalWorkouts})`,
        
        'volume_1000': `(atual ${(currentStats.totalVolume / 1000).toFixed(2)} mil kg)`,
        'volume_5000': `(atual ${(currentStats.totalVolume / 1000).toFixed(2)} mil kg)`,
        'volume_10000': `(atual ${(currentStats.totalVolume / 1000).toFixed(2)} mil kg)`,
        'volume_25000': `(atual ${(currentStats.totalVolume / 1000).toFixed(2)} mil kg)`,
        'volume_50000': `(atual ${(currentStats.totalVolume / 1000).toFixed(2)} mil kg)`,
        'volume_100000': `(atual ${(currentStats.totalVolume / 1000).toFixed(2)} mil kg)`,
        
        'time_5h': `(atual ${(currentStats.totalTimeSeconds / 3600).toFixed(2)}h)`,
        'time_10h': `(atual ${(currentStats.totalTimeSeconds / 3600).toFixed(2)}h)`,
        'time_25h': `(atual ${(currentStats.totalTimeSeconds / 3600).toFixed(2)}h)`,
        'time_50h': `(atual ${(currentStats.totalTimeSeconds / 3600).toFixed(2)}h)`,
        'time_100h': `(atual ${(currentStats.totalTimeSeconds / 3600).toFixed(2)}h)`,
        
        'consecutive_3': `(atual ${currentStats.consecutiveDays} dias)`,
        'consecutive_5': `(atual ${currentStats.consecutiveDays} dias)`,
        'consecutive_7': `(atual ${currentStats.consecutiveDays} dias)`,
        'consecutive_14': `(atual ${currentStats.consecutiveDays} dias)`,
        'consecutive_30': `(atual ${currentStats.consecutiveDays} dias)`,
        
        'abdominal_100_sets': `(atual ${currentStats.totalAbdominalSets} séries)`,
        'abdominal_500_sets': `(atual ${currentStats.totalAbdominalSets} séries)`,
        
        'cardio_10h': `(atual ${(currentStats.totalCardioMinutes / 60).toFixed(2)}h)`,
        'cardio_50h': `(atual ${(currentStats.totalCardioMinutes / 60).toFixed(2)}h)`,
        
        'cardio_100km': `(atual ${currentStats.totalCardioKm.toFixed(2)} km)`,
        'cardio_500km': `(atual ${currentStats.totalCardioKm.toFixed(2)} km)`,
        
        'sets_1000': `(atual ${currentStats.totalSets} séries)`,
        'sets_5000': `(atual ${currentStats.totalSets} séries)`,
        
        'reps_10000': `(atual ${currentStats.totalReps} reps)`,
        'reps_50000': `(atual ${currentStats.totalReps} reps)`,
      };

      return progressMap[achievement.id] || null;
    } catch (error) {
      return null;
    }
  };

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Conquistas</h1>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} de {totalCount} desbloqueadas
              </p>
            </div>
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
                        {!unlocked && getProgressText(achievement) && (
                          <span className="text-iron-orange font-medium ml-1">
                            {getProgressText(achievement)}
                          </span>
                        )}
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
