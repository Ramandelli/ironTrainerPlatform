import { Achievement, AchievementCheckData, UnlockedAchievement } from '../types/achievement';
import { WorkoutSession } from '../types/workout';
import { storage } from './storage';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_workout',
    title: 'Primeiro Treino',
    description: 'Complete seu primeiro treino',
    icon: '🥇',
    condition: (stats) => stats.totalWorkouts >= 1,
  },
  {
    id: 'workout_5',
    title: 'Iniciante',
    description: 'Complete 5 treinos',
    icon: '💪',
    condition: (stats) => stats.totalWorkouts >= 5,
  },
  {
    id: 'workout_10',
    title: 'Dedicado',
    description: 'Complete 10 treinos',
    icon: '🔥',
    condition: (stats) => stats.totalWorkouts >= 10,
  },
  {
    id: 'workout_25',
    title: 'Persistente',
    description: 'Complete 25 treinos',
    icon: '⭐',
    condition: (stats) => stats.totalWorkouts >= 25,
  },
  {
    id: 'workout_50',
    title: 'Atleta',
    description: 'Complete 50 treinos',
    icon: '🏆',
    condition: (stats) => stats.totalWorkouts >= 50,
  },
  {
    id: 'workout_100',
    title: 'Lendário',
    description: 'Complete 100 treinos',
    icon: '👑',
    condition: (stats) => stats.totalWorkouts >= 100,
  },
  {
    id: 'volume_1000',
    title: 'Força Inicial',
    description: 'Levante 1.000 kg no total',
    icon: '🏋️',
    condition: (stats) => stats.totalVolume >= 1000,
  },
  {
    id: 'volume_5000',
    title: 'Poder Superior',
    description: 'Levante 5.000 kg no total',
    icon: '💥',
    condition: (stats) => stats.totalVolume >= 5000,
  },
  {
    id: 'volume_10000',
    title: 'Força Titânica',
    description: 'Levante 10.000 kg no total',
    icon: '⚡',
    condition: (stats) => stats.totalVolume >= 10000,
  },
  {
    id: 'volume_25000',
    title: 'Mestre do Ferro',
    description: 'Levante 25.000 kg no total',
    icon: '🔱',
    condition: (stats) => stats.totalVolume >= 25000,
  },
  {
    id: 'time_5h',
    title: 'Tempo de Treino',
    description: 'Acumule 5 horas de treino',
    icon: '⏱️',
    condition: (stats) => stats.totalTimeSeconds >= 5 * 3600,
  },
  {
    id: 'time_10h',
    title: 'Maratonista',
    description: 'Acumule 10 horas de treino',
    icon: '🎯',
    condition: (stats) => stats.totalTimeSeconds >= 10 * 3600,
  },
  {
    id: 'time_25h',
    title: 'Guerreiro',
    description: 'Acumule 25 horas de treino',
    icon: '⚔️',
    condition: (stats) => stats.totalTimeSeconds >= 25 * 3600,
  },
  {
    id: 'consecutive_3',
    title: 'Sequência Inicial',
    description: 'Treine 3 dias consecutivos',
    icon: '🔄',
    condition: (stats) => stats.consecutiveDays >= 3,
  },
  {
    id: 'consecutive_5',
    title: 'Rotina Estabelecida',
    description: 'Treine 5 dias consecutivos',
    icon: '📅',
    condition: (stats) => stats.consecutiveDays >= 5,
  },
  {
    id: 'consecutive_7',
    title: 'Semana Completa',
    description: 'Treine 7 dias consecutivos',
    icon: '🌟',
    condition: (stats) => stats.consecutiveDays >= 7,
  },
];

class AchievementManager {
  private STORAGE_KEY = 'unlocked_achievements';

  async getUnlockedAchievements(): Promise<UnlockedAchievement[]> {
    try {
      const data = await storage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load achievements:', error);
      return [];
    }
  }

  async unlockAchievement(achievement: Achievement): Promise<void> {
    const unlocked = await this.getUnlockedAchievements();
    
    if (unlocked.some(a => a.id === achievement.id)) {
      return;
    }

    const newAchievement: UnlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };

    unlocked.push(newAchievement);
    await storage.setItem(this.STORAGE_KEY, JSON.stringify(unlocked));
  }

  async checkAndUnlockAchievements(history: WorkoutSession[]): Promise<UnlockedAchievement[]> {
    const unlocked = await this.getUnlockedAchievements();
    const newlyUnlocked: UnlockedAchievement[] = [];

    const stats = this.calculateStats(history);

    for (const achievement of ACHIEVEMENTS) {
      const alreadyUnlocked = unlocked.some(a => a.id === achievement.id);
      
      if (!alreadyUnlocked && achievement.condition(stats)) {
        await this.unlockAchievement(achievement);
        newlyUnlocked.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    return newlyUnlocked;
  }

  private calculateStats(history: WorkoutSession[]): AchievementCheckData {
    const completedWorkouts = history.filter(s => s.completed);
    
    const totalWorkouts = completedWorkouts.length;
    
    const totalVolume = completedWorkouts.reduce((sum, session) => {
      return sum + session.totalVolume;
    }, 0);
    
    const totalTimeSeconds = completedWorkouts.reduce((sum, session) => {
      if (session.endTime && session.startTime) {
        return sum + Math.round((session.endTime - session.startTime) / 1000);
      }
      return sum;
    }, 0);
    
    const consecutiveDays = this.calculateConsecutiveDays(completedWorkouts);

    return {
      totalWorkouts,
      totalVolume,
      totalTimeSeconds,
      consecutiveDays,
      history: completedWorkouts,
    };
  }

  private calculateConsecutiveDays(workouts: WorkoutSession[]): number {
    if (workouts.length === 0) return 0;

    const dates = workouts
      .map(w => w.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = Array.from(new Set(dates));
    
    let maxStreak = 0;
    let currentStreak = 1;

    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const nextDate = new Date(uniqueDates[i + 1]);
      
      const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return Math.max(maxStreak, currentStreak);
  }

  async resetAchievements(): Promise<void> {
    await storage.removeItem(this.STORAGE_KEY);
  }
}

export const achievementManager = new AchievementManager();
