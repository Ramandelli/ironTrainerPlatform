import { useState, useEffect, useCallback } from 'react';
import { WorkoutSession, Exercise, SetData, TimerState, AerobicExercise } from '../types/workout';
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
import { formatWeightCompact } from '../utils/formatters';

export const useWorkoutSession = () => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<UnlockedAchievement[]>([]);
  const [modifiedExercises, setModifiedExercises] = useState<Set<string>>(new Set());
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

      const savedModifiedExercises = await storage.loadModifiedExercises();
      if (savedModifiedExercises.length > 0) {
        setModifiedExercises(new Set(savedModifiedExercises));
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
      await storage.saveModifiedExercises(Array.from(modifiedExercises));
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
      if (typeof setData.weight === 'number') parts.push(`${formatWeightCompact(setData.weight)}kg`);
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

  const skipExercise = useCallback(async (exerciseId: string) => {
    if (!currentSession) return;

    try {
      // Mark exercise as completed but keep any completed set data
      const updatedExercises = currentSession.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        
        // Keep only completed sets data
        const completedSets = ex.setData.filter(set => set.completed);
        const hasCompletedData = completedSets.length > 0;
        
        return { 
          ...ex, 
          completed: true, 
          skipped: true,
          setData: completedSets
        };
      });
      setCurrentSession(prev => prev ? { ...prev, exercises: updatedExercises } : null);
      
      const exercise = currentSession.exercises.find(ex => ex.id === exerciseId);
      const completedSetsCount = exercise?.setData.filter(s => s.completed).length || 0;
      
      toast({
        title: "Exercício pulado",
        description: completedSetsCount > 0 
          ? `${completedSetsCount} série(s) registrada(s), restante ignorado.`
          : "O exercício foi ignorado sem registrar dados.",
      });
    } catch (error) {
      console.error('Failed to skip exercise:', error);
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

  const skipAbdominalExercise = useCallback(async (exerciseId: string) => {
    if (!currentSession || !currentSession.abdominal) return;

    try {
      setCurrentSession(prev => {
        if (!prev || !prev.abdominal) return prev;
        const updated = prev.abdominal.map(ex => 
          ex.id === exerciseId 
            ? { ...ex, completed: true, skipped: true, setData: [] }
            : ex
        );
        return { ...prev, abdominal: updated };
      });

      toast({
        title: "Exercício abdominal pulado",
        description: "O exercício foi ignorado sem registrar dados.",
      });
    } catch (error) {
      console.error('Failed to skip abdominal exercise:', error);
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
      await storage.clearModifiedExercises();
      
      setCurrentSession(null);
      setTimerState(null);
      setModifiedExercises(new Set());

      const workoutTime = calculateWorkoutTime(finishedSession.startTime, finishedSession.endTime);      
      
      // Check for new achievements
      const newUnlocked = await achievementManager.checkAndUnlockAchievements(history);
      if (newUnlocked.length > 0) {
        setNewAchievements(newUnlocked);
      }
      
      toast({
        title: "Treino finalizado! 🎉",
        description: `Duração: ${workoutTime}min | Volume: ${formatWeightCompact(finishedSession.totalVolume)}kg`,
      });
      
      return finishedSession;
    } catch (error) {
      console.error('Failed to finish workout:', error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um problema ao finalizar o treino. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  }, [currentSession, toast]);

  const cancelWorkout = useCallback(async () => {
    try {
      await storage.clearCurrentSession();
      await storage.clearTimerState();
      await storage.clearModifiedExercises();
      setCurrentSession(null);
      setTimerState(null);
      setModifiedExercises(new Set());
      
      toast({
        title: "Treino cancelado",
        description: "O progresso foi descartado.",
      });
    } catch (error) {
      console.error('Failed to cancel workout:', error);
    }
  }, [toast]);

  const updateExercise = useCallback((exerciseId: string, updates: Partial<Exercise>) => {
    if (!currentSession) return;

    setCurrentSession(prev => {
      if (!prev) return null;
      
      const updatedExercises = prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      );
      
      return { ...prev, exercises: updatedExercises };
    });
    
    setModifiedExercises(prev => new Set(prev).add(exerciseId));
    
    toast({
      title: "Exercício atualizado",
      description: "Alterações serão aplicadas neste treino.",
    });
  }, [currentSession, toast]);

  const addExercise = useCallback((exercise: Omit<Exercise, 'id' | 'completed' | 'currentSet' | 'setData'>) => {
    if (!currentSession) return;

    const newExercise: Exercise = {
      ...exercise,
      id: `exercise_${Date.now()}`,
      completed: false,
      currentSet: 0,
      setData: Array(exercise.sets).fill(null).map(() => ({
        weight: 0,
        reps: 0,
        completed: false
      }))
    };

    setCurrentSession(prev => {
      if (!prev) return null;
      return { ...prev, exercises: [...prev.exercises, newExercise] };
    });

    setModifiedExercises(prev => new Set(prev).add(newExercise.id));

    toast({
      title: "Exercício adicionado! ✅",
      description: `${exercise.name} foi adicionado ao treino.`,
    });
  }, [currentSession, toast]);

  const updateAbdominalExercise = useCallback((exerciseId: string, updates: Partial<Exercise>) => {
    if (!currentSession || !currentSession.abdominal) return;

    setCurrentSession(prev => {
      if (!prev || !prev.abdominal) return prev;
      
      const updatedAbdominal = prev.abdominal.map(ex => 
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      );
      
      return { ...prev, abdominal: updatedAbdominal };
    });
    
    setModifiedExercises(prev => new Set(prev).add(exerciseId));
    
    toast({
      title: "Exercício atualizado",
      description: "Alterações serão aplicadas neste treino.",
    });
  }, [currentSession, toast]);

  const updateAerobic = useCallback((updates: Partial<AerobicExercise>) => {
    if (!currentSession || !currentSession.aerobic) return;

    setCurrentSession(prev => {
      if (!prev || !prev.aerobic) return prev;
      return { 
        ...prev, 
        aerobic: { ...prev.aerobic, ...updates, completed: false, actualDuration: 0 }
      };
    });

    setModifiedExercises(prev => new Set(prev).add('aerobic'));

    toast({
      title: "Cardio atualizado",
      description: "Alterações serão aplicadas neste treino.",
    });
  }, [currentSession, toast]);

  const applyPermanentChanges = useCallback(async (): Promise<boolean> => {
    if (!currentSession || modifiedExercises.size === 0) return false;

    try {
      const allWorkouts = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);

      // Try to locate the workout to update (custom override first, then exact id)
      const overrideWorkout = allWorkouts.find(
        (w) => customWorkoutManager.isCustomWorkout(w.id) &&
               customWorkoutManager.getBaseWorkoutId(w.id) === currentSession.workoutDayId
      );
      const exactWorkout = allWorkouts.find((w) => w.id === currentSession.workoutDayId);

      let workoutToUpdate = overrideWorkout || exactWorkout;
      let wasConverted = false;

      // If nothing found in the merged list, fall back to default plan and convert once
      if (!workoutToUpdate) {
        const basePlanWorkout = WORKOUT_PLAN.find((w) => w.id === currentSession.workoutDayId);
        if (!basePlanWorkout) {
          console.error('Workout not found for permanent changes');
          throw new Error('Treino base não encontrado');
        }
        // Don't save yet, just create the structure
        workoutToUpdate = {
          ...JSON.parse(JSON.stringify(basePlanWorkout)),
          id: `custom_${basePlanWorkout.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        wasConverted = true;
      }

      // If it's still a default workout, convert it now (without saving yet)
      if (!customWorkoutManager.isCustomWorkout(workoutToUpdate.id)) {
        workoutToUpdate = {
          ...JSON.parse(JSON.stringify(workoutToUpdate)),
          id: `custom_${workoutToUpdate.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        wasConverted = true;
      }

      // ----- Build updated exercises from session data -----
      // Since we may have converted, use session exercises as the source of truth
      // but preserve base workout structure for non-modified exercises
      
      const baseExercisesByName = new Map(
        (workoutToUpdate.exercises || []).map((ex) => [ex.name.toLowerCase(), ex])
      );
      
      const updatedExercises: Exercise[] = currentSession.exercises.map((sessionEx, idx) => {
        // Find matching base exercise by name or index
        const baseEx = baseExercisesByName.get(sessionEx.name.toLowerCase()) || 
                       (wasConverted ? null : workoutToUpdate!.exercises[idx]);
        
        if (modifiedExercises.has(sessionEx.id)) {
          // This exercise was modified during the session - use session data
          return {
            id: baseEx?.id || `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${idx}`,
            name: sessionEx.name,
            sets: sessionEx.sets,
            targetReps: sessionEx.targetReps,
            suggestedWeight: sessionEx.suggestedWeight,
            restTime: sessionEx.restTime,
            notes: sessionEx.notes,
            hasDropset: sessionEx.hasDropset,
            completed: false,
            currentSet: 0,
            setData: [],
          };
        } else if (baseEx) {
          // Not modified and has a base - preserve base data
          return {
            ...baseEx,
            completed: false,
            currentSet: 0,
            setData: [],
          };
        } else {
          // Not modified but no base found (shouldn't happen often) - use session data
          return {
            id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${idx}`,
            name: sessionEx.name,
            sets: sessionEx.sets,
            targetReps: sessionEx.targetReps,
            suggestedWeight: sessionEx.suggestedWeight,
            restTime: sessionEx.restTime,
            notes: sessionEx.notes,
            hasDropset: sessionEx.hasDropset,
            completed: false,
            currentSet: 0,
            setData: [],
          };
        }
      });

      // ----- Update abdominal exercises similarly -----
      let updatedAbdominal: Exercise[] | undefined = workoutToUpdate.abdominal;
      if (currentSession.abdominal && currentSession.abdominal.length > 0) {
        const baseAbByName = new Map(
          (workoutToUpdate.abdominal || []).map((ex) => [ex.name.toLowerCase(), ex])
        );

        updatedAbdominal = currentSession.abdominal.map((sessionAb, idx) => {
          const baseAb = baseAbByName.get(sessionAb.name.toLowerCase()) ||
                         (wasConverted ? null : workoutToUpdate!.abdominal?.[idx]);

          if (modifiedExercises.has(sessionAb.id)) {
            return {
              id: baseAb?.id || `ab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${idx}`,
              name: sessionAb.name,
              sets: sessionAb.sets,
              targetReps: sessionAb.targetReps,
              restTime: sessionAb.restTime,
              notes: sessionAb.notes,
              isTimeBased: sessionAb.isTimeBased,
              timePerSet: sessionAb.timePerSet,
              isBilateral: sessionAb.isBilateral,
              completed: false,
              currentSet: 0,
              setData: [],
            };
          } else if (baseAb) {
            return {
              ...baseAb,
              completed: false,
              currentSet: 0,
              setData: [],
            };
          } else {
            return {
              id: `ab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${idx}`,
              name: sessionAb.name,
              sets: sessionAb.sets,
              targetReps: sessionAb.targetReps,
              restTime: sessionAb.restTime,
              notes: sessionAb.notes,
              isTimeBased: sessionAb.isTimeBased,
              timePerSet: sessionAb.timePerSet,
              isBilateral: sessionAb.isBilateral,
              completed: false,
              currentSet: 0,
              setData: [],
            };
          }
        });
      }

      // ----- Update aerobic if modified -----
      let updatedAerobic = workoutToUpdate.aerobic;
      if (currentSession.aerobic && modifiedExercises.has('aerobic')) {
        updatedAerobic = {
          type: currentSession.aerobic.type,
          duration: currentSession.aerobic.duration,
          intensity: currentSession.aerobic.intensity,
          timing: currentSession.aerobic.timing,
          completed: false,
        } as AerobicExercise;
      }

      // Save the updated workout
      const workoutToSave = {
        ...workoutToUpdate,
        exercises: updatedExercises,
        abdominal: updatedAbdominal,
        aerobic: updatedAerobic,
      };

      await customWorkoutManager.saveWorkout(workoutToSave);

      setModifiedExercises(new Set());

      return true;
    } catch (error) {
      console.error('Failed to apply permanent changes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar as alterações permanentemente.",
        variant: "destructive",
      });
      return false;
    }
  }, [currentSession, modifiedExercises, toast]);

  const clearAchievements = () => {
    setNewAchievements([]);
  };

  const clearModifications = async () => {
    setModifiedExercises(new Set());
    await storage.clearModifiedExercises();
  };

  const setWarmupCompleted = useCallback((completed: boolean) => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, warmupCompleted: completed } : null);
  }, [currentSession]);

  const setAbdominalCompleted = useCallback((completed: boolean) => {
    if (!currentSession) return;
    setCurrentSession(prev => prev ? { ...prev, abdominalCompleted: completed } : null);
  }, [currentSession]);

  return {
    currentSession,
    timerState,
    isLoading,
    startWorkout,
    completeSet,
    completeExercise: completeExerciseHandler,
    skipExercise,
    startRestTimer,
    stopTimer,
    finishWorkout,
    cancelWorkout,
    completeAerobic,
    skipAerobic,
    completeAbdominalSet,
    completeAbdominalExercise,
    skipAbdominalExercise,
    updateExercise,
    updateAbdominalExercise,
    updateAerobic,
    addExercise,
    applyPermanentChanges,
    modifiedExercises,
    clearModifications,
    newAchievements,
    clearAchievements,
    setWarmupCompleted,
    setAbdominalCompleted,
  };
};