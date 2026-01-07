import { Preferences } from '@capacitor/preferences';
import { WorkoutSession, WorkoutStats, TimerState } from '../types/workout';

class StorageManager {
  private readonly CURRENT_SESSION_KEY = 'current_workout_session';
  private readonly WORKOUT_HISTORY_KEY = 'workout_history';
  private readonly WORKOUT_STATS_KEY = 'workout_stats';
  private readonly TIMER_STATE_KEY = 'timer_state';
  private readonly MODIFIED_EXERCISES_KEY = 'modified_exercises';

  
  async saveCurrentSession(session: WorkoutSession): Promise<void> {
    try {
      await Preferences.set({
        key: this.CURRENT_SESSION_KEY,
        value: JSON.stringify(session)
      });
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  }

  
  async loadCurrentSession(): Promise<WorkoutSession | null> {
    try {
      const { value } = await Preferences.get({ key: this.CURRENT_SESSION_KEY });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to load current session:', error);
      return null;
    }
  }

  
  async clearCurrentSession(): Promise<void> {
    try {
      await Preferences.remove({ key: this.CURRENT_SESSION_KEY });
    } catch (error) {
      console.error('Failed to clear current session:', error);
    }
  }

  
  async saveTimerState(timerState: TimerState): Promise<void> {
    try {
      await Preferences.set({
        key: this.TIMER_STATE_KEY,
        value: JSON.stringify(timerState)
      });
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  }

  
  async loadTimerState(): Promise<TimerState | null> {
    try {
      const { value } = await Preferences.get({ key: this.TIMER_STATE_KEY });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to load timer state:', error);
      return null;
    }
  }

  
  async clearTimerState(): Promise<void> {
    try {
      await Preferences.remove({ key: this.TIMER_STATE_KEY });
    } catch (error) {
      console.error('Failed to clear timer state:', error);
    }
  }

  
  async saveModifiedExercises(exerciseIds: string[]): Promise<void> {
    try {
      await Preferences.set({
        key: this.MODIFIED_EXERCISES_KEY,
        value: JSON.stringify(exerciseIds)
      });
    } catch (error) {
      console.error('Failed to save modified exercises:', error);
    }
  }

  
  async loadModifiedExercises(): Promise<string[]> {
    try {
      const { value } = await Preferences.get({ key: this.MODIFIED_EXERCISES_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Failed to load modified exercises:', error);
      return [];
    }
  }

  
  async clearModifiedExercises(): Promise<void> {
    try {
      await Preferences.remove({ key: this.MODIFIED_EXERCISES_KEY });
    } catch (error) {
      console.error('Failed to clear modified exercises:', error);
    }
  }

  async cleanInvalidSessions(): Promise<void> {
    try {
      const history = await this.loadWorkoutHistory();
      const validHistory = history.filter(session => 
        session.completed && session.date && session.endTime
      );
    
      await Preferences.set({
        key: this.WORKOUT_HISTORY_KEY,
        value: JSON.stringify(validHistory)
      });
    } catch (error) {
      console.error('Failed to clean invalid sessions:', error);
    }
  }

  
  async saveWorkoutToHistory(session: WorkoutSession): Promise<void> {
    return this.saveToHistory(session);
  }

  // Save completed workout to history
async saveToHistory(session: WorkoutSession): Promise<void> {
  try {
    if (!session.completed) return;

    const history = await this.loadWorkoutHistory();
    
    
    const existingIndex = history.findIndex(s => 
      s.id === session.id && s.date === session.date
    );
    
    if (existingIndex >= 0) {
      history[existingIndex] = session;
    } else {
      history.push(session);
    }
    
    
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    await Preferences.set({
      key: this.WORKOUT_HISTORY_KEY,
      value: JSON.stringify(history)
    });
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

  
  async loadWorkoutHistory(): Promise<WorkoutSession[]> {
    try {
      const { value } = await Preferences.get({ key: this.WORKOUT_HISTORY_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Failed to load workout history:', error);
      return [];
    }
  }

  
  async updateStats(stats: WorkoutStats): Promise<void> {
    try {
      await Preferences.set({
        key: this.WORKOUT_STATS_KEY,
        value: JSON.stringify(stats)
      });
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  
  async loadStats(): Promise<WorkoutStats> {
    try {
      const { value } = await Preferences.get({ key: this.WORKOUT_STATS_KEY });
      return value ? JSON.parse(value) : {
        totalWorkouts: 0,
        averageTime: 0,
        weeklyVolume: 0,
        personalRecords: {}
      };
    } catch (error) {
      console.error('Failed to load stats:', error);
      return {
        totalWorkouts: 0,
        averageTime: 0,
        weeklyVolume: 0,
        personalRecords: {}
      };
    }
  }

  
  async createBackup(): Promise<void> {
    try {
      const currentSession = await this.loadCurrentSession();
      const history = await this.loadWorkoutHistory();
      const stats = await this.loadStats();
      const timerState = await this.loadTimerState();

      const backup = {
        currentSession,
        history,
        stats,
        timerState,
        timestamp: Date.now()
      };

      await Preferences.set({
        key: 'iron_tracker_backup',
        value: JSON.stringify(backup)
      });
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  
  async resetAllData(): Promise<void> {
    try {
      const { restDayManager } = await import('./restDays');
      const { missedWorkoutManager } = await import('./missedWorkouts');

      // Ao resetar estatísticas, também “reinicia” a data base do app.
      // Caso contrário, o cálculo de treinos não realizados pode recontar desde a primeira instalação.
      const today = new Date().toISOString().split('T')[0];

      await Promise.all([
        this.clearCurrentSession(),
        this.clearTimerState(),
        this.clearModifiedExercises(),
        Preferences.remove({ key: this.WORKOUT_HISTORY_KEY }),
        Preferences.remove({ key: this.WORKOUT_STATS_KEY }),
        Preferences.remove({ key: this.WORKOUT_AVERAGES_KEY }),
        restDayManager.resetRestDays(),
        missedWorkoutManager.resetMissedWorkouts(),
        Preferences.set({ key: this.INSTALL_DATE_KEY, value: today })
      ]);
    } catch (error) {
      console.error('Failed to reset all data:', error);
      throw error;
    }
  }

  
  async setItem(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  
  private readonly INSTALL_DATE_KEY = 'app_install_date';
  private readonly WORKOUT_AVERAGES_KEY = 'workout_averages';

  async getWorkoutAverages(): Promise<Record<string, number>> {
    try {
      const { value } = await Preferences.get({ key: this.WORKOUT_AVERAGES_KEY });
      return value ? JSON.parse(value) : {};
    } catch (error) {
      console.error('Error getting workout averages:', error);
      return {};
    }
  }

  async updateWorkoutAverage(workoutDayId: string, duration: number): Promise<void> {
    try {
      const averages = await this.getWorkoutAverages();
      
      if (averages[workoutDayId]) {
        averages[workoutDayId] = Math.round((averages[workoutDayId] + duration) / 2);
      } else {
        averages[workoutDayId] = duration;
      }
      
      await Preferences.set({ 
        key: this.WORKOUT_AVERAGES_KEY, 
        value: JSON.stringify(averages) 
      });
    } catch (error) {
      console.error('Error updating workout average:', error);
    }
  }

  
  async ensureInstallDate(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.INSTALL_DATE_KEY });
      if (!value) {
        const today = new Date().toISOString().split('T')[0];
        await Preferences.set({ key: this.INSTALL_DATE_KEY, value: today });
      }
    } catch (error) {
      console.error('Failed to ensure install date:', error);
    }
  }

  
  async getInstallDate(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.INSTALL_DATE_KEY });
      return value || null;
    } catch (error) {
      console.error('Failed to get install date:', error);
      return null;
    }
  }
}

export const storage = new StorageManager();
