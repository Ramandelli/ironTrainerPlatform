import { WorkoutDay } from '../types/workout';
import { storage } from './storage';

class CustomWorkoutManager {
  private readonly CUSTOM_WORKOUTS_KEY = 'custom_workouts';

  // Load custom workouts from storage
  async loadCustomWorkouts(): Promise<WorkoutDay[]> {
    try {
      const workouts = await storage.getItem(this.CUSTOM_WORKOUTS_KEY);
      return workouts ? JSON.parse(workouts) : [];
    } catch (error) {
      console.error('Failed to load custom workouts:', error);
      return [];
    }
  }

  // Save custom workouts to storage
  async saveCustomWorkouts(workouts: WorkoutDay[]): Promise<void> {
    try {
      await storage.setItem(this.CUSTOM_WORKOUTS_KEY, JSON.stringify(workouts));
    } catch (error) {
      console.error('Failed to save custom workouts:', error);
      throw error;
    }
  }

  // Add or update a custom workout
  async saveWorkout(workout: WorkoutDay): Promise<void> {
    try {
      const workouts = await this.loadCustomWorkouts();
      const existingIndex = workouts.findIndex(w => w.id === workout.id);

      if (existingIndex >= 0) {
        // Update existing workout
        workouts[existingIndex] = workout;
      } else {
        // Add new workout with generated ID if not provided
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

  // Delete a workout (custom or default)
  async deleteWorkout(workoutId: string): Promise<void> {
    try {
      const workouts = await this.loadCustomWorkouts();
      
      if (this.isCustomWorkout(workoutId)) {
        // Delete custom workout
        const filteredWorkouts = workouts.filter(w => w.id !== workoutId);
        await this.saveCustomWorkouts(filteredWorkouts);
      } else {
        // For default workouts, create a "deleted" marker
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

  // Duplicate a workout (can be custom or default)
  async duplicateWorkout(sourceWorkout: WorkoutDay, newName?: string): Promise<WorkoutDay> {
    try {
      const duplicatedWorkout: WorkoutDay = {
        ...JSON.parse(JSON.stringify(sourceWorkout)), // Deep clone
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newName || `${sourceWorkout.name} (Cópia)`,
        // Reset exercise states
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

  // Get all workouts (default + custom, prioritizing custom over default with same base id)
  async getAllWorkouts(defaultWorkouts: WorkoutDay[]): Promise<WorkoutDay[]> {
    try {
      const customWorkouts = await this.loadCustomWorkouts();
      const customWorkoutIds = new Set();
      const deletedDefaultIds = new Set();
      const allWorkouts: WorkoutDay[] = [];
      const overriddenDefaultIds = new Set();

      // Process custom workouts and track deleted defaults
      customWorkouts.forEach(workout => {
        // Skip deleted markers
        if ((workout as any)._isDeleted) {
          deletedDefaultIds.add((workout as any)._originalId);
          return;
        }
        
        allWorkouts.push(workout);
        
        // Check if this is a custom workout that overrides a default one
        // This happens when editing a default workout - it creates a custom version
        // and we need to track which default workout it replaces
        const baseId = this.getBaseWorkoutId(workout.id);
        if (baseId) {
          overriddenDefaultIds.add(baseId);
        }
        
        customWorkoutIds.add(workout.id);
      });

      // Add default workouts only if they haven't been overridden or deleted
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

  // Check if workout is custom (can be edited/deleted)
  isCustomWorkout(workoutId: string): boolean {
    return workoutId.startsWith('custom_');
  }

  // Get base workout ID from custom workout ID (e.g., "custom_monday_123" -> "monday")
  getBaseWorkoutId(workoutId: string): string | null {
    if (!workoutId.startsWith('custom_')) return null;
    const parts = workoutId.split('_');
    if (parts.length >= 3) {
      return parts[1]; // Return the base ID part
    }
    return null;
  }

  // Convert default workout to editable custom workout
  async convertToCustomWorkout(sourceWorkout: WorkoutDay): Promise<WorkoutDay> {
    try {
      const customWorkout: WorkoutDay = {
        ...JSON.parse(JSON.stringify(sourceWorkout)), // Deep clone
        id: `custom_${sourceWorkout.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // Reset exercise states but keep original structure
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

  // Export workouts to JSON
  async exportWorkouts(): Promise<string> {
    try {
      const customWorkouts = await this.loadCustomWorkouts();
      return JSON.stringify(customWorkouts, null, 2);
    } catch (error) {
      console.error('Failed to export workouts:', error);
      throw error;
    }
  }

  // Import workouts from JSON
  async importWorkouts(jsonData: string): Promise<void> {
    try {
      const importedWorkouts: WorkoutDay[] = JSON.parse(jsonData);
      
      // Validate data structure
      if (!Array.isArray(importedWorkouts)) {
        throw new Error('Invalid workout data format');
      }

      // Ensure unique IDs for imported workouts
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