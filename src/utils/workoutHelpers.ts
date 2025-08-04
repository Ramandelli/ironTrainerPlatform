import { WorkoutSession, Exercise, WorkoutStats, SetData } from '../types/workout';
import { format } from 'date-fns';

export const createWorkoutSession = (workoutDayId: string, exercises: Exercise[]): WorkoutSession => ({
  id: `session_${Date.now()}`,
  workoutDayId,
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: Date.now(),
  exercises: exercises.map(exercise => ({
    ...exercise,
    setData: Array(exercise.sets).fill(null).map(() => ({
      weight: 0,
      reps: 0,
      completed: false
    }))
  })),
  totalVolume: 0,
  completed: false
});

export const calculateTotalVolume = (exercises: Exercise[]): number => {
  return exercises.reduce((total, exercise) => {
    return total + exercise.setData.reduce((exerciseTotal, set) => {
      return exerciseTotal + (set.completed ? set.weight * set.reps : 0);
    }, 0);
  }, 0);
};

export const calculateWorkoutTime = (startTime: number, endTime?: number): number => {
  const end = endTime || Date.now(); // Se não há endTime, usar tempo atual
  return Math.round((end - startTime) / 60000); // Converter para minutos
};

export const getTodayWorkoutId = (): string => {
  const dayOfWeek = new Date().getDay();
  const dayMap = {
    1: 'monday',    // Segunda
    2: 'tuesday',   // Terça
    3: 'wednesday', // Quarta
    4: 'thursday',  // Quinta
    5: 'friday',    // Sexta
    6: 'saturday',  // Sábado (rest day)
    0: 'sunday'     // Domingo (rest day)
  };
  return dayMap[dayOfWeek as keyof typeof dayMap] || 'rest';
};

export const updateExerciseSet = (
  exercises: Exercise[], 
  exerciseId: string, 
  setIndex: number, 
  setData: Partial<SetData>
): Exercise[] => {
  return exercises.map(exercise => {
    if (exercise.id === exerciseId) {
      const updatedSetData = [...exercise.setData];
      updatedSetData[setIndex] = { ...updatedSetData[setIndex], ...setData };
      
      return {
        ...exercise,
        setData: updatedSetData,
        currentSet: setData.completed ? Math.min(setIndex + 1, exercise.sets) : exercise.currentSet
      };
    }
    return exercise;
  });
};

export const completeExercise = (exercises: Exercise[], exerciseId: string): Exercise[] => {
  return exercises.map(exercise => {
    if (exercise.id === exerciseId) {
      return {
        ...exercise,
        completed: true,
        currentSet: exercise.sets
      };
    }
    return exercise;
  });
};

export const getNextExercise = (exercises: Exercise[]): Exercise | null => {
  return exercises.find(exercise => !exercise.completed) || null;
};

export const calculatePersonalRecords = (history: WorkoutSession[]): Record<string, { weight: number; reps: number; date: string }> => {
  const records: Record<string, { weight: number; reps: number; date: string }> = {};
  
  history.forEach(session => {
    session.exercises.forEach(exercise => {
      exercise.setData.forEach(set => {
        if (set.completed) {
          // Usar o nome do exercício em vez do ID
          const key = exercise.name;
          
          if (!records[key] || 
              set.weight > records[key].weight || 
              (set.weight === records[key].weight && set.reps > records[key].reps)) {
            records[key] = {
              weight: set.weight,
              reps: set.reps,
              date: session.date
            };
          }
        }
      });
    });
  });
  
  return records;
};


export const calculateWeeklyStats = (history: WorkoutSession[]): { averageTime: number; weeklyVolume: number } => {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  // Filtrar sessões da última semana
  const thisWeek = history.filter(session => {
    const [day, month, year] = session.date.split('/');
    const sessionDate = new Date(`${year}-${month}-${day}`).getTime();
    return sessionDate > oneWeekAgo;
  });

  if (thisWeek.length === 0) {
    return { averageTime: 0, weeklyVolume: 0 };
  }
  
  const totalTime = thisWeek.reduce((sum, session) => {
    return sum + calculateWorkoutTime(session.startTime, session.endTime);
  }, 0);
  
  const totalVolume = thisWeek.reduce((sum, session) => sum + session.totalVolume, 0);
  
  return {
    averageTime: Math.round(totalTime / thisWeek.length),
    weeklyVolume: totalVolume
  };
};

export const isWorkoutCompletedToday = (history: WorkoutSession[], workoutDayId: string): boolean => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const todayStr = `${day}/${month}/${year}`;
  
  return history.some(session => 
    session.date === todayStr && 
    session.workoutDayId === workoutDayId && 
    session.completed
  );
};