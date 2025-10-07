import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession, Exercise, SetData, TimerState } from '../types/workout';
import { storage } from '../utils/storage';
import { customWorkoutManager } from '../utils/customWorkouts';
import { 
  createWorkoutSession, 
  calculateTotalVolume, 
  updateExerciseSet, 
  completeExercise,
  calculateWorkoutTime,
  calculatePersonalRecords,
  calculateWeeklyStats,
  isWorkoutCompletedToday
} from '../utils/workoutHelpers';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { useToast } from './use-toast';
import { achievementManager } from '../utils/achievements';
import { UnlockedAchievement } from '../types/achievement';

export const useWorkoutSession = () => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<UnlockedAchievement[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (currentSession) {
      saveSession();
    }
  }, [currentSession]);

  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(async () => {
      await storage.createBackup();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentSession]);
const loadSession = async () => {
    try {
      setIsLoading(true);
      const savedSession = await storage.loadCurrentSession();
      if (savedSession) {
        setCurrentSession(savedSession);
        toast({
          title: "Treino restaurado! 💪",
          description: "Seu progresso foi recuperado com sucesso.",
        });
      }

      const savedTimer = await storage.loadTimerState();
      if (savedTimer) {
        setTimerState(savedTimer);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível recuperar o treino anterior.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async () => {
    if (!currentSession) return;
    
    try {
      const updatedSession = {
        ...currentSession,
        totalVolume: calculateTotalVolume(currentSession.exercises)
      };
      await storage.saveCurrentSession(updatedSession);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const startWorkout = useCallback(async (workoutDayId: string) => {
    try {
      const history = await storage.loadWorkoutHistory();
      if (isWorkoutCompletedToday(history, workoutDayId)) {
        toast({
          title: "Treino já realizado",
          description: "Você já completou este treino hoje!",
          variant: "destructive"
        });
        return;
      }

      const allWorkouts = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);
      const workoutDay = allWorkouts.find(day => day.id === workoutDayId);
      if (!workoutDay) throw new Error('Workout day not found');

      const session = createWorkoutSession(workoutDayId, workoutDay.exercises);
      
     
      if (workoutDay.aerobic) {
        session.aerobic = {
          ...workoutDay.aerobic,
          completed: false,
          actualDuration: 0
        };
      }
      
      if (workoutDay.abdominal) {
        session.abdominal = workoutDay.abdominal.map(exercise => ({
          ...exercise,
          setData: Array(exercise.sets).fill(null).map(() => ({
            weight: 0,
            reps: 0,
            completed: false
          }))
        }));
      }
      
      setCurrentSession(session);
      
      toast({
        title: "Treino iniciado! 🔥",
        description: `${workoutDay.name} - Boa sorte!`,
      });
    } catch (error) {
      console.error('Failed to start workout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o treino.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const completeSet = useCallback(async (exerciseId: string, setIndex: number, setData: SetData) => {
    if (!currentSession) return;

    try {
      const updatedExercises = updateExerciseSet(currentSession.exercises, exerciseId, setIndex, setData);
      setCurrentSession(prev => prev ? { ...prev, exercises: updatedExercises } : null);
      
      const parts: string[] = [];
      if (typeof setData.weight === 'number') parts.push(`${setData.weight}kg`);
      if (typeof setData.reps === 'number') parts.push(`${setData.reps} reps`);
      if (typeof setData.timeCompleted === 'number') parts.push(`${setData.timeCompleted}s`);
      
      toast({
        title: "Série completada! 💯",
        description: parts.length > 0 ? parts.join(' × ') : undefined,
      });
    } catch (error) {
      console.error('Failed to complete set:', error);
    }
  }, [currentSession, toast]);

  const completeExerciseHandler = useCallback(async (exerciseId: string) => {
    if (!currentSession) return;

    try {
      const updatedExercises = completeExercise(currentSession.exercises, exerciseId);
      setCurrentSession(prev => prev ? { ...prev, exercises: updatedExercises } : null);
      
      toast({
        title: "Exercício concluído! ✅",
        description: "Parabéns! Próximo exercício disponível.",
      });
    } catch (error) {
      console.error('Failed to complete exercise:', error);
    }
  }, [currentSession, toast]);

  const startRestTimer = useCallback(async (duration: number, type: TimerState['type'], exerciseId?: string, setIndex?: number) => {
    const timer: TimerState = {
      isActive: true,
      timeLeft: duration,
      type,
      exerciseId,
      setIndex
    };
    
    setTimerState(timer);
    await storage.saveTimerState(timer);
  }, []);

  const stopTimer = useCallback(async () => {
    setTimerState(null);
    await storage.clearTimerState();
  }, []);

  const completeAerobic = useCallback(async (actualMinutes: number, distance?: number) => {
    if (!currentSession || !currentSession.aerobic) return;

    try {
      setCurrentSession(prev => {
        if (!prev || !prev.aerobic) return prev;
        
        return {
          ...prev,
          aerobic: {
            ...prev.aerobic,
            completed: true,
            actualDuration: actualMinutes,
            distance: distance
          }
        };
      });
      
      const minutes = Math.floor(actualMinutes);
      const seconds = Math.round((actualMinutes - minutes) * 60);
      
      const distanceText = distance ? ` • ${distance}km` : '';
      
      toast({
        title: "Cardio concluído! 🎯",
        description: `Tempo realizado: ${minutes}:${seconds.toString().padStart(2, '0')}${distanceText}`,
      });
    } catch (error) {
      console.error('Failed to complete aerobic:', error);
    }
  }, [currentSession, toast]);

  const skipAerobic = useCallback(async () => {
    if (!currentSession || !currentSession.aerobic) return;

    try {
      setCurrentSession(prev => {
        if (!prev || !prev.aerobic) return prev;
        
        return {
          ...prev,
          aerobic: {
            ...prev.aerobic,
            completed: false,
            skipped: true,
            actualDuration: 0
          }
        };
      });
      
      toast({
        title: "Cardio pulado",
        description: "Prosseguindo para o próximo estágio.",
      });
    } catch (error) {
      console.error('Failed to skip aerobic:', error);
    }
  }, [currentSession, toast]);
  
  const completeAbdominalSet = useCallback(async (exerciseId: string, setIndex: number, setData: SetData) => {
    if (!currentSession || !currentSession.abdominal) return;

    try {
      setCurrentSession(prev => {
        if (!prev || !prev.abdominal) return prev;
        const updated = prev.abdominal.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const newSetData = [...ex.setData];
          newSetData[setIndex] = { ...newSetData[setIndex], ...setData } as SetData;
          const nextSet = Math.min(ex.currentSet + 1, ex.sets);
          const isAllSetsCompleted = newSetData.filter(s => s?.completed).length >= ex.sets;
          return {
            ...ex,
            setData: newSetData,
            currentSet: isAllSetsCompleted ? ex.currentSet : nextSet,
            completed: isAllSetsCompleted ? true : ex.completed,
          };
        });
        return { ...prev, abdominal: updated };
      });

      const parts: string[] = [];
      if (typeof setData.reps === 'number') parts.push(`${setData.reps} reps`);
      if (typeof setData.timeCompleted === 'number') parts.push(`${setData.timeCompleted}s`);

      toast({
        title: "Série de abdominal completada! ⏱️",
        description: parts.join(' × '),
      });
    } catch (error) {
      console.error('Failed to complete abdominal set:', error);
    }
  }, [currentSession, toast]);

  const completeAbdominalExercise = useCallback(async (exerciseId: string) => {
    if (!currentSession || !currentSession.abdominal) return;

    try {
      setCurrentSession(prev => {
        if (!prev || !prev.abdominal) return prev;
        const updated = completeExercise(prev.abdominal, exerciseId);
        return { ...prev, abdominal: updated };
      });

      toast({
        title: "Abdominal concluído! ✅",
        description: "Ótimo trabalho!",
      });
    } catch (error) {
      console.error('Failed to complete abdominal exercise:', error);
    }
  }, [currentSession, toast]);

  const finishWorkout = useCallback(async (notes?: string) => {
    if (!currentSession) return;

    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const date = `${year}-${month}-${day}`;

      const finishedSession: WorkoutSession = {
        ...currentSession,
        endTime: Date.now(),
        date,
        totalVolume: calculateTotalVolume(currentSession.exercises),
        notes,
        completed: true
      };

      if (currentSession.aerobic && !currentSession.aerobic.completed) {
      finishedSession.aerobic = {
        ...currentSession.aerobic,
        actualDuration: 0
      };
    }

      await storage.cleanInvalidSessions();
      await storage.saveToHistory(finishedSession);
      
      const history = await storage.loadWorkoutHistory();
      const { averageTime, weeklyVolume } = calculateWeeklyStats(history);
      const personalRecords = calculatePersonalRecords(history);
      
      await storage.updateStats({
        totalWorkouts: history.length,
        averageTime,
        weeklyVolume,
        personalRecords
      });

      await storage.clearCurrentSession();
      await storage.clearTimerState();
      
      setCurrentSession(null);
      setTimerState(null);

      const workoutTime = calculateWorkoutTime(finishedSession.startTime, finishedSession.endTime);      
      
      // Check for new achievements
      const newUnlocked = await achievementManager.checkAndUnlockAchievements(history);
      if (newUnlocked.length > 0) {
        setNewAchievements(newUnlocked);
      }
      
      toast({
        title: "Treino finalizado! 🎉",
        description: `Duração: ${workoutTime}min | Volume: ${finishedSession.totalVolume}kg`,
      });
      
      return finishedSession;
    } catch (error) {
      console.error('Failed to finish workout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o treino.",
        variant: "destructive"
      });
    }
  }, [currentSession, toast]);

  const cancelWorkout = useCallback(async () => {
    try {
      await storage.clearCurrentSession();
      await storage.clearTimerState();
      setCurrentSession(null);
      setTimerState(null);
      
      toast({
        title: "Treino cancelado",
        description: "O progresso foi descartado.",
      });
    } catch (error) {
      console.error('Failed to cancel workout:', error);
    }
  }, [toast]);

  const clearAchievements = () => {
    setNewAchievements([]);
  };

  return {
    currentSession,
    timerState,
    isLoading,
    startWorkout,
    completeSet,
    completeExercise: completeExerciseHandler,
    startRestTimer,
    stopTimer,
    finishWorkout,
    cancelWorkout,
    completeAerobic,
    skipAerobic,
    completeAbdominalSet,
    completeAbdominalExercise,
    newAchievements,
    clearAchievements,
  };
};