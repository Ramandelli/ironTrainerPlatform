import { WorkoutSession, Exercise } from '../types/workout';

export interface ExerciseSuggestion {
  weight: number;
  reps: number;
  lastPerformed?: string;
}

export class ExerciseSuggestionManager {
  /**
   * Get suggestion for an exercise based on workout history
   */
  getSuggestion(exerciseName: string, history: WorkoutSession[]): ExerciseSuggestion | null {
    const exerciseHistory = this.getExerciseHistory(exerciseName, history);
    
    if (exerciseHistory.length === 0) {
      return null;
    }

    const recentExercises = exerciseHistory.slice(0, 3);
    
    const totalWeight = recentExercises.reduce((sum, ex) => sum + ex.avgWeight, 0);
    const totalReps = recentExercises.reduce((sum, ex) => sum + ex.avgReps, 0);
    
    const avgWeight = Math.round(totalWeight / recentExercises.length);
    const avgReps = Math.round(totalReps / recentExercises.length);

    return {
      weight: avgWeight,
      reps: avgReps,
      lastPerformed: exerciseHistory[0].date,
    };
  }

  /**
   * Get all exercise performances from history
   */
  private getExerciseHistory(
    exerciseName: string,
    history: WorkoutSession[]
  ): Array<{ date: string; avgWeight: number; avgReps: number }> {
    const performances: Array<{ date: string; avgWeight: number; avgReps: number }> = [];

    for (const session of history) {
      if (!session.completed) continue;

      for (const exercise of session.exercises) {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          const completedSets = exercise.setData.filter(set => set.completed && set.weight && set.reps);
          
          if (completedSets.length > 0) {
            const avgWeight = completedSets.reduce((sum, set) => sum + (set.weight || 0), 0) / completedSets.length;
            const avgReps = completedSets.reduce((sum, set) => sum + (set.reps || 0), 0) / completedSets.length;
            
            performances.push({
              date: session.date,
              avgWeight: Math.round(avgWeight),
              avgReps: Math.round(avgReps),
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
