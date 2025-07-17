import { Preferences } from '@capacitor/preferences';
import { WorkoutSession, WorkoutStats, TimerState } from '../types/workout';

class StorageManager {
  private readonly CURRENT_SESSION_KEY = 'current_workout_session';
  private readonly WORKOUT_HISTORY_KEY = 'workout_history';
  private readonly WORKOUT_STATS_KEY = 'workout_stats';
  private readonly TIMER_STATE_KEY = 'timer_state';

  // Save current workout session (called frequently during workout)
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

  // Load current workout session (called when app starts)
  async loadCurrentSession(): Promise<WorkoutSession | null> {
    try {
      const { value } = await Preferences.get({ key: this.CURRENT_SESSION_KEY });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to load current session:', error);
      return null;
    }
  }

  // Clear current session (called when workout is completed)
  async clearCurrentSession(): Promise<void> {
    try {
      await Preferences.remove({ key: this.CURRENT_SESSION_KEY });
    } catch (error) {
      console.error('Failed to clear current session:', error);
    }
  }

  // Save timer state (called when timer is active)
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

  // Load timer state
  async loadTimerState(): Promise<TimerState | null> {
    try {
      const { value } = await Preferences.get({ key: this.TIMER_STATE_KEY });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to load timer state:', error);
      return null;
    }
  }

  // Clear timer state
  async clearTimerState(): Promise<void> {
    try {
      await Preferences.remove({ key: this.TIMER_STATE_KEY });
    } catch (error) {
      console.error('Failed to clear timer state:', error);
    }
  }

  // Save completed workout to history
  async saveToHistory(session: WorkoutSession): Promise<void> {
    try {
      const history = await this.loadWorkoutHistory();
      history.push(session);
      
      // Keep only last 100 workouts to avoid storage bloat
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

  // Load workout history
  async loadWorkoutHistory(): Promise<WorkoutSession[]> {
    try {
      const { value } = await Preferences.get({ key: this.WORKOUT_HISTORY_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Failed to load workout history:', error);
      return [];
    }
  }

  // Update workout stats
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

  // Load workout stats
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

  // Emergency backup - save everything to a single key
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
}

export const storage = new StorageManager();
