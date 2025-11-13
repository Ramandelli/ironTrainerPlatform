import { WorkoutDay } from '../types/workout';
import { storage } from './storage';

class CustomWorkoutManager {
  private readonly CUSTOM_WORKOUTS_KEY = 'custom_workouts';

  
  async loadCustomWorkouts(): Promise<WorkoutDay[]> {
    try {
      const workouts = await storage.getItem(this.CUSTOM_WORKOUTS_KEY);
      return workouts ? JSON.parse(workouts) : [];
    } catch (error) {
      console.error('Failed to load custom workouts:', error);
      return [];
    }
  }

  
  
  async saveCustomWorkouts(workouts: WorkoutDay[]): Promise<void> {
    try {
      await storage.setItem(this.CUSTOM_WORKOUTS_KEY, JSON.stringify(workouts));
      // Notify UI that workouts have been updated so dependent screens can refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('custom_workouts_updated'));
      }
    } catch (error) {
      console.error('Failed to save custom workouts:', error);
      throw error;
    }
  }

  
  async saveWorkout(workout: WorkoutDay): Promise<void> {
    try {
      const workouts = await this.loadCustomWorkouts();
      const existingIndex = workouts.findIndex(w => w.id === workout.id);

      if (existingIndex >= 0) {
        workouts[existingIndex] = workout;
      } else {
        const newWorkout = {
          ...workout,
          id: workout.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        workouts.push(newWorkout);
      }

      await this.saveCustomWorkouts(workouts);
    } catch (error) {
      console.error('Failed to save workout:', error);
      throw error;
    }
  }

  
  async deleteWorkout(workoutId: string): Promise<void> {
    try {
      const workouts = await this.loadCustomWorkouts();
      
      if (this.isCustomWorkout(workoutId)) {
        const filteredWorkouts = workouts.filter(w => w.id !== workoutId);
        await this.saveCustomWorkouts(filteredWorkouts);
      } else {
        const deletedMarker: WorkoutDay = {
          id: `custom_deleted_${workoutId}_${Date.now()}`,
          name: `DELETED_${workoutId}`,
          day: 'DELETED',
          exercises: [],
          _isDeleted: true,
          _originalId: workoutId
        } as any; // Using 'as any' for the _isDeleted property
        
        workouts.push(deletedMarker);
        await this.saveCustomWorkouts(workouts);
      }
    } catch (error) {
      console.error('Failed to delete workout:', error);
      throw error;
    }
  }

  
  async duplicateWorkout(sourceWorkout: WorkoutDay, newName?: string): Promise<WorkoutDay> {
    try {
      const duplicatedWorkout: WorkoutDay = {
        ...JSON.parse(JSON.stringify(sourceWorkout)), 
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newName || `${sourceWorkout.name} (Cópia)`,
        exercises: sourceWorkout.exercises.map(ex => ({
          ...ex,
          id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
          currentSet: 0,
          setData: []
        })),
        abdominal: sourceWorkout.abdominal?.map(ex => ({
          ...ex,
          id: `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
          currentSet: 0,
          setData: []
        })),
        aerobic: sourceWorkout.aerobic ? {
          ...sourceWorkout.aerobic,
          completed: false
        } : undefined
      };

      await this.saveWorkout(duplicatedWorkout);
      return duplicatedWorkout;
    } catch (error) {
      console.error('Failed to duplicate workout:', error);
      throw error;
    }
  }

 
  async getAllWorkouts(defaultWorkouts: WorkoutDay[]): Promise<WorkoutDay[]> {
    try {
      const customWorkouts = await this.loadCustomWorkouts();
      const customWorkoutIds = new Set();
      const deletedDefaultIds = new Set();
      const allWorkouts: WorkoutDay[] = [];
      const overriddenDefaultIds = new Set();

      
      customWorkouts.forEach(workout => {
        if ((workout as any)._isDeleted) {
          deletedDefaultIds.add((workout as any)._originalId);
          return;
        }
        
        allWorkouts.push(workout);
        
      
        const baseId = this.getBaseWorkoutId(workout.id);
        if (baseId) {
          overriddenDefaultIds.add(baseId);
        }
        
        customWorkoutIds.add(workout.id);
      });

      
      defaultWorkouts.forEach(workout => {
        if (!customWorkoutIds.has(workout.id) && 
            !deletedDefaultIds.has(workout.id) &&
            !overriddenDefaultIds.has(workout.id)) {
          allWorkouts.push(workout);
        }
      });

      return allWorkouts;
    } catch (error) {
      console.error('Failed to get all workouts:', error);
      return defaultWorkouts;
    }
  }

  
  isCustomWorkout(workoutId: string): boolean {
    return workoutId.startsWith('custom_');
  }

  
  getBaseWorkoutId(workoutId: string): string | null {
    if (!workoutId.startsWith('custom_')) return null;
    const parts = workoutId.split('_');
    if (parts.length >= 3) {
      return parts[1]; 
    }
    return null;
  }

  
  async convertToCustomWorkout(sourceWorkout: WorkoutDay): Promise<WorkoutDay> {
    try {
      const customWorkout: WorkoutDay = {
        ...JSON.parse(JSON.stringify(sourceWorkout)), 
        id: `custom_${sourceWorkout.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exercises: sourceWorkout.exercises.map(ex => ({
          ...ex,
          id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
          currentSet: 0,
          setData: []
        })),
        abdominal: sourceWorkout.abdominal?.map(ex => ({
          ...ex,
          id: `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
          currentSet: 0,
          setData: []
        })),
        aerobic: sourceWorkout.aerobic ? {
          ...sourceWorkout.aerobic,
          completed: false
        } : undefined
      };

      await this.saveWorkout(customWorkout);
      return customWorkout;
    } catch (error) {
      console.error('Failed to convert to custom workout:', error);
      throw error;
    }
  }

  
  async exportWorkouts(): Promise<string> {
    try {
      const customWorkouts = await this.loadCustomWorkouts();
      return JSON.stringify(customWorkouts, null, 2);
    } catch (error) {
      console.error('Failed to export workouts:', error);
      throw error;
    }
  }
  

  
  async importWorkouts(jsonData: string): Promise<void> {
    try {
      const importedWorkouts: WorkoutDay[] = JSON.parse(jsonData);
      
      
      if (!Array.isArray(importedWorkouts)) {
        throw new Error('Invalid workout data format');
      }

     
      const workoutsWithNewIds = importedWorkouts.map(workout => ({
        ...workout,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exercises: workout.exercises.map(ex => ({
          ...ex,
          id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
          currentSet: 0,
          setData: []
        })),
        abdominal: workout.abdominal?.map(ex => ({
          ...ex,
          id: `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
          currentSet: 0,
          setData: []
        }))
      }));

      const existingWorkouts = await this.loadCustomWorkouts();
      const allWorkouts = [...existingWorkouts, ...workoutsWithNewIds];
      
      await this.saveCustomWorkouts(allWorkouts);
    } catch (error) {
      console.error('Failed to import workouts:', error);
      throw error;
    }
  }
}

export const customWorkoutManager = new CustomWorkoutManager();

getWorkoutByDay: (dayName: string, workouts: WorkoutDay[]) => {
    return workouts.find(workout => 
      workout.day.toLowerCase() === dayName.toLowerCase() && 
      customWorkoutManager.isCustomWorkout(workout.id)
    );
  }

