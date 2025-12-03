export interface Exercise {
  id: string;
  name: string;
  sets: number;
  targetReps?: string;
  suggestedWeight?: number;
  restTime?: number;
  notes?: string;
  completed: boolean;
  currentSet: number;
  setData: SetData[];
  // Propriedades específicas para abdominais por tempo
  isTimeBased?: boolean;
  timePerSet?: number; 
  isBilateral?: boolean; 
  // Propriedades para dropset
  hasDropset?: boolean; 
}

export interface SetData {
  weight?: number;
  reps?: number;
  completed: boolean;
  restStartTime?: number;
  timeCompleted?: number; 
  leftSideCompleted?: boolean; 
  rightSideCompleted?: boolean; 
  dropsetData?: DropsetData[];
}

export interface DropsetData {
  weight: number;
  reps: number;
}

export interface WorkoutDay {
  id: string;
  name: string;
  day: string;
  exercises: Exercise[];
  aerobic?: AerobicExercise;
  abdominal?: Exercise[];
  warmup?: string;
  _isDeleted?: boolean;
  _originalId?: string;
}

export interface AerobicExercise {
  type: 'esteira' | 'bicicleta' | 'transport' | 'rowing';
  duration: number;
  actualDuration?: number;
  distance?: number; 
  intensity: 'leve' | 'moderada' | 'intensa';
  timing: 'antes' | 'depois';
  completed: boolean;
  skipped?: boolean;
}

export interface WorkoutSession {
  id: string;
  workoutDayId: string;
  date: string;
  startTime: number;
  endTime?: number;
  exercises: Exercise[];
  aerobic?: AerobicExercise;
  abdominal?: Exercise[];
  totalVolume: number;
  notes?: string;
  completed: boolean;
  warmupCompleted?: boolean;
  abdominalCompleted?: boolean;
}

export interface WorkoutStats {
  totalWorkouts: number;
  averageTime: number;
  weeklyVolume: number;
  personalRecords: Record<string, { weight: number; reps: number; date: string }>;
}

export interface TimerState {
  isActive: boolean;
  timeLeft: number;
  type: 'rest-between-sets' | 'rest-between-exercises';
  exerciseId?: string;
  setIndex?: number;
}