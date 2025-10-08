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
  {
    id: 'consecutive_14',
    title: 'Duas Semanas Seguidas',
    description: 'Treine 14 dias consecutivos',
    icon: '🔥',
    condition: (stats) => stats.consecutiveDays >= 14,
  },
  {
    id: 'consecutive_30',
    title: 'Mês Perfeito',
    description: 'Treine 30 dias consecutivos',
    icon: '👑',
    condition: (stats) => stats.consecutiveDays >= 30,
  },
  {
    id: 'volume_50000',
    title: 'Hercules',
    description: 'Levante 50.000 kg no total',
    icon: '💎',
    condition: (stats) => stats.totalVolume >= 50000,
  },
  {
    id: 'volume_100000',
    title: 'Força Lendária',
    description: 'Levante 100.000 kg no total',
    icon: '🦾',
    condition: (stats) => stats.totalVolume >= 100000,
  },
  {
    id: 'time_50h',
    title: 'Dedicação Total',
    description: 'Acumule 50 horas de treino',
    icon: '🎖️',
    condition: (stats) => stats.totalTimeSeconds >= 50 * 3600,
  },
  {
    id: 'time_100h',
    title: 'Veterano',
    description: 'Acumule 100 horas de treino',
    icon: '🏅',
    condition: (stats) => stats.totalTimeSeconds >= 100 * 3600,
  },
  {
    id: 'workout_250',
    title: 'Mestre',
    description: 'Complete 250 treinos',
    icon: '🌠',
    condition: (stats) => stats.totalWorkouts >= 250,
  },
  {
    id: 'workout_500',
    title: 'Imortal',
    description: 'Complete 500 treinos',
    icon: '⚜️',
    condition: (stats) => stats.totalWorkouts >= 500,
  },
  {
    id: 'abdominal_100_sets',
    title: 'Abdômen de Aço',
    description: 'Complete 100 séries de abdominais',
    icon: '💪',
    condition: (stats) => {
      const abdominalSets = stats.history.reduce((sum, session) => {
        if (!session.abdominal) return sum;
        return sum + session.abdominal.reduce((exerciseSum, ex) => {
          return exerciseSum + (ex.completedSets || 0);
        }, 0);
      }, 0);
      return abdominalSets >= 100;
    },
  },
  {
    id: 'abdominal_500_sets',
    title: 'Núcleo Destruído',
    description: 'Complete 500 séries de abdominais',
    icon: '🔱',
    condition: (stats) => {
      const abdominalSets = stats.history.reduce((sum, session) => {
        if (!session.abdominal) return sum;
        return sum + session.abdominal.reduce((exerciseSum, ex) => {
          return exerciseSum + (ex.completedSets || 0);
        }, 0);
      }, 0);
      return abdominalSets >= 500;
    },
  },
  {
    id: 'cardio_10h',
    title: 'Cardio Iniciante',
    description: 'Complete 10 horas de cardio',
    icon: '🏃',
    condition: (stats) => {
      const cardioTime = stats.history.reduce((sum, session) => {
        if (!session.aerobic?.completed || !session.aerobic.actualMinutes) return sum;
        return sum + (session.aerobic.actualMinutes * 60);
      }, 0);
      return cardioTime >= 10 * 3600;
    },
  },
  {
    id: 'cardio_50h',
    title: 'Corredor de Elite',
    description: 'Complete 50 horas de cardio',
    icon: '🏃‍♂️',
    condition: (stats) => {
      const cardioTime = stats.history.reduce((sum, session) => {
        if (!session.aerobic?.completed || !session.aerobic.actualMinutes) return sum;
        return sum + (session.aerobic.actualMinutes * 60);
      }, 0);
      return cardioTime >= 50 * 3600;
    },
  },
  {
    id: 'cardio_100km',
    title: 'Maratonista',
    description: 'Complete 100 km de cardio',
    icon: '🎽',
    condition: (stats) => {
      const totalDistance = stats.history.reduce((sum, session) => {
        if (!session.aerobic?.completed || !session.aerobic.distance) return sum;
        return sum + session.aerobic.distance;
      }, 0);
      return totalDistance >= 100;
    },
  },
  {
    id: 'cardio_500km',
    title: 'Ultramaratonista',
    description: 'Complete 500 km de cardio',
    icon: '🦅',
    condition: (stats) => {
      const totalDistance = stats.history.reduce((sum, session) => {
        if (!session.aerobic?.completed || !session.aerobic.distance) return sum;
        return sum + session.aerobic.distance;
      }, 0);
      return totalDistance >= 500;
    },
  },
  {
    id: 'sets_1000',
    title: 'Máquina de Séries',
    description: 'Complete 1.000 séries no total',
    icon: '🎯',
    condition: (stats) => {
      const totalSets = stats.history.reduce((sum, session) => {
        return sum + session.exercises.reduce((exerciseSum, ex) => {
          return exerciseSum + (ex.completedSets || 0);
        }, 0);
      }, 0);
      return totalSets >= 1000;
    },
  },
  {
    id: 'sets_5000',
    title: 'Senhor das Séries',
    description: 'Complete 5.000 séries no total',
    icon: '💯',
    condition: (stats) => {
      const totalSets = stats.history.reduce((sum, session) => {
        return sum + session.exercises.reduce((exerciseSum, ex) => {
          return exerciseSum + (ex.completedSets || 0);
        }, 0);
      }, 0);
      return totalSets >= 5000;
    },
  },
  {
    id: 'reps_10000',
    title: 'Contador de Reps',
    description: 'Complete 10.000 repetições no total',
    icon: '🔢',
    condition: (stats) => {
      const totalReps = stats.history.reduce((sum, session) => {
        return sum + session.exercises.reduce((exerciseSum, ex) => {
          return exerciseSum + ex.setsData.reduce((setSum, set) => {
            return setSum + (set.actualReps || 0);
          }, 0);
        }, 0);
      }, 0);
      return totalReps >= 10000;
    },
  },
  {
    id: 'reps_50000',
    title: 'Mestre das Repetições',
    description: 'Complete 50.000 repetições no total',
    icon: '♾️',
    condition: (stats) => {
      const totalReps = stats.history.reduce((sum, session) => {
        return sum + session.exercises.reduce((exerciseSum, ex) => {
          return exerciseSum + ex.setsData.reduce((setSum, set) => {
            return setSum + (set.actualReps || 0);
          }, 0);
        }, 0);
      }, 0);
      return totalReps >= 50000;
    },
  },
  {
    id: 'perfect_workout',
    title: 'Treino Perfeito',
    description: 'Complete um treino com todos os exercícios sem pular nenhum',
    icon: '✨',
    condition: (stats) => {
      return stats.history.some(session => {
        if (!session.completed) return false;
        const allExercisesCompleted = session.exercises.every(ex => ex.completed);
        const aerobicCompleted = !session.aerobic || session.aerobic.completed;
        const abdominalCompleted = !session.abdominal || session.abdominal.every(ex => ex.completed);
        return allExercisesCompleted && aerobicCompleted && abdominalCompleted;
      });
    },
  },
  {
    id: 'early_bird',
    title: 'Madrugador',
    description: 'Complete um treino antes das 7h da manhã',
    icon: '🌅',
    condition: (stats) => {
      return stats.history.some(session => {
        if (!session.completed || !session.startTime) return false;
        const startHour = new Date(session.startTime).getHours();
        return startHour < 7;
      });
    },
  },
  {
    id: 'night_warrior',
    title: 'Guerreiro Noturno',
    description: 'Complete um treino depois das 22h',
    icon: '🌙',
    condition: (stats) => {
      return stats.history.some(session => {
        if (!session.completed || !session.startTime) return false;
        const startHour = new Date(session.startTime).getHours();
        return startHour >= 22;
      });
    },
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
