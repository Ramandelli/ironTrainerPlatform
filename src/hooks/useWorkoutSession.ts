import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession, Exercise, SetData, TimerState } from '../types/workout';
import { storage } from '../utils/storage';
import { 
  createWorkoutSession, 
  calculateTotalVolume, 
  updateExerciseSet, 
  completeExercise,
  calculateWorkoutTime,
  calculatePersonalRecords,
  calculateWeeklyStats
} from '../utils/workoutHelpers';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { useToast } from './use-toast';

export const useWorkoutSession = () => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Auto-save session whenever it changes
  useEffect(() => {
    if (currentSession) {
      saveSession();
    }
  }, [currentSession]);

  // Auto-backup every 30 seconds during active workout
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(async () => {
      await storage.createBackup();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentSession]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      
      // Load current session
      const savedSession = await storage.loadCurrentSession();
      if (savedSession) {
        setCurrentSession(savedSession);
        toast({
          title: "Treino restaurado! 💪",
          description: "Seu progresso foi recuperado com sucesso.",
        });
      }

      // Load timer state
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
      // Update total volume
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
      const workoutDay = WORKOUT_PLAN.find(day => day.id === workoutDayId);
      if (!workoutDay) throw new Error('Workout day not found');

      const session = createWorkoutSession(workoutDayId, workoutDay.exercises);
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

  const finishWorkout = useCallback(async (notes?: string) => {
    if (!currentSession) return;

    try {
      const finishedSession: WorkoutSession = {
        ...currentSession,
        endTime: Date.now(),
        totalVolume: calculateTotalVolume(currentSession.exercises),
        notes,
        completed: true
      };

      // Save to history
      await storage.saveToHistory(finishedSession);
      
      // Update stats
      const history = await storage.loadWorkoutHistory();
      const { averageTime, weeklyVolume } = calculateWeeklyStats([...history, finishedSession]);
      const personalRecords = calculatePersonalRecords([...history, finishedSession]);
      
      await storage.updateStats({
        totalWorkouts: history.length + 1,
        averageTime,
        weeklyVolume,
        personalRecords
      });

      // Clear current session
      await storage.clearCurrentSession();
      await storage.clearTimerState();
      
      setCurrentSession(null);
      setTimerState(null);

      const workoutTime = calculateWorkoutTime(finishedSession.startTime, finishedSession.endTime);
      
      toast({
        title: "Treino finalizado! 🎉",
        description: `Duração: ${workoutTime}min | Volume: ${finishedSession.totalVolume}kg`,
      });
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
    cancelWorkout
  };
};