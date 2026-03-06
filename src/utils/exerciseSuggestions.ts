import { WorkoutSession, Exercise } from '../types/workout';

export interface ExerciseSuggestion {
  weight: number;
  reps: number;
  lastPerformed?: string;
  action: 'increase' | 'maintain' | 'decrease';
  message: string;
}

interface SessionPerformance {
  date: string;
  avgWeight: number;
  avgReps: number;
  targetReps: number;
}

export class ExerciseSuggestionManager {
  /**
   * Get smart suggestion based on performance progression
   */
  getSuggestion(exerciseName: string, history: WorkoutSession[]): ExerciseSuggestion | null {
    const exerciseHistory = this.getExerciseHistory(exerciseName, history);
    
    if (exerciseHistory.length === 0) {
      return null;
    }

    const latest = exerciseHistory[0];
    const targetReps = latest.targetReps || 10;
    const avgRepsAchieved = latest.avgReps;
    const lastWeight = latest.avgWeight;

    // Calculate rep deficit
    const repDifference = avgRepsAchieved - targetReps;

    let action: 'increase' | 'maintain' | 'decrease';
    let suggestedWeight: number;
    let suggestedReps: number;
    let message: string;

    if (repDifference >= 0) {
      // Hit or exceeded all target reps → increase weight
      action = 'increase';
      const increment = lastWeight >= 40 ? 2.5 : lastWeight >= 20 ? 2 : 1;
      suggestedWeight = Math.round((lastWeight + increment) * 2) / 2;
      suggestedReps = targetReps;
      message = `✅ Você atingiu a meta! Aumente para ${suggestedWeight}kg`;
    } else if (repDifference >= -2) {
      // Missed by 1-2 reps → maintain weight
      action = 'maintain';
      suggestedWeight = lastWeight;
      suggestedReps = targetReps;
      message = `💪 Quase lá! Mantenha ${lastWeight}kg e tente completar todas as reps`;
    } else {
      // Missed by 3+ reps → decrease weight
      action = 'decrease';
      const decrement = lastWeight >= 40 ? 2.5 : lastWeight >= 20 ? 2 : 1;
      suggestedWeight = Math.max(0, Math.round((lastWeight - decrement) * 2) / 2);
      suggestedReps = targetReps;
      message = `⚠️ Carga alta demais. Reduza para ${suggestedWeight}kg`;
    }

    return {
      weight: suggestedWeight,
      reps: suggestedReps,
      lastPerformed: latest.date,
      action,
      message,
    };
  }

  /**
   * Get all exercise performances from history
   */
  private getExerciseHistory(
    exerciseName: string,
    history: WorkoutSession[]
  ): SessionPerformance[] {
    const performances: SessionPerformance[] = [];

    for (const session of history) {
      if (!session.completed) continue;

      for (const exercise of session.exercises) {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          const completedSets = exercise.setData.filter(set => set.completed && set.reps);
          
          if (completedSets.length > 0) {
            const avgWeight = completedSets.reduce((sum, set) => sum + (set.weight || 0), 0) / completedSets.length;
            const avgReps = completedSets.reduce((sum, set) => sum + (set.reps || 0), 0) / completedSets.length;
            
            // Parse targetReps (e.g. "8-10" → 10, "12" → 12)
            let targetReps = 10;
            if (exercise.targetReps) {
              const parts = exercise.targetReps.split('-');
              targetReps = parseInt(parts[parts.length - 1]) || 10;
            }

            performances.push({
              date: session.date,
              avgWeight: Math.round(avgWeight),
              avgReps: Math.round(avgReps),
              targetReps,
            });
          }
        }
      }
    }

    return performances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get last weight used for an exercise
   */
  getLastWeight(exerciseName: string, history: WorkoutSession[]): number | null {
    const suggestion = this.getSuggestion(exerciseName, history);
    return suggestion ? suggestion.weight : null;
  }

  /**
   * Get last reps performed for an exercise
   */
  getLastReps(exerciseName: string, history: WorkoutSession[]): number | null {
    const suggestion = this.getSuggestion(exerciseName, history);
    return suggestion ? suggestion.reps : null;
  }
}

export const exerciseSuggestionManager = new ExerciseSuggestionManager();
