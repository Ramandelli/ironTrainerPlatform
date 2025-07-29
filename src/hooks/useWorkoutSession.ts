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

export const useWorkoutSession = () => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      
      if (workoutDay.aerobic?.timing === 'antes') {
        session.aerobic = { ...workoutDay.aerobic };
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
      
      toast({
        title: "Série completada! 💯",
        description: `${setData.weight}kg x ${setData.reps} reps`,
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

  const completeAerobic = useCallback(async (actualMinutes?: number) => {
    if (!currentSession || !currentSession.aerobic) return;

    try {
      setCurrentSession(prev => {
        if (!prev || !prev.aerobic) return prev;
        
        return {
          ...prev,
          aerobic: {
            ...prev.aerobic,
            completed: actualMinutes !== undefined,
            actualDuration: actualMinutes
          }
        };
      });
    } catch (error) {
      console.error('Failed to complete aerobic:', error);
    }
  }, [currentSession]);

  const finishWorkout = useCallback(async (notes?: string) => {
    if (!currentSession) return;

    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const date = `${day}/${month}/${year}`;

      const finishedSession: WorkoutSession = {
        ...currentSession,
        endTime: Date.now(),
        date,
        totalVolume: calculateTotalVolume(currentSession.exercises),
        notes,
        completed: true
      };

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
    completeAerobic
  };
};